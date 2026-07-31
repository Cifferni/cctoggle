// uTools ccToggle - mcp.js
// MCP Server 配置管理：配置文件为源 + db 仅存 apps 映射

var utils = require("./utils");
var cleanup = require("./cleanup");
var fs = utils.fs;
var path = utils.path;
var getHomeDir = utils.getHomeDir;
var ensureDir = utils.ensureDir;

var APPS_KEY = "cctoggle_mcp_apps";
var ALL_APPS = ["claude", "claude-desktop", "codex", "openclaw"];

// ─────────── 配置文件路径 ───────────

var CONFIG_PATHS = {
  claude: function () {
    var configured = utils.getAgentConfigPath("claude");
    if (configured) return path.join(configured, ".claude.json");
    return path.join(getHomeDir(), ".claude.json");
  },
  "claude-desktop": function () { return utils.getClaudeDesktopConfigPath(); },
  codex: function () {
    var configured = utils.getAgentConfigPath("codex");
    if (configured) return path.join(configured, "config.toml");
    return path.join(getHomeDir(), ".codex", "config.toml");
  },
  openclaw: function () {
    var configured = utils.getAgentConfigPath("openclaw");
    if (configured) return path.join(configured, "openclaw.json");
    return path.join(getHomeDir(), ".openclaw", "openclaw.json");
  },
};

// ─────────── db apps 映射读写 ───────────

function _emptyMapping() {
  var m = { disabled: [] };
  ALL_APPS.forEach(function (a) { m[a] = []; });
  return m;
}

function _getMapping() {
  try {
    var doc = utools.db.get(APPS_KEY);
    if (!doc) return _emptyMapping();
    var m = { disabled: Array.isArray(doc.disabled) ? doc.disabled : [] };
    ALL_APPS.forEach(function (a) {
      m[a] = Array.isArray(doc[a]) ? doc[a] : [];
    });
    return m;
  } catch (e) {
    return _emptyMapping();
  }
}

function _putMapping(mapping) {
  var existing = null;
  try { existing = utools.db.get(APPS_KEY); } catch (e) {}
  var doc = { _id: APPS_KEY, disabled: mapping.disabled || [] };
  ALL_APPS.forEach(function (a) { doc[a] = mapping[a] || []; });
  if (existing && existing._rev) doc._rev = existing._rev;
  utools.db.put(doc);
}

// ─────────── 配置文件读取 ───────────

function _readJsonConfig(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      var config = JSON.parse(fs.readFileSync(filePath, "utf8"));
      return config.mcpServers || {};
    }
  } catch (e) {}
  return {};
}

