// composables/useSession.js
import { ref, computed } from "vue";
import { toast } from "./useToast.js";
import { getSkillNest, APP_ICONS } from "./shared.js";

const SESSION_APPS = [
  { key: "all", label: "全部" },
  { key: "claude", label: "Claude" },
  { key: "codex", label: "Codex" },
  { key: "openclaw", label: "OpenClaw" },
  { key: "claude-desktop", label: "Desktop" },
];

const SORT_OPTIONS = [
  { value: "today", label: "今日活跃" },
  { value: "time-desc", label: "最近活跃" },
  { value: "time-asc", label: "最早活跃" },
  { value: "name-asc", label: "名称 A-Z" },
  { value: "name-desc", label: "名称 Z-A" },
  { value: "messages-desc", label: "消息最多" },
  { value: "tokens-desc", label: "Token 最多" },
];

// 模块级状态（单例）
const cache = {};          // { claude: [...], codex: [...], ... }
const allSessions = ref([]);
const loading = ref(false);
const activeApp = ref("claude");
const searchQuery = ref("");
const sortBy = ref("today");
const detailSession = ref(null);
const detailMessages = ref([]);
const detailLoading = ref(false);
const showDetail = ref(false);

// 各应用统计（基于缓存）
const appStats = ref(
  SESSION_APPS.filter(function (a) { return a.key !== "all"; }).map(function (a) {
    return { app: a.key, label: a.label, icon: APP_ICONS[a.key] || null, count: 0 };
  })
);

function _updateStats() {
  appStats.value = SESSION_APPS.filter(function (a) { return a.key !== "all"; }).map(function (a) {
    return { app: a.key, label: a.label, icon: APP_ICONS[a.key] || null, count: (cache[a.key] || []).length };
  });
}

// 按需加载单个 app 的会话
async function loadSessions(app) {
  app = app || activeApp.value;
  loading.value = true;
  try {
    var result = await getSkillNest().scanSessions(app === "all" ? "" : app);
    if (app === "all") {
      // "全部" 模式：加载所有 app
      var all = result.sessions || [];
      allSessions.value = all;
      // 按 app 分桶更新缓存
      SESSION_APPS.forEach(function (a) {
        if (a.key !== "all") cache[a.key] = all.filter(function (s) { return s.app === a.key; });
      });
    } else {
      cache[app] = result.sessions || [];
      allSessions.value = cache[app];
    }
    _updateStats();
  } catch (e) {
    console.error("Failed to load sessions:", e);
    allSessions.value = [];
  } finally {
    loading.value = false;
  }
}

// 切换 Tab 时调用
async function switchApp(app) {
  activeApp.value = app;
  searchQuery.value = "";
  if (app === "all") {
    // 汇总所有已缓存的
    var merged = [];
    Object.keys(cache).forEach(function (k) { merged = merged.concat(cache[k]); });
    if (merged.length) {
      allSessions.value = merged;
      return;
    }
  } else if (cache[app]) {
    allSessions.value = cache[app];
    return;
  }
  await loadSessions(app);
}

export function useSession() {
  const filteredSessions = computed(() => {
    var list = allSessions.value;

    // 搜索
    if (searchQuery.value) {
      var q = searchQuery.value.toLowerCase();
      list = list.filter(function (s) {
        return (s.title || "").toLowerCase().indexOf(q) >= 0
          || (s.projectPath || "").toLowerCase().indexOf(q) >= 0
          || (s.model || "").toLowerCase().indexOf(q) >= 0;
      });
    }

    // 排序
    var sorted = list.slice();
    switch (sortBy.value) {
      case "today":
        var today = new Date().toISOString().substring(0, 10);
        sorted = sorted.filter(function (s) { return (s.updatedAt || "").substring(0, 10) === today; });
        sorted.sort(function (a, b) { return (b.updatedAt || "").localeCompare(a.updatedAt || ""); });
        break;
      case "time-desc":
        sorted.sort(function (a, b) { return (b.updatedAt || "").localeCompare(a.updatedAt || ""); });
        break;
      case "time-asc":
        sorted.sort(function (a, b) { return (a.updatedAt || "").localeCompare(b.updatedAt || ""); });
        break;
      case "name-asc":
        sorted.sort(function (a, b) { return (a.title || "").localeCompare(b.title || ""); });
        break;
      case "name-desc":
        sorted.sort(function (a, b) { return (b.title || "").localeCompare(a.title || ""); });
        break;
      case "messages-desc":
        sorted.sort(function (a, b) { return (b.messageCount || 0) - (a.messageCount || 0); });
        break;
      case "tokens-desc":
        sorted.sort(function (a, b) { return (b.tokenUsage || 0) - (a.tokenUsage || 0); });
        break;
    }

    return sorted;
  });

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
      allSessions.value = allSessions.value.filter(function (s) { return s.id !== session.id; });
      toast.success("会话已删除");
    } else {
      toast.error("删除失败：" + (result.error || "未知错误"));
    }
    return result;
  }

  function clearSessions(app) {
    var target = app || activeApp.value;
    var toDelete = allSessions.value.filter(function (s) {
      return target === "all" || s.app === target;
    });
    var successCount = 0;
    toDelete.forEach(function (s) {
      var r = getSkillNest().deleteSession(s.filePath);
      if (r.success) successCount++;
    });
    // 重新加载
    loadSessions();
    toast.success(`已清空 ${successCount} 个会话`);
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
        toast.success("导出成功");
      }
    } catch (e) {
      // fallback: 复制到剪贴板
      try {
        utools.copyText(data);
        toast.success("已复制到剪贴板");
      } catch (e2) {
        toast.error("导出失败");
      }
    }
  }

  function exportAllSessions(format) {
    var allData = filteredSessions.value.map(function (s) {
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
        toast.success("导出成功");
      }
    } catch (e) {
      try {
        utools.copyText(data);
        toast.success("已复制到剪贴板");
      } catch (e2) {
        toast.error("导出失败");
      }
    }
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
    allSessions,
    filteredSessions,
    appStats,
    loading,

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
    loadSessions,
    switchApp,
    loadDetail,
    closeDetail,
    deleteSession,
    clearSessions,
    exportSession,
    exportAllSessions,
  };
}
