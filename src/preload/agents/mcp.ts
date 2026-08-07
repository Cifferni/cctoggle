// uTools ccToggle - mcp.ts
// MCP Server 配置管理：配置文件为源 + db 仅存 apps 映射

import { DataMigration } from "../core/cleanup";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const utils = require("../utils");

const fs = utils.fs;
const path = utils.path;
const getHomeDir = utils.getHomeDir;
const ensureDir = utils.ensureDir;

const APPS_KEY = "cctoggle_mcp_apps";
const ALL_APPS: string[] = ["claude", "claude-desktop", "codex", "openclaw"];

// ─────────── 类型定义 ───────────

interface StdioEntry {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

interface SseEntry {
  url: string;
  headers?: Record<string, string>;
}

interface HttpEntry {
  url: string;
  headers?: Record<string, string>;
}

interface ConfigEntry {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  authType?: string;
  apiKey?: string;
}

interface McpServerData {
  stdio?: StdioEntry | null;
  sse?: SseEntry | null;
  http?: HttpEntry | null;
}

interface McpServer {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  stdio: StdioEntry | null;
  sse: SseEntry | null;
  http: HttpEntry | null;
  apps: string[];
}

interface AppMapping {
  disabled: string[];
  [app: string]: string[];
}

interface ConfigsMap {
  [app: string]: Record<string, ConfigEntry>;
}

interface TransportFields {
  stdio?: StdioEntry;
  sse?: { url: string; headers: Record<string, string>; authType: string; apiKey: string };
  http?: { url: string; headers: Record<string, string>; authType: string; apiKey: string };
}

// ─────────── 配置文件路径 ───────────

const CONFIG_PATHS: Record<string, () => string> = {
  claude: function (): string {
    const configured = utils.getAgentConfigPath("claude");
    if (configured) return path.join(configured, ".claude.json");
    return path.join(getHomeDir(), ".claude.json");
  },
  "claude-desktop": function (): string { return utils.getClaudeDesktopConfigPath(); },
  codex: function (): string {
    const configured = utils.getAgentConfigPath("codex");
    if (configured) return path.join(configured, "config.toml");
    return path.join(getHomeDir(), ".codex", "config.toml");
  },
  openclaw: function (): string {
    const configured = utils.getAgentConfigPath("openclaw");
    if (configured) return path.join(configured, "openclaw.json");
    return path.join(getHomeDir(), ".openclaw", "openclaw.json");
  },
};

export class McpManager {

  // ─────────── db apps 映射读写 ───────────

  private static _emptyMapping(): AppMapping {
    const m: AppMapping = { disabled: [] };
    ALL_APPS.forEach(function (a) { m[a] = []; });
    return m;
  }

  private static _getMapping(): AppMapping {
    try {
      const doc = utools.db.get(APPS_KEY);
      if (!doc) return McpManager._emptyMapping();
      const m: AppMapping = { disabled: Array.isArray(doc.disabled) ? doc.disabled : [] };
      ALL_APPS.forEach(function (a) {
        m[a] = Array.isArray(doc[a]) ? doc[a] : [];
      });
      return m;
    } catch (e) {
      return McpManager._emptyMapping();
    }
  }

  private static _putMapping(mapping: AppMapping): void {
    let existing: any = null;
    try { existing = utools.db.get(APPS_KEY); } catch (e) {}
    const doc: any = { _id: APPS_KEY, disabled: mapping.disabled || [] };
    ALL_APPS.forEach(function (a) { doc[a] = mapping[a] || []; });
    if (existing && existing._rev) doc._rev = existing._rev;
    utools.db.put(doc);
  }

  // ─────────── 配置文件读取 ───────────

  private static _readJsonConfig(filePath: string): Record<string, ConfigEntry> {
    try {
      if (fs.existsSync(filePath)) {
        const config = JSON.parse(fs.readFileSync(filePath, "utf8"));
        return config.mcpServers || {};
      }
    } catch (e) {}
    return {};
  }

