// uTools ccToggle - preload.js
const fs = require("fs");
const path = require("path");
const os = require("os");

// ———————————————————————————————————

function getHomeDir() {
  const home = utools.getPath("home");
  if (home && home.trim()) return home;
  return os.homedir();
}

function getCodexAuthPath() {
  return path.join(getHomeDir(), ".codex", "auth.json");
}

function getCodexConfigPath() {
  return path.join(getHomeDir(), ".codex", "config.toml");
}

function getClaudeSettingsPath() {
  return path.join(getHomeDir(), ".claude", "settings.json");
}

function getGeminiEnvPath() {
  return path.join(getHomeDir(), ".gemini", ".env");
}

function getOpenClawConfigPath() {
  return path.join(getHomeDir(), ".openclaw", "openclaw.json");
}
// 纯路径展开（~ → homeDir）
function expandHome(p) {
// 绾喕绻氶惄顔肩秿鐎涙ê婀?function expandHome(p) {
  if (!p) return p;
  if (p === "~") return getHomeDir();
  if (p.indexOf("~/") === 0 || p.indexOf("~\\") === 0) return path.join(getHomeDir(), p.slice(2));
  return p;
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ———————————————————————————————————

function readCodexConfig() {
  try {
    const authPath = getCodexAuthPath();
    const configPath = getCodexConfigPath();
    let auth = {};
    let config = "";
    if (fs.existsSync(authPath)) {
      auth = JSON.parse(fs.readFileSync(authPath, "utf8"));
    }
    if (fs.existsSync(configPath)) {
      config = fs.readFileSync(configPath, "utf8");
    }
    return { auth, config };
  } catch (e) {
    return { auth: {}, config: "" };
  }
}

function writeCodexConfig(auth, configToml) {
  const authPath = getCodexAuthPath();
  const configPath = getCodexConfigPath();
  ensureDir(authPath);
  ensureDir(configPath);
  fs.writeFileSync(authPath, JSON.stringify(auth, null, 2), "utf8");
  let existing = "";
  try {
    if (fs.existsSync(configPath)) existing = fs.readFileSync(configPath, "utf8");
  } catch (e) { existing = ""; }
  const merged = mergeCodexConfig(existing, configToml);
  fs.writeFileSync(configPath, merged, "utf8");
  return true;
}
// 将插件生成的 provider 配置合并进现有 config.toml
// 只替换顶层 provider 相关键与本次写入声明的 [表] 段，其余内容原样保留
function mergeCodexConfig(existing, incoming) {
  if (!existing || !existing.trim()) return incoming;

// header 为 null 的块表示文件开头的顶层键区。
  function parseBlocks(text) {
    const blocks = [];
    let cur = { header: null, tableName: null, lines: [] };
    text.split(/\r?\n/).forEach(function (line) {
      const m = line.match(/^\s*\[\[?\s*([^\]]+?)\s*\]\]?\s*$/);
      if (m) {
        blocks.push(cur);
        cur = { header: line, tableName: m[1].trim(), lines: [] };
      } else {
        cur.lines.push(line);
      }
    });
    blocks.push(cur);
    return blocks;
  }
// 顶层键名（形如 `key = ...`），用于识别本次写入声明的顶层键
  function topLevelKeys(topBlock) {
    const keys = {};
    (topBlock ? topBlock.lines : []).forEach(function (line) {
      const km = line.match(/^\s*([A-Za-z0-9_.-]+)\s*=/);
      if (km) keys[km[1]] = true;
    });
    return keys;
  }

  const oldBlocks = parseBlocks(existing);
  const newBlocks = parseBlocks(incoming);

  const newTop = newBlocks.find(function (b) { return b.header === null; }) || { lines: [] };
  const incomingKeys = topLevelKeys(newTop);
  const incomingTables = {};
// 本次是否声明了 model_providers.* 表；若声明则清除旧的所有 provider 表，避免切换后残留废弃 pro
// 本次是否声明了 model_providers.* 表；若声明则清除旧的所有 provider 表，避免切换后残留废弃
  const incomingHasProvider = Object.keys(incomingTables).some(function (t) {
    return t.indexOf("model_providers.") === 0;
  });
// 1) 合并顶层键区：保留旧文件里本次未声明的顶层键，覆盖新增本次声明的键
  const oldTop = oldBlocks.find(function (b) { return b.header === null; }) || { lines: [] };
  const mergedTopLines = [];
  oldTop.lines.forEach(function (line) {
    const km = line.match(/^\s*([A-Za-z0-9_.-]+)\s*=/);
    if (km && incomingKeys[km[1]]) return; // 本次会重新写入，跳过旧值
    mergedTopLines.push(line);
  });
// 去掉尾部多余空行后追加本次顶层键
  while (mergedTopLines.length && mergedTopLines[mergedTopLines.length - 1].trim() === "") mergedTopLines.pop();
  newTop.lines.forEach(function (line) { mergedTopLines.push(line); });
// 2) 表段：本次声明的表用新内容替换；旧文件里其余表原样保留
  const topText = mergedTopLines.join("\n").replace(/\n+$/, "");
  if (topText.trim()) outParts.push(topText);
// 保留旧表（未被本次覆盖的）
  oldBlocks.forEach(function (b) {
    if (b.header === null) return;
// 本次写入了 provider，则丢弃旧的所有 provider 表（由插件统一管理）
    outParts.push([b.header].concat(b.lines).join("\n").replace(/\n+$/, ""));
  });
// 追加本次声明的表
  newBlocks.forEach(function (b) {
    if (b.header === null) return;
    outParts.push([b.header].concat(b.lines).join("\n").replace(/\n+$/, ""));
  });

  return outParts.join("\n\n") + "\n";
}

// ——————————— Claude 配置读写 ———————————

function readClaudeSettings() {
  try {
    const settingsPath = getClaudeSettingsPath();
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    }
    return {};
  } catch (e) {
    return {};
  }
}

function writeClaudeSettings(settings) {
  const settingsPath = getClaudeSettingsPath();
  ensureDir(settingsPath);
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf8");
  return true;
}

// ——————————— Gemini 配置读写 ———————————
function readGeminiEnv() {
  try {
    const envPath = getGeminiEnvPath();
    if (fs.existsSync(envPath)) {
      return fs.readFileSync(envPath, "utf8");
    }
    return "";
  } catch (e) {
    return "";
  }
}

function writeGeminiEnv(envContent) {
  const envPath = getGeminiEnvPath();
  ensureDir(envPath);
  fs.writeFileSync(envPath, envContent, "utf8");
  return true;
}

// ———————————————————————————————————

function getCurrentConfigs() {
  return {
    codex: readCodexConfig(),
    claude: readClaudeSettings(),
    openclaw: readOpenClawConfig(),
    gemini: readGeminiEnv()
  };
}
// ——————————— 存储后端（uTools PouchDB） ———————————

// 底层 uTools.db 读写封装
const DB_PREFIX = "cctoggle_provider_";

