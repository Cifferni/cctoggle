import { ref } from "vue";
import { toast } from "./useToast.js";
import { PRESETS as BUILT_IN_PRESETS } from "../data/presets.js";
import { useRoutes } from "./useRoutes.js";
import { APP_TYPES, APP_LABELS, APP_ICONS, getSkillNest, toPlain } from "./shared.js";

const PRESETS = BUILT_IN_PRESETS;

const providers = ref([]);
const _activeTab = ref("codex");

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
  const r = getSkillNest().switchProvider(activeTab(), id);
  if (r.success) {
    loadProviders();
    toast.success("\u5DF2\u5207\u6362\u5230 " + r.providerName);
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
  getSkillNest().saveProvider(activeTab(), toPlain(presetToProviderData(preset)));
  loadProviders();
}

function getFullProvider(id) { return getSkillNest().getProvider(activeTab(), id); }

const paths = {
  get codexAuth() { return getSkillNest().paths?.codexAuth || ""; },
  get codexConfig() { return getSkillNest().paths?.codexConfig || ""; },
  get claudeSettings() { return getSkillNest().paths?.claudeSettings || ""; },
  get openclawConfig() { return getSkillNest().paths?.openclawConfig || ""; },
  get geminiEnv() { return getSkillNest().paths?.geminiEnv || ""; },
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