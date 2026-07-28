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

// Codex model_catalog_json requires base_instructions on each model (or parsing fails).
// Hardcoded minimal instructions, always written on switch/proxy; no external file dependency.
const CODEX_BASE_INSTRUCTIONS = [
  "You are Codex, a coding agent that collaborates with the user in a shared workspace until the task is genuinely handled.",
  "",
  "Working style:",
  "- Read the relevant code before changing it. Prefer the repo's existing patterns, frameworks, and helpers over inventing new abstractions.",
  "- Keep edits tightly scoped to the request. Do not revert or refactor unrelated changes the user made.",
  "- Use apply_patch for file edits; do not write files via shell tricks. Use rg / rg --files for search.",
  "- Default to ASCII unless the file already uses other characters.",
  "- If the user asks a question or wants a plan, answer it; otherwise implement the change and try to work through blockers yourself.",
  "- If you could not run or verify something (e.g. tests), say so.",
  "",
  "Communication:",
  "- Be concise and direct. Use short paragraphs; add lists or headers only when they help.",
  "- Reference real files as clickable markdown links with absolute paths, e.g. [file.js](/abs/path/file.js:12).",
  "- Wrap commands, paths, and code identifiers in backticks; put multi-line code in fenced blocks.",
  "- The user does not see command output, so summarize important results.",
  "- Do not use emojis or em dashes unless asked.",
].join("\n");
function getCodexInstructions() {
  return { base_instructions: CODEX_BASE_INSTRUCTIONS, instructions_variables: {} };
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
  newBlocks.forEach(function (b) {
    if (b.header !== null && b.tableName) incomingTables[b.tableName] = true;
  });
  // 本次是否声明了 model_providers.* 表；若声明则清除旧的所有 provider 表，避免残留废弃项
  const incomingHasProvider = Object.keys(incomingTables).some(function (t) {
    return t.indexOf("model_providers.") === 0;
  });

  // 1) 合并顶层键区：保留旧文件里本次未声明的顶层键，覆盖本次声明的键
  const oldTop = oldBlocks.find(function (b) { return b.header === null; }) || { lines: [] };
  const mergedTopLines = [];
  oldTop.lines.forEach(function (line) {
    const km = line.match(/^\s*([A-Za-z0-9_.-]+)\s*=/);
    if (km && incomingKeys[km[1]]) return;
    mergedTopLines.push(line);
  });
  while (mergedTopLines.length && mergedTopLines[mergedTopLines.length - 1].trim() === "") mergedTopLines.pop();
  newTop.lines.forEach(function (line) { mergedTopLines.push(line); });

  // 2) 表段：本次声明的表用新内容替换；旧文件里其余表原样保留
  const outParts = [];
  const topText = mergedTopLines.join("\n").replace(/\n+$/, "");
  if (topText.trim()) outParts.push(topText);
  oldBlocks.forEach(function (b) {
    if (b.header === null) return;
    if (incomingTables[b.tableName]) return;
    if (incomingHasProvider && b.tableName && b.tableName.indexOf("model_providers.") === 0) return;
    outParts.push([b.header].concat(b.lines).join("\n").replace(/\n+$/, ""));
  });
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
      // 空白占位 apiKey（列表不含明文，通过 getProvider 单独读取）
      const provider = { id: doc._id.replace(DB_PREFIX + appType + "_", ""), name: doc.name, baseUrl: doc.baseUrl, model: doc.model, models: doc.models || [], websiteUrl: doc.websiteUrl, remark: doc.remark || "", icon: doc.icon, iconColor: doc.iconColor, category: doc.category, configType: doc.configType, isCurrent: doc.isCurrent, sortOrder: doc.sortOrder, createdAt: doc.createdAt, apiFormat: doc.apiFormat || "", wireApi: doc.wireApi || "" };
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
      remark: doc.remark || "",
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
    remark: providerData.remark || "",
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
  try {
    var groups = listRouteGroups(appType);
    groups.forEach(function (g) {
      var before = (g.members || []).length;
      g.members = (g.members || []).filter(function (m) { return m.providerId !== providerId; });
      if (g.members.length !== before) {
        g.appType = appType;
        if (g.members.length === 0) {
          deleteRouteGroup(appType, g.id);
          // 路由组清空 + 代理正在运行 → 自动停掉代理
          if (proxyRuntime._active === appType) {
            stopProxy(appType);
            restoreApp(appType);
          }
        } else {
          saveRouteGroup(g);
        }
      }
    });
  } catch (e) {}
  return true;
}
function switchProviderCodex(provider) {
  // 构建 auth.json
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

  const hasCatalog = Array.isArray(provider.modelCatalog) && provider.modelCatalog.length;
  const catalogFileName = "utoolscctoggle-model-catalog.json";

  // 构建 config.toml
  let configToml = provider.extraConfig || "";
  if (!configToml) {
    const cleanName = (provider.name || "custom")
      .toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^_+|_+$/g, "") || "custom";
    const baseUrl = provider.baseUrl || "https://api.openai.com/v1";
    const model = provider.model || "gpt-4o";
    const apiFormat = provider.apiFormat || "";
    const wireApi = provider.wireApi || (apiFormat === "openai_chat" ? "chat" : "responses");
    const effort = provider.reasoningEffort || "high";
    const lines = [
      'model_provider = "' + cleanName + '"',
      'model = "' + model + '"',
      'model_reasoning_effort = "' + effort + '"',
      'disable_response_storage = true',
    ];
    // 有多模型目录时写入引用，Codex 的 /model 菜单据此展示可选模型
    if (hasCatalog) lines.push('model_catalog_json = "' + catalogFileName + '"');
    lines.push(
      '',
      '[model_providers.' + cleanName + ']',
      'name = "' + cleanName + '"',
      'base_url = "' + baseUrl + '"',
      'wire_api = "' + wireApi + '"',
      'requires_openai_auth = ' + (/^https?:\/\/(127\.0\.0\.1|localhost)/.test(baseUrl) ? 'false' : 'true')
    );
    configToml = lines.join("\n");
  }

  if (hasCatalog) {
    try {
      // 将前端精简字段(model/displayName/contextWindow)映射为 Codex 模型目录真实格式(下划线命名)，
      // 并补齐 Codex 期望的字段默认值；前端若已填同名字段则以其为准。
      const catalogModels = provider.modelCatalog.map(function (m) {
        const slug = m.slug || m.model || "";
        const displayName = m.display_name || m.displayName || slug;
        const ctx = Number(m.context_window || m.contextWindow) || 128000;
        const instr = getCodexInstructions();
        return {
          slug: slug,
          display_name: displayName,
          description: m.description || displayName,
          context_window: ctx,
          max_context_window: Number(m.max_context_window) || ctx,
          input_modalities: ["text"],
          default_reasoning_level: provider.reasoningEffort || "medium",
          base_instructions: instr.base_instructions,
          instructions_variables: instr.instructions_variables,
          supported_reasoning_levels: [
            { effort: "low", description: "Fast responses with lighter reasoning" },
            { effort: "medium", description: "Balances speed and reasoning depth for everyday tasks" },
            { effort: "high", description: "Greater reasoning depth for complex problems" }
          ],
          supports_parallel_tool_calls: true,
          supports_search_tool: true,
          supports_reasoning_summaries: true,
          apply_patch_tool_type: "freeform",
          shell_type: "shell_command",
          supported_in_api: true,
          priority: 1000,
          visibility: "list",
          // 补齐 Codex 期望的其余字段默认值（此版本几乎全部必填）
          additional_speed_tiers: [],
          availability_nux: null,
          // 以下三项为用户偏好：优先用 provider 上的设置，未设置时回退默认
          default_reasoning_summary: provider.reasoningSummary || "none",
          default_verbosity: provider.verbosity || "low",
          effective_context_window_percent: 95,
          experimental_supported_tools: [],
          model_messages: { instructions_template: instr.base_instructions, instructions_variables: instr.instructions_variables },
          service_tiers: [],
          support_verbosity: true,
          supports_image_detail_original: true,
          truncation_policy: { limit: 10000, mode: "tokens" },
          upgrade: null,
          web_search_tool_type: provider.webSearch === false ? "none" : "text_and_image"
        };
      });
      const catalogJson = JSON.stringify({ models: catalogModels }, null, 2);
      const catalogPath = path.join(getHomeDir(), ".codex", catalogFileName);
      ensureDir(catalogPath);
      fs.writeFileSync(catalogPath, catalogJson, "utf8");
    } catch (e) { /* ignore */ }
  }

  writeCodexConfig(auth, configToml);
  return true;
}

