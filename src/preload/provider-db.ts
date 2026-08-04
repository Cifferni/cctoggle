// @ts-nocheck TODO: 逐步添加类型注解后移除
// uTools ccToggle - provider-db.ts
// 供应商 CRUD、切换、导入导出

import * as utils from './utils';
import * as configRw from './config-rw';

const DB_PREFIX = "cctoggle_provider_";

export class ProviderStore {
  static getProviderKey(appType: string, providerId: string): string {
    return DB_PREFIX + appType + "_" + providerId;
  }

  static listProviders(appType: string): any[] {
    try {
      const docs = utools.db.allDocs(DB_PREFIX + appType + "_") || [];
      return docs.map(function (doc) {
        const provider = { id: doc._id.replace(DB_PREFIX + appType + "_", ""), name: doc.name, baseUrl: doc.baseUrl, model: doc.model, models: doc.models || [], websiteUrl: doc.websiteUrl, remark: doc.remark || "", icon: doc.icon, iconColor: doc.iconColor, category: doc.category, configType: doc.configType, isCurrent: doc.isCurrent, sortOrder: doc.sortOrder, createdAt: doc.createdAt, apiFormat: doc.apiFormat || "", wireApi: doc.wireApi || "" };
        return provider;
      });
    } catch (e) {
      return [];
    }
  }

  static getProvider(appType: string, providerId: string): any {
    try {
      const doc = utools.db.get(ProviderStore.getProviderKey(appType, providerId));
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

  static saveProvider(appType: string, providerData: any): string {
    const id = providerData.id || utils.generateId();
    const key = ProviderStore.getProviderKey(appType, id);

    const apiKey = providerData.apiKey || "";
    delete providerData.apiKey;
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

    if (apiKey) {
      utools.dbCryptoStorage.setItem("apikey_" + appType + "_" + id, apiKey);
    }

    return id;
  }

  static deleteProvider(appType: string, providerId: string): boolean {
    utools.db.remove(ProviderStore.getProviderKey(appType, providerId));
    utools.dbCryptoStorage.removeItem("apikey_" + appType + "_" + providerId);
    try {
      var proxy = require("./proxy");
      var groups = proxy.ProxyManager.listRouteGroups(appType);
      groups.forEach(function (g) {
        var before = (g.members || []).length;
        g.members = (g.members || []).filter(function (m) { return m.providerId !== providerId; });
        if (g.members.length !== before) {
          g.appType = appType;
          if (g.members.length === 0) {
            proxy.ProxyManager.deleteRouteGroup(appType, g.id);
            if (proxy.ProxyManager.proxyRuntime._active === appType) {
              proxy.ProxyManager.stopProxy(appType);
              proxy.ProxyManager.restoreApp(appType);
            }
          } else {
            proxy.ProxyManager.saveRouteGroup(g);
          }
        }
      });
    } catch (e) {}
    return true;
  }

  static switchProvider(appType: string, providerId: string): any {
    const provider = ProviderStore.getProvider(appType, providerId);
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
      } else if (appType === "claude-desktop") {
        configRw.switchProviderClaudeDesktop(provider);
      } else {
        return { success: false, error: "unknown app type" };
      }
      ProviderStore.markCurrent(appType, providerId);
      return { success: true, providerName: provider.name };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  static markCurrent(appType: string, providerId: string): void {
    const all = ProviderStore.listProviders(appType);
    all.forEach(function (p) {
      const key = ProviderStore.getProviderKey(appType, p.id);
      const doc = utools.db.get(key);
      if (doc) {
        doc.isCurrent = (p.id === providerId);
        utools.db.put(doc);
      }
    });
  }

  static getCurrentProviderId(appType: string): string | null {
    const all = ProviderStore.listProviders(appType);
    const current = all.find(function (p) { return p.isCurrent; });
    return current ? current.id : null;
  }

  static setLastActiveApp(appType: string): boolean {
    try { utools.dbStorage.setItem("cctoggle_last_active_app", appType); } catch (e) {}
    return true;
  }

  static getLastActiveApp(): string {
    try { return utools.dbStorage.getItem("cctoggle_last_active_app") || ""; } catch (e) { return ""; }
  }

  static reapplyCurrent(onlyAppType?: string): any {
    const result = {};
    const apps = onlyAppType ? [onlyAppType] : ["codex", "claude", "gemini", "openclaw"];
    apps.forEach(function (appType) {
      try {
        var proxy = require("./proxy");
        const rt = proxy.ProxyManager.proxyRuntime[appType];
        if (rt && rt.running) { result[appType] = { skipped: "proxy running" }; return; }
        const id = ProviderStore.getCurrentProviderId(appType);
        if (!id) { result[appType] = { skipped: "no current" }; return; }
        const r = ProviderStore.switchProvider(appType, id);
        result[appType] = r;
      } catch (e) { result[appType] = { success: false, error: e.message }; }
    });
    return result;
  }

  static exportAllProviders(): any {
    const result = { codex: [], claude: [], gemini: [], exportTime: new Date().toISOString() };
    ["codex", "claude", "gemini"].forEach(function (appType) {
      const providers = ProviderStore.listProviders(appType);
      providers.forEach(function (p) {
        const full = ProviderStore.getProvider(appType, p.id);
        result[appType].push(full);
      });
    });
    return result;
  }

  static importProviders(data: any): number {
    let count = 0;
    ["codex", "claude", "gemini"].forEach(function (appType) {
      (data[appType] || []).forEach(function (p) {
        p.appType = appType;
        ProviderStore.saveProvider(appType, p);
        count++;
      });
    });
    return count;
  }
}
