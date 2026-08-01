# 前端详解

## 组件结构

### 主应用组件（App.vue）
```vue
<script setup>
import { useTheme } from './composables/useTheme.js'
import { zhCN, dateZhCN } from 'naive-ui'
import AppFooter from './components/AppFooter.vue'

const { theme, themeOverrides, isDark } = useTheme()
</script>

<template>
  <n-config-provider :locale="zhCN" :date-locale="dateZhCN" :theme="theme" :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-notification-provider>
        <n-dialog-provider>
          <div class="app-shell" :class="{ dark: isDark }">
            <main class="app-main">
              <router-view />
            </main>
            <AppFooter />
          </div>
        </n-dialog-provider>
      </n-notification-provider>
    </n-message-provider>
  </n-config-provider>
</template>
```

**组件结构：**
- `n-config-provider` - Naive UI 全局配置（主题、国际化）
- `n-message-provider` - 消息提示支持
- `n-notification-provider` - 通知支持
- `n-dialog-provider` - 对话框支持
- `app-shell` - 应用外壳（全屏布局）
- `app-main` - 主内容区（路由视图）
- `AppFooter` - 底部导航栏

---

### 导航栏（TabBar.vue）
```vue
<!-- src/components/TabBar.vue -->
<nav class="tab-bar">
  <!-- Agent 标签页 -->
  <n-tabs :value="activeTab()" @update:value="onTabChange">
    <n-tab-pane v-for="t in APP_TYPES" :key="t" :name="t" :tab="APP_LABELS[t]">
      <template #tab>
        <span class="tab-label">
          <img :src="APP_ICONS[t]" :alt="APP_LABELS[t]" class="tab-icon-img" />
          {{ APP_LABELS[t] }}
        </span>
      </template>
    </n-tab-pane>
  </n-tabs>

  <!-- 代理开关 -->
  <label class="proxy-switch">
    <span class="proxy-label">代理</span>
    <n-switch :value="proxyOn" @update:value="onToggleProxy" />
  </label>

  <!-- 功能导航按钮 -->
  <button class="nav-btn" @click="router.push('/stats')">用量统计</button>
  <button class="nav-btn" @click="router.push('/prompts')">提示词管理</button>
  <button class="nav-btn" @click="router.push('/skills')">Skill管理</button>
  <button class="nav-btn" @click="router.push('/mcp')">MCP管理</button>
  <button class="nav-btn" @click="router.push('/sessions')">会话管理</button>
  <button class="nav-btn" @click="router.push('/settings')">设置</button>
</nav>
```

**导航栏功能：**
- Agent 标签页切换（Codex/Claude/Desktop/OpenClaw/Gemini）
- 代理快速开关
- 功能页面导航（统计/提示词/Skill/MCP/会话/设置）

---

### 主页面（ProviderListPage.vue）
```vue
<!-- src/views/ProviderListPage.vue -->
<script setup>
import { ref, computed, onMounted } from "vue";
import { useProviders } from "../composables/useProviders.js";
import TabBar from "../components/TabBar.vue";
import ProviderCard from "../components/ProviderCard.vue";
import ProviderForm from "../components/ProviderForm.vue";

const { providers, loadProviders, switchProvider, saveProvider, deleteProvider, getFullProvider } = useProviders();
const showForm = ref(false), editingId = ref(null), formInitialData = ref(null);

const currentProvider = computed(() => providers.value.find(p => p.isCurrent));
const otherProviders = computed(() => providers.value.filter(p => !p.isCurrent));

onMounted(() => loadProviders());
</script>

<template>
  <div class="page">
    <!-- 导航栏 -->
    <div class="tab-bar-wrap">
      <TabBar />
    </div>

    <!-- 页面内容 -->
    <div class="page-body">
      <!-- 页面头部 -->
      <div class="page-header">
        <n-text>{{ providers.length }} 个供应商</n-text>
        <n-button type="primary" @click="onAdd">+ 添加供应商</n-button>
      </div>

      <!-- 当前供应商 -->
      <ProviderCard v-if="currentProvider" :provider="currentProvider" @switch="switchProvider" @edit="onEdit" @delete="onDelete" />

      <!-- 其他供应商网格 -->
      <div v-if="otherProviders.length" class="providers-section">
        <div class="section-label">其他供应商</div>
        <n-grid :cols="2" :x-gap="8" :y-gap="8">
          <n-gi v-for="p in otherProviders" :key="p.id">
            <ProviderCard :provider="p" compact @switch="switchProvider" @edit="onEdit" @delete="onDelete" />
          </n-gi>
        </n-grid>
      </div>
    </div>

    <!-- 供应商表单弹窗 -->
    <ProviderForm :visible="showForm" :initial-data="formInitialData" @close="showForm = false" @save="onSave" />
  </div>
</template>
```

