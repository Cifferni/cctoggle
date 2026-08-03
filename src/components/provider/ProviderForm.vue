<script setup lang="ts">
// @ts-nocheck TODO: 逐步添加类型注解后移除
import { reactive, watch, ref, computed, h } from "vue";
import { NInput, NButton, NFlex, useMessage } from "naive-ui";
const props = defineProps({ visible: Boolean, initialData: Object });
const emit = defineEmits(["close", "save"]);
const message = useMessage();

import { useProviders } from "../../composables/useProviders";
const { PRESETS, activeTab, presetToProviderData } = useProviders();
const tab = computed(() => activeTab());

const presetSearch = ref("");
const presetOptions = computed(() =>
  (PRESETS[activeTab()] || []).map(p => ({ label: p.name + ' (' + p.model + ')', value: p.name }))
);

// 图标预设（简圆点色板）
const ICON_PRESETS = [
  { icon: "openai", color: "#00A67E" }, { icon: "anthropic", color: "#D97757" },
  { icon: "google", color: "#4285F4" }, { icon: "kimi", color: "#6366F1" },
  { icon: "deepseek", color: "#4D6BFE" }, { icon: "glm", color: "#22D3EE" },
  { icon: "qwen", color: "#615CED" }, { icon: "grok", color: "#000000" },
  { icon: "packycode", color: "#F97316" }, { icon: "custom", color: "#64748B" },
];
const CATEGORIES = [
  { value: "official", label: "官方" }, { value: "cn_official", label: "国内官方" },
  { value: "partner", label: "合作" }, { value: "prime", label: "Prime" },
  { value: "third_party", label: "第三方" }, { value: "custom", label: "自定义" },
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

// 测试连接状态
const testing = ref(false);
const fetchingModels = ref(false);

// config.toml 实时预览：镜像后端 switchProviderCodex 的拼装逻辑（services.js），仅用于只读展示
function slugifyName(name) {
  return (name || "custom").toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^_+|_+$/g, "") || "custom";
}
const codexConfigPreview = computed(() => {
  if (tab.value !== "codex") return "";
  const cleanName = slugifyName(form.name);
  const baseUrl = form.baseUrl || "https://api.openai.com/v1";
  const model = form.model || "gpt-4o";
  const apiFormat = form.apiFormat || "";
  const wireApi = form.wireApi || (apiFormat === "openai_chat" ? "chat" : "responses");
  const effort = form.reasoningEffort || "high";
  const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost)/.test(baseUrl);
  const hasCatalog = catalogRows.value.some(r => r.model);
  const lines = [
    `model_provider = "${cleanName}"`,
    `model = "${model}"`,
    `model_reasoning_effort = "${effort}"`,
    `disable_response_storage = true`,
  ];
  if (hasCatalog) lines.push(`model_catalog_json = "utoolscctoggle-model-catalog.json"`);
  lines.push(
    ``,
    `[model_providers.${cleanName}]`,
    `name = "${cleanName}"`,
    `base_url = "${baseUrl}"`,
    `wire_api = "${wireApi}"`,
    `requires_openai_auth = ${isLocal ? "false" : "true"}`,
  );
  return lines.join("\n");
});

const ONE_M = "[1M]";
function stripOneM(s) { return typeof s === "string" && s.endsWith(ONE_M) ? s.slice(0, -ONE_M.length).trimEnd() : s || ""; }
function applyOneM(s, on) { const base = stripOneM(s || ""); return on && base ? base + ONE_M : base; }

// —— 表单回填 helper：watch(visible) 与 fillPreset 共用，避免逻辑重复 ——
function mapCatalogRows(list) {
  return (list || []).map(m => ({
    model: m.model || "", displayName: m.displayName || "", contextWindow: m.contextWindow || "",
  }));
}
function mapOpenclawRows(list) {
  return (list || []).map(m => ({
    id: m.id || "", name: m.name || "", contextWindow: m.contextWindow || "",
  }));
}
function deriveAuthField(env, stored) {
  if (stored) return stored;
  return env.ANTHROPIC_API_KEY !== undefined ? "ANTHROPIC_API_KEY" : "ANTHROPIC_AUTH_TOKEN";
}
function assignHidden(d) {
  Object.assign(hidden, {
    settingsConfig: d?.settingsConfig || {}, authData: d?.authData || {},
    endpointCandidates: d?.endpointCandidates || [],
  });
}
// 两条回填路径完全一致的字段（含 Claude 角色模型），差异字段由各调用方单独覆盖
function commonFormFields(d) {
  const env = d?.settingsConfig?.env || {};
  const claudeModel = d?.model || env.ANTHROPIC_MODEL || "";
  return {
    models: (d?.models || []).join(", "),
    configType: d?.configType || "openai",
    reasoningEffort: d?.reasoningEffort || "high",
    extraConfig: d?.extraConfig || "",
    wireApi: d?.wireApi || "responses",
    apiFormat: d?.apiFormat || "",
    apiKeyUrl: d?.apiKeyUrl || "",
    category: d?.category || "custom",
    icon: d?.icon || "", iconColor: d?.iconColor || "",
    maxOutputTokens: d?.maxOutputTokens || "",
    authField: deriveAuthField(env, d?.authField),
    apiProtocol: d?.apiProtocol || d?.settingsConfig?.api || "openai-completions",
    verbosity: d?.verbosity || "low",
    reasoningSummary: d?.reasoningSummary || "none",
    webSearch: d?.webSearch !== false,
    sonnetModel: stripOneM(env.ANTHROPIC_DEFAULT_SONNET_MODEL || ""),
    opusModel: stripOneM(env.ANTHROPIC_DEFAULT_OPUS_MODEL || ""),
    haikuModel: env.ANTHROPIC_DEFAULT_HAIKU_MODEL || "",
    fableModel: stripOneM(env.ANTHROPIC_DEFAULT_FABLE_MODEL || ""),
    subagentModel: stripOneM(env.CLAUDE_CODE_SUBAGENT_MODEL || ""),
    supports1M: typeof claudeModel === "string" && claudeModel.endsWith(ONE_M),
  };
}

