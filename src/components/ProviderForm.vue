<script setup>
import { reactive, watch, ref, computed } from "vue";
const props = defineProps({ visible: Boolean, initialData: Object });
const emit = defineEmits(["close", "save"]);

import { useProviders } from "../composables/useProviders.js";
const { PRESETS, activeTab, presetToProviderData } = useProviders();
const tab = computed(() => activeTab());

const presetSearch = ref("");
const showPresetDropdown = ref(false);
const showApiKey = ref(false);
const filteredPresets = computed(() => {
  const q = presetSearch.value.toLowerCase();
  const all = PRESETS[activeTab()] || [];
  if (!q) return all;
  return all.filter(p => p.name.toLowerCase().includes(q));
});

// 图标预设（简圆点色板）
const ICON_PRESETS = [
  { icon: "openai", color: "#00A67E" }, { icon: "anthropic", color: "#D97757" },
  { icon: "google", color: "#4285F4" }, { icon: "kimi", color: "#6366F1" },
  { icon: "deepseek", color: "#4D6BFE" }, { icon: "glm", color: "#22D3EE" },
  { icon: "qwen", color: "#615CED" }, { icon: "grok", color: "#000000" },
  { icon: "packycode", color: "#F97316" }, { icon: "custom", color: "#64748B" },
];
const CATEGORIES = [
  { v: "official", l: "官方" }, { v: "cn_official", l: "国内官方" },
  { v: "partner", l: "合作" }, { v: "prime", l: "Prime" },
  { v: "third_party", l: "第三方" }, { v: "custom", l: "自定义" },
];

const form = reactive({
  name: "", baseUrl: "https://api.openai.com/v1", apiKey: "", model: "gpt-5.4",
  models: "", websiteUrl: "", remark: "", configType: "openai",
  apiKeyHeader: "Authorization", apiKeyPrefix: "Bearer ",
  reasoningEffort: "high", maxTokens: "", temperature: "", extraHeaders: "", extraConfig: "",
  wireApi: "responses", apiFormat: "", apiKeyUrl: "", category: "custom",
  icon: "", iconColor: "",
// Claude 专属
  authField: "ANTHROPIC_AUTH_TOKEN",
  sonnetModel: "", opusModel: "", haikuModel: "", fableModel: "", subagentModel: "",
  supports1M: false,
  authMethod: "api_key",
// Codex 路由转换
  maxOutputTokens: "", customUserAgent: "", headersOverride: "", bodyOverride: "",
  impersonateClaudeCode: false,
// OpenClaw 专属
  apiProtocol: "openai-completions",
  verbosity: "low",
  reasoningSummary: "none",
  webSearch: true,
});
// modelCatalog 行编辑器（Codex）
const catalogRows = ref([]); // { model, displayName, contextWindow }
const openclawRows = ref([]); // { id, name, contextWindow }
function addOpenclawRow() { openclawRows.value.push({ id: "", name: "", contextWindow: "" }); }
function removeOpenclawRow(i) { openclawRows.value.splice(i, 1); }
function promoteOpenclawRow(i) { if (i <= 0) return; const rows = openclawRows.value; const [r] = rows.splice(i, 1); rows.unshift(r); }
// 非表单直显字段：完整保留预设的差异化配置
const hidden = reactive({ settingsConfig: {}, authData: {}, endpointCandidates: [] });

const ONE_M = "[1M]";
function stripOneM(s) { return typeof s === "string" && s.endsWith(ONE_M) ? s.slice(0, -ONE_M.length).trimEnd() : s || ""; }
function applyOneM(s, on) { const base = stripOneM(s || ""); return on && base ? base + ONE_M : base; }

