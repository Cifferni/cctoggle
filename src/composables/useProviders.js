import { ref } from "vue";
import { PRESETS as BUILT_IN_PRESETS } from "../data/presets.js";
import { useRoutes } from "./useRoutes.js";

const _ccs = () => window.skillNest || {
  listProviders: () => [],
  switchProvider: () => ({ success: false, error: "not in uTools" }),
  saveProvider: () => "",
  deleteProvider: () => {},
  getProvider: () => null,
  paths: {},
};
const _ut = () => window.utools || { showNotification: () => {} };

const APP_TYPES = ["codex", "claude", "openclaw", "gemini"];
const APP_LABELS = { codex: "Codex", claude: "Claude", openclaw: "OpenClaw", gemini: "Gemini" };
const APP_ICONS = { codex: "\u26A1", claude: "\u{1F9E0}", openclaw: "\u{1F43E}", gemini: "\u{1F48E}" };

const PRESETS = BUILT_IN_PRESETS;

const providers = ref([]);
const _activeTab = ref("codex");

function activeTab() { return _activeTab.value; }

// 停止当前正在运行的代理
function stopCurrentProxy() {
  const ccs = _ccs();
  if (!ccs.getProxyStatus || !ccs.stopProxy || !ccs.restoreApp) return;
  
  // 遍历所有 appType，找到正在运行的代理并停止
  for (const appType of APP_TYPES) {
    const status = ccs.getProxyStatus(appType);
    if (status && status.running) {
      ccs.stopProxy(appType);
      ccs.restoreApp(appType);
    }
  }
  
  // 刷新前端状态
  try {
    const { refreshStatus } = useRoutes();
    APP_TYPES.forEach(appType => refreshStatus(appType));
  } catch (e) {
    // 忽略错误
  }
}

function setActiveTab(t) {
  if (t !== _activeTab.value) {
    // 切换 tab 时，停止当前正在运行的代理
    stopCurrentProxy();
    _activeTab.value = t;
    loadProviders();
  }
}

function loadProviders() {
  const tab = activeTab();
  if (APP_TYPES.includes(tab)) {
    providers.value = _ccs().listProviders(tab);
  }
}

function switchProvider(id) {
  const r = _ccs().switchProvider(activeTab(), id);
  if (r.success) {
    loadProviders();
    _ut().showNotification("宸插垏鎹㈠埌 " + r.providerName);
  }
  return r;
}

// 把 Vue reactive/ref 及嵌套对象递归转成纯对象，
// 避免把 reactive 代理传给 uTools IPC 导致 "An object could not be cloned"
function toPlain(v) {
  if (v == null) return v;
  if (Array.isArray(v)) return v.map(toPlain);
  if (typeof v === "object") {
    const o = {};
    for (const k of Object.keys(v)) o[k] = toPlain(v[k]);
    return o;
  }
  return v;
}

function saveProvider(data) {
  _ccs().saveProvider(activeTab(), toPlain(data));
  loadProviders();
}

function deleteProvider(id) {
  _ccs().deleteProvider(activeTab(), id);
  loadProviders();
}

// 把内嵌模板转成「新增供应商」的初始表单数据
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
    configType: preset.configType || (tab === "claude" ? "anthropic" : tab === "gemini" ? "gemini" : tab === "openclaw" ? "openclaw" : "openai"),
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
  _ccs().saveProvider(activeTab(), toPlain(presetToProviderData(preset)));
  loadProviders();
}

function getFullProvider(id) { return _ccs().getProvider(activeTab(), id); }

const paths = {
  get codexAuth() { return _ccs().paths?.codexAuth || ""; },
  get codexConfig() { return _ccs().paths?.codexConfig || ""; },
  get claudeSettings() { return _ccs().paths?.claudeSettings || ""; },
  get openclawConfig() { return _ccs().paths?.openclawConfig || ""; },
  get geminiEnv() { return _ccs().paths?.geminiEnv || ""; },
};

export function useProviders() {
  return {
    APP_TYPES, APP_LABELS, APP_ICONS, PRESETS,
    activeTab, setActiveTab, providers, paths,
    loadProviders, switchProvider,
    saveProvider, deleteProvider, importPreset, getFullProvider,
    presetToProviderData,
  };
}