watch(() => props.visible, v => {
  if (!v) return;
  const d = props.initialData;
  const env = d?.settingsConfig?.env || {};
  const claudeModel = d?.model || env.ANTHROPIC_MODEL || "";
  Object.assign(form, commonFormFields(d), {
    name: d?.name || "", baseUrl: d?.baseUrl || "https://api.openai.com/v1",
    apiKey: d?.apiKey || "", model: stripOneM(claudeModel) || "gpt-5.4",
    websiteUrl: d?.websiteUrl || "", remark: d?.remark || "",
    apiKeyHeader: d?.apiKeyHeader || "Authorization", apiKeyPrefix: d?.apiKeyPrefix || "Bearer ",
    maxTokens: d?.maxTokens || "", temperature: d?.temperature || "", extraHeaders: d?.extraHeaders || "",
    customUserAgent: d?.customUserAgent || "", headersOverride: d?.headersOverride || "", bodyOverride: d?.bodyOverride || "",
    authMethod: d?.authMethod || "api_key",
    impersonateClaudeCode: !!d?.impersonateClaudeCode,
  });
  openclawRows.value = mapOpenclawRows(d?.settingsConfig?.models);
  catalogRows.value = mapCatalogRows(d?.modelCatalog);
  // 编辑已有供应商视为已确定协议，不自动覆盖；新建则允许按 base_url 自动推荐
  protocolTouched.value = !!(d && (d.apiFormat || d.wireApi));
  assignHidden(d);
});

function addCatalogRow() { catalogRows.value.push({ model: "", displayName: "", contextWindow: "" }); }
function removeCatalogRow(i) { catalogRows.value.splice(i, 1); }
function pickIcon(p) { form.icon = p.icon; form.iconColor = p.color; }

// 只支持 Chat Completions 的常见供应商域名 / 模型关键词，用于自动推荐 wire_api。
// 注意：不含火山方舟 —— 其 /api/plan/v3 是 Responses 端点、/api/coding/v3 才是 Chat，
// 域名无法一刀切，故火山依赖预设声明的 apiFormat，不做自动推荐（误判会导致协议错配报错）。
const CHAT_ONLY_HINTS = [
  "deepseek.com",                              // DeepSeek
  "dashscope",                                 // 阿里通义千问
  "moonshot.cn",                               // Kimi / Moonshot
  "bigmodel.cn", "open.bigmodel",              // 智谱 GLM
  "siliconflow",                               // 硅基流动
  "hunyuan",                                   // 腾讯混元
];
function isChatOnlyUpstream(baseUrl, model) {
  const s = ((baseUrl || "") + " " + (model || "")).toLowerCase();
  return CHAT_ONLY_HINTS.some(function (h) { return s.indexOf(h) !== -1; });
}
// wire_api 由上游格式派生：只有 Chat Completions 上游直连时才用 chat，其余一律 responses
function deriveWireApi(apiFormat) {
  return apiFormat === "openai_chat" ? "chat" : "responses";
}

// 「上游协议」单一下拉 <-> 底层双字段(apiFormat/wireApi)的双向映射。
// 底层仍存两字段（后端 config 生成与代理转换分别依赖），此处仅收敛成一个用户可见选项，
// 消除"两字段可矛盾"的历史坑。选项值即 apiFormat 的规范取值（"" 代表原生 Responses 直连）。
const PROTOCOL_FIELDS = {
  "":                { apiFormat: "",                 wireApi: "responses" }, // 原生 Responses 直连
  "openai_chat":     { apiFormat: "openai_chat",      wireApi: "chat" },      // Chat Completions（代理转换/直连均可）
  "openai_responses":{ apiFormat: "openai_responses", wireApi: "responses" }, // Responses 兼容端点（透传，如火山 plan）
  "anthropic":       { apiFormat: "anthropic",        wireApi: "responses" }, // Anthropic Messages（代理转换）
};
// 由已存的双字段反推下拉选项；未知组合回退到 apiFormat 本身（兼容任意历史数据）
function fieldsToProtocol(apiFormat) {
  const af = apiFormat || "";
  return PROTOCOL_FIELDS[af] ? af : "";
}
const codexProtocol = computed({
  get() { return fieldsToProtocol(form.apiFormat); },
  set(v) {
    const f = PROTOCOL_FIELDS[v] || PROTOCOL_FIELDS[""];
    form.apiFormat = f.apiFormat;
    form.wireApi = f.wireApi;
    protocolTouched.value = true;
  },
});
// 记录用户是否手动改过协议，改过则不再自动推荐
const protocolTouched = ref(false);
watch([() => form.baseUrl, () => form.model], () => {
  if (tab.value !== "codex") return;
  if (protocolTouched.value) return;
  // 上游为 chat-only 且尚未指定格式时，自动补 openai_chat：直连据此选 wire_api，走代理据此转换协议。
  // 仅在 apiFormat 为空时填充，避免覆盖预设已声明的 openai_responses / anthropic。
  if (!form.apiFormat && isChatOnlyUpstream(form.baseUrl, form.model)) {
    form.apiFormat = "openai_chat";
  }
  // wire_api 始终与 apiFormat 保持一致，杜绝"上游格式 chat 但 wire_api responses"的矛盾组合
  form.wireApi = deriveWireApi(form.apiFormat);
});