**页面功能：**
- 显示当前激活的供应商（大卡片）
- 显示其他供应商（小卡片网格）
- 添加/编辑/删除供应商
- 切换供应商（写入配置文件）

---

### 供应商卡片（ProviderCard.vue）
```vue
<!-- src/components/ProviderCard.vue -->
<script setup>
const props = defineProps({ provider: Object, compact: Boolean });
const emit = defineEmits(["switch", "edit", "delete"]);

// 代理提示（仅 Codex）
const proxyHint = computed(() => {
  const p = props.provider || {};
  if (p.configType !== "openai") return null;
  const af = p.apiFormat || "";
  if (af === "anthropic") return { level: "required", label: "需代理", tip: "该供应商为 Anthropic 协议，Codex 无法直连，必须开启代理接管。" };
  if (af === "openai_chat") return { level: "optional", label: "可代理", tip: "该供应商仅支持 Chat Completions。可直连(连接协议选 Chat)，或走代理接管获得协议转换与多供应商切换。" };
  return null;
});
</script>

<template>
  <n-card class="provider-card" :class="{ 'provider-card--active': provider.isCurrent }">
    <!-- 完整布局（当前供应商） -->
    <div v-if="!compact" class="provider-row">
      <div class="provider-info">
        <div class="provider-name">
          <n-text strong>{{ provider.name }}</n-text>
          <n-tag v-if="provider.isCurrent" type="success" size="tiny">当前</n-tag>
          <n-tag v-if="provider.category && provider.category !== 'custom'" size="tiny">
            {{ CAT_LABELS[provider.category] }}
          </n-tag>
          <n-tag size="tiny">{{ provider.configType }}</n-tag>
          <n-tooltip v-if="proxyHint" trigger="hover">
            <template #trigger>
              <n-tag size="tiny" :type="proxyHint.level === 'required' ? 'error' : 'info'">{{ proxyHint.label }}</n-tag>
            </template>
            {{ proxyHint.tip }}
          </n-tooltip>
        </div>
        <div class="provider-meta">
          <span v-if="provider.baseUrl" class="meta-url">{{ provider.baseUrl }}</span>
          <span class="meta-model">{{ provider.model }}</span>
          <n-tag v-if="provider.models && provider.models.length" type="primary" size="tiny">
            +{{ provider.models.length }} 模型
          </n-tag>
        </div>
      </div>
      <n-space class="provider-actions">
        <n-button :type="provider.isCurrent ? 'default' : 'primary'" :disabled="provider.isCurrent" @click="emit('switch', provider.id)">
          {{ provider.isCurrent ? '已激活' : '切换' }}
        </n-button>
        <n-button quaternary @click="emit('edit', provider.id)">编辑</n-button>
        <n-popconfirm @positive-click="emit('delete', provider.id)">
          <template #trigger><n-button quaternary type="error">删除</n-button></template>
          确定删除该供应商？
        </n-popconfirm>
      </n-space>
    </div>

    <!-- 紧凑布局（其他供应商） -->
    <div v-else class="compact-grid">
      <div class="compact-info">
        <div class="compact-row1">
          <n-text strong>{{ provider.name }}</n-text>
          <span class="meta-model">{{ provider.model }}</span>
        </div>
      </div>
      <n-space class="compact-actions">
        <!-- 同上操作按钮 -->
      </n-space>
    </div>
  </n-card>
</template>
```

**卡片特性：**
- 双布局模式：完整布局（当前供应商）/ 紧凑布局（其他供应商）
- 代理提示：根据 `apiFormat` 显示代理需求提示
- 分类标签：官方/国内官方/合作/Prime/第三方/自定义
- 激活状态：左侧边框高亮 + 背景色变化

---

