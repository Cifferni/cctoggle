// uTools ccToggle - provider-db.js
// 供应商 CRUD、切换、导入导出

var utils = require("./utils");
var configRw = require("./config-rw");
var DB_PREFIX = "cctoggle_provider_";

function getProviderKey(appType, providerId) {
  return DB_PREFIX + appType + "_" + providerId;
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
  const id = providerData.id || utils.generateId();
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
    // 懒加载 proxy 模块，打破循环依赖
    var proxy = require("./proxy");
    var groups = proxy.listRouteGroups(appType);
    groups.forEach(function (g) {
      var before = (g.members || []).length;
      g.members = (g.members || []).filter(function (m) { return m.providerId !== providerId; });
      if (g.members.length !== before) {
        g.appType = appType;
        if (g.members.length === 0) {
          proxy.deleteRouteGroup(appType, g.id);
          // 路由组清空 + 代理正在运行 → 自动停掉代理
          if (proxy.proxyRuntime._active === appType) {
            proxy.stopProxy(appType);
            proxy.restoreApp(appType);
          }
        } else {
          proxy.saveRouteGroup(g);
        }
      }
    });
  } catch (e) {}
  return true;
}

function switchProvider(appType, providerId) {
  const provider = getProvider(appType, providerId);
  if (!provider) {
    return { success: false, error: "provider not found" };
  }

  try {
    if (appType === "codex") {
      configRw.switchProviderCodex(provider);
    } else if (appType === "claude") {
      configRw.switchProviderClaude(provider);
    } else if (appType === "openclaw") {
      configRw.switchProviderOpenclaw(provider);
    } else if (appType === "gemini") {
      configRw.switchProviderGemini(provider);
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
      var proxy = require("./proxy");
      const rt = proxy.proxyRuntime[appType];
      if (rt && rt.running) { result[appType] = { skipped: "proxy running" }; return; }
      const id = getCurrentProviderId(appType);
      if (!id) { result[appType] = { skipped: "no current" }; return; }
      const r = switchProvider(appType, id);
      result[appType] = r;
    } catch (e) { result[appType] = { success: false, error: e.message }; }
  });
  return result;
}

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

module.exports = {
  getProviderKey: getProviderKey,
  listProviders: listProviders,
  getProvider: getProvider,
  saveProvider: saveProvider,
  deleteProvider: deleteProvider,
  switchProvider: switchProvider,
  markCurrent: markCurrent,
  getCurrentProviderId: getCurrentProviderId,
  setLastActiveApp: setLastActiveApp,
  getLastActiveApp: getLastActiveApp,
  reapplyCurrent: reapplyCurrent,
  exportAllProviders: exportAllProviders,
  importProviders: importProviders,
};