// 表单内实时提示：根据上游格式给出直连/代理结论，与卡片徽章呼应
// config.toml 复制
const copied = ref(false);
function copyConfigToml() {
  try { navigator.clipboard.writeText(codexConfigPreview.value); } catch {}
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 1500);
}

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
  // Codex 已改为纯表单配置，不再支持整篇自定义 toml；清空 extraConfig 以免旧数据残留旁路表单字段
  if (t === "codex") payload.extraConfig = "";
  if (t === "claude") {
    const env = { ...(hidden.settingsConfig?.env || {}) };
    const on = form.supports1M;
    const mainModel = applyOneM(form.model, on);
    if (form.baseUrl) env.ANTHROPIC_BASE_URL = form.baseUrl;
    if (mainModel) env.ANTHROPIC_MODEL = mainModel;
    if (form.sonnetModel) env.ANTHROPIC_DEFAULT_SONNET_MODEL = applyOneM(form.sonnetModel, on);
    if (form.opusModel) env.ANTHROPIC_DEFAULT_OPUS_MODEL = applyOneM(form.opusModel, on);
    if (form.haikuModel) env.ANTHROPIC_DEFAULT_HAIKU_MODEL = form.haikuModel; // Haiku 作兜底，不追加 [1M]
    if (form.fableModel) env.ANTHROPIC_DEFAULT_FABLE_MODEL = applyOneM(form.fableModel, on);
    if (form.subagentModel) env.CLAUDE_CODE_SUBAGENT_MODEL = applyOneM(form.subagentModel, on);
    payload.model = mainModel;
    payload.settingsConfig = { ...(hidden.settingsConfig || {}), env };
  } else if (t === "openclaw") {
    const models = openclawRows.value
      .map(r => {
        const m = { id: (r.id || "").trim() };
        const name = String(r.name || "").trim();
        if (name) m.name = name;
        const ctx = Number(r.contextWindow);
        if (ctx) m.contextWindow = ctx;
        return m;
      })
      .filter(m => m.id);
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
          fallbacks: models.slice(1).map(m => m.id),
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

// 测试连接（仅 Codex/OpenClaw）
async function handleTestConnection() {
  if (!form.baseUrl) {
    message.warning("请输入 Base URL");
    return;
  }
  testing.value = true;
  try {
    const result = await window.utoolsCctoggle.testConnection(form.baseUrl, form.apiKey, tab.value);
    if (result.success) {
      // 如果检测成功，自动填充 apiFormat
      if (result.apiFormat) {
        form.apiFormat = result.apiFormat;
        form.wireApi = result.wireApi || (result.apiFormat === "openai_chat" ? "chat" : "responses");
        protocolTouched.value = true;
      }
      // 显示检测到的协议
      const protocolNames = {
        'openai_chat': 'Chat Completions',
        'openai_responses': 'Responses',
        'anthropic': 'Anthropic',
      };
      const protocolName = protocolNames[result.apiFormat] || result.apiFormat || '未知';
      message.success(`连接成功，检测到协议：${protocolName}`);
    } else {
      message.error(result.error || "连接失败");
    }
  } catch (err) {
    message.error("测试失败：" + (err.message || err));
  } finally {
    testing.value = false;
  }
}

// 自动添加模型
function autoAddModels(modelIds) {
  if (tab.value === 'codex') {
    // Codex: 添加到 modelCatalog
    const existingModels = catalogRows.value.map(r => r.model);
    const newModels = modelIds.filter(m => !existingModels.includes(m));
    if (newModels.length > 0) {
      newModels.forEach(m => {
        catalogRows.value.push({
          model: m,
          displayName: m,
          contextWindow: "",
        });
      });
      message.success(`已自动添加 ${newModels.length} 个模型到目录`);
    } else {
      message.info("模型已存在，无需添加");
    }
  } else if (tab.value === 'openclaw') {
    // OpenClaw: 添加到 openclawRows
    const existingModels = openclawRows.value.map(r => r.id);
    const newModels = modelIds.filter(m => !existingModels.includes(m));
    if (newModels.length > 0) {
      newModels.forEach(m => {
        openclawRows.value.push({
          id: m,
          name: m,
          contextWindow: "",
        });
      });
      message.success(`已自动添加 ${newModels.length} 个模型`);
    } else {
      message.info("模型已存在，无需添加");
    }
  } else {
    // Claude/Gemini: 设置默认模型
    if (modelIds.length > 0 && !form.model) {
      form.model = modelIds[0];
      message.success(`已自动设置默认模型：${modelIds[0]}`);
    }
  }
}

// 获取模型列表
async function handleFetchModels() {
  if (!form.baseUrl) {
    message.warning("请输入 Base URL");
    return;
  }
  fetchingModels.value = true;
  try {
    const result = await window.utoolsCctoggle.fetchAvailableModels(form.baseUrl, form.apiKey, tab.value);
    if (result.success) {
      if (result.models && result.models.length > 0) {
        autoAddModels(result.models);
      } else {
        message.info("未获取到可用模型");
      }
    } else {
      message.error(result.error || "获取模型失败");
    }
  } catch (err) {
    message.error("获取失败：" + (err.message || err));
  } finally {
    fetchingModels.value = false;
  }
}

function fillPreset(preset) {
  const d = presetToProviderData ? presetToProviderData(preset) : preset;
  const env = d.settingsConfig?.env || {};
  const claudeModel = d.model || env.ANTHROPIC_MODEL || "";
  Object.assign(form, commonFormFields(d), {
    name: d.name || preset.name,
    baseUrl: d.baseUrl || preset.baseUrl || "",
    model: stripOneM(claudeModel) || preset.model || "",
    websiteUrl: d.websiteUrl || preset.websiteUrl || "",
    authMethod: preset.authMethod || "api_key",
    impersonateClaudeCode: !!preset.impersonateClaudeCode,
  });
  openclawRows.value = mapOpenclawRows(d.settingsConfig?.models);
  catalogRows.value = mapCatalogRows(d.modelCatalog);
  assignHidden(d);
}

// Select 选项
const configTypeOptions = [
  { value: "openai", label: "OpenAI 兼容" },
  { value: "anthropic", label: "Anthropic 原生" },
  { value: "gemini", label: "Gemini 原生" },
  { value: "openclaw", label: "OpenClaw" },
];
const authMethodOptions = [
  { value: "api_key", label: "API Key" },
  { value: "oauth_chatgpt", label: "ChatGPT OAuth (Codex 订阅)" },
  { value: "oauth_xai", label: "xAI OAuth (Grok 订阅)" },
  { value: "oauth_copilot", label: "GitHub Copilot OAuth" },
];
const authFieldOptions = [
  { value: "ANTHROPIC_AUTH_TOKEN", label: "ANTHROPIC_AUTH_TOKEN（默认）" },
  { value: "ANTHROPIC_API_KEY", label: "ANTHROPIC_API_KEY" },
];
const reasoningEffortOptions = [
  { value: "minimal", label: "minimal" },
  { value: "low", label: "low" },
  { value: "medium", label: "medium" },
  { value: "high", label: "high" },
];
const codexProtocolOptions = [
  { value: "", label: "Responses（OpenAI 官方 / gpt-5 系，直连）" },
  { value: "openai_chat", label: "Chat Completions（DeepSeek / 通义 / Kimi 等，走代理转换）" },
  { value: "openai_responses", label: "Responses 兼容（火山 plan / 豆包等国产 Responses 端点）" },
  { value: "anthropic", label: "Anthropic Messages（走代理转换）" },
];
const verbosityOptions = [
  { value: "low", label: "简洁 (low)" },
  { value: "medium", label: "适中 (medium)" },
  { value: "high", label: "详细 (high)" },
];
const reasoningSummaryOptions = [
  { value: "none", label: "不显示 (none)" },
  { value: "auto", label: "自动 (auto)" },
];
const apiProtocolOptions = [
  { value: "openai-completions", label: "OpenAI Completions" },
  { value: "openai-responses", label: "OpenAI Responses" },
  { value: "anthropic-messages", label: "Anthropic Messages" },
  { value: "google-generative-ai", label: "Google Generative AI" },
  { value: "bedrock-converse-stream", label: "AWS Bedrock" },
];

function handleClose() {
  emit('close');
}

// Catalog 表格列定义（Codex）
const catalogColumns = [
  { title: '菜单显示名', key: 'displayName', render: (row) => h(NInput, { value: row.displayName, 'onUpdate:value': v => row.displayName = v, placeholder: 'Ark Code Latest', size: 'small' }) },
  { title: '实际模型 ID', key: 'model', render: (row) => h(NInput, { value: row.model, 'onUpdate:value': v => row.model = v, placeholder: 'ark-code-latest', size: 'small' }) },
  { title: '上下文窗口', key: 'contextWindow', width: 100, render: (row) => h(NInput, { value: row.contextWindow, 'onUpdate:value': v => row.contextWindow = v, placeholder: '256000', size: 'small' }) },
  { title: '', key: 'actions', width: 40, render: (row, rowIndex) => h(NButton, { quaternary: true, type: 'error', size: 'tiny', onClick: () => removeCatalogRow(rowIndex) }, { default: () => '×' }) },
];

// OpenClaw 表格列定义
const openclawColumns = [
  { title: '模型 ID', key: 'id', render: (row) => h(NInput, { value: row.id, 'onUpdate:value': v => row.id = v, placeholder: 'kimi-k2.7-code', size: 'small' }) },
  { title: '显示名', key: 'name', render: (row) => h(NInput, { value: row.name, 'onUpdate:value': v => row.name = v, placeholder: 'Kimi K2.7 Code', size: 'small' }) },
  { title: '上下文窗口', key: 'contextWindow', width: 100, render: (row) => h(NInput, { value: row.contextWindow, 'onUpdate:value': v => row.contextWindow = v, placeholder: '262144', size: 'small' }) },
  { title: '操作', key: 'actions', width: 80, render: (row, rowIndex) => h(NFlex, { size: 4 }, { default: () => [
    h(NButton, { quaternary: true, size: 'tiny', disabled: rowIndex === 0, title: rowIndex === 0 ? '当前主模型' : '设为主模型', onClick: () => promoteOpenclawRow(rowIndex) }, { default: () => '↑' }),
    h(NButton, { quaternary: true, type: 'error', size: 'tiny', title: '删除', onClick: () => removeOpenclawRow(rowIndex) }, { default: () => '×' }),
  ] }) },
];
</script>

<template>
  <n-drawer :show="visible" width="50vw" placement="right" @update:show="v => { if (!v) handleClose() }">
    <n-drawer-content closable>
      <template #header>
        {{ initialData ? '编辑供应商' : '添加供应商' }}
      </template>

      <div class="drawer-body">
        <!-- 预设搜索 -->
        <n-flex v-if="!initialData" vertical :size="6" class="preset-section">
          <n-text depth="3" style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .3px;">从预设导入</n-text>
          <n-select
            v-model:value="presetSearch"
            :options="presetOptions"
            placeholder="搜索供应商预设.."
            filterable
            clearable
            @update:value="(val) => {
              const p = (PRESETS[activeTab()] || []).find(x => x.name === val);
              if (p) { fillPreset(p); presetSearch = ''; }
            }"
          />
        </n-flex>

        <!-- 基本信息 -->
        <n-card title="基本信息" size="small" :bordered="true" class="section-card">
          <n-flex vertical :size="10">
            <n-grid :cols="2" :x-gap="10">
              <n-gi>
                <n-form-item label="名称" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
                  <n-input v-model:value="form.name" placeholder="如 NewAPI" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="官网" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
                  <n-input v-model:value="form.websiteUrl" placeholder="https://..." />
                </n-form-item>
              </n-gi>
            </n-grid>
            <n-form-item label="备注" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
              <n-input v-model:value="form.remark" placeholder="选填，例如：个人账号 / 充值到期 / 限速说明" />
            </n-form-item>
            <n-grid :cols="2" :x-gap="10">
              <n-gi>
                <n-form-item label="分类" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
                  <n-select v-model:value="form.category" :options="CATEGORIES" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="图标" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
                  <div class="icon-picker">
                    <div
                      v-for="p in ICON_PRESETS" :key="p.icon"
                      class="icon-dot" :class="{ 'icon-dot--on': form.icon === p.icon }"
                      :style="{ background: p.color }" :title="p.icon"
                      @click="pickIcon(p)"
                    />
                  </div>
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-flex>
        </n-card>

        <!-- Codex config.toml 预览 -->
        <n-collapse v-if="tab === 'codex'" class="toml-preview">
          <n-collapse-item name="preview">
            <template #header>
              <n-text depth="2" style="font-size: 11px; font-weight: 600;">config.toml 预览</n-text>
            </template>
            <template #header-extra>
              <n-button quaternary size="tiny" type="primary" @click.stop="copyConfigToml">
                {{ copied ? '✓ 已复制' : '复制' }}
              </n-button>
            </template>
            <div class="toml-preview__code">
              <n-code :code="codexConfigPreview" language="toml" />
            </div>
            <n-text depth="3" style="font-size: 10px; margin-top: 4px; display: block;">由表单实时生成，切换供应商时写入 ~/.codex/config.toml</n-text>
          </n-collapse-item>
        </n-collapse>

        <!-- 连接配置与认证（合并） -->
        <n-card title="连接配置" size="small" :bordered="true" class="section-card">
          <n-flex vertical :size="10">
            <n-form-item label="API 类型" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
              <n-select v-model:value="form.configType" :options="configTypeOptions" />
            </n-form-item>
            <n-form-item :label="tab === 'gemini' ? 'API 端点' : 'Base URL'" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
              <n-input
                v-model:value="form.baseUrl"
                :placeholder="tab==='claude' ? 'https://api.anthropic.com' : tab==='gemini' ? 'https://your-endpoint.com/' : 'https://api.openai.com/v1'"
              />
            </n-form-item>
            <!-- 认证方式（仅 Codex/Claude） -->
            <n-form-item v-if="tab==='codex' || tab==='claude'" label="认证方式" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
              <n-select v-model:value="form.authMethod" :options="authMethodOptions" />
            </n-form-item>
            <n-alert v-if="form.authMethod!=='api_key'" type="warning" size="small">
              <template #default>
                <n-text>uTools 环境暂不支持后端 token 交换，请在浏览器完成 OAuth 后手动粘贴 Access Token 到下方 API Key。</n-text>
                <n-button
                  type="primary" size="small" secondary style="margin-top: 8px;"
                  @click="openOAuthUrl(
                    form.authMethod==='oauth_chatgpt' ? 'https://chatgpt.com/codex' :
                    form.authMethod==='oauth_xai' ? 'https://x.ai/api' :
                    'https://github.com/login/oauth/authorize?client_id=Iv1.b507a08c87ecfe98&scope=read:user'
                  )"
                >打开 OAuth 登录页</n-button>
              </template>
            </n-alert>
            <n-form-item label="API Key" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
              <n-input
                v-model:value="form.apiKey"
                type="password"
                placeholder="sk-..."
                show-password-on="click"
              />
            </n-form-item>
            <!-- Claude 认证字段 -->
            <n-form-item v-if="tab==='claude'" label="认证字段" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
              <template #label>
                <n-text style="font-size: 11px; font-weight: 600;">认证字段 <n-text depth="3" style="font-size: 11px; font-weight: 400;">(写入哪个环境变量)</n-text></n-text>
              </template>
              <n-select v-model:value="form.authField" :options="authFieldOptions" />
            </n-form-item>
            <!-- Codex Header 配置 -->
            <n-grid v-if="tab==='codex'" :cols="2" :x-gap="10">
              <n-gi>
                <n-form-item label="Header 名" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
                  <n-input v-model:value="form.apiKeyHeader" placeholder="Authorization" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="前缀" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
                  <n-input v-model:value="form.apiKeyPrefix" placeholder="Bearer " />
                </n-form-item>
              </n-gi>
            </n-grid>
            <n-alert v-if="tab==='gemini' && form.category==='official'" type="info" size="small">
              Google 官方使用 OAuth 个人认证，无需填写 API Key，首次使用会自动打开浏览器登录。
            </n-alert>
            <n-grid :cols="2" :x-gap="8">
              <n-gi>
                <n-button
                  v-if="tab !== 'claude'"
                  :loading="testing"
                  type="primary"
                  secondary
                  size="small"
                  @click="handleTestConnection"
                  style="width: 100%;"
                >
                  {{ testing ? '测试中...' : '测试连接' }}
                </n-button>
              </n-gi>
              <n-gi>
                <n-button
                  v-if="tab !== 'claude'"
                  :loading="fetchingModels"
                  type="default"
                  secondary
                  size="small"
                  @click="handleFetchModels"
                  style="width: 100%;"
                >
                  {{ fetchingModels ? '获取中...' : '获取模型' }}
                </n-button>
              </n-gi>
            </n-grid>
          </n-flex>
        </n-card>

        <!-- 模型配置 -->
        <n-card title="模型配置" size="small" :bordered="true" class="section-card">
          <n-flex vertical :size="10">
            <!-- Codex -->
            <template v-if="tab==='codex'">
              <n-grid :cols="2" :x-gap="10">
                <n-gi>
                  <n-form-item label="默认模型" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
                    <n-input v-model:value="form.model" placeholder="gpt-5.4" />
                  </n-form-item>
                </n-gi>
                <n-gi>
                  <n-form-item label="推理强度" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
                    <n-select v-model:value="form.reasoningEffort" :options="reasoningEffortOptions" />
                  </n-form-item>
                </n-gi>
              </n-grid>
              <n-alert v-if="testResult?.success" type="info" size="small">
                已自动检测到协议格式，如需手动调整请在高级选项中修改。
              </n-alert>
              <template v-if="form.apiFormat==='anthropic'">
                <n-form-item label="认证字段" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
                  <template #label>
                    <n-text style="font-size: 11px; font-weight: 600;">认证字段 <n-text depth="3" style="font-size: 11px; font-weight: 400;">(网关接收 Key 的请求头)</n-text></n-text>
                  </template>
                  <n-select v-model:value="form.authField" :options="authFieldOptions" />
                </n-form-item>
                <n-checkbox v-model:checked="form.impersonateClaudeCode">
                  模拟 Claude Code 客户端 <n-text depth="3" style="font-size: 11px;">(伪装 UA / anthropic-beta / x-app)</n-text>
                </n-checkbox>
              </template>
              <div>
                <n-text style="font-size: 11px; font-weight: 600; display: block; margin-bottom: 6px;">模型目录 <n-text depth="3" style="font-weight: 400;">(写入 model_catalog_json, /model 菜单显示)</n-text></n-text>
                <n-data-table
                  :columns="catalogColumns"
                  :data="catalogRows"
                  :bordered="false"
                  size="small"
                  :max-height="200"
                />
                <n-button dashed size="small" @click="addCatalogRow" style="margin-top: 6px; width: 100%;">+ 添加模型</n-button>
                <n-text depth="3" style="font-size: 11px; margin-top: 4px; display: block;">修改后需重启 Codex 刷新 /model 列表。</n-text>
              </div>
              <n-text style="font-size: 11px; font-weight: 600; display: block; margin-bottom: 6px;">模型偏好 <n-text depth="3" style="font-weight: 400;">(可选, 写入模型目录)</n-text></n-text>
              <n-grid :cols="2" :x-gap="10">
                <n-gi>
                  <n-form-item label="输出详细度" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
                    <n-select v-model:value="form.verbosity" :options="verbosityOptions" />
                  </n-form-item>
                </n-gi>
                <n-gi>
                  <n-form-item label="推理摘要" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
                    <n-select v-model:value="form.reasoningSummary" :options="reasoningSummaryOptions" />
                  </n-form-item>
                </n-gi>
              </n-grid>
              <n-checkbox v-model:checked="form.webSearch">
                启用联网搜索 <n-text depth="3" style="font-size: 11px;">(web_search 工具)</n-text>
              </n-checkbox>
            </template>

            <!-- Claude -->
            <template v-else-if="tab==='claude'">
              <n-form-item label="默认模型" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
                <template #label>
                  <n-text style="font-size: 11px; font-weight: 600;">默认模型 <n-text depth="3" style="font-weight: 400;">(ANTHROPIC_MODEL)</n-text></n-text>
                </template>
                <n-input v-model:value="form.model" placeholder="claude-sonnet-4-20250514" />
              </n-form-item>
              <n-checkbox v-model:checked="form.supports1M">
                声明支持 1M 上下文 <n-text depth="3" style="font-size: 11px;">(为角色模型追加 [1M] 后缀)</n-text>
              </n-checkbox>
              <n-grid :cols="2" :x-gap="10">
                <n-gi>
                  <n-form-item label="Sonnet 模型" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
                    <n-input v-model:value="form.sonnetModel" placeholder="claude-sonnet-4-20250514" />
                  </n-form-item>
                </n-gi>
                <n-gi>
                  <n-form-item label="Opus 模型" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
                    <n-input v-model:value="form.opusModel" placeholder="留空=默认" />
                  </n-form-item>
                </n-gi>
              </n-grid>
              <n-grid :cols="2" :x-gap="10">
                <n-gi>
                  <n-form-item label="Fable 模型" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
                    <n-input v-model:value="form.fableModel" placeholder="留空=默认" />
                  </n-form-item>
                </n-gi>
                <n-gi>
                  <n-form-item label="Haiku 模型" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
                    <template #label>
                      <n-text style="font-size: 11px; font-weight: 600;">Haiku 模型 <n-text depth="3" style="font-weight: 400;">(兜底)</n-text></n-text>
                    </template>
                    <n-input v-model:value="form.haikuModel" placeholder="留空=默认" />
                  </n-form-item>
                </n-gi>
              </n-grid>
              <n-form-item label="Subagent 模型" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
                <template #label>
                  <n-text style="font-size: 11px; font-weight: 600;">Subagent 模型 <n-text depth="3" style="font-weight: 400;">(CLAUDE_CODE_SUBAGENT_MODEL)</n-text></n-text>
                </template>
                <n-input v-model:value="form.subagentModel" placeholder="留空=默认" />
              </n-form-item>
            </template>

            <!-- OpenClaw -->
            <template v-else-if="tab==='openclaw'">
              <n-form-item label="API 协议" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
                <n-select v-model:value="form.apiProtocol" :options="apiProtocolOptions" />
              </n-form-item>
              <div>
                <n-text style="font-size: 11px; font-weight: 600; display: block; margin-bottom: 6px;">模型列表 <n-text depth="3" style="font-weight: 400;">(第一行为默认主模型，其余为回退)</n-text></n-text>
                <n-data-table
                  :columns="openclawColumns"
                  :data="openclawRows"
                  :bordered="false"
                  size="small"
                  :max-height="200"
                />
                <n-text v-if="!openclawRows.length" depth="3" style="font-size: 12px; text-align: center; padding: 8px 0; display: block;">暂无模型，点下方按钮添加</n-text>
                <n-button dashed size="small" @click="addOpenclawRow" style="margin-top: 6px; width: 100%;">+ 添加模型</n-button>
                <n-text depth="3" style="font-size: 11px; margin-top: 4px; display: block;">切换时会写入 ~/.openclaw/openclaw.json 的 models.providers[供应商名]，主模型自动使用第一行，其余作为 fallback 依次回退。</n-text>
              </div>
            </template>

            <!-- Gemini -->
            <template v-else>
              <n-form-item label="模型" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
                <template #label>
                  <n-text style="font-size: 11px; font-weight: 600;">模型 <n-text depth="3" style="font-weight: 400;">(GEMINI_MODEL)</n-text></n-text>
                </template>
                <n-input v-model:value="form.model" placeholder="gemini-2.5-pro" />
              </n-form-item>
            </template>
          </n-flex>
        </n-card>

        <!-- 高级 -->
        <n-card title="高级" size="small" :bordered="true" class="section-card">
          <n-flex vertical :size="10">
            <n-form-item label="额外 Header" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
              <template #label>
                <n-text style="font-size: 11px; font-weight: 600;">额外 Header <n-text depth="3" style="font-weight: 400;">(每行一个 Key: Value)</n-text></n-text>
              </template>
              <n-input v-model:value="form.extraHeaders" type="textarea" :rows="3" placeholder="X-Custom: value" />
            </n-form-item>
            <template v-if="tab==='codex'">
              <n-form-item label="上游协议" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
                <template #label>
                  <n-text style="font-size: 11px; font-weight: 600;">上游协议 <n-text depth="3" style="font-size: 11px; font-weight: 400;">(供应商 API 格式，通常自动检测)</n-text></n-text>
                </template>
                <n-select v-model:value="codexProtocol" :options="codexProtocolOptions" />
              </n-form-item>
              <n-text depth="3" style="font-size: 11px;">按供应商真实 API 协议选择。Chat / Anthropic 需开启代理路由接管才能转换；Responses 与 Responses 兼容端点可直连。</n-text>
              <n-form-item label="最大输出 tokens" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
                <template #label>
                  <n-text style="font-size: 11px; font-weight: 600;">最大输出 tokens <n-text depth="3" style="font-weight: 400;">(max_tokens, 留空=默认8192)</n-text></n-text>
                </template>
                <n-input-number v-model:value="form.maxOutputTokens" placeholder="8192" :show-button="false" style="width: 100%;" />
              </n-form-item>
              <n-form-item label="自定义 User-Agent" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
                <n-input v-model:value="form.customUserAgent" placeholder="Mozilla/5.0 ..." />
              </n-form-item>
              <n-form-item label="Header 覆盖" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
                <template #label>
                  <n-text style="font-size: 11px; font-weight: 600;">Header 覆盖 <n-text depth="3" style="font-weight: 400;">(JSON, 代理转换时生效)</n-text></n-text>
                </template>
                <n-input v-model:value="form.headersOverride" type="textarea" :rows="2" placeholder='{"x-custom": "value"}' style="font-family: 'SF Mono', 'Fira Code', monospace;" />
              </n-form-item>
              <n-form-item label="Body 覆盖" label-placement="top" label-style="font-size: 11px; font-weight: 600;">
                <template #label>
                  <n-text style="font-size: 11px; font-weight: 600;">Body 覆盖 <n-text depth="3" style="font-weight: 400;">(JSON, 合并到请求体)</n-text></n-text>
                </template>
                <n-input v-model:value="form.bodyOverride" type="textarea" :rows="2" placeholder='{"max_output_tokens": 16384}' style="font-family: 'SF Mono', 'Fira Code', monospace;" />
              </n-form-item>
            </template>
          </n-flex>
        </n-card>
      </div>

      <template #footer>
        <n-flex justify="end" :size="8">
          <n-button quaternary @click="handleClose">取消</n-button>
          <n-button type="primary" strong @click="save">保存</n-button>
        </n-flex>
      </template>
    </n-drawer-content>
  </n-drawer>
