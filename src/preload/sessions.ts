// uTools ccToggle - sessions.ts
// 会话管理：读取各 AI 应用的本地会话数据

import utils = require("./utils");

const fs = utils.fs;
const path = utils.path;
const getHomeDir = utils.getHomeDir;

// --- 类型定义 ---

interface ScanCacheEntry {
  sessions: Session[];
}

interface ScanCache {
  data: Record<string, ScanCacheEntry> | null;
  timestamp: number;
  readonly TTL: number;
}

interface Session {
  id: string;
  app: string;
  sessionId: string;
  title: string;
  projectPath: string;
  messageCount: number;
  tokenUsage: number;
  model: string;
  createdAt: string;
  updatedAt: string;
  filePath: string;
}

interface ContentBlock {
  type: string;
  text?: string;
  name?: string;
  input?: Record<string, unknown>;
}

interface Message {
  role: string;
  contentBlocks: ContentBlock[];
  timestamp: string;
}

interface ScanResult {
  sessions: Session[];
  total: number;
  error?: string;
}

interface ScanOptions {
  offset?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

interface FileWithMtime {
  path: string;
  mtime: number;
}

interface HeadTailResult {
  head: string[];
  tail: string[];
  size: number;
}

interface DeleteResult {
  success: boolean;
  error?: string;
}

interface ClearAllResult {
  success: boolean;
  count: number;
  errors: string[];
}

// --- 扫描缓存 ---
const _scanCache: ScanCache = {
  data: null,
  timestamp: 0,
  TTL: 30000,
};
let _sessionCache: Record<string, Message[]> = {};

// ============================================================
// 大文件优化：只读头尾，提取元数据
// ============================================================

const CHUNK_SIZE = 4096;

type ScanFunction = (home: string, opts?: { offset?: number; limit?: number }) => Promise<{ sessions: Session[]; totalFiles: number }>;

export class SessionManager {
  // ============================================================
  // 内部辅助方法
  // ============================================================

  private static _clearScanCache(): void {
    _scanCache.data = null;
    _scanCache.timestamp = 0;
  }

  // 一次打开文件，读取头部和尾部（只 open/stat/close 一次）
  private static async _readHeadAndTail(filePath: string): Promise<HeadTailResult> {
    let fd: import("fs").promises.FileHandle;
    try {
      fd = await fs.promises.open(filePath, "r");
    } catch (e) {
      return { head: [], tail: [], size: 0 };
    }
    try {
      const size = (await fd.stat()).size;
      // 读头部
      const headLen = Math.min(CHUNK_SIZE, size);
      const headBuf = Buffer.alloc(headLen);
      await fd.read(headBuf, 0, headLen, 0);
      const head = headBuf.toString("utf8").split(/\r?\n/);

      // 读尾部（文件够大时）
      let tail: string[] = [];
      if (size > CHUNK_SIZE) {
        const tailPos = size - CHUNK_SIZE;
        const tailBuf = Buffer.alloc(CHUNK_SIZE);
        await fd.read(tailBuf, 0, CHUNK_SIZE, tailPos);
        tail = tailBuf.toString("utf8").split(/\r?\n/);
      }

      return { head, tail, size };
    } catch (e) {
      return { head: [], tail: [], size: 0 };
    } finally {
      await fd.close();
    }
  }

