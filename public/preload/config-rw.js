// uTools ccToggle - config-rw.js
// 各 AI 工具配置文件读写

var utils = require("./utils");
var fs = utils.fs;
var path = utils.path;
var getHomeDir = utils.getHomeDir;
var getCodexAuthPath = utils.getCodexAuthPath;
var getCodexConfigPath = utils.getCodexConfigPath;
var getClaudeSettingsPath = utils.getClaudeSettingsPath;
var getGeminiEnvPath = utils.getGeminiEnvPath;
var getOpenClawConfigPath = utils.getOpenClawConfigPath;
var getClaudeJsonPath = utils.getClaudeJsonPath;
var getClaudeDesktopConfigPath = utils.getClaudeDesktopConfigPath;
var ensureDir = utils.ensureDir;
var getCodexInstructions = utils.getCodexInstructions;

// ——————————— Codex 配置读写 ———————————

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

// ——————————— Claude Desktop 配置读写 ———————————

function readClaudeDesktopConfig() {
  try {
    var p = getClaudeDesktopConfigPath();
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) { /* JSON 损坏时回退默认 */ }
  return {};
}

function writeClaudeDesktopConfig(config) {
  var p = getClaudeDesktopConfigPath();
  ensureDir(p);
  fs.writeFileSync(p, JSON.stringify(config, null, 2), "utf8");
  return true;
}

function switchProviderClaudeDesktop(provider) {
  if (!provider) return { success: false, error: "provider not found" };
  // 读取现有配置，保留 mcpServers 等字段
  var config = readClaudeDesktopConfig();
  var env = {};

  // 优先使用预设 settingsConfig.env
  if (provider.settingsConfig && provider.settingsConfig.env) {
    Object.keys(provider.settingsConfig.env).forEach(function (k) {
      env[k] = provider.settingsConfig.env[k];
    });
  }

  // 兼容旧字段
  if (provider.model) env.ANTHROPIC_MODEL = provider.model;
  if (provider.apiKey) {
    var field = provider.authField || (env.ANTHROPIC_API_KEY !== undefined ? "ANTHROPIC_API_KEY" : "ANTHROPIC_AUTH_TOKEN");
    env[field] = provider.apiKey;
  }

  config.env = env;

  // 合并 extraConfig（JSON）
  try {
    var extra = JSON.parse(provider.extraConfig);
    Object.keys(extra).forEach(function (k) {
      if (k !== "mcpServers") config[k] = extra[k];
    });
  } catch (e) { /* ignore */ }

  writeClaudeDesktopConfig(config);
  return true;
}

// ——————————— Claude Onboarding 跳过 ———————————

function readClaudeOnboarding() {
  try {
    var p = getClaudeJsonPath();
    if (fs.existsSync(p)) {
      var config = JSON.parse(fs.readFileSync(p, "utf8"));
      return !!config.hasCompletedOnboarding;
    }
  } catch (e) {}
  return false;
}

function setClaudeOnboarding(skip) {
  var p = getClaudeJsonPath();
  var config = {};
  try {
    if (fs.existsSync(p)) config = JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) { config = {}; }

  if (skip) {
    config.hasCompletedOnboarding = true;
  } else {
    delete config.hasCompletedOnboarding;
  }

  ensureDir(p);
  fs.writeFileSync(p, JSON.stringify(config, null, 2), "utf8");
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

// ——————————— OpenClaw 配置读写 ———————————

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

// ——————————— 综合读取 ———————————

function getCurrentConfigs() {
  return {
    codex: readCodexConfig(),
    claude: readClaudeSettings(),
    openclaw: readOpenClawConfig(),
    gemini: readGeminiEnv()
  };
}

// ——————————— 供应商切换逻辑 ———————————

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

module.exports = {
  readCodexConfig: readCodexConfig,
  writeCodexConfig: writeCodexConfig,
  mergeCodexConfig: mergeCodexConfig,
  readClaudeSettings: readClaudeSettings,
  writeClaudeSettings: writeClaudeSettings,
  readGeminiEnv: readGeminiEnv,
  writeGeminiEnv: writeGeminiEnv,
  readOpenClawConfig: readOpenClawConfig,
  writeOpenClawConfig: writeOpenClawConfig,
  readClaudeDesktopConfig: readClaudeDesktopConfig,
  writeClaudeDesktopConfig: writeClaudeDesktopConfig,
  readClaudeOnboarding: readClaudeOnboarding,
  setClaudeOnboarding: setClaudeOnboarding,
  getCurrentConfigs: getCurrentConfigs,
  switchProviderCodex: switchProviderCodex,
  switchProviderClaude: switchProviderClaude,
  switchProviderGemini: switchProviderGemini,
  switchProviderOpenclaw: switchProviderOpenclaw,
  switchProviderClaudeDesktop: switchProviderClaudeDesktop,
};