</template>

<style scoped>
/* ── Drawer 项目基调 ── */
:deep(.n-drawer-body-content) {
  background: var(--bg);
  color: var(--text);
}

:deep(.n-drawer-content) {
  background: var(--bg) !important;
  color: var(--text);
  --n-text-color: var(--text);
}

:deep(.n-drawer-header__main) {
  color: var(--text);
}

:deep(.n-drawer-content .n-drawer-header) {
  background: var(--bg);
  border-bottom: 1px solid var(--border);
}

:deep(.n-drawer-content .n-drawer-footer) {
  background: var(--bg);
  border-top: 1px solid var(--border);
}

.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preset-section {
  padding-bottom: 2px;
}

.section-card :deep(.n-card__content) {
  padding: 8px 10px;
}

.section-card :deep(.n-card-header) {
  padding: 8px 10px 4px;
}

.section-card :deep(.n-card-header__main) {
  color: var(--text);
}

/* 表单项紧凑 */
.drawer-body :deep(.n-form-item) {
  margin-bottom: 0 !important;
  --n-label-padding-vertical: 0 0 2px 0 !important;
  --n-blank-height-small: 0px !important;
  --n-blank-height-medium: 0px !important;
  --n-blank-height-large: 0px !important;
}

.drawer-body :deep(.n-form-item .n-form-item-label) {
  font-weight: 600;
  padding-bottom: 2px !important;
  min-height: auto !important;
  line-height: 1.4;
}

