import { ref } from "vue";
import { toast } from "./useToast.js";
import { PRESETS as BUILT_IN_PRESETS } from "../data/presets.js";
import { useRoutes } from "./useRoutes.js";
import { APP_TYPES, APP_LABELS, APP_ICONS, getSkillNest, toPlain } from "./shared.js";

const PRESETS = BUILT_IN_PRESETS;

const providers = ref([]);
function _initActiveTab() {
  try {
    const last = window.utoolsCctoggle?.getLastActiveApp?.();
    if (last && APP_TYPES.includes(last)) return last;
  } catch (e) {}
  return "codex";
}
const _activeTab = ref(_initActiveTab());

function activeTab() { return _activeTab.value; }

function stopCurrentProxy() {
  const ccs = getSkillNest();
  if (!ccs.getProxyStatus || !ccs.stopProxy || !ccs.restoreApp) return;

  for (const appType of APP_TYPES) {
    const status = ccs.getProxyStatus(appType);
    if (status && status.running) {
      ccs.stopProxy(appType);
      ccs.restoreApp(appType);
    }
  }

  try {
    const { refreshStatus } = useRoutes();
    APP_TYPES.forEach(appType => refreshStatus(appType));
  } catch (e) {}
}

function setActiveTab(t) {
  if (t !== _activeTab.value) {
    stopCurrentProxy();
    _activeTab.value = t;
    try { window.utoolsCctoggle?.setLastActiveApp?.(t); } catch (e) {}
    loadProviders();
  }
}

function loadProviders() {
  const tab = activeTab();
  if (APP_TYPES.includes(tab)) {
    providers.value = getSkillNest().listProviders(tab);
  }
}

function switchProvider(id) {
  const tab = activeTab();
  const target = providers.value.find(pv => pv.id === id);
  const r = getSkillNest().switchProvider(tab, id);
  if (r.success) {
    try { getSkillNest().setLastActiveApp?.(tab); } catch (e) {}
    loadProviders();
    toast.success("\u5DF2\u5207\u6362\u5230 " + r.providerName);
    // Codex direct connect: anthropic must use proxy; openai_chat can direct-connect but proxy recommended
    const fmt = target && target.apiFormat;
    if (tab === "codex" && (fmt === "openai_chat" || fmt === "anthropic")) {
      let proxyRunning = false;
      try { proxyRunning = !!useRoutes().runtime[tab]?.running; } catch (e) {}
      if (!proxyRunning) {
        const msg = fmt === "anthropic" ? "该供应商为 Anthropic 协议，Codex 无法直连，请开启代理后使用" : "该供应商为 Chat 协议，直连需将连接协议选为 Chat，或开启代理获得自动转换";
        toast.warn(msg, { duration: 5000 });
      }
    }
  }
  return r;
}

function saveProvider(data) {
  getSkillNest().saveProvider(activeTab(), toPlain(data));
  loadProviders();
}

function deleteProvider(id) {
  getSkillNest().deleteProvider(activeTab(), id);
  loadProviders();
  try {
    const { refreshStatus } = useRoutes();
    APP_TYPES.forEach(appType => refreshStatus(appType));
  } catch (e) {}
}

function presetToProviderData(preset) {
  const tab = activeTab();
  const base = {
    name: preset.name,
    baseUrl: preset.baseUrl || "",
    apiKey: "",
    model: preset.model || "",
    models: preset.models || [],
    websiteUrl: preset.websiteUrl || "",
    apiKeyUrl: preset.apiKeyUrl || "",
    icon: preset.icon || "",
    iconColor: preset.iconColor || "",
    category: preset.category || "custom",
    configType: preset.configType || (tab === "claude" || tab === "claude-desktop" ? "anthropic" : tab === "gemini" ? "gemini" : tab === "openclaw" ? "openclaw" : "openai"),
    endpointCandidates: preset.endpointCandidates || [],
  };
  if (tab === "codex") {
    return Object.assign(base, {
      reasoningEffort: preset.reasoningEffort || "high",
      wireApi: preset.wireApi || "responses",
      apiFormat: preset.apiFormat || "",
      modelCatalog: preset.modelCatalog || [],
      authData: preset.authData || { OPENAI_API_KEY: "" },
      extraConfig: preset.config || "",
    });
  } else if (tab === "claude") {
    return Object.assign(base, { settingsConfig: preset.settingsConfig || { env: {} } });
  } else if (tab === "claude-desktop") {
    return Object.assign(base, { settingsConfig: preset.settingsConfig || { env: {} } });
  } else if (tab === "openclaw") {
    return Object.assign(base, {
      apiProtocol: preset.apiProtocol || "openai-completions",
      settingsConfig: preset.settingsConfig || {},
      suggestedDefaults: preset.suggestedDefaults || null,
    });
  }
  return Object.assign(base, { settingsConfig: preset.settingsConfig || { env: {} } });
}

function importPreset(preset) {
  getSkillNest().saveProvider(activeTab(), toPlain(presetToProviderData(preset)));
  loadProviders();
}

function getFullProvider(id) { return getSkillNest().getProvider(activeTab(), id); }

const paths = {
  get codexAuth() { return getSkillNest().paths?.codexAuth || ""; },
  get codexConfig() { return getSkillNest().paths?.codexConfig || ""; },
  get claudeSettings() { return getSkillNest().paths?.claudeSettings || ""; },
  get claudeDesktopConfig() { return getSkillNest().paths?.claudeDesktopConfig || ""; },
  get openclawConfig() { return getSkillNest().paths?.openclawConfig || ""; },
  get geminiEnv() { return getSkillNest().paths?.geminiEnv || ""; },
};

// 供 onPluginEnter 调用：插件每次进入时刷新当前列表，
// 让 isCurrent 依据最新真实配置重算（覆盖用户在 cc-switch 等外部工具切换后再进入的场景）
export function refreshOnEnter() {
  try {
    // 按方案 B：进入插件时，将已激活的供应商重新应用一次，
    // 把真实配置文件强制写回本软件的完整版本（修复外部工具可能写不完整的配置）
    getSkillNest().reapplyCurrent?.(activeTab());
    loadProviders();
    const { refreshStatus } = useRoutes();
    APP_TYPES.forEach(function (appType) { refreshStatus(appType); });
  } catch (e) {}
}

export function useProviders() {
  return {
    APP_TYPES, APP_LABELS, APP_ICONS, PRESETS,
    activeTab, setActiveTab, providers, paths,
    loadProviders, switchProvider,
    saveProvider, deleteProvider, importPreset, getFullProvider,
    presetToProviderData,
  };
}