// 优先使用预设 settingsConfig，其次回退旧字段
function switchProviderClaude(provider) {
  if (!provider) return { success: false, error: "provider not found" };
  let settings = {};
  if (provider.settingsConfig && Object.keys(provider.settingsConfig).length) {
    settings = JSON.parse(JSON.stringify(provider.settingsConfig));
  }
  settings.env = settings.env || {};

  // 兼容旧字段
  if (provider.model) settings.env.ANTHROPIC_MODEL = provider.model;
  // 写入 apiKey 到指定认证字段（默认 ANTHROPIC_AUTH_TOKEN）；未提供 apiKey 时不写，避免污染为 undefined
  if (provider.apiKey) {
    const field = provider.authField || (settings.env.ANTHROPIC_API_KEY !== undefined ? "ANTHROPIC_API_KEY" : "ANTHROPIC_AUTH_TOKEN");
    settings.env[field] = provider.apiKey;
  }
  // 合并 extraConfig（JSON）
  try {
    const extra = JSON.parse(provider.extraConfig);
    Object.assign(settings, extra);
  } catch (e) { /* ignore */ }

  writeClaudeSettings(settings);
  return true;
}

function switchProviderGemini(provider) {
  // 收集 env
  const env = Object.assign({}, (provider.settingsConfig && provider.settingsConfig.env) || {});
  if (provider.baseUrl) env.GOOGLE_GEMINI_BASE_URL = provider.baseUrl;
  if (provider.model) env.GEMINI_MODEL = provider.model;
  if (provider.apiKey) env.GEMINI_API_KEY = provider.apiKey;
  // 序列化 KEY=VALUE
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
  const all = listProviders(appType);
  const current = all.find(function (p) { return p.isCurrent; });
  return current ? current.id : null;
}