/* 压缩 label 与控件之间的空白 */
.drawer-body :deep(.n-form-item .n-form-item-blank) {
  min-height: 0;
}

/* 选择器、输入框等控件紧凑 */
.drawer-body :deep(.n-base-selection),
.drawer-body :deep(.n-input) {
  --n-height: 30px !important;
}

/* 反馈区域无错误时不占位 */
.drawer-body :deep(.n-form-item .n-form-item-feedback-wrapper) {
  min-height: 0 !important;
  padding-top: 0 !important;
}

/* grid 内表单项无额外底部间距 */
.drawer-body :deep(.n-gi .n-form-item) {
  margin-bottom: 0;
}

/* DataTable 主题色 */
.drawer-body :deep(.n-data-table .n-data-table-th) {
  background-color: var(--bg-hover) !important;
  color: var(--text) !important;
}
.drawer-body :deep(.n-data-table .n-data-table-td) {
  background-color: var(--bg-card) !important;
  color: var(--text) !important;
}
.drawer-body :deep(.n-data-table .n-data-table-tr:hover .n-data-table-td) {
  background-color: var(--primary-light) !important;
}

.icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 2px 0;
}

.icon-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform .1s;
}

.icon-dot:hover {
  transform: scale(1.15);
}

.icon-dot--on {
  border-color: var(--text);
  box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--primary);
}

.toml-preview {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.toml-preview :deep(.n-collapse-item .n-collapse-item__header) {
  align-items: center;
}

.toml-preview :deep(.n-collapse-item .n-collapse-item__header-main) {
  display: flex;
  align-items: center;
  color: var(--text);
}

.toml-preview__code {
  background: var(--primary-light);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 10px;
  font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
}
</style>