function getProviderKey(appType, providerId) {
  return DB_PREFIX + appType + "_" + providerId;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function listProviders(appType) {
  try {
    const docs = utools.db.allDocs(DB_PREFIX + appType + "_") || [];
    return docs.map(function (doc) {
      const provider = { id: doc._id.replace(DB_PREFIX + appType + "_", ""), name: doc.name, baseUrl: doc.baseUrl, model: doc.model, models: doc.models || [], websiteUrl: doc.websiteUrl, icon: doc.icon, iconColor: doc.iconColor, category: doc.category, configType: doc.configType, isCurrent: doc.isCurrent, sortOrder: doc.sortOrder, createdAt: doc.createdAt, apiFormat: doc.apiFormat || "", wireApi: doc.wireApi || "" };
// 空白占位 apiKey
      return provider;
    });
  } catch (e) {
    return [];
  }
}

function getProvider(appType, providerId) {
  try {
    const doc = utools.db.get(getProviderKey(appType, providerId));
    if (!doc) return null;
    const apiKey = utools.dbCryptoStorage.getItem("apikey_" + appType + "_" + providerId) || "";
    return {
      id: providerId,
      appType: appType,
      name: doc.name,
      baseUrl: doc.baseUrl,
      apiKey: apiKey, authType: doc.authType, apiKeyHeader: doc.apiKeyHeader, apiKeyPrefix: doc.apiKeyPrefix, reasoningEffort: doc.reasoningEffort, maxTokens: doc.maxTokens, temperature: doc.temperature, extraHeaders: doc.extraHeaders,
      model: doc.model,
      models: doc.models || [],
      websiteUrl: doc.websiteUrl,
      icon: doc.icon,
      iconColor: doc.iconColor,
      category: doc.category,
      configType: doc.configType || "openai",
      authData: doc.authData || {},
      extraConfig: doc.extraConfig || "",
      settingsConfig: doc.settingsConfig || {},
      authField: doc.authField || "ANTHROPIC_AUTH_TOKEN",
      wireApi: doc.wireApi || "",
      apiFormat: doc.apiFormat || "",
      apiKeyUrl: doc.apiKeyUrl || "",
      modelCatalog: doc.modelCatalog || [],
      endpointCandidates: doc.endpointCandidates || [],
      customUserAgent: doc.customUserAgent || "",
      headersOverride: doc.headersOverride || "",
      bodyOverride: doc.bodyOverride || "",
      authMethod: doc.authMethod || "api_key",
      impersonateClaudeCode: doc.impersonateClaudeCode || false,
      apiProtocol: doc.apiProtocol || "",
      suggestedDefaults: doc.suggestedDefaults || null,
      isCurrent: doc.isCurrent,
      sortOrder: doc.sortOrder,
      createdAt: doc.createdAt
    };
  } catch (e) {
    return null;
  }
}

function saveProvider(appType, providerData) {
  const id = providerData.id || generateId();
  const key = getProviderKey(appType, id);

  const apiKey = providerData.apiKey || "";
  delete providerData.apiKey;
// 更新已有文档必须带上 _rev，否则 uTools(PouchDB) 会以 conflict 静默失败，编辑不生效
  const existing = utools.db.get(key);

  const doc = {
    _id: key,
    _rev: existing ? existing._rev : undefined,
    appType: appType,
    name: providerData.name || "Unnamed",
    baseUrl: providerData.baseUrl || "",
    model: providerData.model || "",
    models: providerData.models || [],
    websiteUrl: providerData.websiteUrl || "",
    icon: providerData.icon || "",
    iconColor: providerData.iconColor || "",
    category: providerData.category || "custom", authType: providerData.authType || "api_key", apiKeyHeader: providerData.apiKeyHeader || "Authorization", apiKeyPrefix: providerData.apiKeyPrefix || "Bearer ", reasoningEffort: providerData.reasoningEffort || "high", maxTokens: providerData.maxTokens || "", temperature: providerData.temperature || "", extraHeaders: providerData.extraHeaders || "",
    configType: providerData.configType || "openai",
    authData: providerData.authData || {},
    extraConfig: providerData.extraConfig || "",
    settingsConfig: providerData.settingsConfig || {},
    authField: providerData.authField || "ANTHROPIC_AUTH_TOKEN",
    wireApi: providerData.wireApi || "",
    apiFormat: providerData.apiFormat || "",
    apiKeyUrl: providerData.apiKeyUrl || "",
    modelCatalog: providerData.modelCatalog || [],
    endpointCandidates: providerData.endpointCandidates || [],
    customUserAgent: providerData.customUserAgent || "",
    headersOverride: providerData.headersOverride || "",
    bodyOverride: providerData.bodyOverride || "",
    authMethod: providerData.authMethod || "api_key",
    impersonateClaudeCode: providerData.impersonateClaudeCode || false,
    apiProtocol: providerData.apiProtocol || "",
    suggestedDefaults: providerData.suggestedDefaults || null,
    isCurrent: providerData.isCurrent !== undefined ? providerData.isCurrent : (existing ? existing.isCurrent : false),
    sortOrder: providerData.sortOrder !== undefined ? providerData.sortOrder : (existing ? existing.sortOrder : 0),
    createdAt: providerData.createdAt || (existing ? existing.createdAt : new Date().toISOString())
  };

  utools.db.put(doc);

// 读取 API Key
  if (apiKey) {
    utools.dbCryptoStorage.setItem("apikey_" + appType + "_" + id, apiKey);
  }

  return id;
}

function deleteProvider(appType, providerId) {
  utools.db.remove(getProviderKey(appType, providerId));
  utools.dbCryptoStorage.removeItem("apikey_" + appType + "_" + providerId);
  return true;
}

// ———————————————————————————————————

function switchProviderCodex(provider) {
  // 鏋勫缓 auth.json
  const auth = Object.assign({}, provider.authData || {});
  if (provider.apiKey) {
    if (Object.keys(auth).length === 0) {
      if (provider.configType === "gemini") auth.GEMINI_API_KEY = provider.apiKey;
      else auth.OPENAI_API_KEY = provider.apiKey;
    } else {
      const primary = auth.OPENAI_API_KEY !== undefined ? "OPENAI_API_KEY" : Object.keys(auth)[0];
      auth[primary] = provider.apiKey;
    }
  }

  // 鏋勫缓 config.toml
  let configToml = provider.extraConfig || "";
  if (!configToml) {
    const cleanName = (provider.name || "custom")
      .toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^_+|_+$/g, "") || "custom";
    const baseUrl = provider.baseUrl || "https://api.openai.com/v1";
    const model = provider.model || "gpt-5.4";
    const wireApi = provider.wireApi || "responses";
    const effort = provider.reasoningEffort || "high";
    configToml = [
      'model_provider = "' + cleanName + '"',
      'model = "' + model + '"',
      'model_reasoning_effort = "' + effort + '"',
      'disable_response_storage = true',
      '',
      '[model_providers.' + cleanName + ']',
      'name = "' + cleanName + '"',
      'base_url = "' + baseUrl + '"',
      'wire_api = "' + wireApi + '"',
      'requires_openai_auth = true',
    ].join("\n");
  }

    try {
      const catalogJson = JSON.stringify({ object: "model_catalog", models: provider.modelCatalog }, null, 2);
      const catalogPath = path.join(getHomeDir(), ".codex", "cc-switch-model-catalog.json");
      ensureDir(catalogPath);
      fs.writeFileSync(catalogPath, catalogJson, "utf8");
// 在 config.toml 中引用
    } catch (e) { /* ignore */ }

  writeCodexConfig(auth, configToml);
  return true;
}