// 进入插件时重新应用已激活的供应商：将真实配置文件强制写回本软件的版本（覆盖外部工具的修改）
// 仅处理数据库中确实标记了 isCurrent 的 app；代理正在运行时跳过该 app，避免破坏代理接管状态
// 记录/读取用户上次使用的 agent（下次进入插件只需重新激活这一个）
function setLastActiveApp(appType) {
  try { utools.dbStorage.setItem("cctoggle_last_active_app", appType); } catch (e) {}
  return true;
}
function getLastActiveApp() {
  try { return utools.dbStorage.getItem("cctoggle_last_active_app") || ""; } catch (e) { return ""; }
}
function reapplyCurrent(onlyAppType) {
  const result = {};
  const apps = onlyAppType ? [onlyAppType] : ["codex", "claude", "gemini", "openclaw"];
  apps.forEach(function (appType) {
    try {
      const rt = proxyRuntime[appType];
      if (rt && rt.running) { result[appType] = { skipped: "proxy running" }; return; }
      const id = getCurrentProviderId(appType);
      if (!id) { result[appType] = { skipped: "no current" }; return; }
      const r = switchProvider(appType, id);
      result[appType] = r;
    } catch (e) { result[appType] = { success: false, error: e.message }; }
  });
  return result;
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

// 校验技能名合法：非空、无路径分隔符、无 ".."，避免目录穿越
function _safeSkillName(name) {
  if (!name || typeof name !== "string") return false;
  if (name.indexOf("/") >= 0 || name.indexOf("\\") >= 0) return false;
  if (name === "." || name === "..") return false;
  if (name.indexOf("\0") >= 0) return false;
  return true;
}
// 断言 target 落在 root 目录内（防止拼接出的路径逃逸后被递归删除）
function _assertInside(root, target) {
  var r = path.resolve(root);
  var t = path.resolve(target);
  var rel = path.relative(r, t);
  if (rel === "" || rel === ".." || rel.indexOf(".." + path.sep) === 0 || path.isAbsolute(rel)) {
    throw new Error("unsafe path outside target root: " + target);
  }
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
  _assertInside(path.dirname(dest), dest);
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
  if (!_safeSkillName(skillName)) {
    return { success: false, error: "invalid skill name: " + skillName };
  }
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
  _assertInside(destDir, destPath);

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
  if (!_safeSkillName(skillName)) {
    return { success: false, error: "invalid skill name: " + skillName };
  }
  var allPaths = getSkillStoragePaths();
  var destDir = expandHome(allPaths[target]);
  if (!destDir) {
    var projects = listProjectTargets();
    var proj = projects.find(function(p) { return p.id === target; });
    if (proj) destDir = expandHome(proj.path);
  }
  if (!destDir) return { success: false, error: "unknown target: " + target };

  var destPath = path.join(destDir, skillName);
  _assertInside(destDir, destPath);
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
    if (!_safeSkillName(name)) return { success: false, error: "invalid skill name" };
    var nest = getNestDir();
    var target = path.join(nest, name);
    _assertInside(nest, target);
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
  if (!_safeSkillName(skillName)) return { success: false, error: "invalid skill name" };
  var nest = getNestDir();
  var target = path.join(nest, skillName);
  _assertInside(nest, target);
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
// ———— 用量统计（无缓存：每次直接扫描本地 CLI 会话日志） ————
// 不在 db 存聚合数据。仅存一个「清除时间戳」文档用于隐藏历史。
// Claude Code: ~/.claude/projects/**/*.jsonl（assistant 行带 message.usage + model）
// Codex:       ~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl（token_count 的 last_token_usage 增量）
const CLEARED_KEY = "cctoggle_stat_clearedAt";

function _statDayKey(d) {
// 本地日期 YYYY-MM-DD
  var y = d.getFullYear();
  var m = ("0" + (d.getMonth() + 1)).slice(-2);
  var day = ("0" + d.getDate()).slice(-2);
  return y + "-" + m + "-" + day;
}

function _emptyBucket() {
  return { requests: 0, input: 0, output: 0, cacheRead: 0, cacheCreate: 0, total: 0 };
}

function _dayFromTs(ts) {
  if (!ts) return "";
  try { return _statDayKey(new Date(ts)); } catch (e) { return ""; }
}

// 读取各 agent 的清除时间戳（毫秒）；无则为 0
function _getClearedAt() {
  var doc = utools.db.get(CLEARED_KEY) || {};
  return { claude: Number(doc.claude) || 0, codex: Number(doc.codex) || 0 };
}

// 递归列出目录下所有 .jsonl 文件（绝对路径，异步以让出主线程）
async function _listJsonl(dir, out) {
  out = out || [];
  var entries;
  try { entries = await fs.promises.readdir(dir, { withFileTypes: true }); } catch (e) { return out; }
  for (var i = 0; i < entries.length; i++) {
    var ent = entries[i];
    var full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      await _listJsonl(full, out);
    } else if (ent.isFile() && /\.jsonl$/i.test(ent.name)) {
      out.push(full);
    }
  }
  return out;
}

// 解析单个日志文件，把用量累加进 acc（按 "<appType>_<day>" → { appType, day, ...6字段, models }）
// clearedMs：早于此时间戳的条目跳过（清除点之前的历史被隐藏）
async function _parseLogFile(file, appType, clearedMs, acc) {
  var text;
  try { text = await fs.promises.readFile(file, "utf8"); } catch (e) { return; }
  var lines = text.split(/\r?\n/);
  var codexModel = ""; // Codex: 随 turn_context 更新，归因后续 token_count

  function bucketFor(day, model) {
    var dayKey = appType + "_" + day;
    var d = acc[dayKey] || (acc[dayKey] = { appType: appType, day: day,
      requests: 0, input: 0, output: 0, cacheRead: 0, cacheCreate: 0, total: 0, models: {} });
    var m = model || "unknown";
    return d.models[m] || (d.models[m] = _emptyBucket());
  }
  function addUsage(day, model, input, output, cacheRead, cacheCreate) {
    var b = bucketFor(day, model);
    var d = acc[appType + "_" + day];
    b.requests += 1; b.input += input; b.output += output;
    b.cacheRead += cacheRead; b.cacheCreate += cacheCreate; b.total += input + output + cacheRead + cacheCreate;
    d.requests += 1; d.input += input; d.output += output;
    d.cacheRead += cacheRead; d.cacheCreate += cacheCreate; d.total += input + output + cacheRead + cacheCreate;
  }

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line) continue;
    var d;
    try { d = JSON.parse(line); } catch (e) { continue; }
    if (!d || typeof d !== "object") continue;

    if (appType === "claude") {
      // assistant 消息：message.usage 为单次增量
      if (d.type !== "assistant" || !d.message) continue;
      var mu = d.message.usage;
      if (!mu) continue;
      if (clearedMs && d.timestamp && new Date(d.timestamp).getTime() <= clearedMs) continue;
      var day = _dayFromTs(d.timestamp);
      if (!day) continue;
      var cIn = Number(mu.input_tokens) || 0;
      var cOut = Number(mu.output_tokens) || 0;
      var cRead = Number(mu.cache_read_input_tokens) || 0;
      var cCreate = Number(mu.cache_creation_input_tokens) || 0;
      if (!cIn && !cOut && !cRead && !cCreate) continue;
      addUsage(day, d.message.model || "unknown", cIn, cOut, cRead, cCreate);
    } else {
      // codex
      if (d.type === "turn_context" && d.payload && d.payload.model) {
        codexModel = d.payload.model;
        continue;
      }
      if (d.type !== "event_msg" || !d.payload || d.payload.type !== "token_count") continue;
      var info = d.payload.info;
      var last = info && info.last_token_usage; // 增量，禁用 total_token_usage（累计值）
      if (!last) continue;
      if (clearedMs && d.timestamp && new Date(d.timestamp).getTime() <= clearedMs) continue;
      var day2 = _dayFromTs(d.timestamp);
      if (!day2) continue;
      var totalIn = Number(last.input_tokens) || 0;
      var cachedIn = Number(last.cached_input_tokens) || 0;
      var freshIn = Math.max(0, totalIn - cachedIn); // input_tokens 含缓存命中，拆出新增输入
      var out = Number(last.output_tokens) || 0;
      var cacheCreate = Number(last.cache_write_input_tokens) || 0;
      if (!totalIn && !out && !cacheCreate) continue;
      addUsage(day2, codexModel || "unknown", freshIn, out, cachedIn, cacheCreate);
    }
  }
}

