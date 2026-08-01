<script setup lang="ts">
// @ts-nocheck TODO: 逐步添加类型注解后移除
import { onMounted, ref, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { NIcon, NTabs, NTabPane, NInput, NSelect, NSpace, NButton, NEmpty, NText, NSkeleton, NSpin, useMessage, useDialog } from "naive-ui";
import { ArrowBackOutline, SearchOutline } from "@vicons/ionicons5";
import { useSession } from "../composables/useSession";
import AppDashboard from "../components/AppDashboard.vue";
import SessionCard from "../components/SessionCard.vue";
import SessionDetail from "../components/SessionDetail.vue";

const router = useRouter();
const message = useMessage();
const dialog = useDialog();
const {
  sessions,
  total,
  appStats,
  loading,
  loadingMore,
  switching,
  hasMore,
  showSkeleton,
  activeApp,
  searchQuery,
  sortBy,
  SESSION_APPS,
  SORT_OPTIONS,
  showDetail,
  detailSession,
  detailMessages,
  detailLoading,
  loadPage,
  loadMore,
  switchApp,
  onSearch,
  onSortChange,
  loadStats,
  loadDetail,
  closeDetail,
  deleteSession,
  clearSessions,
  exportSession,
  exportAllSessions,
  cleanup,
} = useSession();

// 搜索防抖
let searchTimer = null;
function onSearchInput(value) {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    onSearch(value);
  }, 300);
}

// 无限滚动（rAF 节流）
const scrollContainer = ref(null);
let scrollRaf = null;
function onScroll() {
  if (scrollRaf) return;
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = null;
    if (!scrollContainer.value || loadingMore.value || !hasMore.value) return;
    const el = scrollContainer.value;
    // 距底部 100px 时触发加载
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) {
      loadMore();
    }
  });
}

onMounted(() => {
  loadPage();
  loadStats();
});

onUnmounted(() => {
  if (searchTimer) clearTimeout(searchTimer);
  if (scrollRaf) cancelAnimationFrame(scrollRaf);
  cleanup();
});

function onDelete(session) {
  dialog.warning({
    title: "删除会话",
    content: "确定删除该会话？删除后无法恢复。",
    positiveText: "删除",
    negativeText: "取消",
    onPositiveClick: function () {
      deleteSession(session);
    },
  });
}

function onClear() {
  var label = SESSION_APPS.find(function (a) { return a.key === activeApp.value; })?.label || "";
  dialog.warning({
    title: "清空会话",
    content: "确定清空" + label + "的全部会话？删除后无法恢复。",
    positiveText: "清空",
    negativeText: "取消",
    onPositiveClick: function () {
      clearSessions();
    },
  });
}

function onView(session) {
  loadDetail(session);
}

function onExport(session) {
  exportSession(session, "json");
}

function onCopyTo(targetApp) {
  if (detailSession.value) {
    var app = detailSession.value.app;
    var cmd = (app === "codex" ? "codex" : "claude") + " --resume " + detailSession.value.id;
    navigator.clipboard.writeText(cmd).then(function () {
      message.success("已复制: " + cmd);
    });
    return;
  }
  message.info("跨应用复制功能开发中");
}
</script>

<template>
  <div class="page">
    <!-- 页头 -->
    <div class="page-header" v-once>
      <div class="page-header__left">
        <button class="back-btn" title="返回" @click="router.back()">
          <n-icon :size="16"><arrow-back-outline /></n-icon>
        </button>
        <span class="page-title">会话管理</span>
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
      <n-tabs :value="activeApp" type="segment" size="small" @update:value="switchApp">
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
        :value="searchQuery"
        placeholder="搜索会话..."
        clearable
        size="small"
        style="flex: 1;"
        @update:value="onSearchInput"
      >
        <template #prefix>
          <n-icon :size="14"><search-outline /></n-icon>
        </template>
      </n-input>
      <n-select
        :value="sortBy"
        :options="SORT_OPTIONS"
        size="small"
        style="width: 130px;"
        @update:value="onSortChange"
      />
    </div>

    <!-- 会话列表 -->
    <div class="page-body" ref="scrollContainer" @scroll="onScroll">
      <!-- 骨架屏 -->
      <template v-if="showSkeleton || switching">
        <div v-for="i in 5" :key="'sk-' + i" class="skeleton-card">
          <n-skeleton circle width="32px" height="32px" />
          <div class="skeleton-card__body">
            <n-skeleton text width="60%" style="margin-bottom: 6px;" />
            <n-skeleton text width="40%" style="margin-bottom: 4px;" />
            <n-skeleton text width="50%" />
          </div>
        </div>
      </template>

      <!-- 空状态 -->
      <n-empty v-else-if="!loading && sessions.length === 0" description="暂无会话记录" style="padding: 60px 0;">
        <template #extra>
          <n-text depth="3" style="font-size: 13px;">
            {{ searchQuery ? "未找到匹配的会话" : "暂无本地会话数据" }}
          </n-text>
        </template>
      </n-empty>

      <!-- 会话卡片 -->
      <template v-else>
        <SessionCard
          v-for="s in sessions"
          :key="s.id"
          :session="s"
          v-memo="[s.id, s.updatedAt]"
          @view="onView"
          @export="onExport"
          @delete="onDelete"
        />

        <!-- 加载更多骨架屏 -->
        <div v-if="loadingMore" class="loading-more">
          <n-spin size="small" />
          <n-text depth="3" style="margin-left: 8px;">加载中...</n-text>
        </div>

        <!-- 没有更多 -->
        <div v-else-if="!hasMore && sessions.length > 0" class="no-more">
          <n-text depth="3">没有更多了</n-text>
        </div>
      </template>
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

  // active tab hover 保持白色文字
  :deep(.n-tabs-tab--active:hover) {
    color: #fff !important;
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

// 骨架屏卡片
.skeleton-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-card);

  &__body {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
}

// 加载更多
.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 0;
}

// 没有更多
.no-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 0;
}
</style>