watch(() => props.visible, v => {
  if (!v) return;
  const d = props.initialData;
  const env = d?.settingsConfig?.env || {};
  const claudeModel = d?.model || env.ANTHROPIC_MODEL || "";
  Object.assign(form, {
    name: d?.name || "", baseUrl: d?.baseUrl || "https://api.openai.com/v1",
    apiKey: d?.apiKey || "", model: stripOneM(claudeModel) || "gpt-5.4",
    models: (d?.models || []).join(", "), websiteUrl: d?.websiteUrl || "", remark: d?.remark || "",
    configType: d?.configType || "openai",
    apiKeyHeader: d?.apiKeyHeader || "Authorization", apiKeyPrefix: d?.apiKeyPrefix || "Bearer ",
    reasoningEffort: d?.reasoningEffort || "high", maxTokens: d?.maxTokens || "",
    temperature: d?.temperature || "", extraHeaders: d?.extraHeaders || "", extraConfig: d?.extraConfig || "",
    wireApi: d?.wireApi || "responses", apiFormat: d?.apiFormat || "", apiKeyUrl: d?.apiKeyUrl || "",
    category: d?.category || "custom", icon: d?.icon || "", iconColor: d?.iconColor || "",
    maxOutputTokens: d?.maxOutputTokens || "", customUserAgent: d?.customUserAgent || "",
    headersOverride: d?.headersOverride || "", bodyOverride: d?.bodyOverride || "",
    authField: d?.authField || (env.ANTHROPIC_API_KEY !== undefined ? "ANTHROPIC_API_KEY" : "ANTHROPIC_AUTH_TOKEN"),
    sonnetModel: stripOneM(env.ANTHROPIC_DEFAULT_SONNET_MODEL || ""),
    opusModel: stripOneM(env.ANTHROPIC_DEFAULT_OPUS_MODEL || ""),
    haikuModel: env.ANTHROPIC_DEFAULT_HAIKU_MODEL || "",
    fableModel: stripOneM(env.ANTHROPIC_DEFAULT_FABLE_MODEL || ""),
    subagentModel: stripOneM(env.CLAUDE_CODE_SUBAGENT_MODEL || ""),
    supports1M: typeof claudeModel === "string" && claudeModel.endsWith(ONE_M),
    authMethod: d?.authMethod || "api_key",
    impersonateClaudeCode: !!d?.impersonateClaudeCode,
    apiProtocol: d?.apiProtocol || d?.settingsConfig?.api || "openai-completions",
    verbosity: d?.verbosity || "low",
    reasoningSummary: d?.reasoningSummary || "none",
    webSearch: d?.webSearch !== false,
  });
  openclawRows.value = ((d?.settingsConfig?.models) || []).map(function (m) {
    return { id: m.id || "", name: m.name || "", contextWindow: m.contextWindow || "" };
  });
  catalogRows.value = (d?.modelCatalog || []).map(m => ({
    model: m.model || "", displayName: m.displayName || "",
    contextWindow: m.contextWindow || "",
  }));
  // 编辑已有供应商视为已确定协议，不自动覆盖；新建则允许按 base_url 自动推荐
  wireApiTouched.value = !!(d && d.wireApi);
  Object.assign(hidden, {
    settingsConfig: d?.settingsConfig || {}, authData: d?.authData || {},
    endpointCandidates: d?.endpointCandidates || [],
  });
  try { window.utools?.setExpendHeight(600); } catch {}
});

function addCatalogRow() { catalogRows.value.push({ model: "", displayName: "", contextWindow: "" }); }
function removeCatalogRow(i) { catalogRows.value.splice(i, 1); }
function pickIcon(p) { form.icon = p.icon; form.iconColor = p.color; }

// 只支持 Chat Completions 的常见供应商域名 / 模型关键词，用于自动推荐 wire_api
const CHAT_ONLY_HINTS = [
  "ark.cn-", "volces.com", "volcengine",      // 火山方舟 / 豆包
  "deepseek.com",                              // DeepSeek
  "dashscope",                                 // 阿里通义千问
  "moonshot.cn",                               // Kimi / Moonshot
  "bigmodel.cn", "open.bigmodel",              // 智谱 GLM
  "siliconflow",                               // 硅基流动
  "hunyuan",                                   // 腾讯混元
];
function guessWireApi(baseUrl, model) {
  const s = ((baseUrl || "") + " " + (model || "")).toLowerCase();
  return CHAT_ONLY_HINTS.some(function (h) { return s.indexOf(h) !== -1; }) ? "chat" : "responses";
}
// 记录用户是否手动改过协议
const wireApiTouched = ref(false);
watch(() => form.wireApi, () => { if (props.visible) wireApiTouched.value = true; });
watch([() => form.baseUrl, () => form.model], () => {
  if (tab.value !== "codex") return;
  if (wireApiTouched.value) return;
  form.wireApi = guessWireApi(form.baseUrl, form.model);
});

    // 表单内实时提示：根据上游格式给出直连/代理结论，与卡片徽章呼应
const codexProxyHint = computed(() => {
  if (tab.value !== "codex") return null;
  var af = form.apiFormat || "";
  if (af === "anthropic") {
    return { level: "required", text: "该供应商为 Anthropic 协议，Codex 无法直连，必须开启代理路由接管才能使用。" };
  }
  if (af === "openai_chat") {
    return { level: "optional", text: "该供应商仅支持 Chat Completions。可直连(连接协议选 Chat)，或走代理接管获得協議轉換與多供應商切換。" };
  }
  if (af === "openai_responses" || form.wireApi === "responses") {
    return { level: "ok", text: "该供应商原生支持 Responses，直连即可，无需代理。" };
  }
  return null;
});

