// uTools ccToggle - prompts.ts
// 提示词管理：使用 utools.db 存储提示词数据

const utils = require("./utils");
const configRw = require("./config-rw");
const fs = utils.fs;
const path = utils.path;

const DB_KEY = "cctoggle_prompts";
const BACKUP_KEY = "cctoggle_prompts_backup";

interface Prompt {
  id: string;
  name: string;
  description: string;
  content: string;
  agents: string[];
  variables: string[];
  tags: string[];
  isTemplate: boolean;
  templateId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PromptSaveData {
  id?: string;
  name: string;
  description?: string;
  content?: string;
  agents?: string[];
  variables?: string[];
  tags?: string[];
  isTemplate?: boolean;
  templateId?: string | null;
  createdAt?: string;
}

interface PromptImportItem {
  id?: string;
  name: string;
  description?: string;
  content: string;
  agents?: string[];
  variables?: string[];
  tags?: string[];
  isTemplate?: boolean;
  templateId?: string | null;
  createdAt?: string;
}

interface ResultWithPrompt {
  success: boolean;
  prompt?: Prompt;
  error?: string;
}

interface ResultBasic {
  success: boolean;
  error?: string;
}

interface ResultWithCount {
  success: boolean;
  count?: number;
  error?: string;
}

interface BackupEntry {
  content: string;
  backedUpAt: string;
}

interface BackupsMap {
  [agent: string]: BackupEntry;
}

interface BackupResult {
  success: boolean;
  backups?: BackupsMap;
  error?: string;
}

interface RestoreResults {
  [agent: string]: ResultBasic;
}

interface ToggleResult {
  success: boolean;
  prompt?: Prompt;
  associated?: boolean;
  error?: string;
}

interface OriginalPrompts {
  codex: string;
  claude: string;
  openclaw: string;
  gemini: string;
}

export class PromptManager {
  // ─────────── 数据库操作 ───────────

  private static _getAll(): Prompt[] {
    try {
      const doc = utools.db.get(DB_KEY);
      if (!doc) return [];
      return Array.isArray(doc.prompts) ? doc.prompts : [];
    } catch (e) {
      return [];
    }
  }

  private static _saveAll(prompts: Prompt[]): void {
    try {
      let existing: any = null;
      try { existing = utools.db.get(DB_KEY); } catch (e) {}
      // 深拷贝确保是纯 JSON 对象
      const cleanPrompts: Prompt[] = JSON.parse(JSON.stringify(prompts));
      const doc: any = { _id: DB_KEY, prompts: cleanPrompts };
      if (existing && existing._rev) doc._rev = existing._rev;
      utools.db.put(doc);
    } catch (e: any) {
      throw new Error("Failed to save to db: " + (e.message || e));
    }
  }

