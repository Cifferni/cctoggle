<script setup>
import { onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { NIcon, NTabs, NTabPane, NInput, NSelect, NSpace, NButton, NEmpty, NText } from "naive-ui";
import { ArrowBackOutline, SearchOutline } from "@vicons/ionicons5";
import { useSession } from "../composables/useSession.js";
import { confirm } from "../composables/useConfirm.js";
import AppDashboard from "../components/AppDashboard.vue";
import SessionCard from "../components/SessionCard.vue";
import SessionDetail from "../components/SessionDetail.vue";

const router = useRouter();
const {
  filteredSessions,
  appStats,
  loading,
  activeApp,
  searchQuery,
  sortBy,
  SESSION_APPS,
  SORT_OPTIONS,
  showDetail,
  detailSession,
  detailMessages,
  detailLoading,
  loadSessions,
  loadDetail,
  closeDetail,
  deleteSession,
  clearSessions,
  exportSession,
  exportAllSessions,
} = useSession();

onMounted(() => loadSessions());

async function onDelete(session) {
  const ok = await confirm("确定删除该会话？删除后无法恢复。", {
    title: "删除会话",
    confirmText: "删除",
    danger: true,
  });
  if (ok) deleteSession(session);
}

async function onClear() {
  var label = activeApp.value === "all" ? "所有" : (SESSION_APPS.find(function (a) { return a.key === activeApp.value; })?.label || "");
  const ok = await confirm(`确定清空${label}的全部会话？删除后无法恢复。`, {
    title: "清空会话",
    confirmText: "清空",
    danger: true,
  });
  if (ok) clearSessions();
}

function onView(session) {
  loadDetail(session);
}

function onExport(session) {
  exportSession(session, "json");
}

function onCopyTo(targetApp) {
  // 跨应用复制功能（TODO: 后续实现）
  // 暂时提示
  import("../composables/useToast.js").then(function (mod) {
    mod.toast.info("跨应用复制功能开发中");
  });
}
</script>

<template>
  <div class="page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="page-header__left">
        <button class="back-btn" title="返回" @click="router.back()">
          <n-icon :size="16"><arrow-back-outline /></n-icon>
        </button>
        <span class="page-title">会话管理</span>
        <n-tag v-if="filteredSessions.length" size="tiny" :bordered="false" round>{{ filteredSessions.length }}</n-tag>
      </div>
      <n-space :size="6">
        <n-button size="small" quaternary @click="exportAllSessions('json')">导出</n-button>
        <n-button size="small" quaternary type="error" @click="onClear">清空</n-button>
      </n-space>
    </div>

    <!-- 应用统计卡片 -->
    <AppDashboard :stats="appStats" unit="会话" />

    <!-- Tab 筛选 -->
    <div class="filter-bar">
      <n-tabs :value="activeApp" type="segment" size="small" @update:value="activeApp = $event">
        <n-tab-pane
          v-for="app in SESSION_APPS"
          :key="app.key"
          :name="app.key"
          :tab="app.label"
          display-directive="show"
        />
      </n-tabs>
    </div>

    <!-- 搜索 + 排序 -->
    <div class="search-bar">
      <n-input
        v-model:value="searchQuery"
        placeholder="搜索会话..."
        clearable
        size="small"
        style="flex: 1;"
      >
        <template #prefix>
          <n-icon :size="14"><search-outline /></n-icon>
        </template>
      </n-input>
      <n-select
        v-model:value="sortBy"
        :options="SORT_OPTIONS"
        size="small"
        style="width: 130px;"
      />
    </div>

    <!-- 会话列表 -->
    <div class="page-body">
      <n-empty v-if="!loading && filteredSessions.length === 0" description="暂无会话记录" style="padding: 60px 0;">
        <template #extra>
          <n-text depth="3" style="font-size: 13px;">
            {{ searchQuery ? "未找到匹配的会话" : "暂无本地会话数据" }}
          </n-text>
        </template>
      </n-empty>

      <n-empty v-else-if="loading" description="加载中..." style="padding: 60px 0;" />

      <SessionCard
        v-for="s in filteredSessions"
        :key="s.id"
        :session="s"
        @view="onView"
        @export="onExport"
        @delete="onDelete"
      />
    </div>

    <!-- 详情抽屉 -->
    <SessionDetail
      :show="showDetail"
      :session="detailSession"
      :messages="detailMessages"
      :loading="detailLoading"
      @update:show="closeDetail"
      @export="onExport"
      @copy-to="onCopyTo"
    />
  </div>
</template>

<style lang="scss" scoped>
.page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px 8px;
  flex-shrink: 0;
}

.page-header__left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-btn {
  display: flex;
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

  &:hover {
    background: var(--bg-hover);
    color: var(--text);
  }
}

.page-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

// 筛选栏
.filter-bar {
  padding: 0 20px 6px;
  flex-shrink: 0;

  :deep(.n-tabs) {
    --n-tab-border-radius: 6px;
  }

  :deep(.n-tabs-tab) {
    font-size: 12px;
    padding: 4px 10px;
    min-height: 28px;
  }
}

// 搜索栏
.search-bar {
  display: flex;
  gap: 8px;
  padding: 0 20px 8px;
  flex-shrink: 0;
}

// 列表区域
.page-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