// 扫描本地日志并返回全部原始按天记录（不写 db）。前端在内存中按 appType/天数过滤。
// 返回 { daily: [{ appType, day, ...6字段, models }], error? }
// 异步以让出渲染进程主线程，扫描期间 UI 不卡死
async function scanUsageLogs() {
  try {
    var home = getHomeDir();
    var cleared = _getClearedAt();
    var roots = [
      { dir: path.join(home, ".claude", "projects"), appType: "claude" },
      { dir: path.join(home, ".codex", "sessions"), appType: "codex" },
    ];
    var acc = {}; // "<appType>_<day>" → 记录
    for (var r = 0; r < roots.length; r++) {
      var root = roots[r];
      var clearedMs = cleared[root.appType] || 0;
      var list = await _listJsonl(root.dir);
      for (var i = 0; i < list.length; i++) {
        await _parseLogFile(list[i], root.appType, clearedMs, acc);
      }
    }
    var daily = Object.keys(acc).map(function (k) { return acc[k]; });
    return { daily: daily };
  } catch (e) {
    return { daily: [], error: String(e && e.message ? e.message : e) };
  }
}

// 清除统计：记录当前时间戳，扫描时早于此的条目被隐藏（appType="all" 则清全部）
function clearStats(appType) {
  var doc = utools.db.get(CLEARED_KEY) || { _id: CLEARED_KEY };
  var now = Date.now();
  if (!appType || appType === "all") { doc.claude = now; doc.codex = now; }
  else doc[appType] = now;
  try { utools.db.put(doc); return { success: true }; }
  catch (e) { return { success: false, error: String(e && e.message ? e.message : e) }; }
}