  private static _generateId(): string {
    return "prompt_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  // ─────────── CRUD ───────────

  static listPrompts(): Prompt[] {
    return PromptManager._getAll();
  }

  static getPrompt(id: string): Prompt | null {
    const prompts = PromptManager._getAll();
    for (let i = 0; i < prompts.length; i++) {
      if (prompts[i].id === id) return prompts[i];
    }
    return null;
  }

  static savePrompt(data: PromptSaveData): ResultWithPrompt {
    if (!data || !data.name) {
      return { success: false, error: "Name is required" };
    }

    const prompts = PromptManager._getAll();
    const now = new Date().toISOString();

    const prompt: Prompt = {
      id: data.id || PromptManager._generateId(),
      name: data.name,
      description: data.description || "",
      content: data.content || "",
      agents: Array.isArray(data.agents) ? data.agents : [],
      variables: Array.isArray(data.variables) ? data.variables : [],
      tags: Array.isArray(data.tags) ? data.tags : [],
      isTemplate: !!data.isTemplate,
      templateId: data.templateId || null,
      createdAt: data.createdAt || now,
      updatedAt: now,
    };

    let found = false;
    for (let i = 0; i < prompts.length; i++) {
      if (prompts[i].id === prompt.id) {
        prompts[i] = prompt;
        found = true;
        break;
      }
    }

    if (!found) {
      prompts.push(prompt);
    }

    PromptManager._saveAll(prompts);
    return { success: true, prompt: prompt };
  }

  static deletePrompt(id: string): ResultBasic {
    const prompts = PromptManager._getAll();
    const filtered = prompts.filter(function (p) { return p.id !== id; });

    if (filtered.length === prompts.length) {
      return { success: false, error: "Prompt not found" };
    }

    PromptManager._saveAll(filtered);
    return { success: true };
  }

  static duplicatePrompt(id: string): ResultWithPrompt {
    const prompts = PromptManager._getAll();
    let source: Prompt | null = null;

    for (let i = 0; i < prompts.length; i++) {
      if (prompts[i].id === id) {
        source = prompts[i];
        break;
      }
    }

    if (!source) {
      return { success: false, error: "Source prompt not found" };
    }

    const now = new Date().toISOString();
    const newPrompt: Prompt = {
      id: PromptManager._generateId(),
      name: source.name + " (副本)",
      description: source.description,
      content: source.content,
      agents: source.agents ? source.agents.slice() : [],
      variables: source.variables ? source.variables.slice() : [],
      tags: source.tags ? source.tags.slice() : [],
      isTemplate: false,
      templateId: source.templateId || source.id,
      createdAt: now,
      updatedAt: now,
    };

    prompts.push(newPrompt);
    PromptManager._saveAll(prompts);
    return { success: true, prompt: newPrompt };
  }

  // ─────────── 导入导出 ───────────

  static exportPrompts(): string {
    const prompts = PromptManager._getAll();
    return JSON.stringify(prompts, null, 2);
  }

  static importPrompts(jsonString: string): ResultWithCount {
    try {
      const data: PromptImportItem[] = JSON.parse(jsonString);
      if (!Array.isArray(data)) {
        return { success: false, error: "Invalid format: expected array" };
      }

      const existing = PromptManager._getAll();
      const existingIds: { [id: string]: boolean } = {};
      existing.forEach(function (p) { existingIds[p.id] = true; });

      const now = new Date().toISOString();
      let imported = 0;

      data.forEach(function (item) {
        if (!item.name || !item.content) return;

        const prompt: Prompt = {
          id: item.id && !existingIds[item.id] ? item.id : PromptManager._generateId(),
          name: item.name,
          description: item.description || "",
          content: item.content,
          agents: Array.isArray(item.agents) ? item.agents : [],
          variables: Array.isArray(item.variables) ? item.variables : [],
          tags: Array.isArray(item.tags) ? item.tags : [],
          isTemplate: !!item.isTemplate,
          templateId: item.templateId || null,
          createdAt: item.createdAt || now,
          updatedAt: now,
        };

        existing.push(prompt);
        imported++;
      });

      PromptManager._saveAll(existing);
      return { success: true, count: imported };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  // ─────────── 读取各 Agent 原始提示词 ───────────

  // 获取 Agent 对应的提示词文件路径
  private static _getAgentPromptPath(agent: string): string | null {
    switch (agent) {
      case "claude": return utils.getClaudeMdPath();
      case "codex": return utils.getCodexAgentsMdPath();
      case "gemini": return utils.getGeminiMdPath();
      case "openclaw": return utils.getOpenClawAgentsMdPath();
      default: return null;
    }
  }

  // 读取指定 Agent 的提示词文件
  private static _readPromptFile(agent: string): string {
    try {
      const filePath = PromptManager._getAgentPromptPath(agent);
      if (filePath && fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, "utf8");
      }
      return "";
    } catch (e) {
      return "";
    }
  }

  // 写入提示词到指定 Agent 的文件
  private static _writePromptFile(agent: string, content: string): void {
    const filePath = PromptManager._getAgentPromptPath(agent);
    if (!filePath) {
      throw new Error("Unsupported agent: " + agent);
    }
    if (agent === "openclaw" && !utils.getOpenClawWorkspaceDir()) {
      throw new Error("OpenClaw workspace not found");
    }
    utils.ensureDir(filePath);
    fs.writeFileSync(filePath, content, "utf8");
  }

  static readOriginalPrompt(agent: string): string {
    return PromptManager._readPromptFile(agent);
  }

  static readAllOriginalPrompts(): OriginalPrompts {
    return {
      codex: PromptManager._readPromptFile("codex"),
      claude: PromptManager._readPromptFile("claude"),
      openclaw: PromptManager._readPromptFile("openclaw"),
      gemini: PromptManager._readPromptFile("gemini"),
    };
  }

  // ─────────── 备份与恢复 ───────────

  private static _getBackups(): BackupsMap {
    try {
      const doc = utools.db.get(BACKUP_KEY);
      if (!doc) return {};
      return doc.backups || {};
    } catch (e) {
      return {};
    }
  }

  private static _saveBackups(backups: BackupsMap): any {
    try {
      let existing: any = null;
      try { existing = utools.db.get(BACKUP_KEY); } catch (e) {}
      // 深拷贝确保是纯 JSON 对象
      const cleanBackups: BackupsMap = JSON.parse(JSON.stringify(backups));
      const doc: any = { _id: BACKUP_KEY, backups: cleanBackups };
      if (existing && existing._rev) doc._rev = existing._rev;
      const result = utools.db.put(doc);
      return result;
    } catch (e: any) {
      throw new Error("Failed to save backups: " + (e.message || e));
    }
  }

  // 备份当前各 Agent 的提示词
  static backupOriginalPrompts(): BackupResult {
    try {
      const backups = PromptManager._getBackups();
      const now = new Date().toISOString();
      const agents = ["codex", "claude", "openclaw", "gemini"];

      agents.forEach(function (agent) {
        backups[agent] = { content: PromptManager._readPromptFile(agent), backedUpAt: now };
      });

      PromptManager._saveBackups(backups);
      return { success: true, backups: backups };
    } catch (e: any) {
      return { success: false, error: e.message || "Backup failed" };
    }
  }

  // 备份指定 Agent 的提示词
  static backupSelectedPrompts(agentList: string[]): BackupResult {
    if (!Array.isArray(agentList) || agentList.length === 0) {
      return { success: false, error: "No agents selected" };
    }
    try {
      const backups = PromptManager._getBackups();
      const now = new Date().toISOString();

      agentList.forEach(function (agent) {
        backups[agent] = { content: PromptManager._readPromptFile(agent), backedUpAt: now };
      });

      PromptManager._saveBackups(backups);
      return { success: true, backups: backups };
    } catch (e: any) {
      return { success: false, error: e.message || "Backup failed" };
    }
  }

  // 获取备份
  static getBackups(): BackupsMap {
    return PromptManager._getBackups();
  }

  // 恢复指定 Agent 的原始提示词
  static restoreOriginalPrompt(agent: string): ResultBasic {
    const backups = PromptManager._getBackups();
    const backup = backups[agent];

    if (!backup || !backup.backedUpAt) {
      return { success: false, error: "No backup found for " + agent };
    }

    try {
      PromptManager._writePromptFile(agent, backup.content || "");
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  // 恢复所有 Agent 的原始提示词
  static restoreAllOriginalPrompts(): RestoreResults {
    const results: RestoreResults = {};
    ["codex", "claude", "openclaw", "gemini"].forEach(function (agent) {
      results[agent] = PromptManager.restoreOriginalPrompt(agent);
    });
    return results;
  }

  // ─────────── 应用提示词到 Agent ───────────

  // 应用提示词到指定 Agent，并自动取消其他提示词对该 Agent 的关联
  static applyPromptToAgent(promptId: string, agent: string): ResultWithPrompt {
    const prompts = PromptManager._getAll();
    let targetPrompt: Prompt | null = null;

    // 找到目标提示词
    for (let i = 0; i < prompts.length; i++) {
      if (prompts[i].id === promptId) {
        targetPrompt = prompts[i];
        break;
      }
    }

    if (!targetPrompt) {
      return { success: false, error: "Prompt not found" };
    }

    // 自动取消其他提示词对该 Agent 的关联
    prompts.forEach(function (p) {
      if (p.id !== promptId && Array.isArray(p.agents)) {
        const idx = p.agents.indexOf(agent);
        if (idx !== -1) {
          p.agents.splice(idx, 1);
        }
      }
    });

    // 确保目标提示词关联了该 Agent
    if (!Array.isArray(targetPrompt.agents)) {
      targetPrompt.agents = [];
    }
    if (targetPrompt.agents.indexOf(agent) === -1) {
      targetPrompt.agents.push(agent);
    }

    // 保存更新后的提示词
    PromptManager._saveAll(prompts);

    // 将提示词内容写入对应的 md 文件
    try {
      PromptManager._writePromptFile(agent, targetPrompt.content);
    } catch (e: any) {
      return { success: false, error: "Failed to write prompt file: " + e.message };
    }

    return { success: true, prompt: targetPrompt };
  }

  // 切换提示词对 Agent 的关联，取消关联时同步清理 Agent 配置文件
  static togglePromptAgent(promptId: string, agent: string): ToggleResult {
    const prompts = PromptManager._getAll();
    let targetPrompt: Prompt | null = null;

    for (let i = 0; i < prompts.length; i++) {
      if (prompts[i].id === promptId) {
        targetPrompt = prompts[i];
        break;
      }
    }

    if (!targetPrompt) {
      return { success: false, error: "Prompt not found" };
    }

    if (!Array.isArray(targetPrompt.agents)) {
      targetPrompt.agents = [];
    }

    const idx = targetPrompt.agents.indexOf(agent);
    if (idx === -1) {
      // 关联：由前端调用 applyPromptToAgent 处理文件写入
      targetPrompt.agents.push(agent);
    } else {
      // 取消关联：清理 Agent 配置文件中的提示词内容
      targetPrompt.agents.splice(idx, 1);
      try {
        const currentContent = PromptManager._readPromptFile(agent);
        if (currentContent === targetPrompt.content) {
          const backups = PromptManager._getBackups();
          const backup = backups[agent];
          if (backup && backup.content) {
            PromptManager._writePromptFile(agent, backup.content);
          } else {
            PromptManager._writePromptFile(agent, "");
          }
        }
      } catch (e) {
        // 文件清理失败不阻断数据库更新
      }
    }

    PromptManager._saveAll(prompts);
    return { success: true, prompt: targetPrompt, associated: idx === -1 };
  }
}