function save() {
  const t = activeTab();
  const modelCatalog = catalogRows.value
    .filter(r => r.model)
    .map(r => ({
      model: r.model,
      displayName: r.displayName || r.model,
      contextWindow: r.contextWindow ? Number(r.contextWindow) || r.contextWindow : "",
    }));
  const payload = {
    ...form,
    ...hidden,
    modelCatalog,
    models: form.models.split(",").map(s => s.trim()).filter(Boolean),
  };
  if (t === "claude") {
    const env = { ...(hidden.settingsConfig?.env || {}) };
    const mainModel = applyOneM(form.model, form.supports1M);
    if (form.baseUrl) env.ANTHROPIC_BASE_URL = form.baseUrl;
    if (mainModel) env.ANTHROPIC_MODEL = mainModel;
    if (form.sonnetModel) env.ANTHROPIC_DEFAULT_SONNET_MODEL = applyOneM(form.sonnetModel, form.supports1M);
    if (form.opusModel)   env.ANTHROPIC_DEFAULT_OPUS_MODEL   = applyOneM(form.opusModel,   form.supports1M);
if (form.haikuModel)  env.ANTHROPIC_DEFAULT_HAIKU_MODEL  = form.haikuModel; // H
    if (form.fableModel)  env.ANTHROPIC_DEFAULT_FABLE_MODEL  = applyOneM(form.fableModel, form.supports1M);
    if (form.subagentModel) env.CLAUDE_CODE_SUBAGENT_MODEL   = applyOneM(form.subagentModel, form.supports1M);
    payload.model = mainModel;
    payload.settingsConfig = { ...(hidden.settingsConfig || {}), env };
  } else if (t === "openclaw") {
    const models = openclawRows.value
      .map(function (r) {
        const m = { id: (r.id || "").trim() };
        if (r.name && String(r.name).trim()) m.name = String(r.name).trim();
        if (r.contextWindow) { const n = Number(r.contextWindow); if (n) m.contextWindow = n; }
        return m;
      })
      .filter(function (m) { return m.id; });
    payload.settingsConfig = Object.assign({}, hidden.settingsConfig || {}, {
      baseUrl: form.baseUrl || "",
      apiKey: form.apiKey || "",
      api: form.apiProtocol || "openai-completions",
      models,
    });
    payload.apiProtocol = form.apiProtocol || "openai-completions";
    payload.model = models[0] ? models[0].id : "";
    if (models.length) {
      payload.suggestedDefaults = {
        model: {
          primary: models[0].id,
          fallbacks: models.slice(1).map(function (m) { return m.id; }),
        },
      };
    }
  } else if (t === "gemini") {
    const env = { ...(hidden.settingsConfig?.env || {}) };
    if (form.baseUrl) env.GOOGLE_GEMINI_BASE_URL = form.baseUrl;
    if (form.model) env.GEMINI_MODEL = form.model;
    payload.settingsConfig = { ...(hidden.settingsConfig || {}), env };
  }
  emit("save", payload);
}

function openOAuthUrl(url) {
  try { window.utools?.shellOpenExternal?.(url); } catch (e) { window.open(url, "_blank"); }
}

function fillPreset(preset) {
  const d = presetToProviderData ? presetToProviderData(preset) : preset;
  const env = d.settingsConfig?.env || {};
  const claudeModel = d.model || env.ANTHROPIC_MODEL || "";
  Object.assign(form, {
    name: d.name || preset.name,
    baseUrl: d.baseUrl || preset.baseUrl || "",
    model: stripOneM(claudeModel) || preset.model || "",
    configType: d.configType || preset.configType || "openai",
    wireApi: d.wireApi || "responses",
    apiFormat: d.apiFormat || "",
    apiKeyUrl: d.apiKeyUrl || "",
    category: d.category || "custom",
    icon: d.icon || "",
    iconColor: d.iconColor || "",
    websiteUrl: d.websiteUrl || preset.websiteUrl || "",
    reasoningEffort: d.reasoningEffort || "high",
    extraConfig: d.extraConfig || "",
    models: (d.models || []).join(", "),
    sonnetModel: stripOneM(env.ANTHROPIC_DEFAULT_SONNET_MODEL || ""),
    opusModel: stripOneM(env.ANTHROPIC_DEFAULT_OPUS_MODEL || ""),
    haikuModel: env.ANTHROPIC_DEFAULT_HAIKU_MODEL || "",
    fableModel: stripOneM(env.ANTHROPIC_DEFAULT_FABLE_MODEL || ""),
    subagentModel: stripOneM(env.CLAUDE_CODE_SUBAGENT_MODEL || ""),
    supports1M: typeof claudeModel === "string" && claudeModel.endsWith(ONE_M),
    authField: env.ANTHROPIC_API_KEY !== undefined ? "ANTHROPIC_API_KEY" : "ANTHROPIC_AUTH_TOKEN",
    maxOutputTokens: d.maxOutputTokens || "",
    authMethod: preset.authMethod || "api_key",
    impersonateClaudeCode: !!preset.impersonateClaudeCode,
    apiProtocol: d.apiProtocol || d.settingsConfig?.api || "openai-completions",
    verbosity: d.verbosity || "low",
    reasoningSummary: d.reasoningSummary || "none",
    webSearch: d.webSearch !== false,
  });
  openclawRows.value = ((d.settingsConfig?.models) || []).map(function (m) {
    return { id: m.id || "", name: m.name || "", contextWindow: m.contextWindow || "" };
  });
  catalogRows.value = (d.modelCatalog || []).map(m => ({
    model: m.model || "", displayName: m.displayName || "",
    contextWindow: m.contextWindow || "",
  }));
  Object.assign(hidden, {
    settingsConfig: d.settingsConfig || {},
    authData: d.authData || {},
    endpointCandidates: d.endpointCandidates || [],
  });
}