  // 统计 JSONL 中的消息行数（user/assistant/human 类型）
  private static _countMessageLines(lines: string[]): number {
    let count = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line || line[0] !== "{") continue;
      try {
        const d = JSON.parse(line);
        if (d && (d.type === "assistant" || d.type === "human" || d.type === "user"
          || (d.type === "event_msg" && d.payload && (d.payload.type === "user_message" || d.payload.type === "agent_message"))
          || (d.type === "message" && d.message && (d.message.role === "user" || d.message.role === "assistant"))
        )) count++;
      } catch (e) { /* skip */ }
    }
    return count;
  }

  // 快速统计消息数：直接数头尾的消息行
  private static _estimateMessageCount(headLines: string[], tailLines: string[], size: number): number {
    // 小文件：头尾重叠，直接数头部
    if (size <= CHUNK_SIZE * 2) return SessionManager._countMessageLines(headLines);
    // 大文件：头尾各数一遍（中间的数不到，但比瞎猜准）
    return SessionManager._countMessageLines(headLines) + SessionManager._countMessageLines(tailLines);
  }

  // ============================================================
  // Claude / Claude Desktop 元数据解析
  // ============================================================

  private static async _parseClaudeMeta(filePath: string, projectName: string): Promise<Session> {
    const r = await SessionManager._readHeadAndTail(filePath);
    const headLines = r.head;
    const tailLines = r.tail;

    const sessionId = path.basename(filePath, ".jsonl");
    let title = "";
    let firstTs = "";
    let lastTs = "";
    let tokenUsage = 0;
    let lastModel = "";
    let projectPath = "";

    // 解析头部行
    for (let i = 0; i < headLines.length; i++) {
      const line = headLines[i];
      if (!line || line[0] !== "{") continue;
      let d: Record<string, any>;
      try { d = JSON.parse(line); } catch (e) { continue; }
      if (!d || typeof d !== "object") continue;

      if (d.type === "summary" && d.summary) title = d.summary;
      if (!projectPath && d.cwd) projectPath = d.cwd;

      if (d.type === "assistant" || d.type === "human" || d.type === "user") {
        if (d.timestamp) {
          if (!firstTs) firstTs = d.timestamp;
          lastTs = d.timestamp;
        }
        if (!title && d.type === "user" && d.message && d.message.content) {
          let c = typeof d.message.content === "string" ? d.message.content : "";
          if (c.length > 60) c = c.substring(0, 60) + "...";
          if (c) title = c;
        }
        if (d.type === "assistant" && d.message && d.message.usage) {
          const u = d.message.usage;
          tokenUsage += (Number(u.input_tokens) || 0) + (Number(u.output_tokens) || 0);
          if (d.message.model && d.message.model !== "<synthetic>") lastModel = d.message.model;
        }
      }
    }

    // 解析尾部行（补充 lastTs、tokenUsage）
    for (let j = 0; j < tailLines.length; j++) {
      const line2 = tailLines[j];
      if (!line2 || line2[0] !== "{") continue;
      let d2: Record<string, any>;
      try { d2 = JSON.parse(line2); } catch (e) { continue; }
      if (!d2 || typeof d2 !== "object") continue;
      if (d2.type === "assistant" || d2.type === "human" || d2.type === "user") {
        if (d2.timestamp) lastTs = d2.timestamp;
        if (d2.type === "assistant" && d2.message && d2.message.usage) {
          const u2 = d2.message.usage;
          tokenUsage += (Number(u2.input_tokens) || 0) + (Number(u2.output_tokens) || 0);
          if (d2.message.model && d2.message.model !== "<synthetic>") lastModel = d2.message.model;
        }
      }
    }

    // 用文件大小估算消息数
    const messageCount = SessionManager._estimateMessageCount(headLines, tailLines, r.size);

    if (!title) title = sessionId.substring(0, 12) + "...";
    if (!projectPath) projectPath = (projectName || "").replace(/-/g, "/");

    return {
      id: "claude_" + sessionId,
      app: "claude",
      sessionId,
      title,
      projectPath,
      messageCount,
      tokenUsage,
      model: lastModel,
      createdAt: firstTs || "",
      updatedAt: lastTs || "",
      filePath,
    };
  }

  // ============================================================
  // Codex 元数据解析
  // ============================================================

  private static async _parseCodexMeta(filePath: string): Promise<Session> {
    const r = await SessionManager._readHeadAndTail(filePath);
    const headLines = r.head;
    const tailLines = r.tail;

    const sessionId = path.basename(filePath, ".jsonl");
    let title = "";
    let firstTs = "";
    let lastTs = "";
    let tokenUsage = 0;
    let lastModel = "";
    let projectPath = "";

    for (let i = 0; i < headLines.length; i++) {
      const line = headLines[i];
      if (!line || line[0] !== "{") continue;
      let d: Record<string, any>;
      try { d = JSON.parse(line); } catch (e) { continue; }
      if (!d || typeof d !== "object") continue;

      if (d.type === "session_meta" && d.payload) {
        if (d.payload.cwd) projectPath = d.payload.cwd;
        if (d.payload.model_provider) lastModel = d.payload.model_provider;
      }
      if (d.type === "event_msg" && d.payload) {
        if (d.payload.type === "user_message" && d.payload.message) {
          if (!title) {
            let t: string = d.payload.message;
            if (t.length > 60) t = t.substring(0, 60) + "...";
            title = t;
          }
        } else if (d.payload.type === "token_count" && d.payload.info && d.payload.info.last_token_usage) {
          const u = d.payload.info.last_token_usage;
          tokenUsage += (Number(u.input_tokens) || 0) + (Number(u.output_tokens) || 0);
        }
      }
      if (d.type === "response_item" && d.payload && d.payload.model) lastModel = d.payload.model;
      if (d.timestamp) { if (!firstTs) firstTs = d.timestamp; lastTs = d.timestamp; }
    }

    for (let j = 0; j < tailLines.length; j++) {
      const line2 = tailLines[j];
      if (!line2 || line2[0] !== "{") continue;
      let d2: Record<string, any>;
      try { d2 = JSON.parse(line2); } catch (e) { continue; }
      if (!d2 || typeof d2 !== "object") continue;
      if (d2.type === "event_msg" && d2.payload) {
        if (d2.payload.type === "token_count" && d2.payload.info && d2.payload.info.last_token_usage) {
          const u2 = d2.payload.info.last_token_usage;
          tokenUsage += (Number(u2.input_tokens) || 0) + (Number(u2.output_tokens) || 0);
        }
      }
      if (d2.type === "response_item" && d2.payload && d2.payload.model) lastModel = d2.payload.model;
      if (d2.timestamp) lastTs = d2.timestamp;
    }

    const messageCount = SessionManager._estimateMessageCount(headLines, tailLines, r.size);
    if (!title) title = sessionId.substring(0, 12) + "...";

    return {
      id: "codex_" + sessionId,
      app: "codex",
      sessionId,
      title,
      projectPath,
      messageCount,
      tokenUsage,
      model: lastModel,
      createdAt: firstTs || "",
      updatedAt: lastTs || "",
      filePath,
    };
  }

  // ============================================================
  // OpenClaw 元数据解析
  // ============================================================

  private static async _parseOpenClawMeta(filePath: string, agentId: string): Promise<Session> {
    const r = await SessionManager._readHeadAndTail(filePath);
    const headLines = r.head;
    const tailLines = r.tail;

    let sessionId = path.basename(filePath, ".jsonl");
    let title = "";
    let firstTs = "";
    let lastTs = "";
    let tokenUsage = 0;
    let lastModel = "";
    let projectPath = "";

    function parseOpenClawLines(lines: string[]): void {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line || line[0] !== "{") continue;
        let d: Record<string, any>;
        try { d = JSON.parse(line); } catch (e) { continue; }
        if (!d || typeof d !== "object") continue;

        if (d.type === "session") {
          if (d.id) sessionId = d.id;
          if (d.cwd) projectPath = d.cwd;
          if (d.timestamp) { if (!firstTs) firstTs = d.timestamp; lastTs = d.timestamp; }
        }
        if (d.type === "message" && d.message) {
          const role: string = d.message.role || "";
          if (role === "user" || role === "assistant") {
            if (!title && role === "user") {
              let c = "";
              if (typeof d.message.content === "string") c = d.message.content;
              else if (Array.isArray(d.message.content)) {
                for (let k = 0; k < d.message.content.length; k++) {
                  if (d.message.content[k].type === "text") { c = d.message.content[k].text; break; }
                }
              }
              if (c) { title = c.substring(0, 60); if (c.length > 60) title += "..."; }
            }
            if (d.message.usage) {
              const u = d.message.usage;
              tokenUsage += (Number(u.input) || 0) + (Number(u.output) || 0) + (Number(u.totalTokens) || 0);
            }
            if (d.message.model) lastModel = d.message.model;
          }
          if (d.timestamp) { if (!firstTs) firstTs = d.timestamp; lastTs = d.timestamp; }
        }
        if (d.timestamp && d.type !== "session" && d.type !== "message") {
          if (!firstTs) firstTs = d.timestamp; lastTs = d.timestamp;
        }
      }
    }

    parseOpenClawLines(headLines);
    parseOpenClawLines(tailLines);

    const messageCount = SessionManager._estimateMessageCount(headLines, tailLines, r.size);
    if (!title) title = sessionId.substring(0, 12) + "...";
    if (!projectPath && agentId) projectPath = agentId;

    return {
      id: "openclaw_" + sessionId,
      app: "openclaw",
      sessionId,
      title,
      projectPath,
      messageCount,
      tokenUsage,
      model: lastModel,
      createdAt: firstTs || "",
      updatedAt: lastTs || "",
      filePath,
    };
  }

  // ============================================================
  // 收集文件路径 + mtime（按 mtime 倒序）
  // ============================================================

  private static async _collectFilesWithMtime(dirPath: string, recursive: boolean): Promise<FileWithMtime[]> {
    const results: FileWithMtime[] = [];
    let entries: import("fs").Dirent[];
    try {
      entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    } catch (e) {
      return results;
    }

    for (let i = 0; i < entries.length; i++) {
      const ent = entries[i];
      const fullPath = path.join(dirPath, ent.name);
      if (ent.isDirectory() && recursive) {
        const sub = await SessionManager._collectFilesWithMtime(fullPath, true);
        results.push(...sub);
      } else if (ent.isFile() && /\.jsonl$/i.test(ent.name)) {
        let st: import("fs").Stats;
        try { st = await fs.promises.stat(fullPath); } catch (e) { continue; }
        results.push({ path: fullPath, mtime: st.mtimeMs });
      }
    }
    return results;
  }

  // ============================================================
  // Claude / Claude Desktop 扫描（带分页）
  // ============================================================

  private static async _scanClaudeSessions(home: string, opts?: { offset?: number; limit?: number }): Promise<{ sessions: Session[]; totalFiles: number }> {
    opts = opts || {};
    const offset = opts.offset || 0;
    const limit = opts.limit != null ? opts.limit : 20;

    const projectsDir = utils.getAgentSessionPath("claude") || path.join(home, ".claude", "projects");
    const sessions: Session[] = [];
    let entries: import("fs").Dirent[];
    try {
      entries = await fs.promises.readdir(projectsDir, { withFileTypes: true });
    } catch (e) {
      return { sessions, totalFiles: 0 };
    }

    // 收集所有文件路径 + mtime
    const allFiles: Array<{ path: string; mtime: number; project: string }> = [];
    for (let i = 0; i < entries.length; i++) {
      const ent = entries[i];
      if (!ent.isDirectory()) continue;
      const projectPath = path.join(projectsDir, ent.name);
      let files: string[];
      try { files = await fs.promises.readdir(projectPath); } catch (e) { continue; }
      for (let j = 0; j < files.length; j++) {
        const fname = files[j];
        if (!/\.jsonl$/i.test(fname)) continue;
        const filePath = path.join(projectPath, fname);
        let st: import("fs").Stats;
        try { st = await fs.promises.stat(filePath); } catch (e) { continue; }
        allFiles.push({ path: filePath, mtime: st.mtimeMs, project: ent.name });
      }
    }

    // 按 mtime 倒序排序
    allFiles.sort((a, b) => b.mtime - a.mtime);

    // 扫描：跳过 offset 个，取 limit 个
    let skipped = 0;
    for (let k = 0; k < allFiles.length; k++) {
      const f = allFiles[k];
      const session = await SessionManager._parseClaudeMeta(f.path, f.project);
      if (!session) continue;
      if (skipped < offset) { skipped++; continue; }
      sessions.push(session);
      if (sessions.length >= limit) break;
    }

    return { sessions, totalFiles: allFiles.length };
  }

  private static async _scanClaudeDesktopSessions(home: string, opts?: { offset?: number; limit?: number }): Promise<{ sessions: Session[]; totalFiles: number }> {
    opts = opts || {};
    const offset = opts.offset || 0;
    const limit = opts.limit != null ? opts.limit : 20;

    let projectsDir = utils.getAgentSessionPath("claude-desktop") || path.join(home, ".claude-desktop", "projects");
    let entries: import("fs").Dirent[] | undefined;
    try {
      entries = await fs.promises.readdir(projectsDir, { withFileTypes: true });
    } catch (e) {
      // 如果配置的路径不存在，尝试默认路径
      if (utils.getAgentSessionPath("claude-desktop")) {
        projectsDir = path.join(home, ".claude-desktop", "projects");
        try {
          entries = await fs.promises.readdir(projectsDir, { withFileTypes: true });
        } catch (e2) {
          // 继续尝试 APPDATA
        }
      }
      if (!entries) {
        let appData: string;
        try { appData = process.env.APPDATA || ""; } catch (e3) { appData = ""; }
        if (appData) {
          try {
            const altDir = path.join(appData, "Claude", "projects");
            entries = await fs.promises.readdir(altDir, { withFileTypes: true });
            projectsDir = altDir;
          } catch (e4) {
            return { sessions: [], totalFiles: 0 };
          }
        } else {
          return { sessions: [], totalFiles: 0 };
        }
      }
    }

    const allFiles: Array<{ path: string; mtime: number; project: string }> = [];
    for (let i = 0; i < entries!.length; i++) {
      const ent = entries![i];
      if (!ent.isDirectory()) continue;
      const projectPath = path.join(projectsDir, ent.name);
      let files: string[];
      try { files = await fs.promises.readdir(projectPath); } catch (e) { continue; }
      for (let j = 0; j < files.length; j++) {
        const fname = files[j];
        if (!/\.jsonl$/i.test(fname)) continue;
        const filePath = path.join(projectPath, fname);
        let st: import("fs").Stats;
        try { st = await fs.promises.stat(filePath); } catch (e) { continue; }
        allFiles.push({ path: filePath, mtime: st.mtimeMs, project: ent.name });
      }
    }

    allFiles.sort((a, b) => b.mtime - a.mtime);

    const sessions: Session[] = [];
    let skipped = 0;
    for (let k = 0; k < allFiles.length; k++) {
      const f = allFiles[k];
      const meta = await SessionManager._parseClaudeMeta(f.path, f.project);
      if (!meta) continue;
      meta.id = "claude-desktop_" + meta.sessionId;
      meta.app = "claude-desktop";
      if (skipped < offset) { skipped++; continue; }
      sessions.push(meta);
      if (sessions.length >= limit) break;
    }

    return { sessions, totalFiles: allFiles.length };
  }

  // ============================================================
  // Codex 扫描（带分页，目录结构天然按时间排序）
  // ============================================================

  private static async _scanCodexSessions(home: string, opts?: { offset?: number; limit?: number }): Promise<{ sessions: Session[]; totalFiles: number }> {
    opts = opts || {};
    const offset = opts.offset || 0;
    const limit = opts.limit != null ? opts.limit : 20;

    const sessionsDir = utils.getAgentSessionPath("codex") || path.join(home, ".codex", "sessions");
    const sessions: Session[] = [];
    let totalFiles = 0;
    let scanned = 0; // 已处理（跳过或解析）的文件数
    let years: import("fs").Dirent[];
    try {
      years = await fs.promises.readdir(sessionsDir, { withFileTypes: true });
    } catch (e) {
      return { sessions, totalFiles: 0 };
    }

    // 从最新日期反向遍历，目录结构天然有序
    const yearNames = years.filter((e) => e.isDirectory()).map((e) => e.name).sort().reverse();

    for (let yi = 0; yi < yearNames.length; yi++) {
      const yearDir = path.join(sessionsDir, yearNames[yi]);
      let months: import("fs").Dirent[];
      try { months = await fs.promises.readdir(yearDir, { withFileTypes: true }); } catch (e) { continue; }
      const monthNames = months.filter((e) => e.isDirectory()).map((e) => e.name).sort().reverse();

      for (let mi = 0; mi < monthNames.length; mi++) {
        const monthDir = path.join(yearDir, monthNames[mi]);
        let days: import("fs").Dirent[];
        try { days = await fs.promises.readdir(monthDir, { withFileTypes: true }); } catch (e) { continue; }
        const dayNames = days.filter((e) => e.isDirectory()).map((e) => e.name).sort().reverse();

        for (let di = 0; di < dayNames.length; di++) {
          const dayDir = path.join(monthDir, dayNames[di]);
          let files: string[];
          try { files = await fs.promises.readdir(dayDir); } catch (e) { continue; }
          const jsonlFiles = files.filter((f) => /\.jsonl$/i.test(f)).sort().reverse();

          for (let fi = 0; fi < jsonlFiles.length; fi++) {
            totalFiles++; // 始终统计总数
            if (scanned < offset) { scanned++; continue; } // 跳过 offset 之前的
            if (sessions.length >= limit) continue; // 够了只计数不解析
            const session = await SessionManager._parseCodexMeta(path.join(dayDir, jsonlFiles[fi]));
            if (session) sessions.push(session);
            scanned++;
          }
        }
      }
    }

    return { sessions, totalFiles };
  }

  // ============================================================
  // OpenClaw 扫描（带分页）
  // ============================================================

  private static async _scanOpenClawSessions(home: string, opts?: { offset?: number; limit?: number }): Promise<{ sessions: Session[]; totalFiles: number }> {
    opts = opts || {};
    const offset = opts.offset || 0;
    const limit = opts.limit != null ? opts.limit : 20;

    const agentsDir = utils.getAgentSessionPath("openclaw") || path.join(home, ".openclaw", "agents");
    const sessions: Session[] = [];
    let agentEntries: import("fs").Dirent[];
    try {
      agentEntries = await fs.promises.readdir(agentsDir, { withFileTypes: true });
    } catch (e) {
      return { sessions, totalFiles: 0 };
    }

    const allFiles: Array<{ path: string; mtime: number; agent: string }> = [];
    for (let i = 0; i < agentEntries.length; i++) {
      const agentEnt = agentEntries[i];
      if (!agentEnt.isDirectory()) continue;
      const sessDir = path.join(agentsDir, agentEnt.name, "sessions");
      let files: string[];
      try { files = await fs.promises.readdir(sessDir); } catch (e) { continue; }
      for (let j = 0; j < files.length; j++) {
        const fname = files[j];
        if (!/\.jsonl$/i.test(fname)) continue;
        const filePath = path.join(sessDir, fname);
        let st: import("fs").Stats;
        try { st = await fs.promises.stat(filePath); } catch (e) { continue; }
        allFiles.push({ path: filePath, mtime: st.mtimeMs, agent: agentEnt.name });
      }
    }

    allFiles.sort((a, b) => b.mtime - a.mtime);

    let skipped = 0;
    for (let k = 0; k < allFiles.length; k++) {
      const f = allFiles[k];
      const session = await SessionManager._parseOpenClawMeta(f.path, f.agent);
      if (!session) continue;
      if (skipped < offset) { skipped++; continue; }
      sessions.push(session);
      if (sessions.length >= limit) break;
    }

    return { sessions, totalFiles: allFiles.length };
  }

  // ============================================================
  // 加载会话详情（含完整消息历史）
  // ============================================================

  // 从文件路径推断应用类型
  private static _detectApp(filePath: string): string {
    if (filePath.indexOf(".codex") >= 0) return "codex";
    if (filePath.indexOf(".openclaw") >= 0 || filePath.indexOf("openclaw") >= 0) return "openclaw";
    if (filePath.indexOf("claude-desktop") >= 0) return "claude-desktop";
    return "claude";
  }

  // 从 content 字段提取结构化内容块
  private static _extractContentBlocks(content: unknown): ContentBlock[] {
    if (!content) return [];
    if (typeof content === "string") return [{ type: "text", text: content }];
    if (Array.isArray(content)) {
      const blocks: ContentBlock[] = [];
      for (let i = 0; i < content.length; i++) {
        const item = content[i];
        if (!item || typeof item !== "object") continue;
        if (item.type === "text" && item.text) {
          blocks.push({ type: "text", text: item.text });
        } else if (item.type === "thinking" && item.thinking) {
          blocks.push({ type: "thinking", text: item.thinking });
        } else if (item.type === "tool_use") {
          blocks.push({ type: "tool_use", name: item.name || "unknown", input: item.input || {} });
        } else if (item.type === "toolCall") {
          blocks.push({ type: "tool_use", name: item.name || "unknown", input: {} });
        } else if (item.type === "tool_result") {
          // 工具执行结果：从嵌套的 content 中提取文本
          const resultText = SessionManager._extractToolResultText(item);
          if (resultText) blocks.push({ type: "tool_result", text: resultText, name: item.tool_use_id || "" });
        }
      }
      return blocks;
    }
    return [{ type: "text", text: JSON.stringify(content) }];
  }

  // 从 tool_result 中提取文本内容
  private static _extractToolResultText(item: Record<string, any>): string {
    if (!item) return "";
    const c = item.content;
    if (typeof c === "string") return c;
    if (Array.isArray(c)) {
      const parts: string[] = [];
      for (let i = 0; i < c.length; i++) {
        if (c[i] && c[i].type === "text" && c[i].text) parts.push(c[i].text);
      }
      return parts.join("\n");
    }
    return "";
  }

  // 兼容旧接口：提取纯文本
  private static _extractContent(content: unknown): string {
    const blocks = SessionManager._extractContentBlocks(content);
    const parts: string[] = [];
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (b.type === "text") parts.push(b.text!);
      else if (b.type === "thinking") parts.push(b.text!);
      else if (b.type === "tool_use") parts.push("[工具调用: " + b.name + "]");
    }
    return parts.join("");
  }

  // 合并连续同角色消息
  private static _mergeMessages(messages: Message[]): Message[] {
    if (messages.length <= 1) return messages;
    const merged: Message[] = [messages[0]];
    for (let i = 1; i < messages.length; i++) {
      const prev = merged[merged.length - 1];
      const cur = messages[i];
      if (cur.role === prev.role) {
        // 合并 contentBlocks，使用最后一条的时间戳
        prev.contentBlocks = prev.contentBlocks.concat(cur.contentBlocks);
        if (cur.timestamp) prev.timestamp = cur.timestamp;
      } else {
        merged.push(cur);
      }
    }
    return merged;
  }

  // 解析 OpenClaw 消息
  private static _parseOpenClawMessages(lines: string[]): Message[] {
    const messages: Message[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line || line[0] !== "{") continue;
      let d: Record<string, any>;
      try { d = JSON.parse(line); } catch (e) { continue; }
      if (!d || d.type !== "message" || !d.message) continue;
      const role: string = d.message.role || "";
      if (role !== "user" && role !== "assistant") continue;
      const blocks = SessionManager._extractContentBlocks(d.message.content);
      if (blocks.length > 0) messages.push({ role, contentBlocks: blocks, timestamp: d.timestamp || "" });
    }
    return messages;
  }

  // 解析 Codex 消息
  private static _parseCodexMessages(lines: string[]): Message[] {
    const messages: Message[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line || line[0] !== "{") continue;
      let d: Record<string, any>;
      try { d = JSON.parse(line); } catch (e) { continue; }
      if (!d || d.type !== "event_msg" || !d.payload) continue;
      if (d.payload.type === "user_message" && d.payload.message) {
        messages.push({ role: "user", contentBlocks: [{ type: "text", text: d.payload.message }], timestamp: d.timestamp || "" });
      } else if (d.payload.type === "agent_message" && d.payload.message) {
        messages.push({ role: "assistant", contentBlocks: [{ type: "text", text: d.payload.message }], timestamp: d.timestamp || "" });
      }
    }
    return messages;
  }

  // 解析 Claude / Claude Desktop 消息
  private static _parseClaudeMessages(lines: string[]): Message[] {
    const messages: Message[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line || line[0] !== "{") continue;
      let d: Record<string, any>;
      try { d = JSON.parse(line); } catch (e) { continue; }
      if (!d || typeof d !== "object") continue;
      if (d.type === "human" || d.type === "user") {
        const raw = d.message ? d.message.content : d.content;
        const blocks = SessionManager._extractContentBlocks(raw);
        if (blocks.length > 0) messages.push({ role: "user", contentBlocks: blocks, timestamp: d.timestamp || "" });
      } else if (d.type === "assistant") {
        const araw = d.message ? d.message.content : d.content;
        const ablocks = SessionManager._extractContentBlocks(araw);
        if (ablocks.length > 0) messages.push({ role: "assistant", contentBlocks: ablocks, timestamp: d.timestamp || "" });
      }
    }
    return messages;
  }

  // 按应用类型分发解析
  private static readonly _MESSAGE_PARSERS: Record<string, (lines: string[]) => Message[]> = {
    openclaw: SessionManager._parseOpenClawMessages,
    codex: SessionManager._parseCodexMessages,
    claude: SessionManager._parseClaudeMessages,
    "claude-desktop": SessionManager._parseClaudeMessages,
  };

  // ============================================================
  // 排序函数
  // ============================================================

  private static _sortSessions(sessions: Session[], sort: string): Session[] {
    let sorted = sessions.slice();
    switch (sort) {
      case "today": {
        const today = new Date().toISOString().substring(0, 10);
        sorted = sorted.filter((s) => (s.updatedAt || "").substring(0, 10) === today);
        sorted.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
        break;
      }
      case "time-asc":
        sorted.sort((a, b) => (a.updatedAt || "").localeCompare(b.updatedAt || ""));
        break;
      case "name-asc":
        sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        break;
      case "name-desc":
        sorted.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
        break;
      case "time-desc":
      case "all":
      default:
        sorted.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
        break;
    }
    return sorted;
  }

  // ============================================================
  // 主入口：扫描会话
  // ============================================================

  private static readonly _SCAN_MAP: Record<string, ScanFunction> = {
    claude: SessionManager._scanClaudeSessions,
    codex: SessionManager._scanCodexSessions,
    openclaw: SessionManager._scanOpenClawSessions,
    "claude-desktop": SessionManager._scanClaudeDesktopSessions,
  };

  // ============================================================
  // 公共方法
  // ============================================================

  static async scanSessions(app: string, opts?: ScanOptions): Promise<ScanResult> {
    opts = opts || {};
    const offset = opts.offset || 0;
    const limit = opts.limit != null ? opts.limit : 20;
    const search = (opts.search || "").toLowerCase();
    const sort = opts.sort || "time-desc";

    try {
      const home = getHomeDir();
      const now = Date.now();
      const cacheKey = app || "all";

      // 无搜索时可用缓存
      const cached = _scanCache.data && _scanCache.data[cacheKey];
      const useCache = !search && cached && (now - _scanCache.timestamp < _scanCache.TTL);

      if (useCache) {
        const sorted = SessionManager._sortSessions(cached!.sessions, sort);
        const total = sorted.length;
        const page = sorted.slice(offset, offset + limit);
        return { sessions: page, total };
      }

      // 扫描所有文件头部元数据（只读 4KB，很快）
      let all: Session[] = [];
      if (app && SessionManager._SCAN_MAP[app]) {
        const r = await SessionManager._SCAN_MAP[app](home, { offset: 0, limit: Infinity });
        all = r.sessions;
      } else {
        const results = await Promise.all([
          SessionManager._scanClaudeSessions(home, { offset: 0, limit: Infinity }),
          SessionManager._scanCodexSessions(home, { offset: 0, limit: Infinity }),
          SessionManager._scanOpenClawSessions(home, { offset: 0, limit: Infinity }),
          SessionManager._scanClaudeDesktopSessions(home, { offset: 0, limit: Infinity }),
        ]);
        for (let i = 0; i < results.length; i++) {
          all = all.concat(results[i].sessions);
        }
      }

      // 缓存（无搜索 + 有数据时）
      if (!search && limit > 0) {
        if (!_scanCache.data) _scanCache.data = {};
        _scanCache.data[cacheKey] = { sessions: all };
        _scanCache.timestamp = now;
      }

      // 搜索过滤
      if (search) {
        all = all.filter((s) =>
          (s.title || "").toLowerCase().indexOf(search) >= 0
          || (s.projectPath || "").toLowerCase().indexOf(search) >= 0
          || (s.model || "").toLowerCase().indexOf(search) >= 0
        );
      }

      // 排序 + 分页
      all = SessionManager._sortSessions(all, sort);
      const total = all.length;
      const page = all.slice(offset, offset + limit);
      return { sessions: page, total };
    } catch (e: any) {
      return { sessions: [], total: 0, error: String(e && e.message ? e.message : e) };
    }
  }

  static async loadSessionDetail(filePath: string): Promise<Message[] | null> {
    if (!filePath) return null;
    if (_sessionCache[filePath]) return _sessionCache[filePath];

    let text: string;
    try { text = await fs.promises.readFile(filePath, "utf8"); } catch (e) { return null; }

    let app = SessionManager._detectApp(filePath);
    // Claude 路径可能是 OpenClaw 格式
    if (app === "claude") {
      const firstLine = text.split(/\r?\n/)[0] || "";
      if (firstLine.indexOf('"type":"session"') >= 0 && firstLine.indexOf('"version":3') >= 0) app = "openclaw";
    }

    const lines = text.split(/\r?\n/);
    const parser = SessionManager._MESSAGE_PARSERS[app] || SessionManager._parseClaudeMessages;
    const messages = SessionManager._mergeMessages(parser(lines));

    _sessionCache[filePath] = messages;
    return messages;
  }

  static deleteSession(filePath: string): DeleteResult {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        delete _sessionCache[filePath];
        SessionManager._clearScanCache();
        return { success: true };
      }
      return { success: false, error: "file not found" };
    } catch (e: any) {
      return { success: false, error: String(e && e.message ? e.message : e) };
    }
  }

  static clearAllSessions(filePaths: string[]): ClearAllResult {
    if (!Array.isArray(filePaths)) return { success: false, count: 0, errors: ["invalid input"] };
    let successCount = 0;
    const errors: string[] = [];
    for (let i = 0; i < filePaths.length; i++) {
      try {
        if (fs.existsSync(filePaths[i])) {
          fs.unlinkSync(filePaths[i]);
          delete _sessionCache[filePaths[i]];
          successCount++;
        }
      } catch (e: any) {
        errors.push(String(e && e.message ? e.message : e));
      }
    }
    SessionManager._clearScanCache();
    return { success: successCount > 0, count: successCount, errors };
  }

  static clearSessionCache(): void {
    _scanCache.data = null;
    _scanCache.timestamp = 0;
    _sessionCache = {};
  }
}