// 优先使用预设 settingsConfig，其次回退旧字段
function switchProviderClaude(id) {
  const provider = getProvider("claude", id);
  if (!provider) return { success: false, error: "provider not found" };
  let settings = {};
  if (provider.settingsConfig && Object.keys(provider.settingsConfig).length) {
    settings = JSON.parse(JSON.stringify(provider.settingsConfig));
  }
  settings.env = settings.env || {};

// 兼容旧字段
  if (provider.model) settings.env.ANTHROPIC_MODEL = provider.model;
// 写入 apiKey 到指定认证字段（默认 ANTHROPIC_AUTH_TOKEN）
    const field = provider.authField || (settings.env.ANTHROPIC_API_KEY !== undefined ? "ANTHROPIC_API_KEY" : "ANTHROPIC_AUTH_TOKEN");
    settings.env[field] = provider.apiKey;
// 合并 extraConfig（JSON）
    try {
      const extra = JSON.parse(provider.extraConfig);
      Object.assign(settings, extra);
    } catch (e) { /* ignore */ }

  writeClaudeSettings(settings);
  return true;
}

function switchProviderGemini(provider) {
  // 鏀堕泦 env
  const env = Object.assign({}, (provider.settingsConfig && provider.settingsConfig.env) || {});
  if (provider.baseUrl) env.GOOGLE_GEMINI_BASE_URL = provider.baseUrl;
  if (provider.model) env.GEMINI_MODEL = provider.model;
  if (provider.apiKey) env.GEMINI_API_KEY = provider.apiKey;
  // 搴忓垪鍖?KEY=VALUE
  const lines = Object.keys(env).map(function (k) { return k + "=" + (env[k] == null ? "" : env[k]); });
  writeGeminiEnv(lines.join("\n") + "\n");
  return true;
}

function readOpenClawConfig() {
  try {
    const p = getOpenClawConfigPath();
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
} catch (e) { /* JSON5/损坏时回退默认 */ }
  return { models: { mode: "merge", providers: {} } };
}

function writeOpenClawConfig(config) {
  const p = getOpenClawConfigPath();
  ensureDir(p);
  fs.writeFileSync(p, JSON.stringify(config, null, 2), "utf8");
  return true;
}

function _ocSlug(name) {
  return (name || "custom").toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/^-+|-+$/g, "") || "custom";
}
function _ocRebaseRef(ref, key) {
  const i = (ref || "").indexOf("/");
  return i === -1 ? key + "/" + ref : key + ref.slice(i);
}

function switchProviderOpenclaw(provider) {
// OpenClaw 纯叠加式：所有供应商共存于 models.providers；切换时写入该供应商并设为默认
  const config = readOpenClawConfig();
  config.models = config.models || { mode: "merge", providers: {} };
  config.models.providers = config.models.providers || {};

  const key = _ocSlug(provider.name);
  const sc = provider.settingsConfig || {};
  const pc = {};
  if (provider.baseUrl || sc.baseUrl) pc.baseUrl = provider.baseUrl || sc.baseUrl;
  pc.apiKey = provider.apiKey || sc.apiKey || "";
  pc.api = provider.apiProtocol || sc.api || "openai-completions";
  if (Array.isArray(sc.models) && sc.models.length) pc.models = sc.models;
  if (sc.headers && Object.keys(sc.headers).length) pc.headers = sc.headers;
  config.models.providers[key] = pc;

  config.agents = config.agents || {};
  config.agents.defaults = config.agents.defaults || {};
  if (provider.suggestedDefaults && provider.suggestedDefaults.model && provider.suggestedDefaults.model.primary) {
    config.agents.defaults.model = {
      primary: _ocRebaseRef(provider.suggestedDefaults.model.primary, key),
      fallbacks: (provider.suggestedDefaults.model.fallbacks || []).map(function (r) { return _ocRebaseRef(r, key); }),
    };
    if (provider.suggestedDefaults.modelCatalog) {
      const cat = {};
      Object.keys(provider.suggestedDefaults.modelCatalog).forEach(function (r) { cat[_ocRebaseRef(r, key)] = provider.suggestedDefaults.modelCatalog[r]; });
      config.agents.defaults.models = Object.assign({}, config.agents.defaults.models, cat);
    }
  } else {
    const ids = (pc.models || []).map(function (m) { return m.id; });
    if (ids.length) {
      config.agents.defaults.model = {
        primary: key + "/" + ids[0],
        fallbacks: ids.slice(1).map(function (id) { return key + "/" + id; }),
      };
    }
  }

  writeOpenClawConfig(config);
  return true;
}