### 供应商表单（ProviderForm.vue）
```vue
<!-- src/components/ProviderForm.vue -->
<script setup>
const props = defineProps({ visible: Boolean, initialData: Object });
const emit = defineEmits(["close", "save"]);

import { useProviders } from "../composables/useProviders.js";
const { PRESETS, activeTab, presetToProviderData } = useProviders();

// 表单数据
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

// Codex 协议字段映射
const PROTOCOL_FIELDS = {
  "":                { apiFormat: "",                 wireApi: "responses" }, // 原生 Responses 直连
  "openai_chat":     { apiFormat: "openai_chat",      wireApi: "chat" },      // Chat Completions
  "openai_responses":{ apiFormat: "openai_responses", wireApi: "responses" }, // Responses 兼容端点
  "anthropic":       { apiFormat: "anthropic",        wireApi: "responses" }, // Anthropic Messages
};

// 自动推荐协议（仅 Codex）
const CHAT_ONLY_HINTS = [
  "deepseek.com", "dashscope", "moonshot.cn", "bigmodel.cn",
  "open.bigmodel", "siliconflow", "hunyuan",
];
</script>
```

**表单特性：**
- 多 Agent 适配：根据 `activeTab()` 显示不同字段
- 预设选择：从内置预设快速填充
- 协议自动推荐：根据 baseUrl/model 自动选择 `apiFormat`
- 实时预览：Codex 显示 config.toml 预览
- 图标选择：预设图标色板
- 分类管理：官方/国内官方/合作/Prime/第三方/自定义

---

### 图表组件（EChart.vue）
```vue
<!-- src/components/EChart.vue -->
<script setup>
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler } from "chart.js";
import { Bar, Line, Pie } from "vue-chartjs";
import { MatrixController, MatrixElement } from "chartjs-chart-matrix";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler, MatrixController, MatrixElement);

const props = defineProps({
  type: { type: String, required: true },       // "bar" | "line" | "pie" | "matrix"
  data: { type: Object, required: true },        // Chart.js data
  options: { type: Object, default: () => ({}) }, // Chart.js options
  height: { type: String, default: "260px" },
});

const componentMap = { bar: Bar, line: Line, pie: Pie };
const chartComp = computed(() => componentMap[props.type] || null);

// matrix 类型：手动管理 Chart.js 实例
const canvasRef = ref(null);
let chartInstance = null;

function createMatrixChart() {
  if (!canvasRef.value) return;
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  chartInstance = new ChartJS(canvasRef.value, {
    type: "matrix",
    data: props.data,
    options: props.options,
  });
}
</script>

<template>
  <div class="chart-wrap" :class="{ matrix: type === 'matrix' }" :style="{ height }">
    <template v-if="chartComp">
      <component :is="chartComp" :data="data" :options="options" />
    </template>
    <template v-else-if="type === 'matrix'">
      <canvas ref="canvasRef"></canvas>
    </template>
  </div>
</template>
```

**图表类型：**
- `bar` - 柱状图（使用 vue-chartjs 的 Bar 组件）
- `line` - 折线图（使用 vue-chartjs 的 Line 组件）
- `pie` - 饼图（使用 vue-chartjs 的 Pie 组件）
- `matrix` - 热力图（使用 chartjs-chart-matrix，手动管理实例）

---

## Composables

### 供应商管理（useProviders.js）
```javascript
// composables/useProviders.js
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
    appMessage.success("已切换到 " + r.providerName);
    // Codex 直连：anthropic 必须用代理；openai_chat 可直连但推荐代理
    const fmt = target && target.apiFormat;
    if (tab === "codex" && (fmt === "openai_chat" || fmt === "anthropic")) {
      let proxyRunning = false;
      try { proxyRunning = !!useRoutes().runtime[tab]?.running; } catch (e) {}
      if (!proxyRunning) {
        const msg = fmt === "anthropic" ? "该供应商为 Anthropic 协议，Codex 无法直连，请开启代理后使用" : "该供应商为 Chat 协议，直连需将连接协议选为 Chat，或开启代理获得自动转换";
        appMessage.warning(msg, { duration: 5000 });
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
  } else if (tab === "claude" || tab === "claude-desktop") {
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

export function useProviders() {
  return {
    APP_TYPES, APP_LABELS, APP_ICONS, PRESETS,
    activeTab, setActiveTab, providers, paths,
    loadProviders, switchProvider,
    saveProvider, deleteProvider, importPreset, getFullProvider,
    presetToProviderData,
  };
}
```