const overlayPressed = ref(false);
function overlayMouseDown() { overlayPressed.value = true; }
function onOverlayClick() {
// 仅当鼠标在蒙层上按下并抬起时才关闭，避免拖拽选中文字时误关  if (overlayPressed.value) close
  overlayPressed.value = false;
}
function close() {
  try { window.utools?.setExpendHeight(544); } catch {}
  emit("close");
}
</script>

<template>
  <div v-if="visible" class="overlay" @mousedown.self="overlayMouseDown" @click.self="onOverlayClick">
    <div class="panel">
      <div class="panel-header">
        <h2>{{ initialData ? '编辑供应商' : '添加供应商' }}</h2>
        <button class="close-btn" @click="close">&times;</button>
      </div>

      <div class="panel-body">
        <div v-if="!initialData" class="preset-search">
          <label class="field-label-sm">从预设导入</label>
        <div class="search-wrap">
          <input v-model="presetSearch" placeholder="搜索供应商预设.." 
            class="search-input"
            @focus="showPresetDropdown = true"
            @blur="showPresetDropdown = false">
          <div v-if="showPresetDropdown && filteredPresets.length" class="search-dropdown">
            <button v-for="p in filteredPresets" :key="p.name"
              class="search-item"
              @mousedown.prevent="fillPreset(p); presetSearch = ''; showPresetDropdown = false">
              <span class="search-item-name">{{ p.name }}</span>
              <span class="search-item-model">{{ p.model }}</span>
            </button>
          </div>
          <div v-if="showPresetDropdown && presetSearch && !filteredPresets.length" class="search-empty">
无匹配预设          </div>
        </div>
      </div>
        <fieldset><legend>基本信息</legend>
          <div class="row-2">
            <div class="field"><label>名称</label><input v-model="form.name" placeholder="如 NewAPI"></div>
            <div class="field"><label>官网</label><input v-model="form.websiteUrl" placeholder="https://..."></div>
          </div>
          <div class="field" style="margin-top:10px"><label>备注</label><input v-model="form.remark" :placeholder="'选填，例如：个人账号 / 充值到期 / 限速说明'"></div>
          <div class="row-2" style="margin-top:10px">
<div class="field"><label>分类</label>
              <select v-model="form.category">
                <option v-for="c in CATEGORIES" :key="c.v" :value="c.v">{{ c.l }}</option>
              </select>
            </div>
            <div class="field"><label>图标</label>
              <div class="icon-picker">
                <button v-for="p in ICON_PRESETS" :key="p.icon" type="button"
                  class="icon-dot" :class="{ 'icon-dot--on': form.icon === p.icon }"
                  :style="{ background: p.color }" :title="p.icon"
                  @click="pickIcon(p)"></button>
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset><legend>连接配置</legend>
<div class="field"><label>API 类型</label>
            <select v-model="form.configType">
<option value="openai">OpenAI 兼容</option>
              <option value="anthropic">Anthropic 原生</option>
              <option value="gemini">Gemini 原生</option>
              <option value="openclaw">OpenClaw</option>
            </select>
          </div>
          <div class="field" style="margin-top:10px"><label>{{ tab === 'gemini' ? 'API 端点' : 'Base URL' }}</label>
            <input v-model="form.baseUrl" :placeholder="tab==='claude' ? 'https://api.anthropic.com' : tab==='gemini' ? 'https://your-endpoint.com/' : 'https://api.openai.com/v1'"></div>
          <p v-if="tab==='gemini' && form.category==='official'" class="tip">Google 官方使用 OAuth 个人认证，无需填写 API Key，首次使用会自动打开浏览器登录。</p>
        </fieldset>

        <fieldset><legend>认证</legend>
          <div v-if="tab==='codex' || tab==='claude'" class="field">
            <label>认证方式</label>
            <select v-model="form.authMethod">
              <option value="api_key">API Key</option>