function _readCodexMcpServers() {
  var configPath = CONFIG_PATHS.codex();
  var content = "";
  try {
    if (fs.existsSync(configPath)) content = fs.readFileSync(configPath, "utf8");
  } catch (e) { return {}; }

  var servers = {};
  var currentSlug = null;
  var currentEntry = {};

  content.split(/\r?\n/).forEach(function (line) {
    var m = line.match(/^\s*\[\s*mcp_servers\.([^\]]+?)\s*\]\s*$/);
    if (m) {
      var slug = m[1].trim();
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
      var kv = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
      if (kv) {
        var key = kv[1];
        var val = kv[2].trim();
        if (key === "command") {
          currentEntry.command = val.replace(/^["']|["']$/g, "");
        } else if (key === "args") {
          var arrMatch = val.match(/^\[(.*)\]$/);
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

function _readAllConfigs() {
  return {
    claude: _readJsonConfig(CONFIG_PATHS.claude()),
    "claude-desktop": _readJsonConfig(CONFIG_PATHS["claude-desktop"]()),
    codex: _readCodexMcpServers(),
    openclaw: _readJsonConfig(CONFIG_PATHS.openclaw()),
  };
}

// ─────────── 配置文件写入 ───────────

function _writeJsonMcpServer(filePath, name, entryOrNull) {
  var config = {};
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

function _writeCodexMcpServer(slug, entryOrNull) {
  var configPath = CONFIG_PATHS.codex();
  var existing = "";
  try {
    if (fs.existsSync(configPath)) existing = fs.readFileSync(configPath, "utf8");
  } catch (e) { existing = ""; }

  var escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var cleaned = _removeTomlSection(existing, "mcp_servers\\." + escaped);

  if (entryOrNull) {
    var lines = ["[mcp_servers." + slug + "]"];
    if (entryOrNull.command) lines.push('command = "' + entryOrNull.command + '"');
    if (entryOrNull.args && entryOrNull.args.length) {
      lines.push("args = [" + entryOrNull.args.map(function (a) { return '"' + a + '"'; }).join(", ") + "]");
    }
    if (entryOrNull.url) lines.push('url = "' + entryOrNull.url + '"');
    if (entryOrNull.headers && Object.keys(entryOrNull.headers).length) {
      lines.push("[mcp_servers." + slug + ".headers]");
      Object.keys(entryOrNull.headers).forEach(function (k) {
        lines.push('  "' + k + '" = "' + entryOrNull.headers[k] + '"');
      });
    }
    if (entryOrNull.env && Object.keys(entryOrNull.env).length) {
      lines.push("[mcp_servers." + slug + ".env]");
      Object.keys(entryOrNull.env).forEach(function (k) {
        lines.push('  "' + k + '" = "' + entryOrNull.env[k] + '"');
      });
    }
    var content = cleaned.trim();
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

function _writeToApp(appType, name, entry) {
  switch (appType) {
    case "claude":
      _writeJsonMcpServer(CONFIG_PATHS.claude(), name, entry);
      _writeJsonMcpServer(CONFIG_PATHS["claude-desktop"](), name, entry);
      break;
    case "claude-desktop":
      _writeJsonMcpServer(CONFIG_PATHS["claude-desktop"](), name, entry);
      break;
    case "codex":
      _writeCodexMcpServer(_slugify(name), entry);
      break;
    case "openclaw":
      _writeJsonMcpServer(CONFIG_PATHS.openclaw(), name, entry);
      break;
  }
}

function _removeFromApp(appType, name) {
  _writeToApp(appType, name, null);
}

// ─────────── 构建配置文件条目 ───────────

function _buildConfigEntry(server) {
  if (server.stdio) {
    var entry = { command: server.stdio.command || "", args: server.stdio.args || [] };
    if (server.stdio.env && Object.keys(server.stdio.env).length > 0) entry.env = server.stdio.env;
    return entry;
  }
  if (server.sse) {
    var entry2 = { url: server.sse.url || "" };
    if (server.sse.headers && Object.keys(server.sse.headers).length > 0) entry2.headers = server.sse.headers;
    return entry2;
  }
  if (server.http) {
    var entry3 = { url: server.http.url || "" };
    if (server.http.headers && Object.keys(server.http.headers).length > 0) entry3.headers = server.http.headers;
    return entry3;
  }
  return null;
}

// 从配置条目推断类型
function _inferType(def) {
  return (def && def.url) ? "streamable-http" : "stdio";
}

// 从配置条目构建 server 传输字段
function _buildTransport(type, def) {
  if (!def) return {};
  if (type === "stdio") {
    return { stdio: { command: def.command || "", args: def.args || [], env: def.env || {} } };
  }
  var transport = { url: def.url || "", headers: def.headers || {}, authType: def.authType || "none", apiKey: def.apiKey || "" };
  return type === "sse" ? { sse: transport } : { http: transport };
}

// 收集所有配置文件 + 映射中出现的 server name
function _collectAllNames(configs, mapping) {
  var nameSet = {};
  ALL_APPS.forEach(function (app) {
    Object.keys(configs[app] || {}).forEach(function (n) { nameSet[n] = true; });
    (mapping[app] || []).forEach(function (n) { nameSet[n] = true; });
  });
  return Object.keys(nameSet);
}

// 计算 server 关联的 apps
function _resolveApps(name, mapping, configs) {
  var apps = [];
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
function _findDef(name, configs) {
  for (var i = 0; i < ALL_APPS.length; i++) {
    var cfg = configs[ALL_APPS[i]];
    if (cfg && cfg[name]) return cfg[name];
  }
  return null;
}

// ─────────── CRUD ───────────

function _buildServer(name, def, apps, disabledSet) {
  var type = _inferType(def);
  var server = {
    id: name,
    name: name,
    type: type,
    enabled: !disabledSet[name],
    stdio: null,
    sse: null,
    http: null,
    apps: apps,
  };
  var transport = _buildTransport(type, def);
  if (transport.stdio) server.stdio = transport.stdio;
  if (transport.sse) server.sse = transport.sse;
  if (transport.http) server.http = transport.http;
  return server;
}

function listMcpServers() {
  var configs = _readAllConfigs();
  var mapping = _getMapping();
  if (cleanup.cleanMcpMapping(mapping, configs, ALL_APPS)) _putMapping(mapping);
  var disabledSet = {};
  (mapping.disabled || []).forEach(function (n) { disabledSet[n] = true; });

  var names = _collectAllNames(configs, mapping);
  var result = [];

  names.forEach(function (name) {
    var apps = _resolveApps(name, mapping, configs);
    var def = _findDef(name, configs);
    result.push(_buildServer(name, def, apps, disabledSet));
  });

  return result;
}

function getMcpServer(name) {
  var configs = _readAllConfigs();
  var mapping = _getMapping();
  var apps = _resolveApps(name, mapping, configs);
  var def = _findDef(name, configs);
  var disabledSet = {};
  (mapping.disabled || []).forEach(function (n) { disabledSet[n] = true; });
  return _buildServer(name, def, apps, disabledSet);
}

function saveMcpServer(data) {
  var name = data.name;
  if (!name) return "";

  var mapping = _getMapping();
  var newApps = data.apps || [];

  // 获取旧的 apps
  var oldApps = [];
  ALL_APPS.forEach(function (app) {
    if (mapping[app].indexOf(name) !== -1) oldApps.push(app);
  });

  // 更新映射
  ALL_APPS.forEach(function (app) {
    var idx = mapping[app].indexOf(name);
    if (newApps.indexOf(app) !== -1) {
      if (idx === -1) mapping[app].push(name);
    } else {
      if (idx !== -1) mapping[app].splice(idx, 1);
    }
  });
  _putMapping(mapping);

  // 从旧 apps 中移除
  oldApps.forEach(function (app) {
    if (newApps.indexOf(app) === -1) _removeFromApp(app, name);
  });

  // 写入新 apps
  var entry = _buildConfigEntry(data);
  if (entry) {
    newApps.forEach(function (app) { _writeToApp(app, name, entry); });
  }

  return name;
}

function deleteMcpServer(name) {
  var mapping = _getMapping();

  // 从所有关联 app 配置文件中移除
  ALL_APPS.forEach(function (app) {
    if (mapping[app].indexOf(name) !== -1) {
      _removeFromApp(app, name);
      mapping[app] = mapping[app].filter(function (n) { return n !== name; });
    }
  });

  // 也从配置文件中移除（处理不在映射中但存在于配置文件的情况）
  var configs = _readAllConfigs();
  ALL_APPS.forEach(function (app) {
    if ((configs[app] || {})[name]) _removeFromApp(app, name);
  });

  // 从 disabled 列表中移除
  mapping.disabled = (mapping.disabled || []).filter(function (n) { return n !== name; });
  _putMapping(mapping);
}

function toggleMcpServer(name) {
  var mapping = _getMapping();
  if (!mapping.disabled) mapping.disabled = [];

  // 确保 apps 映射存在
  var apps = _resolveApps(name, mapping, _readAllConfigs());
  if (apps.length > 0) {
    apps.forEach(function (app) {
      if (mapping[app].indexOf(name) === -1) mapping[app].push(name);
    });
  }

  var isDisabled = mapping.disabled.indexOf(name) !== -1;

  if (isDisabled) {
    // 启用：从 disabled 移除 + 写入配置文件
    mapping.disabled = mapping.disabled.filter(function (n) { return n !== name; });
    _putMapping(mapping);
    var configs = _readAllConfigs();
    var def = _findDef(name, configs);
    if (def) apps.forEach(function (app) { _writeToApp(app, name, def); });
    return true;
  } else {
    // 禁用：加入 disabled + 从配置文件移除
    mapping.disabled.push(name);
    _putMapping(mapping);
    apps.forEach(function (app) { _removeFromApp(app, name); });
    return false;
  }
}

// ─────────── 同步：从配置文件导入到 mapping ───────────

function syncFromConfigFiles() {
  var configs = _readAllConfigs();
  var mapping = _getMapping();

  // 配置文件里有但 mapping 里没有 → 添加
  ALL_APPS.forEach(function (app) {
    var configServers = configs[app] || {};
    Object.keys(configServers).forEach(function (name) {
      if (mapping[app].indexOf(name) === -1) {
        mapping[app].push(name);
      }
    });
  });

  // 清理残留条目（如旧版 node_repl）
  cleanup.cleanMcpMapping(mapping, configs, ALL_APPS);

  _putMapping(mapping);
}

// ─────────── 工具函数 ───────────

function _slugify(name) {
  return (name || "mcp").toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^_+|_+$/g, "") || "mcp";
}

function _removeTomlSection(text, tableNameRegex) {
  if (!text || !text.trim()) return "";
  var lines = text.split(/\r?\n/);
  var result = [];
  var inTarget = false;
  var regex = new RegExp("^\\s*\\[\\[?\\s*(" + tableNameRegex + "(?:\\..*)?)\\s*\\]\\]?\\s*$");

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var tableMatch = line.match(/^\s*\[\[?\s*([^\]]+?)\s*\]\]?\s*$/);
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

// ─────────── 导出 ───────────

module.exports = {
  listMcpServers: listMcpServers,
  getMcpServer: getMcpServer,
  saveMcpServer: saveMcpServer,
  deleteMcpServer: deleteMcpServer,
  toggleMcpServer: toggleMcpServer,
  syncFromConfigFiles: syncFromConfigFiles,
};
