import { reactive, ref } from "vue";
import { toast } from "./useToast.js";
import { APP_TYPES, APP_LABELS, getSkillNest } from "./shared.js";

const filter = reactive({ appType: "all", days: 7 });

const EMPTY_TOTALS = { requests: 0, input: 0, output: 0, cacheRead: 0, cacheCreate: 0, total: 0 };

const stats = ref({
  totals: { ...EMPTY_TOTALS },
  daily: [],
  providers: [],
  models: [],
});

function loadStats() {
  const r = getSkillNest().getStats(filter.appType, filter.days) || {};
  stats.value = {
    totals: { ...EMPTY_TOTALS, ...r.totals },
    daily: r.daily || [],
    providers: r.providers || [],
    models: r.models || [],
  };
}

function setAppType(t) { filter.appType = t; loadStats(); }
function setDays(d) { filter.days = d; loadStats(); }

function clearStats(appType) {
  const r = getSkillNest().clearStats(appType || "all") || { success: false };
  loadStats();
  if (r.success) toast.success("\u5DF2\u6E05\u7A7A\u7EDF\u8BA1\u6570\u636E");
  return r;
}

function cacheHitRate(t) {
  const tot = t || stats.value.totals;
  const denom = tot.input || 0;
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