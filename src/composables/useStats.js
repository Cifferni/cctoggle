import { reactive, ref } from "vue";

const _ccs = () => window.skillNest || {
  getStats: () => ({ totals: {}, daily: [], providers: [], models: [] }),
  clearStats: () => ({ success: false }),
};
const _ut = () => window.utools || { showNotification: () => {} };

const APP_TYPES = ["codex", "claude", "openclaw", "gemini"];
const APP_LABELS = { codex: "Codex", claude: "Claude", openclaw: "OpenClaw", gemini: "Gemini", all: "全部" };

// 过滤条件（跨组件共享）
const filter = reactive({ appType: "all", days: 7 });

const stats = ref({
  totals: { requests: 0, input: 0, output: 0, cacheRead: 0, cacheCreate: 0, total: 0 },
  daily: [],
  providers: [],
  models: [],
});

function loadStats() {
  const r = _ccs().getStats(filter.appType, filter.days) || {};
  stats.value = {
    totals: Object.assign({ requests: 0, input: 0, output: 0, cacheRead: 0, cacheCreate: 0, total: 0 }, r.totals || {}),
    daily: r.daily || [],
    providers: r.providers || [],
    models: r.models || [],
  };
}

function setAppType(t) { filter.appType = t; loadStats(); }
function setDays(d) { filter.days = d; loadStats(); }

function clearStats(appType) {
  const r = _ccs().clearStats(appType || "all") || { success: false };
  loadStats();
  if (r.success) _ut().showNotification("已清空统计数据");
  return r;
}

// 缓存命中率：cacheRead / input（输入侧命中占比）
function cacheHitRate(t) {
  const tot = t || stats.value.totals;
  const denom = (tot.input || 0);
  if (!denom) return 0;
  return Math.min(1, (tot.cacheRead || 0) / denom);
}

export function useStats() {
  return {
    APP_TYPES, APP_LABELS,
    filter, stats,
    loadStats, setAppType, setDays, clearStats, cacheHitRate,
  };
}