---

### 路由管理（useRoutes.js）
```javascript
// composables/useRoutes.js
function _emptyRt() {
  return {
    running: false, port: 0, members: [], logs: [],
    startedAt: 0, activeConn: 0, reqTotal: 0, reqSuccess: 0, reqFail: 0,
    lastMemberId: null,
  };
}

const runtime = reactive({
  codex: _emptyRt(),
  claude: _emptyRt(),
  gemini: _emptyRt(),
});

let _wired = false;

function _wireEvents() {
  if (_wired) return;
  _wired = true;
  try {
    getSkillNest().onProxyEvent((channel, data) => {
      if (channel === "proxy-log" && data) {
        const active = Object.keys(runtime).find(a => runtime[a].running) || "codex";
        const logs = runtime[active].logs;
        logs.push(data);
        if (logs.length > 200) logs.splice(0, logs.length - 200);
      }
      if (channel === "proxy-stat" && data) {
        for (const app of Object.keys(runtime)) {
          if (runtime[app].port && runtime[app].port === data.port) {
            Object.assign(runtime[app], {
              running: !!data.running,
              members: data.members || [],
              startedAt: data.startedAt || 0,
              activeConn: data.activeConn || 0,
              reqTotal: data.reqTotal || 0,
              reqSuccess: data.reqSuccess || 0,
              reqFail: data.reqFail || 0,
              lastMemberId: data.lastMemberId || null,
            });
          }
        }
      }
    });
  } catch (e) {}
}

function refreshStatus(appType) {
  if (!appType || !runtime[appType]) return;
  _wireEvents();
  const s = getSkillNest().getProxyStatus(appType) || {};
  const rt = runtime[appType];
  Object.assign(rt, {
    running: !!s.running,
    port: s.port || 0,
    members: s.members || [],
    logs: s.logs || rt.logs,
    startedAt: s.startedAt || 0,
    activeConn: s.activeConn || 0,
    reqTotal: s.reqTotal || 0,
    reqSuccess: s.reqSuccess || 0,
    reqFail: s.reqFail || 0,
    lastMemberId: s.lastMemberId || null,
  });
}

function listGroups(appType) { return getSkillNest().listRouteGroups(appType) || []; }
function saveGroup(g) { return getSkillNest().saveRouteGroup(g); }
function deleteGroup(appType, id) { return getSkillNest().deleteRouteGroup(appType, id); }

function startProxy(appType, groupId) {
  _wireEvents();
  const r = getSkillNest().startProxy(appType, groupId);
  refreshStatus(appType);
  return r;
}

function stopProxy(appType) {
  const r = getSkillNest().stopProxy(appType);
  refreshStatus(appType);
  return r;
}

function toggleQuick(appType) {
  _wireEvents();
  const r = getSkillNest().toggleProxyQuick(appType);
  refreshAll();
  setTimeout(refreshAll, 300);
  return r;
}

function takeover(appType, port) { return getSkillNest().takeoverApp(appType, port); }
function restore(appType) { return getSkillNest().restoreApp(appType); }

function getProxyPort(appType) {
  try { return getSkillNest().getProxyPort(appType) || 8788; } catch (e) { return 8788; }
}

function setProxyPort(appType, port) {
  return getSkillNest().setProxyPort(appType, port) || { success: false };
}

export function useRoutes() {
  return {
    runtime,
    listGroups, saveGroup, deleteGroup,
    startProxy, stopProxy, toggleQuick,
    takeover, restore, refreshStatus,
    getProxyPort, setProxyPort,
  };
}
```

---