function switchProvider(appType, providerId) {
  const provider = getProvider(appType, providerId);
  if (!provider) {
    return { success: false, error: "provider not found" };
  }

  try {
    if (appType === "codex") {
      switchProviderCodex(provider);
    } else if (appType === "claude") {
      switchProviderClaude(provider);
    } else if (appType === "openclaw") {
      switchProviderOpenclaw(provider);
    } else if (appType === "gemini") {
      switchProviderGemini(provider);
    } else {
      return { success: false, error: "unknown app type" };
    }
    markCurrent(appType, providerId);
    return { success: true, providerName: provider.name };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
// 标记当前供应商（isCurrent 键纯内存标记）
function markCurrent(appType, providerId) {
// 标记当前供应商（isCurrent 键纯内存标记）
  const all = listProviders(appType);
  all.forEach(function (p) {
    const key = getProviderKey(appType, p.id);
    const doc = utools.db.get(key);
    if (doc) {
      doc.isCurrent = (p.id === providerId);
      utools.db.put(doc);
    }
  });
}
// 读取当前供应商
function getCurrentProviderId(appType) {
// 读取当前供应商
  const all = listProviders(appType);
  const current = all.find(function (p) { return p.isCurrent; });
  return current ? current.id : null;
}

// ———————————————————————————————————

function exportAllProviders() {
  const result = { codex: [], claude: [], gemini: [], exportTime: new Date().toISOString() };
  ["codex", "claude", "gemini"].forEach(function (appType) {
    const providers = listProviders(appType);
    providers.forEach(function (p) {
      const full = getProvider(appType, p.id);
      result[appType].push(full);
    });
  });
  return result;
}

function importProviders(data) {
  let count = 0;
  ["codex", "claude", "gemini"].forEach(function (appType) {
    (data[appType] || []).forEach(function (p) {
      p.appType = appType;
      saveProvider(appType, p);
      count++;
    });
  });
  return count;
}



// ===== SkillNest: Central Skill Nest + Deploy Engine =====

// --- Nest Directory ---

function getNestDir() {
  var home = getHomeDir();
  var nest = path.join(home, ".skillnest", "skills");
  ensureDir(nest);
  return nest;
}

// --- Nest Skill Listing ---

function listNestSkills() {
  var nest = getNestDir();
  try {
    if (!fs.existsSync(nest)) return [];
    var entries = fs.readdirSync(nest, { withFileTypes: true });
    var result = [];
    entries.forEach(function(e) {
      if (!e.isDirectory() || e.name.startsWith(".")) return;
      var skillPath = path.join(nest, e.name);
      var hasSkillMd = fs.existsSync(path.join(skillPath, "SKILL.md"));
      var meta = getNestSkillMeta(e.name);
      result.push({
        name: e.name,
        path: skillPath,
        hasSkillMd: hasSkillMd,
        repo: meta.repo || "",
        version: meta.version || "",
        installedAt: meta.installedAt || ""
      });
    });
    return result;
  } catch (e) { return []; }
}

function getNestSkillMeta(skillName) {
  try {
    var metaPath = path.join(getNestDir(), skillName, "meta.json");
    if (fs.existsSync(metaPath)) {
      return JSON.parse(fs.readFileSync(metaPath, "utf8"));
    }
  } catch(e) {}
  return {};
}

function setNestSkillMeta(skillName, meta) {
  var metaPath = path.join(getNestDir(), skillName, "meta.json");
  ensureDir(metaPath);
  var existing = getNestSkillMeta(skillName);
  Object.assign(existing, meta, { updatedAt: new Date().toISOString() });
  fs.writeFileSync(metaPath, JSON.stringify(existing, null, 2), "utf8");
}

// --- Deploy Registry ---

function getDeployRegistry() {
  try {
    return utools.dbStorage.getItem("ccswitch_nest_registry") || {};
  } catch(e) { return {}; }
}

function setDeployRegistry(reg) {
  utools.dbStorage.setItem("ccswitch_nest_registry", reg);
}

function listDeployments() {
  return getDeployRegistry();
}

// --- Create Link (Win junction / Unix symlink) ---

function createLink(src, dest) {
  ensureDir(dest);
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  var isWin = process.platform === "win32";
  if (isWin) {
    var srcVol = path.parse(src).root;
    var destVol = path.parse(dest).root;
    if (srcVol !== destVol) {
      copyDirSync(src, dest);
      return "copy";
    }
    fs.symlinkSync(src, dest, "junction");
    return "symlink";
  } else {
    fs.symlinkSync(src, dest, "dir");
    return "symlink";
  }
}

// --- Deploy Skill (nest to target) ---

function deploySkill(skillName, target) {
  var nest = getNestDir();
  var srcPath = path.join(nest, skillName);
  if (!fs.existsSync(srcPath) || !fs.existsSync(path.join(srcPath, "SKILL.md"))) {
    return { success: false, error: "skill not found in nest: " + skillName };
  }

  var allPaths = getSkillStoragePaths();
  var destDir = expandHome(allPaths[target]);
  if (!destDir) {
    var projects = listProjectTargets();
    var proj = projects.find(function(p) { return p.id === target; });
    if (proj) {
      destDir = expandHome(proj.path);
    } else {
      return { success: false, error: "unknown target: " + target };
    }
  }
  ensureDir(destDir);
  var destPath = path.join(destDir, skillName);

  var mode = getSyncMode();

  try {
    if (mode === "symlink") {
      createLink(srcPath, destPath);
    } else {
      if (fs.existsSync(destPath)) {
        fs.rmSync(destPath, { recursive: true, force: true });
      }
      copyDirSync(srcPath, destPath);
    }

    var reg = getDeployRegistry();
    if (!reg[skillName]) reg[skillName] = [];
    var existing = reg[skillName].find(function(d) { return d.target === target; });
    if (existing) {
      existing.mode = mode;
    } else {
      reg[skillName].push({ target: target, mode: mode, deployedAt: new Date().toISOString() });
    }
    setDeployRegistry(reg);

    return { success: true, mode: mode };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// --- Undeploy Skill ---

function undeploySkill(skillName, target) {
  var allPaths = getSkillStoragePaths();
  var destDir = expandHome(allPaths[target]);
  if (!destDir) {
    var projects = listProjectTargets();
    var proj = projects.find(function(p) { return p.id === target; });
    if (proj) destDir = expandHome(proj.path);
  }
  if (!destDir) return { success: false, error: "unknown target: " + target };

  var destPath = path.join(destDir, skillName);
  if (!fs.existsSync(destPath)) {
    return { success: false, error: "not deployed to " + target };
  }

  try {
    var stat = fs.lstatSync(destPath);
    if (stat.isSymbolicLink()) {
      fs.unlinkSync(destPath);
    } else {
      fs.rmSync(destPath, { recursive: true, force: true });
    }

    var reg = getDeployRegistry();
    if (reg[skillName]) {
      reg[skillName] = reg[skillName].filter(function(d) { return d.target !== target; });
      if (reg[skillName].length === 0) delete reg[skillName];
    }
    setDeployRegistry(reg);

    return { success: true, action: "removed" };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// --- Toggle (deploy/undeploy) ---

function toggleSkillToAgent(skillName, sourceApp, targetApp) {
  var reg = getDeployRegistry();
  var deployed = reg[skillName] && reg[skillName].find(function(d) { return d.target === targetApp; });
  if (deployed) {
    return undeploySkill(skillName, targetApp);
  } else {
    return deploySkill(skillName, targetApp);
  }
}

// --- Project Targets ---

var _projectTargets = null;

function listProjectTargets() {
  if (_projectTargets) return _projectTargets;
  try {
    _projectTargets = utools.dbStorage.getItem("ccswitch_project_targets") || [];
    return _projectTargets;
  } catch(e) { return []; }
}

function addProjectTarget(pathStr, label) {
  var targets = listProjectTargets();
  if (targets.find(function(t) { return t.path === pathStr; })) {
    return { success: false, error: "target already exists" };
  }
  var id = "project_" + Date.now().toString(36);
  targets.push({ id: id, path: pathStr, label: label || pathStr, addedAt: new Date().toISOString() });
  _projectTargets = targets;
  utools.dbStorage.setItem("ccswitch_project_targets", targets);
  return { success: true, id: id };
}

function removeProjectTarget(id) {
  var targets = listProjectTargets().filter(function(t) { return t.id !== id; });
  _projectTargets = targets;
  utools.dbStorage.setItem("ccswitch_project_targets", targets);
  return { success: true };
}

// --- Skills Registry & Search ---

function getDefaultSkillDirs() {
  var home = getHomeDir();
  return {
    codex: path.join(home, '.codex', 'skills'),
    claude: path.join(home, '.claude', 'skills'),
    gemini: path.join(home, '.gemini', 'skills'),
    opencode: path.join(home, '.config', 'opencode', 'skills'),
    openclaw: path.join(home, '.openclaw', 'skills')
  };
}

function getSkillStoragePaths() {
  var saved = utools.dbStorage.getItem('ccswitch_skill_paths');
  if (saved) return saved;
  var defaults = getDefaultSkillDirs();
  utools.dbStorage.setItem('ccswitch_skill_paths', defaults);
  return defaults;
}

function setSkillStoragePaths(paths) {
  utools.dbStorage.setItem('ccswitch_skill_paths', paths);
}

function getSkillRepos() {
  return utools.dbStorage.getItem('ccswitch_skill_repos') || [];
}

function addSkillRepo(repoUrl, branch) {
  var repos = getSkillRepos();
  if (repos.find(function(r) { return r.url === repoUrl; })) {
    return { success: false, error: 'repo already exists' };
  }
  repos.push({ url: repoUrl, branch: branch || 'main', addedAt: new Date().toISOString() });
  utools.dbStorage.setItem('ccswitch_skill_repos', repos);
  return { success: true };
}

function removeSkillRepo(repoUrl) {
  utools.dbStorage.setItem('ccswitch_skill_repos', getSkillRepos().filter(function(r) { return r.url !== repoUrl; }));
  return { success: true };
}

function copyDirSync(src, dest) {
  ensureDir(dest);
  fs.readdirSync(src, { withFileTypes: true }).forEach(function(entry) {
    var s = path.join(src, entry.name), d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirSync(s, d);
    else fs.copyFileSync(s, d);
  });
}

function getSyncMode() {
  return utools.dbStorage.getItem('ccswitch_sync_mode') || 'symlink';
}

function setSyncMode(mode) {
  utools.dbStorage.setItem('ccswitch_sync_mode', mode);
}

// --- Skills Registry & Search ---

function mapSkill(s) {
  return {
    name: s.name || s.skillId,
    repo: s.source ? "https://github.com/" + s.source : "",
    path: s.skillId || "",
    desc: s.source || "",
    installs: s.installs || 0
  };
}

function searchSkills(query) {
  var https = require("https");
  var url = query
    ? "https://www.skills.sh/api/search?q=" + encodeURIComponent(query) + "&limit=50"
    : "https://www.skills.sh/api/search?limit=200";
  return new Promise(function(resolve) {
    try {
      var req = https.get(url, { timeout: 8000 }, function(res) {
        var data = "";
        res.on("data", function(c) { data += c; });
        res.on("end", function() {
          try {
            var json = JSON.parse(data);
            resolve((json.skills || []).map(mapSkill));
          } catch(e) {
            resolve([]);
          }
        });
      });
      req.on("timeout", function() { req.destroy(); });
      req.on("error", function() { resolve([]); });
      req.end();
    } catch(e) {
      resolve([]);
    }
  });
}

// --- Install / List / Sync (nest-first) ---

function listSkillsInDir(dir) {
  try {
    dir = expandHome(dir);
    if (!fs.existsSync(dir)) return [];
    var out = [];
    function isDirLike(full, dirent) {
      // Dirent.isDirectory() returns false for junctions/symlinks on Windows.
      // Fall back to stat (which follows the link) so deployed skills are counted.
      if (dirent && dirent.isDirectory()) return true;
      try {
        var st = fs.statSync(full);
        return st.isDirectory();
      } catch(_) { return false; }
    }
    function walk(base, rel) {
      var entries;
      try { entries = fs.readdirSync(base, { withFileTypes: true }); } catch(_) { return; }
      entries.forEach(function(e) {
        if (e.name.startsWith(".")) return;
        var full = path.join(base, e.name);
        var r = rel ? rel + "/" + e.name : e.name;
        if (isDirLike(full, e)) {
          if (fs.existsSync(path.join(full, "SKILL.md"))) {
            out.push({ name: r, path: full, hasSkillMd: true });
          } else {
            // Only recurse into real directories to avoid symlink loops.
            if (e.isDirectory()) walk(full, r);
          }
        }
      });
    }
    walk(dir, "");
    return out;
  } catch(e) { return []; }
}

function listAllSkills() {
  var result = { nest: listNestSkills() };
  var paths = getSkillStoragePaths() || {};
  Object.keys(paths).forEach(function(app) {
    result[app] = listSkillsInDir(paths[app]);
  });
  return result;
}

function installSkill(name, repo, subPath, branch) {
  try {
    if (!name) return { success: false, error: "missing name" };
    var nest = getNestDir();
    var target = path.join(nest, name);
    if (fs.existsSync(target) && fs.existsSync(path.join(target, "SKILL.md"))) {
      return { success: false, error: "already installed" };
    }
    ensureDir(target);
    // Best-effort placeholder: write meta + minimal SKILL.md so UI can see it.
    // Actual git clone would require child_process; keep synchronous no-op here.
    setNestSkillMeta(name, { repo: repo || "", subPath: subPath || "", branch: branch || "main", installedAt: new Date().toISOString() });
    var skillMd = path.join(target, "SKILL.md");
    if (!fs.existsSync(skillMd)) {
      fs.writeFileSync(skillMd, "# " + name + "\n\nInstalled from: " + (repo || "(local)") + "\n", "utf8");
    }
    return { success: true, path: target };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

function removeNestSkill(skillName) {
  if (!skillName) return { success: false, error: "missing name" };
  var nest = getNestDir();
  var target = path.join(nest, skillName);
  try {
    // Undeploy from all targets first
    var reg = getDeployRegistry();
    if (reg[skillName]) {
      reg[skillName].slice().forEach(function(d) {
        undeploySkill(skillName, d.target);
      });
    }
    // Remove the skill directory
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
    }
    // Clean up meta.json
    var metaPath = path.join(getNestDir(), skillName, "meta.json");
    if (fs.existsSync(metaPath)) {
      fs.rmSync(metaPath, { recursive: true, force: true });
    }
    return { success: true };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

function syncSkills(sourceApp, targetApps) {
  // Legacy shim: for each nest skill, deploy to each target
  try {
    var nestList = listNestSkills();
    var results = [];
    (targetApps || []).forEach(function(t) {
      nestList.forEach(function(s) {
        results.push({ skill: s.name, target: t, result: deploySkill(s.name, t) });
      });
    });
    return { success: true, results: results };
  } catch(e) {
    return { success: false, error: e.message };
  }
}
// ———— 用量统计存储（按天 + 应用聚合） ————
const STAT_PREFIX = "cctoggle_stat_";
const STAT_KEEP_DAYS = 90;

function _statDayKey(d) {
// 本地日期 YYYY-MM-DD
  var y = d.getFullYear();
  var m = ("0" + (d.getMonth() + 1)).slice(-2);
  var day = ("0" + d.getDate()).slice(-2);
  return y + "-" + m + "-" + day;
}

function _statDocKey(appType, dayStr) {
  return STAT_PREFIX + appType + "_" + dayStr;
}
function recordUsage(evt) {
// 记录一次用量（来自 proxy-usage 事件），按 应用 聚合
  if (!evt) return;
  var appType = evt.appType || "unknown";
  var ts = evt.ts ? new Date(evt.ts) : new Date();
  var dayStr = _statDayKey(ts);
  var key = _statDocKey(appType, dayStr);
  var doc = utools.db.get(key) || {
    _id: key, appType: appType, day: dayStr,
    requests: 0, input: 0, output: 0, cacheRead: 0, cacheCreate: 0, total: 0,
    providers: {}, models: {}, updatedAt: 0,
  };
  var input = Number(evt.input) || 0;
  var output = Number(evt.output) || 0;
  var cacheRead = Number(evt.cacheRead) || 0;
  var cacheCreate = Number(evt.cacheCreate) || 0;
  var total = Number(evt.total) || (input + output);

  doc.requests += 1;
  doc.input += input;
  doc.output += output;
  doc.cacheRead += cacheRead;
  doc.cacheCreate += cacheCreate;
  doc.total += total;

  var pid = evt.providerId || "unknown";
  var pb = doc.providers[pid] || { name: evt.name || pid, requests: 0, input: 0, output: 0, cacheRead: 0, cacheCreate: 0, total: 0 };
  if (evt.name) pb.name = evt.name;
  pb.requests += 1; pb.input += input; pb.output += output;
  pb.cacheRead += cacheRead; pb.cacheCreate += cacheCreate; pb.total += total;
  doc.providers[pid] = pb;

  if (evt.model) {
    var mb = doc.models[evt.model] || { requests: 0, input: 0, output: 0, cacheRead: 0, cacheCreate: 0, total: 0 };
    mb.requests += 1; mb.input += input; mb.output += output;
    mb.cacheRead += cacheRead; mb.cacheCreate += cacheCreate; mb.total += total;
    doc.models[evt.model] = mb;
  }

  doc.updatedAt = Date.now();
  utools.db.put(doc);
}
// 读取统计：可选 appType 过滤与天数范围（days=0 表示全部）
function getStats(appType, days) {
  var docs = utools.db.allDocs(STAT_PREFIX) || [];
  var minDay = null;
  if (days && days > 0) {
    var d = new Date();
    d.setDate(d.getDate() - (days - 1));
    minDay = _statDayKey(d);
  }
  var daily = [];
  var totals = { requests: 0, input: 0, output: 0, cacheRead: 0, cacheCreate: 0, total: 0 };
  var providers = {};
  var models = {};
  docs.forEach(function (doc) {
    if (!doc || !doc.day) return;
    if (appType && appType !== "all" && doc.appType !== appType) return;
    if (minDay && doc.day < minDay) return;
    daily.push({
      day: doc.day, appType: doc.appType,
      requests: doc.requests || 0, input: doc.input || 0, output: doc.output || 0,
      cacheRead: doc.cacheRead || 0, cacheCreate: doc.cacheCreate || 0, total: doc.total || 0,
    });
    totals.requests += doc.requests || 0;
    totals.input += doc.input || 0;
    totals.output += doc.output || 0;
    totals.cacheRead += doc.cacheRead || 0;
    totals.cacheCreate += doc.cacheCreate || 0;
    totals.total += doc.total || 0;
    Object.keys(doc.providers || {}).forEach(function (pid) {
      var b = doc.providers[pid];
      var agg = providers[pid] || { name: b.name || pid, requests: 0, input: 0, output: 0, cacheRead: 0, cacheCreate: 0, total: 0 };
      if (b.name) agg.name = b.name;
      agg.requests += b.requests || 0; agg.input += b.input || 0; agg.output += b.output || 0;
      agg.cacheRead += b.cacheRead || 0; agg.cacheCreate += b.cacheCreate || 0; agg.total += b.total || 0;
      providers[pid] = agg;
    });
    Object.keys(doc.models || {}).forEach(function (mid) {
      var b = doc.models[mid];
      var agg = models[mid] || { requests: 0, input: 0, output: 0, cacheRead: 0, cacheCreate: 0, total: 0 };
      agg.requests += b.requests || 0; agg.input += b.input || 0; agg.output += b.output || 0;
      agg.cacheRead += b.cacheRead || 0; agg.cacheCreate += b.cacheCreate || 0; agg.total += b.total || 0;
      models[mid] = agg;
    });
  });
  daily.sort(function (a, b) { return a.day < b.day ? -1 : a.day > b.day ? 1 : 0; });
  var providerList = Object.keys(providers).map(function (pid) {
    return Object.assign({ id: pid }, providers[pid]);
  }).sort(function (a, b) { return b.total - a.total; });
  var modelList = Object.keys(models).map(function (mid) {
    return Object.assign({ model: mid }, models[mid]);
  }).sort(function (a, b) { return b.total - a.total; });
  return { totals: totals, daily: daily, providers: providerList, models: modelList };
}
function clearStats(appType) {
// 清空统计数据（可选按 appType；不传则全部）
  var docs = utools.db.allDocs(STAT_PREFIX) || [];
  var removed = 0;
  docs.forEach(function (doc) {
    if (!doc || !doc._id) return;
    if (appType && appType !== "all" && doc.appType !== appType) return;
    try { utools.db.remove(doc._id); removed++; } catch (e) {}
  });
  return { success: true, removed: removed };
}
// 清理过期统计（保留最近 STAT_KEEP_DAYS 天）
function pruneStats() {
  try {
    var d = new Date();
    d.setDate(d.getDate() - STAT_KEEP_DAYS);
    var minDay = _statDayKey(d);
    var docs = utools.db.allDocs(STAT_PREFIX) || [];
    docs.forEach(function (doc) {
      if (doc && doc.day && doc.day < minDay) {
        try { utools.db.remove(doc._id); } catch (e) {}
      }
    });
  } catch (e) {}
}

window.skillNest = window.ccSwitch = {
  // Paths
  paths: {
    home: getHomeDir(),
    codexAuth: getCodexAuthPath(),
    codexConfig: getCodexConfigPath(),
    claudeSettings: getClaudeSettingsPath(),
    openclawConfig: getOpenClawConfigPath(),
    geminiEnv: getGeminiEnvPath()
  },

  // Config read
  getCurrentConfigs: getCurrentConfigs,
  readCodexConfig: readCodexConfig,
  readClaudeSettings: readClaudeSettings,
  readGeminiEnv: readGeminiEnv,
  readOpenClawConfig: readOpenClawConfig,

  // Provider CRUD
  listProviders: listProviders,
  getProvider: getProvider,
  saveProvider: saveProvider,
  deleteProvider: deleteProvider,

  // Switch
  switchProvider: switchProvider,
  getCurrentProviderId: getCurrentProviderId,

  // Usage stats
  getStats: getStats,
  clearStats: clearStats,

  // Import/Export
  exportAll: exportAllProviders,
  importAll: importProviders,

  // Skills management
  getDefaultSkillDirs: getDefaultSkillDirs,
  getSkillStoragePaths: getSkillStoragePaths,
  setSkillStoragePaths: setSkillStoragePaths,
  listAllSkills: listAllSkills,
  listSkillsInDir: listSkillsInDir,
  getSkillRepos: getSkillRepos,
  addSkillRepo: addSkillRepo,
  removeSkillRepo: removeSkillRepo,
  syncSkills: syncSkills,
  toggleSkillToAgent: toggleSkillToAgent,
  searchSkills: searchSkills,
  installSkill: installSkill,
  removeNestSkill: removeNestSkill,

  // SkillNest
  getNestDir: getNestDir,
  listNestSkills: listNestSkills,
  getNestSkillMeta: getNestSkillMeta,
  deploySkill: deploySkill,
  undeploySkill: undeploySkill,
  toggleSkillToAgent: toggleSkillToAgent,
  getDeployRegistry: getDeployRegistry,
  listDeployments: listDeployments,

  // Project targets
  listProjectTargets: listProjectTargets,
  addProjectTarget: addProjectTarget,
  removeProjectTarget: removeProjectTarget,

  // Utils
  generateId: generateId,
  getSyncMode: getSyncMode,
  setSyncMode: setSyncMode,
};


// --- Startup: mark current providers ---

try {
  ["codex", "claude", "gemini"].forEach(function (appType) {
    markCurrent(appType, getCurrentProviderId(appType));
  });
} catch (e) {
  // ignore startup errors
}
// 启动时清理过期统计
// ============ 路由（代理网关） ============
const ROUTE_PREFIX = "cctoggle_route_";
const BACKUP_KEY = "cctoggle_route_backup"; // 接管前的原始配置备份
// 后台 daemon 窗口引用（每个 appType 一个）
const daemonWins = {}; // { codex: BrowserWindow, claude: ..., gemini: ... }
const proxyRuntime = {}; // { [appType]: { running, port, groupId, members, logs } }

function _routeKey(appType, id) { return ROUTE_PREFIX + appType + "_" + id; }

function listRouteGroups(appType) {
  try {
    const docs = utools.db.allDocs(ROUTE_PREFIX + appType + "_") || [];
    return docs.map(function (d) {
      return Object.assign({}, d, { id: d._id.replace(ROUTE_PREFIX + appType + "_", "") });
    });
  } catch (e) { return []; }
}

function getRouteGroup(appType, id) {
  try {
    const doc = utools.db.get(_routeKey(appType, id));
    if (!doc) return null;
    return Object.assign({}, doc, { id: id });
  } catch (e) { return null; }
}

function saveRouteGroup(group) {
  const appType = group.appType;
  const id = group.id || generateId();
  const key = _routeKey(appType, id);
  const existing = utools.db.get(key);
  const doc = {
    _id: key,
    _rev: existing ? existing._rev : undefined,
        name: group.name || "未命名路由组",
      name: group.name || "未命名路由组",
    listenPort: group.listenPort || 8788,
    strategy: group.strategy || "failover",
    members: (group.members || []).map(function (m) {
      return { providerId: m.providerId, weight: m.weight || 1, priority: m.priority || 1 };
    }),
    health: Object.assign({ intervalMs: 30000, timeoutMs: 5000, path: "/models" }, group.health || {}),
    breaker: Object.assign({ failThreshold: 3, cooldownMs: 60000, halfOpenProbe: 1 }, group.breaker || {}),
    timeoutMs: group.timeoutMs || 30000,
    updatedAt: new Date().toISOString(),
    createdAt: existing ? existing.createdAt : new Date().toISOString(),
  };
  utools.db.put(doc);
  return id;
}

function deleteRouteGroup(appType, id) {
  try {
stopProxy(appType); // 若在跑先停
    return true;
  } catch (e) { return false; }
}
// 组装 daemon 需要的完整成员信息（含 apiKey 明文）
function _resolveMembers(appType, group) {
  return (group.members || []).map(function (m) {
    const p = getProvider(appType, m.providerId);
    if (!p) return null;
    return {
      providerId: p.id,
      name: p.name,
      baseUrl: p.baseUrl || "",
      apiKey: p.apiKey || "",
      priority: m.priority || 1,
      weight: m.weight || 1,
// 路由转换参数
      appType: appType,
      apiFormat: p.apiFormat || "",
      model: p.model || "",
      maxOutputTokens: p.maxTokens || "",
      customUserAgent: p.customUserAgent || "",
      headersOverride: p.headersOverride || "",
      bodyOverride: p.bodyOverride || "",
      authField: p.authField || "ANTHROPIC_AUTH_TOKEN",
      impersonateClaudeCode: p.impersonateClaudeCode || false,
    };
  }).filter(Boolean);
}

function startProxy(appType, groupId) {
  const group = getRouteGroup(appType, groupId);
  if (!group) return { success: false, error: "group not found" };
// 如已运行则先停
  const members = _resolveMembers(appType, group);
  if (members.length === 0) return { success: false, error: "no members" };

  try {
    const win = utools.createBrowserWindow(
      "preload/proxy-daemon.html",
      { show: false, webPreferences: { preload: "preload/proxy-daemon.js" } },
      function () {
        try {
          win.webContents.send("cfg", { group: group, members: members });
        } catch (e) {}
      }
    );
    daemonWins[appType] = win;
    proxyRuntime[appType] = { running: true, port: group.listenPort, groupId: groupId, members: [], logs: [] };
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function stopProxy(appType) {
  const win = daemonWins[appType];
  if (win) {
    try { win.webContents.send("stop"); } catch (e) {}
    try { win.destroy(); } catch (e) {}
    delete daemonWins[appType];
  }
  if (proxyRuntime[appType]) proxyRuntime[appType].running = false;
  if (proxyRuntime._active === appType) delete proxyRuntime._active;
  return { success: true };
}

function getProxyStatus(appType) {
  const rt = proxyRuntime[appType];
  if (!rt) return { running: false };
  return {
    running: !!rt.running,
    port: rt.port,
    groupId: rt.groupId,
    startedAt: rt.startedAt || 0,
    activeConn: rt.activeConn || 0,
    reqTotal: rt.reqTotal || 0,
    reqSuccess: rt.reqSuccess || 0,
    reqFail: rt.reqFail || 0,
    lastMemberId: rt.lastMemberId || null,
    members: rt.members || [],
    logs: (rt.logs || []).slice(-200),
  };
}
// 主窗调用一次即可注册全局回调；daemon → 主窗事件透传到 window
function onProxyEvent(cb) {
  if (typeof cb !== "function") return;
  try {
    const { ipcRenderer } = require("electron");
    ipcRenderer.removeAllListeners("parent-message");
    ipcRenderer.on("parent-message", function (_event) {
// uTools 独立窗口 sendToParent 落地为 parent-message 事件
      const [channel, data] = args;
      try {
        if (channel === "proxy-stat" && data) {
// 无法反查 appType，简单方案：同端口匹配
          Object.keys(proxyRuntime).forEach(function (app) {
            const rt = proxyRuntime[app];
            if (rt && rt.port === data.port) {
              rt.running = !!data.running;
              rt.members = data.members || [];
              rt.startedAt = data.startedAt || 0;
              rt.activeConn = data.activeConn || 0;
              rt.reqTotal = data.reqTotal || 0;
              rt.reqSuccess = data.reqSuccess || 0;
              rt.reqFail = data.reqFail || 0;
              rt.lastMemberId = data.lastMemberId || null;
            }
          });
        } else if (channel === "proxy-log" && data) {
          Object.keys(proxyRuntime).forEach(function (app) {
            const rt = proxyRuntime[app];
            if (!rt.logs) rt.logs = [];
            rt.logs.push(data);
            if (rt.logs.length > 500) rt.logs.splice(0, rt.logs.length - 500);
          });
        } else if (channel === "proxy-usage" && data) {
          try { recordUsage(data); } catch (e) {}
        }
      } catch (e) {}
      try { cb(channel, data); } catch (e) {}
    });
  } catch (e) {}
}
// —— 接管 / 还原 ——
function _backupCurrent(appType) {
// —— 接管 / 还原 ——
  const cur = getCurrentProviderId(appType);
  const doc = utools.db.get(BACKUP_KEY) || { _id: BACKUP_KEY };
  doc[appType] = { previousProviderId: cur, at: new Date().toISOString() };
  utools.db.put(doc);
}
function _readBackup(appType) {
  const doc = utools.db.get(BACKUP_KEY);
  return doc && doc[appType] ? doc[appType] : null;
}

function takeoverApp(appType, listenPort) {
  try {
    _backupCurrent(appType);
    const baseUrl = "http://127.0.0.1:" + (listenPort || 8788);
// 用一个虚拟 provider 走原版 switch 逻辑写入配置
    const fake = {
      id: "__proxy__",
      appType: appType,
      name: "ccswitch-proxy",
        apiKey: "sk-cctoggle-proxy", // 占位，daemon 会用真实成员 key 转发
        apiKey: "sk-cctoggle-proxy", // 占位，daemon 会用真实成员 key 转发
      model: "gpt-4o", // 鐢ㄦ埛鍙嚜琛?override
      configType: appType === "claude" ? "anthropic" : (appType === "gemini" ? "gemini" : (appType === "openclaw" ? "openclaw" : "openai")),
      extraConfig: "",
    };
    if (appType === "codex") switchProviderCodex(fake);
    else if (appType === "claude") switchProviderClaude(fake);
    else if (appType === "openclaw") switchProviderOpenclaw(fake);
    else if (appType === "gemini") switchProviderGemini(fake);
    return { success: true, baseUrl: baseUrl };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function restoreApp(appType) {
  const bk = _readBackup(appType);
  if (!bk || !bk.previousProviderId) return { success: false, error: "no backup" };
  const r = switchProvider(appType, bk.previousProviderId);
  return r;
}
// 快捷开关：启动 appType 的 默认路由组（第一个）
// 默认端口（每 App 一套，可在设置里修改）
const DEFAULT_PROXY_PORT = 8788;
const PORT_KEY = "cctoggle_route_port";

function getProxyPort(appType) {
  try {
    const doc = utools.db.get(PORT_KEY);
    const p = doc && doc[appType];
    return Number(p) || DEFAULT_PROXY_PORT;
  } catch (e) { return DEFAULT_PROXY_PORT; }
}

function setProxyPort(appType, port) {
  const p = Number(port);
  if (!p || p < 1024 || p > 65535) return { success: false, error: "port must be 1024-65535" };
// 运行中不允许改
  if (proxyRuntime._active === appType) {
    return { success: false, error: "proxy is running" };
  }
  const doc = utools.db.get(PORT_KEY) || { _id: PORT_KEY };
  doc[appType] = p;
// 同步更新该 App 的首个路由组
  const groups = listRouteGroups(appType);
  if (groups[0]) {
    const g = getRouteGroup(appType, groups[0].id);
    if (g) { g.listenPort = p; saveRouteGroup(g); }
  }
  return { success: true, port: p };
}
// 保证存在一个可用路由组：没有则用当前 App 下全部供应商自动生成
function ensureDefaultGroup(appType) {
  const groups = listRouteGroups(appType);
// 已有组：同步补齐新加的供应商成员 & 端口
    const g = groups[0];
  if (groups.length) {
    const wantPort = getProxyPort(appType);
    if (g.listenPort !== wantPort) { g.listenPort = wantPort; }
    const all = listProviders(appType);
    const have = {};
    (g.members || []).forEach(function (m) { have[m.providerId] = true; });
    let changed = false;
    all.forEach(function (p, i) {
      if (!have[p.id]) { g.members.push({ providerId: p.id, priority: (g.members.length + 1), weight: 1 }); changed = true; }
    });
    if (changed) saveRouteGroup(g);
    return getRouteGroup(appType, g.id);
  }
  const all = listProviders(appType);
  if (!all.length) return null;
  const id = saveRouteGroup({
      name: "默认路由（自动）",
      name: "默认路由（自动）",
    listenPort: getProxyPort(appType),
    strategy: "failover",
    members: all.map(function (p, i) { return { providerId: p.id, priority: i + 1, weight: 1 }; }),
    health: { intervalMs: 30000, timeoutMs: 5000, path: appType === "claude" ? "/v1/models" : "/models" },
    breaker: { failThreshold: 3, cooldownMs: 60000 },
    timeoutMs: 30000,
  });
  return getRouteGroup(appType, id);
}

function toggleProxyQuick(appType) {
// 点击当前已开启的 App = 关闭
  if (proxyRuntime._active === appType) {
    stopProxy(appType);
    restoreApp(appType);
    return { success: true, running: false };
// 全局只允许一个 daemon：切换到别的 App 前先关旧的
    stopProxy(proxyRuntime._active);
    restoreApp(proxyRuntime._active);
  }
  const g = ensureDefaultGroup(appType);
  if (!g) return { success: false, error: "no providers" };
  const s = startProxy(appType, g.id);
  if (!s.success) return s;
  const port = g.listenPort || getProxyPort(appType);
  takeoverApp(appType, port);
  proxyRuntime._active = appType;
  return { success: true, running: true, port: port, groupId: g.id };
}

// 暴露到 window
if (window.skillNest) {
  window.skillNest.listRouteGroups = listRouteGroups;
  window.skillNest.getRouteGroup = getRouteGroup;
  window.skillNest.saveRouteGroup = saveRouteGroup;
  window.skillNest.deleteRouteGroup = deleteRouteGroup;
  window.skillNest.startProxy = startProxy;
  window.skillNest.stopProxy = stopProxy;
  window.skillNest.getProxyStatus = getProxyStatus;
  window.skillNest.onProxyEvent = onProxyEvent;
  window.skillNest.takeoverApp = takeoverApp;
  window.skillNest.restoreApp = restoreApp;
  window.skillNest.toggleProxyQuick = toggleProxyQuick;
  window.skillNest.getProxyPort = getProxyPort;
  window.skillNest.setProxyPort = setProxyPort;
}


