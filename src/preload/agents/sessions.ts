// uTools ccToggle - sessions.ts
// 会话管理：读取各 AI 应用的本地会话数据

import utils = require("../utils");

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

// 文件枚举缓存（app -> 已排序文件列表），避免翻页时重复 readdir/stat
const ENUM_TTL = 30000;
const _enumCache: Record<string, { files: any[]; timestamp: number }> = {};

async function _cachedEnum<T>(key: string, produce: () => Promise<T[]>): Promise<T[]> {
  const hit = _enumCache[key];
  if (hit && Date.now() - hit.timestamp < ENUM_TTL) return hit.files as T[];
  const files = await produce();
  _enumCache[key] = { files, timestamp: Date.now() };
  return files;
}

// ============================================================
// 大文件优化：只读头尾，提取元数据
// ============================================================

const CHUNK_SIZE = 4096;
// 元数据解析并发度：每个文件 1 open + 1 stat + 2 read
const PARSE_CONCURRENCY = 12;

type ScanFunction = (home: string, opts?: { offset?: number; limit?: number }) => Promise<{ sessions: Session[]; totalFiles: number }>;
type CountFunction = (home: string) => Promise<number>;

export class SessionManager {
  // ============================================================
  // 内部辅助方法
  // ============================================================

  private static _clearScanCache(): void {
    _scanCache.data = null;
    _scanCache.timestamp = 0;
    for (const k of Object.keys(_enumCache)) delete _enumCache[k];
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
  // 分页解析：只解析当前页的文件，并发执行
  // ============================================================

  private static async _parsePage<T>(
    files: T[],
    offset: number,
    limit: number,
    parse: (f: T) => Promise<Session | null>
  ): Promise<Session[]> {
    if (limit <= 0) return [];
    const slice = limit === Infinity ? files.slice(offset) : files.slice(offset, offset + limit);
    const parsed = await utils.mapLimit(slice, PARSE_CONCURRENCY, parse);
    return parsed.filter(Boolean) as Session[];
  }

  // ============================================================
  // Claude 文件枚举（不解析内容）
  // ============================================================

  private static async _enumClaudeFiles(projectsDir: string): Promise<Array<{ path: string; mtime: number; project: string }>> {
    const allFiles: Array<{ path: string; mtime: number; project: string }> = [];
    let entries: import("fs").Dirent[];
    try {
      entries = await fs.promises.readdir(projectsDir, { withFileTypes: true });
    } catch (e) {
      return allFiles;
    }

    const dirs = entries.filter((e) => e.isDirectory());
    const perDir = await utils.mapLimit(dirs, PARSE_CONCURRENCY, async function (ent) {
      const projectPath = path.join(projectsDir, ent.name);
      let files: string[];
      try { files = await fs.promises.readdir(projectPath); } catch (e) { return []; }
      const jsonl = files.filter((f) => /\.jsonl$/i.test(f));
      const stats = await utils.mapLimit(jsonl, PARSE_CONCURRENCY, async function (fname) {
        const filePath = path.join(projectPath, fname);
        try {
          const st = await fs.promises.stat(filePath);
          return { path: filePath, mtime: st.mtimeMs, project: ent.name };
        } catch (e) { return null; }
      });
      return stats.filter(Boolean);
    });

    for (const list of perDir) {
      if (list) allFiles.push(...list);
    }
    allFiles.sort((a, b) => b.mtime - a.mtime);
    return allFiles;
  }

  // ============================================================
  // Claude / Claude Desktop 扫描（带分页）
  // ============================================================

  private static async _scanClaudeSessions(home: string, opts?: { offset?: number; limit?: number }): Promise<{ sessions: Session[]; totalFiles: number }> {
    opts = opts || {};
    const offset = opts.offset || 0;
    const limit = opts.limit != null ? opts.limit : 20;

    const projectsDir = utils.getAgentSessionPath("claude") || path.join(home, ".claude", "projects");
    const allFiles = await _cachedEnum("claude", () => SessionManager._enumClaudeFiles(projectsDir));

    const sessions = await SessionManager._parsePage(allFiles, offset, limit, (f) =>
      SessionManager._parseClaudeMeta(f.path, f.project)
    );

    return { sessions, totalFiles: allFiles.length };
  }

  private static async _countClaudeSessions(home: string): Promise<number> {
    const projectsDir = utils.getAgentSessionPath("claude") || path.join(home, ".claude", "projects");
    return (await _cachedEnum("claude", () => SessionManager._enumClaudeFiles(projectsDir))).length;
  }

  // Claude Desktop 会话文件枚举
  // 路径优先级：
  // 1. 用户自定义路径
  // 2. LOCALAPPDATA/Claude-3p/local-agent-mode-sessions (Windows 新版本)
  // 3. LOCALAPPDATA/Claude/projects (Windows 旧版本)
  // 4. ~/.claude-desktop/projects (Linux/macOS fallback)
  private static async _enumClaudeDesktopFiles(home: string): Promise<Array<{ path: string; mtime: number; project: string }>> {
    const customPath = utils.getAgentSessionPath("claude-desktop");
    if (customPath) {
      try {
        const entries = await fs.promises.readdir(customPath, { withFileTypes: true });
        if (entries.length > 0) return await SessionManager._enumClaudeFiles(customPath);
      } catch (e) { /* ignore */ }
    }

    let localAppData: string;
    try { localAppData = process.env.LOCALAPPDATA || ""; } catch (e) { localAppData = ""; }

    if (localAppData) {
      const claude3pSessionsDir = path.join(localAppData, "Claude-3p", "local-agent-mode-sessions");
      try {
        await fs.promises.access(claude3pSessionsDir);
        return await SessionManager._enumClaude3pFiles(claude3pSessionsDir);
      } catch (e) { /* ignore */ }
    }

    if (localAppData) {
      const claudeProjectsDir = path.join(localAppData, "Claude", "projects");
      try {
        const entries = await fs.promises.readdir(claudeProjectsDir, { withFileTypes: true });
        if (entries.length > 0) return await SessionManager._enumClaudeFiles(claudeProjectsDir);
      } catch (e) { /* ignore */ }
    }

    const fallbackDir = path.join(home, ".claude-desktop", "projects");
    try {
      const entries = await fs.promises.readdir(fallbackDir, { withFileTypes: true });
      if (entries.length > 0) return await SessionManager._enumClaudeFiles(fallbackDir);
    } catch (e) { /* ignore */ }

    return [];
  }

  private static async _scanClaudeDesktopSessions(home: string, opts?: { offset?: number; limit?: number }): Promise<{ sessions: Session[]; totalFiles: number }> {
    opts = opts || {};
    const offset = opts.offset || 0;
    const limit = opts.limit != null ? opts.limit : 20;

    const allFiles = await _cachedEnum("claude-desktop", () => SessionManager._enumClaudeDesktopFiles(home));
    const sessions = await SessionManager._parsePage(allFiles, offset, limit, async function (f) {
      const meta = await SessionManager._parseClaudeMeta(f.path, f.project);
      if (!meta) return null;
      meta.id = "claude-desktop_" + meta.sessionId;
      meta.app = "claude-desktop";
      return meta;
    });

    return { sessions, totalFiles: allFiles.length };
  }

  private static async _countClaudeDesktopSessions(home: string): Promise<number> {
    return (await _cachedEnum("claude-desktop", () => SessionManager._enumClaudeDesktopFiles(home))).length;
  }

  // 递归枚举 Claude-3p 新版本目录结构
  // 路径: {agentId}/{profileId}/local_{uuid}/.claude/projects/{project}/{session}.jsonl
  private static async _enumClaude3pFiles(baseDir: string): Promise<Array<{ path: string; mtime: number; project: string }>> {
    const allFiles: Array<{ path: string; mtime: number; project: string }> = [];

    async function findSessionFiles(dir: string, depth: number): Promise<void> {
      if (depth > 6) return; // 限制递归深度
      let entries: import("fs").Dirent[];
      try { entries = await fs.promises.readdir(dir, { withFileTypes: true }); } catch (e) { return; }

      for (const ent of entries) {
        if (!ent.isDirectory()) continue;
        const fullPath = path.join(dir, ent.name);
        if (ent.name === "projects") {
          allFiles.push(...await SessionManager._enumClaudeFiles(fullPath));
        } else {
          await findSessionFiles(fullPath, depth + 1);
        }
      }
    }

    await findSessionFiles(baseDir, 0);
    allFiles.sort((a, b) => b.mtime - a.mtime);
    return allFiles;
  }

  // ============================================================
  // Codex 扫描（带分页，目录结构天然按时间排序）
  // ============================================================

  // 枚举 codex 会话文件：目录名 YYYY/MM/DD 天然有序，无需 stat
  private static async _enumCodexFiles(home: string): Promise<string[]> {
    const sessionsDir = utils.getAgentSessionPath("codex") || path.join(home, ".codex", "sessions");
    const out: string[] = [];
    let years: import("fs").Dirent[];
    try {
      years = await fs.promises.readdir(sessionsDir, { withFileTypes: true });
    } catch (e) {
      return out;
    }

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
            out.push(path.join(dayDir, jsonlFiles[fi]));
          }
        }
      }
    }
    return out;
  }

  private static async _scanCodexSessions(home: string, opts?: { offset?: number; limit?: number }): Promise<{ sessions: Session[]; totalFiles: number }> {
    opts = opts || {};
    const offset = opts.offset || 0;
    const limit = opts.limit != null ? opts.limit : 20;

    const allFiles = await _cachedEnum("codex", () => SessionManager._enumCodexFiles(home));
    const sessions = await SessionManager._parsePage(allFiles, offset, limit, (fp) =>
      SessionManager._parseCodexMeta(fp)
    );

    return { sessions, totalFiles: allFiles.length };
  }

  private static async _countCodexSessions(home: string): Promise<number> {
    return (await _cachedEnum("codex", () => SessionManager._enumCodexFiles(home))).length;
  }

  // ============================================================
  // OpenClaw 扫描（带分页）
  // ============================================================

  private static async _enumOpenClawFiles(home: string): Promise<Array<{ path: string; mtime: number; agent: string }>> {
    const agentsDir = utils.getAgentSessionPath("openclaw") || path.join(home, ".openclaw", "agents");
    const allFiles: Array<{ path: string; mtime: number; agent: string }> = [];
    let agentEntries: import("fs").Dirent[];
    try {
      agentEntries = await fs.promises.readdir(agentsDir, { withFileTypes: true });
    } catch (e) {
      return allFiles;
    }

    const dirs = agentEntries.filter((e) => e.isDirectory());
    const perAgent = await utils.mapLimit(dirs, PARSE_CONCURRENCY, async function (agentEnt) {
      const sessDir = path.join(agentsDir, agentEnt.name, "sessions");
      let files: string[];
      try { files = await fs.promises.readdir(sessDir); } catch (e) { return []; }
      const jsonl = files.filter((f) => /\.jsonl$/i.test(f));
      const stats = await utils.mapLimit(jsonl, PARSE_CONCURRENCY, async function (fname) {
        const filePath = path.join(sessDir, fname);
        try {
          const st = await fs.promises.stat(filePath);
          return { path: filePath, mtime: st.mtimeMs, agent: agentEnt.name };
        } catch (e) { return null; }
      });
      return stats.filter(Boolean);
    });

    for (const list of perAgent) {
      if (list) allFiles.push(...list);
    }
    allFiles.sort((a, b) => b.mtime - a.mtime);
    return allFiles;
  }

  private static async _scanOpenClawSessions(home: string, opts?: { offset?: number; limit?: number }): Promise<{ sessions: Session[]; totalFiles: number }> {
    opts = opts || {};
    const offset = opts.offset || 0;
    const limit = opts.limit != null ? opts.limit : 20;

    const allFiles = await _cachedEnum("openclaw", () => SessionManager._enumOpenClawFiles(home));
    const sessions = await SessionManager._parsePage(allFiles, offset, limit, (f) =>
      SessionManager._parseOpenClawMeta(f.path, f.agent)
    );

    return { sessions, totalFiles: allFiles.length };
  }

  private static async _countOpenClawSessions(home: string): Promise<number> {
    return (await _cachedEnum("openclaw", () => SessionManager._enumOpenClawFiles(home))).length;
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

  // 只数文件、不解析内容
  private static readonly _COUNT_MAP: Record<string, CountFunction> = {
    claude: SessionManager._countClaudeSessions,
    codex: SessionManager._countCodexSessions,
    openclaw: SessionManager._countOpenClawSessions,
    "claude-desktop": SessionManager._countClaudeDesktopSessions,
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
        const page = limit > 0 ? sorted.slice(offset, offset + limit) : [];
        return { sessions: page, total };
      }

      // 只要总数（Tab 计数）：枚举文件即可，不解析任何内容
      if (limit <= 0 && !search) {
        let total = 0;
        if (app && SessionManager._COUNT_MAP[app]) {
          total = await SessionManager._COUNT_MAP[app](home);
        } else {
          const counts = await Promise.all(
            Object.keys(SessionManager._COUNT_MAP).map((k) => SessionManager._COUNT_MAP[k](home))
          );
          total = counts.reduce((a, b) => a + b, 0);
        }
        return { sessions: [], total };
      }

      // 快路径：单 app + 无搜索 + 时间倒序
      // 文件枚举天然按 mtime/日期目录倒序，只需解析当前页
      if (!search && (sort === "time-desc" || sort === "all") && app && SessionManager._SCAN_MAP[app]) {
        const r = await SessionManager._SCAN_MAP[app](home, { offset, limit });
        return { sessions: SessionManager._sortSessions(r.sessions, sort), total: r.totalFiles };
      }

      // 慢路径：搜索 / 按名排序 / 今日过滤 / 跨 app 聚合，需要全量元数据
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

      // 缓存（无搜索时）
      if (!search) {
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

    const lines = text.split(/\r?\n/);

    let app = SessionManager._detectApp(filePath);
    // Claude 路径可能是 OpenClaw 格式
    if (app === "claude") {
      const firstLine = lines[0] || "";
      if (firstLine.indexOf('"type":"session"') >= 0 && firstLine.indexOf('"version":3') >= 0) app = "openclaw";
    }

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
    SessionManager._clearScanCache();
    _sessionCache = {};
  }
}