<option value="oauth_chatgpt">ChatGPT OAuth (Codex 订阅)</option>
<option value="oauth_xai">xAI OAuth (Grok 订阅)</option>
              <option value="oauth_copilot">GitHub Copilot OAuth</option>
            </select>
          </div>
          <div v-if="form.authMethod!=='api_key'" class="field oauth-box">
            <p class="tip">uTools 环境暂不支持后端 token 交换，请在浏览器完成 OAuth 后手动粘贴 Access Token 到下方 API Key。</p>
            <button type="button" class="btn-oauth"
              @click="openOAuthUrl(
                form.authMethod==='oauth_chatgpt' ? 'https://chatgpt.com/codex' :
                form.authMethod==='oauth_xai' ? 'https://x.ai/api' :
                'https://github.com/login/oauth/authorize?client_id=Iv1.b507a08c87ecfe98&scope=read:user')">
              打开 OAuth 登录页            </button>
          </div>
          <div class="field" style="margin-top:10px">
            <label>API Key</label>
            <div class="apikey-wrap"><input v-model="form.apiKey" :type="showApiKey ? 'text' : 'password'" placeholder="sk-..."><button type="button" class="btn-eye" @click="showApiKey = !showApiKey" :title="showApiKey ? '隐藏' : '显示'"><svg v-if="!showApiKey" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg><svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg></button></div>
          </div>
          <div v-if="tab==='claude'" class="field" style="margin-top:10px"><label>认证字段 <small>(写入哪个环境变量)</small></label>
            <select v-model="form.authField">
              <option value="ANTHROPIC_AUTH_TOKEN">ANTHROPIC_AUTH_TOKEN（默认）</option>
              <option value="ANTHROPIC_API_KEY">ANTHROPIC_API_KEY</option>
            </select>
          </div>
          <div v-if="tab==='codex'" class="row-2" style="margin-top:10px">
            <div class="field"><label>Header 名</label><input v-model="form.apiKeyHeader" placeholder="Authorization"></div>
            <div class="field"><label>前缀</label><input v-model="form.apiKeyPrefix" placeholder="Bearer "></div>
          </div>
        </fieldset>

        <fieldset><legend>模型配置</legend>
          <template v-if="tab==='codex'">
            <div class="row-2">
              <div class="field"><label>默认模型</label><input v-model="form.model" placeholder="gpt-5.4"></div>
              <div class="field"><label>推理强度</label>
                <select v-model="form.reasoningEffort">
                  <option value="minimal">minimal</option><option value="low">low</option>
                  <option value="medium">medium</option><option value="high">high</option>
                </select>
              </div>
            </div>
            <div class="field" style="margin-top:10px"><label>上游格式 <small>(代理层转换</small></label>
              <select v-model="form.apiFormat">
                <option value="">默认 (Responses 直连)</option>
                <option value="openai_chat">Chat Completions (需路由接管)</option>
                <option value="openai_responses">Responses</option>
                <option value="anthropic">Anthropic Messages (需路由接管)</option>
              </select>
              <p class="tip">供应商原生 Responses 默认；Chat / Anthropic Messages 需開启代理路由接管才能转换。</p>
            </div>
            <div class="field" style="margin-top:10px"><label>连接协议 <small>(wire_api)</small></label>
              <select v-model="form.wireApi">
                <option value="responses">Responses (OpenAI 官方 / gpt-5 系</option>
              <option value="chat">Chat Completions (方舟/DeepSeek/通义/Kimi 等)</option>
              </select>
                <p class="tip">直连只支持 Chat Completions 的供应商（如火山方舟 ark、DeepSeek、通义、Moonshot 等）。可直连(连接协议选 Chat)，或走代理路由接管获得协议转换与多供应商切换。</p>
            </div>
            <div v-if="codexProxyHint" class="proxy-hint" :class="'proxy-hint--' + codexProxyHint.level">
              {{ codexProxyHint.text }}
            </div>
            <template v-if="form.apiFormat==='anthropic'">
              <div class="field" style="margin-top:10px"><label>认证字段 <small>(网关接收 Key 的请求头)</small></label>
                <select v-model="form.authField">
                  <option value="ANTHROPIC_AUTH_TOKEN">ANTHROPIC_AUTH_TOKEN (Authorization: Bearer)</option>
                  <option value="ANTHROPIC_API_KEY">ANTHROPIC_API_KEY (x-api-key)</option>
                </select>
              </div>
              <label class="ck" style="margin-top:10px">
                <input type="checkbox" v-model="form.impersonateClaudeCode">
                模拟 Claude Code 客户端<small>(伪装 UA / anthropic-beta / x-app)</small>
              </label>
            </template>
            <div class="field" style="margin-top:10px">
              <label>模型目录 <small>(写入 model_catalog_json, /model 菜单显示)</small></label>
              <table class="catalog">
                <thead><tr><th>菜单显示名</th><th>实际模型 ID</th><th>上下文窗口</th><th></th></tr></thead>
                <tbody>
                  <tr v-for="(r, i) in catalogRows" :key="i">
                    <td><input v-model="r.displayName" placeholder="Ark Code Latest"></td>
                    <td><input v-model="r.model" placeholder="ark-code-latest"></td>
                    <td><input v-model="r.contextWindow" placeholder="256000" style="width:90px"></td>
                    <td><button type="button" class="btn-mini" @click="removeCatalogRow(i)">×</button></td>
                  </tr>
                </tbody>
              </table>
              <button type="button" class="btn-add" @click="addCatalogRow">+ 添加模型</button>
              <p class="tip">修改后需重启 Codex 刷新 /model 列表。</p>
            </div>
            <div class="field" style="margin-top:10px">
              <label>模型偏好 <small>(可选, 写入模型目录)</small></label>
              <div class="row-2">
                <div class="field">
                  <label>输出详细度</label>
                  <select v-model="form.verbosity">
                    <option value="low">简洁 (low)</option>
                    <option value="medium">适中 (medium)</option>
                    <option value="high">详细 (high)</option>
                  </select>
                </div>
                <div class="field">
                  <label>推理摘要</label>
                  <select v-model="form.reasoningSummary">
                    <option value="none">不显示 (none)</option>
                    <option value="auto">自动 (auto)</option>
                  </select>
                </div>
              </div>
              <label class="ck" style="margin-top:8px">
                <input type="checkbox" v-model="form.webSearch">
                启用联网搜索<small>(web_search 工具)</small>
              </label>
            </div>
          </template>

          <template v-else-if="tab==='claude'">
            <div class="field"><label>默认模型 <small>(ANTHROPIC_MODEL)</small></label><input v-model="form.model" placeholder="claude-sonnet-4-20250514"></div>
            <label class="ck" style="margin-top:8px">
              <input type="checkbox" v-model="form.supports1M">
              声明支持 1M 上下文<small>(为角色模型追加 [1M] 后缀)</small>
            </label>
            <div class="row-2" style="margin-top:10px">
              <div class="field"><label>Sonnet 模型</label><input v-model="form.sonnetModel" placeholder="claude-sonnet-4-20250514"></div>
              <div class="field"><label>Opus 模型</label><input v-model="form.opusModel" placeholder="留空=默认"></div>
            </div>
            <div class="row-2" style="margin-top:10px">
              <div class="field"><label>Fable 模型</label><input v-model="form.fableModel" placeholder="留空=默认"></div>
              <div class="field"><label>Haiku 模型 <small>(兜底)</small></label><input v-model="form.haikuModel" placeholder="留空=默认"></div>
            </div>
            <div class="field" style="margin-top:10px"><label>Subagent 模型 <small>(CLAUDE_CODE_SUBAGENT_MODEL)</small></label><input v-model="form.subagentModel" placeholder="留空=默认"></div>
          </template>

          <template v-else-if="tab==='openclaw'">
            <div class="field"><label>API 协议</label>
              <select v-model="form.apiProtocol">
                <option value="openai-completions">OpenAI Completions</option>
                <option value="openai-responses">OpenAI Responses</option>
                <option value="anthropic-messages">Anthropic Messages</option>
                <option value="google-generative-ai">Google Generative AI</option>
                <option value="bedrock-converse-stream">AWS Bedrock</option>
              </select>
            </div>
            <div class="field" style="margin-top:10px">
              <label>模型列表 <small>(第一行为默认主模型，其余为回退)</small></label>
              <table class="catalog">
                <thead><tr><th style="width:34%">模型 ID</th><th>显示名</th><th style="width:22%">上下文窗口</th><th style="width:80px">操作</th></tr></thead>
                <tbody>
                  <tr v-for="(r, i) in openclawRows" :key="i">
                    <td><input v-model="r.id" placeholder="kimi-k2.7-code"></td>
                    <td><input v-model="r.name" placeholder="Kimi K2.7 Code"></td>
                    <td><input v-model="r.contextWindow" placeholder="262144"></td>
                    <td style="white-space:nowrap">
                      <button type="button" class="btn-mini" :disabled="i===0" :title="i===0?'当前主模型':'设为主模型'" @click="promoteOpenclawRow(i)">↑</button>
                      <button type="button" class="btn-mini" title="删除" @click="removeOpenclawRow(i)">×</button>
                    </td>
                  </tr>
                  <tr v-if="!openclawRows.length"><td colspan="4" style="text-align:center;color:var(--text-muted);padding:8px 0">暂无模型，点下方按钮添加</td></tr>
                </tbody>
              </table>
              <button type="button" class="btn-add" @click="addOpenclawRow">+ 添加模型</button>
              <p class="tip">切换时会写入 ~/.openclaw/openclaw.json 的 models.providers[供应商名]，主模型自动使用第一行，其余作为 fallback 依次回退。</p>
            </div>
          </template>

          <template v-else>
            <div class="field"><label>模型 <small>(GEMINI_MODEL)</small></label><input v-model="form.model" placeholder="gemini-2.5-pro"></div>
          </template>
        </fieldset>

        <fieldset><legend>高级</legend>
          <div class="field"><label>额外 Header <small>(每行一个 Key: Value)</small></label>
            <textarea v-model="form.extraHeaders" rows="3" placeholder="X-Custom: value"></textarea>
          </div>

          <template v-if="tab==='codex'">
            <div class="field" style="margin-top:10px"><label>最大输出 tokens <small>(max_tokens, 留空=默认8192)</small></label>
              <input v-model="form.maxOutputTokens" type="number" placeholder="8192">
            </div>
            <div class="field" style="margin-top:10px"><label>自定义 User-Agent</label>
              <input v-model="form.customUserAgent" placeholder="Mozilla/5.0 ...">
            </div>
            <div class="field" style="margin-top:10px"><label>Header 覆盖 <small>(JSON, 代理转换时生效)</small></label>
              <textarea v-model="form.headersOverride" rows="2" class="mono" placeholder='{"x-custom": "value"}'></textarea>
            </div>
            <div class="field" style="margin-top:10px"><label>Body 覆盖 <small>(JSON, 合并到请求体)</small></label>
              <textarea v-model="form.bodyOverride" rows="2" class="mono" placeholder='{"max_output_tokens": 16384}'></textarea>
            </div>
          </template>

          <div class="field" style="margin-top:10px"><label>自定义 config.toml <small>(Codex 直连/切换时写入)</small></label>
            <textarea v-model="form.extraConfig" rows="4" placeholder="[model_providers.custom]&#10;name = &quot;custom&quot;" class="mono"></textarea>
          </div>
        </fieldset>
      </div>

      <div class="panel-footer">
        <button class="btn-cancel" @click="close">取消</button>
<button class="btn-save" @click="save">保存</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.apikey-wrap { position: relative; display: flex; }
.apikey-wrap input { flex: 1; padding-right: 36px; }
.btn-eye { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; padding: 4px; opacity: 0.5; display: flex; align-items: center; justify-content: center; border-radius: 4px; }
.btn-eye:hover { opacity: 1; }
.overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.3); z-index: 100;
}
.panel {
  position: fixed; top: 0; right: 0; bottom: 0;
  width: 100%; max-width: 460px;
  background: var(--bg);
  display: flex; flex-direction: column;
  box-shadow: -4px 0 24px rgba(0,0,0,.12);
}
.panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
.panel-header h2 { font-size: 16px; font-weight: 600; }
.close-btn {
  width: 28px; height: 28px; border: none; background: none;
  font-size: 22px; cursor: pointer; color: var(--text-secondary);
  border-radius: 6px; display: flex; align-items: center; justify-content: center;
}
.close-btn:hover { background: var(--bg-hover); color: var(--text); }