### 统计功能（useStats.js）
```javascript
// composables/useStats.js
const filter = reactive({ appType: "all", days: 7 });
const rawDaily = ref([]);  // 上次扫描返回的全部原始按天记录
const stats = ref({
  totals: { requests: 0, input: 0, output: 0, cacheRead: 0, cacheCreate: 0, total: 0 },
  daily: [],
  models: [],
});

// 扫描本地 CLI 日志（无缓存、异步）
async function refresh() {
  const api = getSkillNest();
  const r = (await api.scanUsageLogs()) || { daily: [] };
  rawDaily.value = r.daily || [];
  applyFilter();  // 按当前 filter 聚合
}

// 依据当前 filter，从 rawDaily 聚合出展示用 stats（纯内存，瞬时）
function applyFilter() {
  const totals = { ...EMPTY_TOTALS };
  const models = {};
  const daily = [];
  for (const rec of rawDaily.value) {
    if (filter.appType !== "all" && rec.appType !== filter.appType) continue;
    if (minDay && rec.day < minDay) continue;
    daily.push({ day: rec.day, appType: rec.appType, ... });
    totals.requests += rec.requests || 0;
    // ... 累加其他字段
    for (const mid of Object.keys(rec.models || {})) {
      // 聚合模型统计
    }
  }
  stats.value = { totals, daily, models: modelList };
}

// 清除：记录清除时间戳（隐藏该时间点之前的历史）
async function clearStats(appType) {
  const r = getSkillNest().clearStats(appType || "all");
  if (r.success) {
    appMessage.success("已清除统计数据");
    await refresh();
  }
}

// 缓存命中率计算
function cacheHitRate(t) {
  const tot = t || stats.value.totals;
  const denom = (tot.input || 0) + (tot.cacheRead || 0);
  if (!denom) return 0;
  return Math.min(1, (tot.cacheRead || 0) / denom);
}

export function useStats() {
  return {
    APP_TYPES, APP_LABELS,
    filter, stats, rawDaily, refreshing, initialLoading,
    refresh, setAppType, setDays, clearStats, cacheHitRate,
  };
}
```

---

### 提示词管理（usePrompts.js）
```javascript
// composables/usePrompts.js
const ALL_AGENTS = ["codex", "claude", "gemini", "openclaw"];
const AGENT_LABELS = { codex: "Codex", claude: "Claude", gemini: "Gemini", openclaw: "OpenClaw" };

const prompts = ref([]);
const activePrompt = ref(null);
const loading = ref(false);
const activeAgentTab = ref("all");
const backups = ref({});
const originalPrompts = ref({});

// 按 Agent 过滤提示词
const filteredPrompts = computed(() => {
  if (activeAgentTab.value === "all") return prompts.value;
  return prompts.value.filter(p => p.agents?.includes(activeAgentTab.value));
});

// CRUD 操作
function loadPrompts() { prompts.value = _ccs().listPrompts() || []; }
function savePrompt(prompt) { /* 创建或更新提示词 */ }
function deletePrompt(id) { /* 删除提示词 */ }
function duplicatePrompt(id) { /* 复制提示词 */ }

// 导入导出
function exportPrompts() { return JSON.stringify(prompts.value, null, 2); }
function importPrompts(jsonString) { /* 从 JSON 导入 */ }

// 模板操作
function createFromTemplate(template) { /* 从模板创建 */ }

// 备份恢复
function backupOriginalPrompts() { /* 备份原始提示词 */ }
function backupSelectedPrompts(agentList) { /* 备份选中 Agent */ }
function restoreOriginalPrompt(agent) { /* 恢复单个 Agent */ }
function restoreAllOriginalPrompts() { /* 恢复所有 Agent */ }

// Agent 关联
function applyPromptToAgent(promptId, agent) { /* 应用到 Agent */ }
function togglePromptAgent(promptId, agent) { /* 切换关联状态 */ }

export function usePrompts() {
  return {
    ALL_AGENTS, AGENT_LABELS,
    prompts, activePrompt, loading, activeAgentTab, filteredPrompts, backups, originalPrompts,
    loadPrompts, savePrompt, deletePrompt, duplicatePrompt, setActivePrompt,
    exportPrompts, importPrompts, createFromTemplate,
    loadBackups, backupOriginalPrompts, backupSelectedPrompts, loadOriginalPrompts,
    restoreOriginalPrompt, restoreAllOriginalPrompts, hasBackup, getBackupContent,
    applyPromptToAgent, togglePromptAgent,
  };
}
```

---

