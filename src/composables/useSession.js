// composables/useSession.js
import { ref, computed, nextTick } from "vue";
import { appMessage } from "./useAppMessage.js";
import { getSkillNest, APP_ICONS } from "./shared.js";

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

export function useSession() {
  // 组件级状态（随组件销毁自动回收）
  const sessions = ref([]);
  const offset = ref(0);
  const total = ref(0);
  const loading = ref(false);
  const loadingMore = ref(false);
  const switching = ref(false);
  const activeApp = ref("claude");
  const searchQuery = ref("");
  const sortBy = ref("all");
  const detailSession = ref(null);
  const detailMessages = ref([]);
  const detailLoading = ref(false);
  const showDetail = ref(false);

  const appStats = ref(
    SESSION_APPS.map(function (a) {
      return { app: a.key, label: a.label, icon: APP_ICONS[a.key] || null, count: 0 };
    })
  );

  // 计算属性
  const hasMore = computed(() => sessions.value.length < total.value);
  const showSkeleton = computed(() => loading.value && sessions.value.length === 0);

  // 加载第一页（重置）
  async function loadPage() {
    var myApp = activeApp.value;
    sessions.value = [];
    offset.value = 0;
    total.value = 0;
    loading.value = true;
    try {
      var result = await getSkillNest().scanSessions(myApp, {
        offset: 0,
        limit: PAGE_SIZE,
        search: searchQuery.value,
        sort: sortBy.value,
      });
      // 用户已切换 tab，丢弃结果
      if (activeApp.value !== myApp) return;
      sessions.value = result.sessions || [];
      total.value = result.total || 0;
    } catch (e) {
      if (activeApp.value !== myApp) return;
      console.error("Failed to load sessions:", e);
      sessions.value = [];
      total.value = 0;
    } finally {
      if (activeApp.value === myApp) loading.value = false;
    }
  }

  // 加载下一页（追加）
  async function loadMore() {
    if (loadingMore.value || !hasMore.value) return;
    var myApp = activeApp.value;
    loadingMore.value = true;
    try {
      var nextOffset = offset.value + PAGE_SIZE;
      var result = await getSkillNest().scanSessions(myApp, {
        offset: nextOffset,
        limit: PAGE_SIZE,
        search: searchQuery.value,
        sort: sortBy.value,
      });
      if (activeApp.value !== myApp) return;
      sessions.value = [...sessions.value, ...(result.sessions || [])];
      offset.value = nextOffset;
    } catch (e) {
      if (activeApp.value !== myApp) return;
      console.error("Failed to load more sessions:", e);
    } finally {
      loadingMore.value = false;
    }
  }

  // 切换 Tab（先清空展示骨架屏，再加载数据）
  async function switchApp(app) {
    if (switching.value) return;
    switching.value = true;
    activeApp.value = app;
    searchQuery.value = "";
    sessions.value = [];
    total.value = 0;
    await nextTick();
    try {
      await loadPage();
    } finally {
      switching.value = false;
    }
  }

  // 搜索（防抖后调用）
  async function onSearch(query) {
    searchQuery.value = query;
    await loadPage();
  }

  // 排序变更
  async function onSortChange(sort) {
    sortBy.value = sort;
    await loadPage();
  }

  // 加载统计（后台异步，并行请求）
  async function loadStats() {
    try {
      var apps = SESSION_APPS;
      var results = await Promise.all(
        apps.map(function (app) {
          return getSkillNest().scanSessions(app.key, { offset: 0, limit: 0 });
        })
      );
      appStats.value = apps.map(function (app, i) {
        return {
          app: app.key,
          label: app.label,
          icon: APP_ICONS[app.key] || null,
          count: (results[i] && results[i].total) || 0,
        };
      });
    } catch (e) {
      console.error("Failed to load stats:", e);
    }
  }

  async function loadDetail(session) {
    detailLoading.value = true;
    showDetail.value = true;
    detailSession.value = session;
    detailMessages.value = [];

    try {
      var msgs = await getSkillNest().loadSessionDetail(session.filePath);
      detailMessages.value = msgs || [];
    } catch (e) {
      console.error("Failed to load session detail:", e);
      detailMessages.value = [];
    } finally {
      detailLoading.value = false;
    }
  }

  function closeDetail() {
    showDetail.value = false;
    detailSession.value = null;
    detailMessages.value = [];
  }

  function deleteSession(session) {
    var result = getSkillNest().deleteSession(session.filePath);
    if (result.success) {
      sessions.value = sessions.value.filter(function (s) { return s.id !== session.id; });
      total.value = Math.max(0, total.value - 1);
      appMessage.success("会话已删除");
    } else {
      appMessage.error("删除失败：" + (result.error || "未知错误"));
    }
    return result;
  }

  async function clearSessions(app) {
    var target = app || activeApp.value;
    var toDelete = sessions.value.filter(function (s) {
      return s.app === target;
    });
    if (toDelete.length === 0) {
      appMessage.info("没有可清空的会话");
      return;
    }
    var filePaths = toDelete.map(function (s) { return s.filePath; });
    var result = getSkillNest().clearAllSessions(filePaths);
    // 重新加载
    await loadPage();
    if (result.success) {
      appMessage.success("已清空 " + result.count + " 个会话");
    } else {
      appMessage.error("清空失败");
    }
  }

  function exportSession(session, format) {
    var data;
    var ext;
    if (format === "markdown") {
      data = _toMarkdown(session, detailMessages.value);
      ext = ".md";
    } else {
      data = JSON.stringify({
        exportedAt: new Date().toISOString(),
        app: session.app,
        session: Object.assign({}, session, { messages: detailMessages.value }),
      }, null, 2);
      ext = ".json";
    }

    // 使用 utools 的文件保存对话框（如果可用）
    try {
      var savePath = utools.showSaveDialog({
        defaultPath: (session.title || "session").replace(/[<>:"/\\|?*]/g, "_") + ext,
        filters: [{ name: format === "markdown" ? "Markdown" : "JSON", extensions: [ext.replace(".", "")] }],
      });
      if (savePath) {
        require("fs").writeFileSync(savePath, data, "utf8");
        appMessage.success("导出成功");
      }
    } catch (e) {
      // fallback: 复制到剪贴板
      try {
        utools.copyText(data);
        appMessage.success("已复制到剪贴板");
      } catch (e2) {
        appMessage.error("导出失败");
      }
    }
  }

  function exportAllSessions(format) {
    var allData = sessions.value.map(function (s) {
      return Object.assign({}, s, { filePath: undefined });
    });
    var data = JSON.stringify({
      exportedAt: new Date().toISOString(),
      sessions: allData,
    }, null, 2);

    try {
      var savePath = utools.showSaveDialog({
        defaultPath: "sessions-export.json",
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (savePath) {
        require("fs").writeFileSync(savePath, data, "utf8");
        appMessage.success("导出成功");
      }
    } catch (e) {
      try {
        utools.copyText(data);
        appMessage.success("已复制到剪贴板");
      } catch (e2) {
        appMessage.error("导出失败");
      }
    }
  }

  // 清理 preload 缓存
  function cleanup() {
    try { getSkillNest().clearSessionCache(); } catch (e) { /* ignore */ }
  }

  function _toMarkdown(session, messages) {
    var lines = [];
    lines.push(`# ${session.title}`);
    lines.push("");
    lines.push(`**应用**: ${session.app}`);
    if (session.projectPath) lines.push(`**项目**: ${session.projectPath}`);
    if (session.createdAt) lines.push(`**创建时间**: ${session.createdAt}`);
    if (session.updatedAt) lines.push(`**更新时间**: ${session.updatedAt}`);
    lines.push(`**消息数**: ${session.messageCount}`);
    if (session.tokenUsage) lines.push(`**Token 用量**: ${session.tokenUsage.toLocaleString()}`);
    lines.push("");
    lines.push("---");
    lines.push("");
    lines.push("## 对话记录");
    lines.push("");

    (messages || []).forEach(function (msg) {
      lines.push(`### ${msg.role === "user" ? "User" : "Assistant"}`);
      lines.push(msg.content);
      lines.push("");
    });

    return lines.join("\n");
  }

  return {
    // 数据
    sessions,
    total,
    appStats,
    loading,
    loadingMore,
    switching,

    // 分页
    hasMore,
    showSkeleton,

    // 筛选
    activeApp,
    searchQuery,
    sortBy,
    SESSION_APPS,
    SORT_OPTIONS,

    // 详情
    showDetail,
    detailSession,
    detailMessages,
    detailLoading,

    // 操作
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
  };
}