.panel-body {
  flex: 1; overflow-y: auto; padding: 16px 20px;
  display: flex; flex-direction: column; gap: 16px;
}
.panel-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 14px 20px; border-top: 1px solid var(--border); flex-shrink: 0;
}

fieldset {
  border: 1px solid var(--border); border-radius: var(--radius); padding: 12px 14px;
}
legend {
  font-size: 11px; font-weight: 600; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: .5px; padding: 0 6px;
}
.field { display: flex; flex-direction: column; gap: 4px; }
.field label {
  font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: .3px;
}
.field label small { font-weight: 400; text-transform: none; letter-spacing: 0; color: var(--text-muted); }
.field input, .field select, .field textarea {
  padding: 8px 10px; border: 1px solid var(--border); border-radius: 6px;
  font-size: 13px; background: var(--bg-card); color: var(--text);
  outline: none; font-family: inherit; transition: border-color .15s;
}
.field input:focus, .field select:focus, .field textarea:focus { border-color: var(--primary); }
.field textarea { resize: vertical; min-height: 60px; }
.field .mono { font-family: "SF Mono", "Fira Code", monospace; font-size: 12px; }

.row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

.btn-cancel, .btn-save {
  padding: 8px 20px; border-radius: var(--radius);
  font-size: 13px; font-weight: 500; cursor: pointer; transition: all .15s;
}
.btn-cancel {
  border: 1px solid var(--border); background: none; color: var(--text-secondary);
}
.btn-cancel:hover { background: var(--bg-hover); color: var(--text); }
.btn-save {
  border: 1px solid var(--primary); background: var(--primary); color: #fff;
}
.btn-save:hover { background: var(--primary-hover); }

