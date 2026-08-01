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
var getClaudeDesktop3pConfigPath = utils.getClaudeDesktop3pConfigPath;
var getClaudeDesktopProfilePath = utils.getClaudeDesktopProfilePath;
var getClaudeDesktopMetaPath = utils.getClaudeDesktopMetaPath;
var ensureDir = utils.ensureDir;
var getCodexInstructions = utils.getCodexInstructions;
var getAgentConfigPath = utils.getAgentConfigPath;
function readCodexConfig() {
    try {
        const configDir = getAgentConfigPath("codex");
        const authPath = configDir ? path.join(configDir, "auth.json") : getCodexAuthPath();
        const configPath = configDir ? path.join(configDir, "config.toml") : getCodexConfigPath();
        let auth = {};
        let config = "";
        if (fs.existsSync(authPath)) {
            auth = JSON.parse(fs.readFileSync(authPath, "utf8"));
        }
        if (fs.existsSync(configPath)) {
            config = fs.readFileSync(configPath, "utf8");
        }
        return { auth, config };
    }
    catch (e) {
        return { auth: {}, config: "" };
    }
}
function writeCodexConfig(auth, configToml) {
    const configDir = getAgentConfigPath("codex");
    const authPath = configDir ? path.join(configDir, "auth.json") : getCodexAuthPath();
    const configPath = configDir ? path.join(configDir, "config.toml") : getCodexConfigPath();
    ensureDir(authPath);
    ensureDir(configPath);
    fs.writeFileSync(authPath, JSON.stringify(auth, null, 2), "utf8");
    let existing = "";
    try {
        if (fs.existsSync(configPath))
            existing = fs.readFileSync(configPath, "utf8");
    }
    catch (e) {
        existing = "";
    }
    const merged = mergeCodexConfig(existing, configToml);
    fs.writeFileSync(configPath, merged, "utf8");
    return true;
}
function mergeCodexConfig(existing, incoming) {
    if (!existing || !existing.trim())
        return incoming;
    function parseBlocks(text) {
        const blocks = [];
        let cur = { header: null, tableName: null, lines: [] };
        text.split(/\r?\n/).forEach(function (line) {
            const m = line.match(/^\s*\[\[?\s*([^\]]+?)\s*\]\]?\s*$/);
            if (m) {
                blocks.push(cur);
                cur = { header: line, tableName: m[1].trim(), lines: [] };
            }
            else {
                cur.lines.push(line);
            }
        });
        blocks.push(cur);
        return blocks;
    }
    function topLevelKeys(topBlock) {
        const keys = {};
        (topBlock ? topBlock.lines : []).forEach(function (line) {
            const km = line.match(/^\s*([A-Za-z0-9_.-]+)\s*=/);
            if (km)
                keys[km[1]] = true;
        });
        return keys;
    }
    const oldBlocks = parseBlocks(existing);
    const newBlocks = parseBlocks(incoming);
    const newTop = newBlocks.find(function (b) { return b.header === null; }) || { lines: [] };
    const incomingKeys = topLevelKeys(newTop);
    const incomingTables = {};
    newBlocks.forEach(function (b) {
        if (b.header !== null && b.tableName)
            incomingTables[b.tableName] = true;
    });
    const incomingHasProvider = Object.keys(incomingTables).some(function (t) {
        return t.indexOf("model_providers.") === 0;
    });
    const oldTop = oldBlocks.find(function (b) { return b.header === null; }) || { lines: [] };
    const mergedTopLines = [];
    oldTop.lines.forEach(function (line) {
        const km = line.match(/^\s*([A-Za-z0-9_.-]+)\s*=/);
        if (km && incomingKeys[km[1]])
            return;
        mergedTopLines.push(line);
    });
    while (mergedTopLines.length && mergedTopLines[mergedTopLines.length - 1].trim() === "")
        mergedTopLines.pop();
    newTop.lines.forEach(function (line) { mergedTopLines.push(line); });
    const outParts = [];
    const topText = mergedTopLines.join("\n").replace(/\n+$/, "");
    if (topText.trim())
        outParts.push(topText);
    oldBlocks.forEach(function (b) {
        if (b.header === null)
            return;
        if (incomingTables[b.tableName])
            return;
        if (incomingHasProvider && b.tableName && b.tableName.indexOf("model_providers.") === 0)
            return;
        outParts.push([b.header].concat(b.lines).join("\n").replace(/\n+$/, ""));
    });
    newBlocks.forEach(function (b) {
        if (b.header === null)
            return;
        outParts.push([b.header].concat(b.lines).join("\n").replace(/\n+$/, ""));
    });
    return outParts.join("\n\n") + "\n";
}
function readClaudeSettings() {
    try {
        const configDir = getAgentConfigPath("claude");
        const settingsPath = configDir ? path.join(configDir, "settings.json") : getClaudeSettingsPath();
        if (fs.existsSync(settingsPath)) {
            return JSON.parse(fs.readFileSync(settingsPath, "utf8"));
        }
        return {};
    }
    catch (e) {
        return {};
    }
}
function writeClaudeSettings(settings) {
    const configDir = getAgentConfigPath("claude");
    const settingsPath = configDir ? path.join(configDir, "settings.json") : getClaudeSettingsPath();
    ensureDir(settingsPath);
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf8");
    return true;
}
function readClaudeDesktopConfig() {
    try {
        var p = getClaudeDesktopConfigPath();
        if (fs.existsSync(p))
            return JSON.parse(fs.readFileSync(p, "utf8"));
    }
    catch (e) { }
    return {};
}
function writeClaudeDesktopConfig(config) {
    var p = getClaudeDesktopConfigPath();
    ensureDir(p);
    fs.writeFileSync(p, JSON.stringify(config, null, 2), "utf8");
    return true;
}
function switchProviderClaudeDesktop(provider) {
    if (!provider)
        return { success: false, error: "provider not found" };
    var proxyPort = 0;
    var proxyToken = "";
    try {
        var proxy = require("./proxy");
        var rt = proxy.getProxyStatus("claude-desktop");
        if (rt && rt.running) {
            proxyPort = rt.port || 8788;
            var groupId = rt.groupId;
            if (groupId) {
                var g = proxy.getRouteGroup("claude-desktop", groupId);
                if (g)
                    proxyToken = g.authToken || "";
            }
        }
        if (!proxyPort && proxy.proxyRuntime && proxy.proxyRuntime["claude-desktop"]) {
            var prt = proxy.proxyRuntime["claude-desktop"];
            if (prt.running) {
                proxyPort = prt.port || 8788;
                var gid = prt.groupId;
                if (gid) {
                    var pg = proxy.getRouteGroup("claude-desktop", gid);
                    if (pg)
                        proxyToken = pg.authToken || "";
                }
            }
        }
        if (proxyPort && !proxyToken) {
            var groups = proxy.listRouteGroups("claude-desktop");
            for (var i = 0; i < groups.length; i++) {
                var gg = proxy.getRouteGroup("claude-desktop", groups[i].id);
                if (gg && gg.authToken) {
                    proxyToken = gg.authToken;
                    break;
                }
            }
        }
    }
    catch (e) { }
    var baseUrl, apiKey;
    if (proxyPort && proxyToken) {
        baseUrl = "http://127.0.0.1:" + proxyPort;
        apiKey = proxyToken;
    }
    else {
        var envSrc = (provider.settingsConfig && provider.settingsConfig.env) || {};
        baseUrl = envSrc.ANTHROPIC_BASE_URL || provider.baseUrl || "";
        apiKey = provider.apiKey || envSrc.ANTHROPIC_AUTH_TOKEN || envSrc.ANTHROPIC_API_KEY || "";
        if (!baseUrl)
            return { success: false, error: "missing ANTHROPIC_BASE_URL" };
        if (!apiKey)
            return { success: false, error: "missing API key" };
    }
    _writeDeploymentMode(getClaudeDesktopConfigPath(), "3p");
    _writeDeploymentMode(getClaudeDesktop3pConfigPath(), "3p");
    var mainConfigPath = getClaudeDesktopConfigPath();
    var mainConfig = {};
    try {
        if (fs.existsSync(mainConfigPath))
            mainConfig = JSON.parse(fs.readFileSync(mainConfigPath, "utf8"));
    }
    catch (e) {
        mainConfig = {};
    }
    mainConfig.apiProviders = {
        "custom-provider": {
            "apiBase": baseUrl,
            "apiKey": apiKey
        }
    };
    try {
        fs.writeFileSync(mainConfigPath, JSON.stringify(mainConfig, null, 2), "utf8");
    }
    catch (e) { }
    var profile = {
        inferenceProvider: "gateway",
        inferenceGatewayBaseUrl: baseUrl,
        inferenceGatewayApiKey: apiKey,
        inferenceGatewayAuthScheme: "bearer",
        inferenceModels: [
            { name: "claude-sonnet-5", supports1m: true },
            { name: "claude-opus-4-8", supports1m: true },
            { name: "claude-haiku-4-5", supports1m: true }
        ],
        disableDeploymentModeChooser: true,
        coworkEgressAllowedHosts: ["*"]
    };
    var profilePath = getClaudeDesktopProfilePath();
    ensureDir(profilePath);
    fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2), "utf8");
    var PROFILE_ID = "00000000-0000-4000-8000-000000157210";
    var metaPath = getClaudeDesktopMetaPath();
    var meta = {};
    try {
        if (fs.existsSync(metaPath))
            meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    }
    catch (e) {
        meta = {};
    }
    var entries = (meta.entries || []).filter(function (e) { return e.id !== PROFILE_ID; });
    entries.push({ id: PROFILE_ID, name: "CC Toggle" });
    meta.entries = entries;
    meta.appliedId = PROFILE_ID;
    ensureDir(metaPath);
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf8");
    return { success: true, mode: proxyPort ? "proxy" : "direct", port: proxyPort };
}
function _writeDeploymentMode(configPath, mode) {
    var config = {};
    try {
        if (fs.existsSync(configPath))
            config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    }
    catch (e) {
        config = {};
    }
    if (typeof config !== "object" || config === null)
        config = {};
    config.deploymentMode = mode;
    ensureDir(configPath);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
}
function restoreOfficialClaudeDesktop() {
    var PROFILE_ID = "00000000-0000-4000-8000-000000157210";
    _writeDeploymentMode(getClaudeDesktopConfigPath(), "1p");
    _writeDeploymentMode(getClaudeDesktop3pConfigPath(), "1p");
    var profilePath = getClaudeDesktopProfilePath();
    try {
        if (fs.existsSync(profilePath))
            fs.unlinkSync(profilePath);
    }
    catch (e) { }
    var metaPath = getClaudeDesktopMetaPath();
    try {
        if (fs.existsSync(metaPath)) {
            var meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
            if (meta.appliedId === PROFILE_ID)
                delete meta.appliedId;
            meta.entries = (meta.entries || []).filter(function (e) { return e.id !== PROFILE_ID; });
            fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf8");
        }
    }
    catch (e) { }
    return true;
}
function readClaudeOnboarding() {
    try {
        var p = getClaudeJsonPath();
        if (fs.existsSync(p)) {
            var config = JSON.parse(fs.readFileSync(p, "utf8"));
            return !!config.hasCompletedOnboarding;
        }
    }
    catch (e) { }
    return false;
}
function setClaudeOnboarding(skip) {
    var p = getClaudeJsonPath();
    var config = {};
    try {
        if (fs.existsSync(p))
            config = JSON.parse(fs.readFileSync(p, "utf8"));
    }
    catch (e) {
        config = {};
    }
    if (skip) {
        config.hasCompletedOnboarding = true;
    }
    else {
        delete config.hasCompletedOnboarding;
    }
    ensureDir(p);
    fs.writeFileSync(p, JSON.stringify(config, null, 2), "utf8");
    return true;
}
function readGeminiEnv() {
    try {
        const configDir = getAgentConfigPath("gemini");
        const envPath = configDir ? path.join(configDir, ".env") : getGeminiEnvPath();
        if (fs.existsSync(envPath)) {
            return fs.readFileSync(envPath, "utf8");
        }
        return "";
    }
    catch (e) {
        return "";
    }
}
function writeGeminiEnv(envContent) {
    const configDir = getAgentConfigPath("gemini");
    const envPath = configDir ? path.join(configDir, ".env") : getGeminiEnvPath();
    ensureDir(envPath);
    fs.writeFileSync(envPath, envContent, "utf8");
    return true;
}
function readOpenClawConfig() {
    try {
        const configDir = getAgentConfigPath("openclaw");
        const p = configDir ? path.join(configDir, "openclaw.json") : getOpenClawConfigPath();
        if (fs.existsSync(p))
            return JSON.parse(fs.readFileSync(p, "utf8"));
    }
    catch (e) { }
    return { models: { mode: "merge", providers: {} } };
}
function writeOpenClawConfig(config) {
    const configDir = getAgentConfigPath("openclaw");
    const p = configDir ? path.join(configDir, "openclaw.json") : getOpenClawConfigPath();
    ensureDir(p);
    fs.writeFileSync(p, JSON.stringify(config, null, 2), "utf8");
    return true;
}
function getCurrentConfigs() {
    return {
        codex: readCodexConfig(),
        claude: readClaudeSettings(),
        openclaw: readOpenClawConfig(),
        gemini: readGeminiEnv()
    };
}
function switchProviderCodex(provider) {
    const auth = Object.assign({}, provider.authData || {});
    if (provider.apiKey) {
        if (Object.keys(auth).length === 0) {
            if (provider.configType === "gemini")
                auth.GEMINI_API_KEY = provider.apiKey;
            else
                auth.OPENAI_API_KEY = provider.apiKey;
        }
        else {
            const primary = auth.OPENAI_API_KEY !== undefined ? "OPENAI_API_KEY" : Object.keys(auth)[0];
            auth[primary] = provider.apiKey;
        }
    }
    const hasCatalog = Array.isArray(provider.modelCatalog) && provider.modelCatalog.length;
    const catalogFileName = "utoolscctoggle-model-catalog.json";
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
        if (hasCatalog)
            lines.push('model_catalog_json = "' + catalogFileName + '"');
        lines.push('', '[model_providers.' + cleanName + ']', 'name = "' + cleanName + '"', 'base_url = "' + baseUrl + '"', 'wire_api = "' + wireApi + '"', 'requires_openai_auth = ' + (/^https?:\/\/(127\.0\.0\.1|localhost)/.test(baseUrl) ? 'false' : 'true'));
        configToml = lines.join("\n");
    }
    if (hasCatalog) {
        try {
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
                    additional_speed_tiers: [],
                    availability_nux: null,
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
        }
        catch (e) { }
    }
    writeCodexConfig(auth, configToml);
    return true;
}
function switchProviderClaude(provider) {
    if (!provider)
        return { success: false, error: "provider not found" };
    let settings = {};
    if (provider.settingsConfig && Object.keys(provider.settingsConfig).length) {
        settings = JSON.parse(JSON.stringify(provider.settingsConfig));
    }
    settings.env = settings.env || {};
    if (provider.model)
        settings.env.ANTHROPIC_MODEL = provider.model;
    if (provider.apiKey) {
        const field = provider.authField || (settings.env.ANTHROPIC_API_KEY !== undefined ? "ANTHROPIC_API_KEY" : "ANTHROPIC_AUTH_TOKEN");
        settings.env[field] = provider.apiKey;
    }
    try {
        const extra = JSON.parse(provider.extraConfig);
        Object.assign(settings, extra);
    }
    catch (e) { }
    writeClaudeSettings(settings);
    return true;
}
function switchProviderGemini(provider) {
    const env = Object.assign({}, (provider.settingsConfig && provider.settingsConfig.env) || {});
    if (provider.baseUrl)
        env.GOOGLE_GEMINI_BASE_URL = provider.baseUrl;
    if (provider.model)
        env.GEMINI_MODEL = provider.model;
    if (provider.apiKey)
        env.GEMINI_API_KEY = provider.apiKey;
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
    const config = readOpenClawConfig();
    config.models = config.models || { mode: "merge", providers: {} };
    config.models.providers = config.models.providers || {};
    const key = _ocSlug(provider.name);
    const sc = provider.settingsConfig || {};
    const pc = {};
    if (provider.baseUrl || sc.baseUrl)
        pc.baseUrl = provider.baseUrl || sc.baseUrl;
    pc.apiKey = provider.apiKey || sc.apiKey || "";
    pc.api = provider.apiProtocol || sc.api || "openai-completions";
    if (Array.isArray(sc.models) && sc.models.length)
        pc.models = sc.models;
    if (sc.headers && Object.keys(sc.headers).length)
        pc.headers = sc.headers;
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
    }
    else {
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
    restoreOfficialClaudeDesktop: restoreOfficialClaudeDesktop,
};