window.utoolsCctoggle = {
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
  reapplyCurrent: reapplyCurrent,
  setLastActiveApp: setLastActiveApp,
  getLastActiveApp: getLastActiveApp,

  // 统计（无缓存：直接扫描本地 CLI 会话日志）
  clearStats: clearStats,
  scanUsageLogs: scanUsageLogs,

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
// ============ 路由（代理网关） ============
const ROUTE_PREFIX = "cctoggle_route_";
const BACKUP_KEY = "cctoggle_route_backup"; // 接管前的原始配置备份
// 后台 daemon 窗口引用（每个 appType 一个）
const daemonWins = {}; // { codex: BrowserWindow, claude: ..., gemini: ... }
const proxyRuntime = {}; // { [appType]: { running, port, groupId, members, logs } }

function _routeKey(appType, id) { return ROUTE_PREFIX + appType + "_" + id; }

// 生成本地代理访问令牌（仅本机持有者可用代理转发）
function _genProxyToken() {
  return "utct-" + generateId() + generateId() + Math.random().toString(36).slice(2, 10);
}
// 确保路由组有 authToken，没有则生成并持久化，返回 token
function _ensureRouteToken(appType, group) {
  if (group.authToken) return group.authToken;
  group.authToken = _genProxyToken();
  group.appType = group.appType || appType;
  saveRouteGroup(group);
  return group.authToken;
}

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
    listenPort: group.listenPort || 8788,
    strategy: group.strategy || "failover",
    members: (group.members || []).map(function (m) {
      return { providerId: m.providerId, weight: m.weight || 1, priority: m.priority || 1 };
    }),
    health: Object.assign({ intervalMs: 30000, timeoutMs: 5000, path: "/models" }, group.health || {}),
    breaker: Object.assign({ failThreshold: 3, cooldownMs: 60000, halfOpenProbe: 1 }, group.breaker || {}),
    timeoutMs: group.timeoutMs || 30000,
    authToken: group.authToken || (existing && existing.authToken) || "",
    updatedAt: new Date().toISOString(),
    createdAt: existing ? existing.createdAt : new Date().toISOString(),
  };
  utools.db.put(doc);
  return id;
}

