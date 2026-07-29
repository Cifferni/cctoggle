<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { NIcon, NTabs, NTabPane, NSwitch } from "naive-ui";
import { BuildOutline, SettingsOutline, CubeOutline, StatsChartOutline } from "@vicons/ionicons5";
import { useProviders } from "../composables/useProviders.js";
import { useRoutes } from "../composables/useRoutes.js";
import { toast } from "../composables/useToast.js";

const { APP_TYPES, APP_LABELS, APP_ICONS, activeTab, setActiveTab } = useProviders();
const { runtime, toggleQuick } = useRoutes();
const router = useRouter();

const proxyOn = computed(() => !!runtime[activeTab()]?.running);

function onTabChange(val) {
  setActiveTab(val);
}

function onToggleProxy() {
  const app = activeTab();
  if (!proxyOn.value) {
    try {
      const list = window.utoolsCctoggle?.listProviders?.(app) || [];
      if (!list.length) {
        toast.warn("当前 App 还没有供应商，请先添加供应商");
        return;
      }
      if (!list.some(p => p.isCurrent)) {
        toast.warn("当前 App 没有已激活的供应商，请先点击「切换」激活一个供应商");
        return;
      }
    } catch (e) {}
  }
  const r = toggleQuick(app);
  if (!r.success && (r.error === "no providers" || r.error === "no members")) {
    toast.warn("当前 App 还没有可用的供应商，请先添加供应商");
  } else if (!r.success) {
    toast.error("操作失败：" + (r.error || "unknown"));
  } else {
    toast.success(r.running ? "路由已开启" : "路由已关闭");
  }
}
</script>

<template>
  <nav class="tab-bar">
    <n-tabs
      :value="activeTab()"
      type="line"
      size="small"
      scrollable
      class="app-tabs"
      @update:value="onTabChange"
    >
      <n-tab-pane
        v-for="t in APP_TYPES"
        :key="t"
        :name="t"
        :tab="APP_LABELS[t]"
      >
        <template #tab>
          <span class="tab-label">
            <img :src="APP_ICONS[t]" :alt="APP_LABELS[t]" class="tab-icon-img" />
            {{ APP_LABELS[t] }}
          </span>
        </template>
        <!-- 内容由 ProviderListPage 渲染，这里不渲染任何内容 -->
      </n-tab-pane>
    </n-tabs>

    <span class="tab-divider"></span>

    <button class="nav-btn" title="用量统计" @click="router.push('/stats')">
      <n-icon :size="15"><stats-chart-outline /></n-icon>
    </button>

    <label
      class="proxy-switch"
      :title="proxyOn ? APP_LABELS[activeTab()] + ' 代理运行中，点击关闭' : '打开以为 ' + APP_LABELS[activeTab()] + ' 开启代理'"
    >
      <span class="proxy-label">代理</span>
      <n-switch :value="proxyOn" size="small" @update:value="onToggleProxy" />
    </label>

    <button class="nav-btn" title="Skill管理" @click="router.push('/skills')">
      <n-icon :size="15"><build-outline /></n-icon>
    </button>
    <button class="nav-btn" title="MCP管理" @click="router.push('/mcp')">
      <n-icon :size="15"><cube-outline /></n-icon>
    </button>
    <button class="nav-btn" title="设置" @click="router.push('/settings')">
      <n-icon :size="15"><settings-outline /></n-icon>
    </button>
  </nav>
</template>

<style scoped>
.tab-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-hover);
}
.app-tabs {
  flex-shrink: 1;
  min-width: 0;
}
.app-tabs :deep(.n-tabs-tab-pad) {
  width: 20px !important;
}
.app-tabs :deep(.n-tabs-content) {
  height: 0 !important;
  overflow: hidden !important;
  min-height: 0 !important;
}
.app-tabs :deep(.n-tab-pane) {
  height: 0 !important;
  min-height: 0 !important;
  padding-top: 0 !important;
}
.app-tabs :deep(.n-tabs-tab) {
  padding: 4px 4px;
  font-size: 12px;
}
.app-tabs :deep(.n-tabs-nav-scroll-content) {
  height: 36px;
  border: none !important;
}
.app-tabs :deep(.n-tabs-bar) {
  background-color: var(--primary) !important;
}
.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.tab-icon-img {
  width: 14px;
  height: 14px;
  vertical-align: middle;
  object-fit: contain;
}
.tab-divider {
  flex: 1;
  min-width: 4px;
}
.nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 6px;
  transition: all .15s;
}
.nav-btn:hover {
  background: var(--bg-card);
  color: var(--text);
}

.proxy-switch {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;
}
.proxy-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
}
</style>