  private static _readCodexMcpServers(): Record<string, ConfigEntry> {
    const configPath = CONFIG_PATHS.codex();
    let content = "";
    try {
      if (fs.existsSync(configPath)) content = fs.readFileSync(configPath, "utf8");
    } catch (e) { return {}; }

    const servers: Record<string, ConfigEntry> = {};
    let currentSlug: string | null = null;
    let currentEntry: ConfigEntry = {};

    content.split(/\r?\n/).forEach(function (line) {
      const m = line.match(/^\s*\[\s*mcp_servers\.([^\]]+?)\s*\]\s*$/);
      if (m) {
        const slug = m[1].trim();
        // 跳过子节（如 mcp_servers.xxx.env）和非 MCP 的沙箱配置
        if (slug.indexOf(".") !== -1 || slug === "node_repl") {
          currentSlug = null;
          currentEntry = {};
          return;
        }
        if (currentSlug) servers[currentSlug] = currentEntry;
        currentSlug = slug;
        currentEntry = {};
        return;
      }
      if (currentSlug) {
        const kv = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
        if (kv) {
          const key = kv[1];
          const val = kv[2].trim();
          if (key === "command") {
            currentEntry.command = val.replace(/^["']|["']$/g, "");
          } else if (key === "args") {
            const arrMatch = val.match(/^\[(.*)\]$/);
            if (arrMatch) {
              currentEntry.args = arrMatch[1].split(",").map(function (s) {
                return s.trim().replace(/^["']|["']$/g, "");
              }).filter(Boolean);
            }
          } else if (key === "url") {
            currentEntry.url = val.replace(/^["']|["']$/g, "");
          }
        }
      }
    });
    if (currentSlug) servers[currentSlug] = currentEntry;
    return servers;
  }

  private static _readAllConfigs(): ConfigsMap {
    return {
      claude: McpManager._readJsonConfig(CONFIG_PATHS.claude()),
      "claude-desktop": McpManager._readJsonConfig(CONFIG_PATHS["claude-desktop"]()),
      codex: McpManager._readCodexMcpServers(),
      openclaw: McpManager._readJsonConfig(CONFIG_PATHS.openclaw()),
    };
  }

  // ─────────── 配置文件写入 ───────────

  private static _writeJsonMcpServer(filePath: string, name: string, entryOrNull: ConfigEntry | null): void {
    let config: any = {};
    try {
      if (fs.existsSync(filePath)) config = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (e) { config = {}; }
    if (!config.mcpServers) config.mcpServers = {};

    if (entryOrNull === null) {
      delete config.mcpServers[name];
    } else {
      config.mcpServers[name] = entryOrNull;
    }

    ensureDir(filePath);
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), "utf8");
  }

  private static _writeCodexMcpServer(slug: string, entryOrNull: ConfigEntry | null): void {
    const configPath = CONFIG_PATHS.codex();
    let existing = "";
    try {
      if (fs.existsSync(configPath)) existing = fs.readFileSync(configPath, "utf8");
    } catch (e) { existing = ""; }

    const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const cleaned = McpManager._removeTomlSection(existing, "mcp_servers\\." + escaped);

    if (entryOrNull) {
      const lines: string[] = ["[mcp_servers." + slug + "]"];
      if (entryOrNull.command) lines.push('command = "' + entryOrNull.command + '"');
      if (entryOrNull.args && entryOrNull.args.length) {
        lines.push("args = [" + entryOrNull.args.map(function (a) { return '"' + a + '"'; }).join(", ") + "]");
      }
      if (entryOrNull.url) lines.push('url = "' + entryOrNull.url + '"');
      if (entryOrNull.headers && Object.keys(entryOrNull.headers).length) {
        lines.push("[mcp_servers." + slug + ".headers]");
        Object.keys(entryOrNull.headers).forEach(function (k) {
          lines.push('  "' + k + '" = "' + entryOrNull.headers![k] + '"');
        });
      }
      if (entryOrNull.env && Object.keys(entryOrNull.env).length) {
        lines.push("[mcp_servers." + slug + ".env]");
        Object.keys(entryOrNull.env).forEach(function (k) {
          lines.push('  "' + k + '" = "' + entryOrNull.env![k] + '"');
        });
      }
      let content = cleaned.trim();
      if (content) content += "\n\n";
      content += lines.join("\n") + "\n";
      ensureDir(configPath);
      fs.writeFileSync(configPath, content, "utf8");
    } else {
      ensureDir(configPath);
      fs.writeFileSync(configPath, cleaned, "utf8");
    }
  }

  // ─────────── 配置文件条目读写 ───────────

  private static _writeToApp(appType: string, name: string, entry: ConfigEntry): void {
    switch (appType) {
      case "claude":
        McpManager._writeJsonMcpServer(CONFIG_PATHS.claude(), name, entry);
        McpManager._writeJsonMcpServer(CONFIG_PATHS["claude-desktop"](), name, entry);
        break;
      case "claude-desktop":
        McpManager._writeJsonMcpServer(CONFIG_PATHS["claude-desktop"](), name, entry);
        break;
      case "codex":
        McpManager._writeCodexMcpServer(McpManager._slugify(name), entry);
        break;
      case "openclaw":
        McpManager._writeJsonMcpServer(CONFIG_PATHS.openclaw(), name, entry);
        break;
    }
  }

  private static _removeFromApp(appType: string, name: string): void {
    McpManager._writeToApp(appType, name, null as any);
  }

  // ─────────── 构建配置文件条目 ───────────

  private static _buildConfigEntry(server: McpServerData): ConfigEntry | null {
    if (server.stdio) {
      const entry: ConfigEntry = { command: server.stdio.command || "", args: server.stdio.args || [] };
      if (server.stdio.env && Object.keys(server.stdio.env).length > 0) entry.env = server.stdio.env;
      return entry;
    }
    if (server.sse) {
      const entry: ConfigEntry = { url: server.sse.url || "" };
      if (server.sse.headers && Object.keys(server.sse.headers).length > 0) entry.headers = server.sse.headers;
      return entry;
    }
    if (server.http) {
      const entry: ConfigEntry = { url: server.http.url || "" };
      if (server.http.headers && Object.keys(server.http.headers).length > 0) entry.headers = server.http.headers;
      return entry;
    }
    return null;
  }

  // 从配置条目推断类型
  private static _inferType(def: ConfigEntry | null): string {
    return (def && def.url) ? "streamable-http" : "stdio";
  }

  // 从配置条目构建 server 传输字段
  private static _buildTransport(type: string, def: ConfigEntry | null): TransportFields {
    if (!def) return {};
    if (type === "stdio") {
      return { stdio: { command: def.command || "", args: def.args || [], env: def.env || {} } };
    }
    const transport = { url: def.url || "", headers: def.headers || {}, authType: def.authType || "none", apiKey: def.apiKey || "" };
    return type === "sse" ? { sse: transport } : { http: transport };
  }

  // 收集所有配置文件 + 映射中出现的 server name
  private static _collectAllNames(configs: ConfigsMap, mapping: AppMapping): string[] {
    const nameSet: Record<string, boolean> = {};
    ALL_APPS.forEach(function (app) {
      Object.keys(configs[app] || {}).forEach(function (n) { nameSet[n] = true; });
      (mapping[app] || []).forEach(function (n) { nameSet[n] = true; });
    });
    return Object.keys(nameSet);
  }

  // 计算 server 关联的 apps
  private static _resolveApps(name: string, mapping: AppMapping, configs: ConfigsMap): string[] {
    const apps: string[] = [];
    ALL_APPS.forEach(function (app) {
      if (mapping[app].indexOf(name) !== -1) apps.push(app);
    });
    if (apps.length === 0) {
      ALL_APPS.forEach(function (app) {
        if ((configs[app] || {})[name]) apps.push(app);
      });
    }
    return apps;
  }

  // 从配置文件中查找 server 定义
  private static _findDef(name: string, configs: ConfigsMap): ConfigEntry | null {
    for (let i = 0; i < ALL_APPS.length; i++) {
      const cfg = configs[ALL_APPS[i]];
      if (cfg && cfg[name]) return cfg[name];
    }
    return null;
  }

  // ─────────── 工具函数 ───────────

  private static _slugify(name: string): string {
    return (name || "mcp").toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^_+|_+$/g, "") || "mcp";
  }

  private static _removeTomlSection(text: string, tableNameRegex: string): string {
    if (!text || !text.trim()) return "";
    const lines = text.split(/\r?\n/);
    const result: string[] = [];
    let inTarget = false;
    const regex = new RegExp("^\\s*\\[\\[?\\s*(" + tableNameRegex + "(?:\\..*)?)\\s*\\]\\]?\\s*$");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const tableMatch = line.match(/^\s*\[\[?\s*([^\]]+?)\s*\]\]?\s*$/);
      if (tableMatch) {
        if (regex.test(line)) {
          inTarget = true;
          continue;
        } else {
          inTarget = false;
        }
      }
      if (!inTarget) result.push(line);
    }
    return result.join("\n");
  }

  // ─────────── CRUD ───────────

  private static _buildServer(name: string, def: ConfigEntry | null, apps: string[], disabledSet: Record<string, boolean>): McpServer {
    const type = McpManager._inferType(def);
    const server: McpServer = {
      id: name,
      name: name,
      type: type,
      enabled: !disabledSet[name],
      stdio: null,
      sse: null,
      http: null,
      apps: apps,
    };
    const transport = McpManager._buildTransport(type, def);
    if (transport.stdio) server.stdio = transport.stdio;
    if (transport.sse) server.sse = transport.sse;
    if (transport.http) server.http = transport.http;
    return server;
  }

  static listMcpServers(): McpServer[] {
    const configs = McpManager._readAllConfigs();
    const mapping = McpManager._getMapping();
    if (DataMigration.cleanMcpMapping(mapping, configs, ALL_APPS)) McpManager._putMapping(mapping);
    const disabledSet: Record<string, boolean> = {};
    (mapping.disabled || []).forEach(function (n) { disabledSet[n] = true; });

    const names = McpManager._collectAllNames(configs, mapping);
    const result: McpServer[] = [];

    names.forEach(function (name) {
      const apps = McpManager._resolveApps(name, mapping, configs);
      const def = McpManager._findDef(name, configs);
      result.push(McpManager._buildServer(name, def, apps, disabledSet));
    });

    return result;
  }

  static getMcpServer(name: string): McpServer {
    const configs = McpManager._readAllConfigs();
    const mapping = McpManager._getMapping();
    const apps = McpManager._resolveApps(name, mapping, configs);
    const def = McpManager._findDef(name, configs);
    const disabledSet: Record<string, boolean> = {};
    (mapping.disabled || []).forEach(function (n) { disabledSet[n] = true; });
    return McpManager._buildServer(name, def, apps, disabledSet);
  }

  static saveMcpServer(data: McpServerData & { name?: string; apps?: string[] }): string {
    const name = data.name;
    if (!name) return "";

    const mapping = McpManager._getMapping();
    const newApps = data.apps || [];

    // 获取旧的 apps
    const oldApps: string[] = [];
    ALL_APPS.forEach(function (app) {
      if (mapping[app].indexOf(name) !== -1) oldApps.push(app);
    });

    // 更新映射
    ALL_APPS.forEach(function (app) {
      const idx = mapping[app].indexOf(name);
      if (newApps.indexOf(app) !== -1) {
        if (idx === -1) mapping[app].push(name);
      } else {
        if (idx !== -1) mapping[app].splice(idx, 1);
      }
    });
    McpManager._putMapping(mapping);

    // 从旧 apps 中移除
    oldApps.forEach(function (app) {
      if (newApps.indexOf(app) === -1) McpManager._removeFromApp(app, name);
    });

    // 写入新 apps
    const entry = McpManager._buildConfigEntry(data);
    if (entry) {
      newApps.forEach(function (app) { McpManager._writeToApp(app, name, entry); });
    }

    return name;
  }

  static deleteMcpServer(name: string): void {
    const mapping = McpManager._getMapping();

    // 从所有关联 app 配置文件中移除
    ALL_APPS.forEach(function (app) {
      if (mapping[app].indexOf(name) !== -1) {
        McpManager._removeFromApp(app, name);
        mapping[app] = mapping[app].filter(function (n) { return n !== name; });
      }
    });

    // 也从配置文件中移除（处理不在映射中但存在于配置文件的情况）
    const configs = McpManager._readAllConfigs();
    ALL_APPS.forEach(function (app) {
      if ((configs[app] || {})[name]) McpManager._removeFromApp(app, name);
    });

    // 从 disabled 列表中移除
    mapping.disabled = (mapping.disabled || []).filter(function (n) { return n !== name; });
    McpManager._putMapping(mapping);
  }

  static toggleMcpServer(name: string): boolean {
    const mapping = McpManager._getMapping();
    if (!mapping.disabled) mapping.disabled = [];

    // 确保 apps 映射存在
    const apps = McpManager._resolveApps(name, mapping, McpManager._readAllConfigs());
    if (apps.length > 0) {
      apps.forEach(function (app) {
        if (mapping[app].indexOf(name) === -1) mapping[app].push(name);
      });
    }

    const isDisabled = mapping.disabled.indexOf(name) !== -1;

    if (isDisabled) {
      // 启用：从 disabled 移除 + 写入配置文件
      mapping.disabled = mapping.disabled.filter(function (n) { return n !== name; });
      McpManager._putMapping(mapping);
      const configs = McpManager._readAllConfigs();
      const def = McpManager._findDef(name, configs);
      if (def) apps.forEach(function (app) { McpManager._writeToApp(app, name, def); });
      return true;
    } else {
      // 禁用：加入 disabled + 从配置文件移除
      mapping.disabled.push(name);
      McpManager._putMapping(mapping);
      apps.forEach(function (app) { McpManager._removeFromApp(app, name); });
      return false;
    }
  }

  // ─────────── 同步：从配置文件导入到 mapping ───────────

  static syncFromConfigFiles(): void {
    const configs = McpManager._readAllConfigs();
    const mapping = McpManager._getMapping();

    // 配置文件里有但 mapping 里没有 → 添加
    ALL_APPS.forEach(function (app) {
      const configServers = configs[app] || {};
      Object.keys(configServers).forEach(function (name) {
        if (mapping[app].indexOf(name) === -1) {
          mapping[app].push(name);
        }
      });
    });

    // 清理残留条目（如旧版 node_repl）
    DataMigration.cleanMcpMapping(mapping, configs, ALL_APPS);

    McpManager._putMapping(mapping);
  }
}