.preset-search { margin-bottom: 2px; }
.field-label-sm {
  font-size: 11px; font-weight: 600; color: var(--text-secondary);
  text-transform: uppercase; letter-spacing: .3px;
  display: block; margin-bottom: 6px;
}
.search-wrap { position: relative; }
.search-input {
  width: 100%; padding: 8px 12px;
  border: 1px solid var(--border); border-radius: 6px;
  font-size: 13px; background: var(--bg-card); color: var(--text);
  outline: none; transition: border-color .15s;
}
.search-input:focus { border-color: var(--primary); }
.search-dropdown {
  position: absolute; top: 100%; left: 0; right: 0;
  max-height: 180px; overflow-y: auto;
  background: var(--bg); border: 1px solid var(--border);
  border-radius: 6px; margin-top: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,.1);
  z-index: 10;
}
.search-item {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; border: none; background: none; cursor: pointer;
  font-size: 13px; color: var(--text); text-align: left;
  transition: background .1s;
}
.search-item:hover { background: var(--bg-hover); }
.search-item-name { font-weight: 500; }
.search-item-model { font-size: 11px; color: var(--text-muted); }
.search-empty {
  position: absolute; top: 100%; left: 0; right: 0;
  padding: 10px 12px; font-size: 12px; color: var(--text-muted);
  background: var(--bg); border: 1px solid var(--border);
  border-radius: 6px; margin-top: 4px;
}
.tip { font-size: 11px; color: var(--text-muted); margin-top: 6px; line-height: 1.5; }
.proxy-hint {
  margin-top: 10px; padding: 8px 10px; border-radius: 6px;
  font-size: 12px; line-height: 1.5; border: 1px solid transparent;
}
.proxy-hint--required { background: #fdecec; color: #c0392b; border-color: #f5c6cb; }
.proxy-hint--optional { background: #eef4fd; color: #2b6cb0; border-color: #cdddf5; }
.proxy-hint--ok { background: #eaf7ef; color: #1f8a4c; border-color: #cdebd8; }
.link { font-size: 11px; color: var(--primary); text-decoration: none; margin-left: 6px; text-transform: none; letter-spacing: 0; font-weight: 400; }
.link:hover { text-decoration: underline; }

.icon-picker { display: flex; flex-wrap: wrap; gap: 6px; padding: 4px 0; }
.icon-dot {
  width: 22px; height: 22px; border-radius: 50%; border: 2px solid transparent;
  cursor: pointer; padding: 0; transition: transform .1s;
}
.icon-dot:hover { transform: scale(1.15); }
.icon-dot--on { border-color: var(--text); box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--primary); }

.ck {
  display: flex; align-items: center; gap: 8px; font-size: 12px;
  color: var(--text-secondary); cursor: pointer;
}
.ck small { color: var(--text-muted); }
.ck input { width: auto; }

.catalog { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 4px; }
.catalog th {
  text-align: left; font-size: 10px; font-weight: 600; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: .3px; padding: 2px 4px;
}
.catalog td { padding: 2px 4px; }
.catalog input { width: 100%; padding: 5px 7px; border: 1px solid var(--border); border-radius: 5px; font-size: 12px; background: var(--bg-card); color: var(--text); }
.btn-mini {
  width: 22px; height: 22px; border: 1px solid var(--border); border-radius: 5px;
  background: var(--bg); color: var(--text-secondary); cursor: pointer; font-size: 14px; line-height: 1;
}
.btn-mini:hover { color: var(--danger); border-color: var(--danger); }
.btn-add {
  margin-top: 6px; padding: 5px 12px; border: 1px dashed var(--border); border-radius: 6px;
  background: none; color: var(--text-secondary); cursor: pointer; font-size: 12px;
}
.btn-add:hover { border-color: var(--primary); color: var(--primary); }
.oauth-box { margin-top: 10px; }
.btn-oauth {
  margin-top: 4px; padding: 7px 14px; border: 1px solid var(--primary); border-radius: 6px;
  background: var(--primary-light); color: var(--primary); cursor: pointer; font-size: 12px; font-weight: 500;
}
.btn-oauth:hover { background: var(--primary); color: #fff; }
</style>