function deleteRouteGroup(appType, id) {
  try {
    stopProxy(appType); // 若在跑先停
    utools.db.remove(_routeKey(appType, id));
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
  const members = _resolveMembers(appType, group);
  if (members.length === 0) return { success: false, error: "no members" };
  const token = _ensureRouteToken(appType, group);
  try {
    const win = utools.createBrowserWindow(
      "preload/proxy-daemon.html",
      { show: false, webPreferences: { preload: "preload/proxy-daemon.js" } },
      function () {
        try {
          win.webContents.send("cfg", { group: group, members: members, authToken: token });
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
    ipcRenderer.on("parent-message", function (_event, ...args) {
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
          // 统计改为扫描本地 CLI 日志（见 scanUsageLogs），代理事件不再写库，避免双写与关面板丢数据
        }
      } catch (e) {}
      try { cb(channel, data); } catch (e) {}
    });
  } catch (e) {}
}
// —— 接管 / 还原 ——
function _backupCurrent(appType) {
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
    // 客户端配置里写入代理令牌作为 key；daemon 校验后再换成真实上游 key 转发
    let proxyToken = "sk-utoolscctoggle-proxy";
    try {
      const rt0 = proxyRuntime[appType];
      const g0 = rt0 && rt0.groupId ? getRouteGroup(appType, rt0.groupId) : ensureDefaultGroup(appType);
      if (g0) proxyToken = _ensureRouteToken(appType, g0);
    } catch (e) { /* 回退到占位符 */ }
    let proxyModel = "";
    const proxyCatalog = [];
    const proxyCatalogSeen = {};
    try {
      const rt = proxyRuntime[appType];
      const g = rt && rt.groupId ? getRouteGroup(appType, rt.groupId) : ensureDefaultGroup(appType);
      (g && g.members ? g.members : []).forEach(function (mem) {
        const prov = getProvider(appType, mem.providerId);
        if (!prov) return;
        if (!proxyModel && prov.model) proxyModel = prov.model;
        (Array.isArray(prov.modelCatalog) ? prov.modelCatalog : []).forEach(function (m) {
          const slug = m.slug || m.model || "";
          if (!slug || proxyCatalogSeen[slug]) return;
          proxyCatalogSeen[slug] = true;
          proxyCatalog.push(m);
        });
        if (prov.model && !proxyCatalogSeen[prov.model] && (!prov.modelCatalog || prov.modelCatalog.length === 0)) {
          proxyCatalogSeen[prov.model] = true;
          proxyCatalog.push({ model: prov.model, displayName: prov.name || prov.model });
        }
      });
    } catch (e) { /* ignore */ }
// 用一个虚拟 provider 走原版 switch 逻辑写入配置
    const fake = {
      id: "__proxy__",
      appType: appType,
      name: "utoolscctoggle-proxy",
      baseUrl: appType === "codex" ? baseUrl + "/v1" : baseUrl,
      apiKey: proxyToken, // 代理令牌；daemon 校验后再用真实成员 key 转发
      model: proxyModel || "gpt-4o",
      modelCatalog: proxyCatalog, // 用户可自行 override
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
  const all = listProviders(appType);
  if (groups.length) {
    const g = groups[0];
    g.appType = appType;
    if (!all.length) {
      deleteRouteGroup(appType, g.id);
      return null;
    }
    const wantPort = getProxyPort(appType);
    if (g.listenPort !== wantPort) { g.listenPort = wantPort; }
    const allIds = {};
    all.forEach(function (p) { allIds[p.id] = true; });
    g.members = (g.members || []).filter(function (m) { return allIds[m.providerId]; });
    const have = {};
    g.members.forEach(function (m) { have[m.providerId] = true; });
    all.forEach(function (p) {
      if (!have[p.id]) { g.members.push({ providerId: p.id, priority: (g.members.length + 1), weight: 1 }); }
    });
    saveRouteGroup(g);
    return getRouteGroup(appType, g.id);
  }
  if (!all.length) return null;
  const id = saveRouteGroup({
    appType: appType,
    name: "默认路由（自动）",
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
  }
  // 全局只允许一个 daemon：切换到别的 App 前先关旧的
  if (proxyRuntime._active) {
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
if (window.utoolsCctoggle) {
  window.utoolsCctoggle.listRouteGroups = listRouteGroups;
  window.utoolsCctoggle.getRouteGroup = getRouteGroup;
  window.utoolsCctoggle.saveRouteGroup = saveRouteGroup;
  window.utoolsCctoggle.deleteRouteGroup = deleteRouteGroup;
  window.utoolsCctoggle.startProxy = startProxy;
  window.utoolsCctoggle.stopProxy = stopProxy;
  window.utoolsCctoggle.getProxyStatus = getProxyStatus;
  window.utoolsCctoggle.onProxyEvent = onProxyEvent;
  window.utoolsCctoggle.takeoverApp = takeoverApp;
  window.utoolsCctoggle.restoreApp = restoreApp;
  window.utoolsCctoggle.toggleProxyQuick = toggleProxyQuick;
  window.utoolsCctoggle.getProxyPort = getProxyPort;
  window.utoolsCctoggle.setProxyPort = setProxyPort;
}