### 会话管理（useSession.js）
```javascript
// composables/useSession.js
const SESSION_APPS = [
  { key: "claude", label: "Claude" },
  { key: "claude-desktop", label: "Desktop" },
  { key: "codex", label: "Codex" },
  { key: "openclaw", label: "OpenClaw" },
];

const SORT_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "today", label: "今日活跃" },
  { value: "time-desc", label: "时间倒序" },
  { value: "time-asc", label: "时间正序" },
  { value: "name-asc", label: "名称 A-Z" },
  { value: "name-desc", label: "名称 Z-A" },
];

const PAGE_SIZE = 20;

// 状态
const sessions = ref([]);
const offset = ref(0);
const total = ref(0);
const loading = ref(false);
const loadingMore = ref(false);
const activeApp = ref("claude");
const searchQuery = ref("");
const sortBy = ref("all");
const detailSession = ref(null);
const detailMessages = ref([]);

// 分页加载
async function loadPage() { /* 加载第一页（重置） */ }
async function loadMore() { /* 加载下一页（追加） */ }

// Tab 切换
async function switchApp(app) {
  activeApp.value = app;
  sessions.value = [];
  await loadPage();
}

// 搜索排序
async function onSearch(query) { /* 搜索后重新加载 */ }
async function onSortChange(sort) { /* 排序后重新加载 */ }

// 详情加载
async function loadDetail(session) {
  detailMessages.value = await getSkillNest().loadSessionDetail(session.filePath);
}

// 删除清空
function deleteSession(session) { /* 删除单个会话 */ }
async function clearSessions(app) { /* 清空指定 App 会话 */ }

// 导出
function exportSession(session, format) { /* 导出单个会话（Markdown/JSON） */ }
function exportAllSessions(format) { /* 导出所有会话 */ }

export function useSession() {
  return {
    sessions, total, appStats, loading, loadingMore, switching,
    hasMore, showSkeleton,
    activeApp, searchQuery, sortBy, SESSION_APPS, SORT_OPTIONS,
    showDetail, detailSession, detailMessages, detailLoading,
    loadPage, loadMore, switchApp, onSearch, onSortChange, loadStats,
    loadDetail, closeDetail, deleteSession, clearSessions,
    exportSession, exportAllSessions, cleanup,
  };
}
```

---

### MCP 管理（useMcp.js）
```javascript
// composables/useMcp.js
const mcpServers = ref([]);

function loadServers() { mcpServers.value = getSkillNest().listMcpServers(); }
function saveServer(data) { getSkillNest().saveMcpServer(toPlain(data)); loadServers(); }
function deleteServer(id) { getSkillNest().deleteMcpServer(id); loadServers(); }
function toggleServer(id) { getSkillNest().toggleMcpServer(id); loadServers(); }
function getServer(id) { return getSkillNest().getMcpServer(id); }
function syncFromConfigFiles() { getSkillNest().syncFromConfigFiles(); loadServers(); }

export function useMcp() {
  return {
    mcpServers,
    loadServers, saveServer, deleteServer, toggleServer, getServer, syncFromConfigFiles,
  };
}
```

---

## 消息提示系统

### 实现方式
```javascript
// composables/useAppMessage.js
import { createDiscreteApi } from "naive-ui";

// 独立的 message / dialog 实例，供 composable 在 setup 外使用
const { message, dialog } = createDiscreteApi(["message", "dialog"]);

export { message as appMessage, dialog as appDialog };
```

### 使用方法
```javascript
import { appMessage, appDialog } from "../composables/useAppMessage.js";

// 成功提示
appMessage.success("操作成功");

// 警告提示
appMessage.warning("请注意", { duration: 5000 });

// 错误提示
appMessage.error("操作失败");

// 确认对话框
appDialog.warning({
  title: "确认删除",
  content: "确定要删除这个供应商吗？",
  positiveText: "确定",
  negativeText: "取消",
  onPositiveClick: () => { /* 执行删除 */ },
});
```

### 设计优势
- 独立于 Vue 组件生命周期
- 可在 composable 中直接使用（无需组件上下文）
- 全局单例，避免重复创建

---

## 工具函数

### src/utils/
```javascript
// utils/markdown.js - Markdown 渲染
import { marked } from "marked";
marked.setOptions({ gfm: true, breaks: true });

export function renderMarkdown(content) {
  if (!content) return "";
  try {
    return marked(content);
  } catch (e) {
    console.error("Markdown parse error:", e);
    return content;
  }
}

// utils/openUrl.js - URL 打开
export function openUrl(url) {
  try {
    window.utools?.shellOpenExternal?.(url);
  } catch (e) {
    window.open(url, "_blank");
  }
}
```

### 使用场景
- `renderMarkdown()` - 提示词预览、会话详情的 Markdown 渲染
- `openUrl()` - 打开供应商网站、API Key 申请页面等外部链接
