import { reactive, ref } from "vue";
import { appMessage } from "./useAppMessage.js";
import { APP_TYPES, APP_LABELS, getSkillNest } from "./shared.js";

const filter = reactive({ appType: "all", days: 7 });

const EMPTY_TOTALS = { requests: 0, input: 0, output: 0, cacheRead: 0, cacheCreate: 0, total: 0 };

// 上次扫描返回的全部原始按天记录（[{ appType, day, ...6字段, models }]）
// 切换 agent / 天数时在内存中过滤，无需重新扫描日志
const rawDaily = ref([]);

const stats = ref({
  totals: { ...EMPTY_TOTALS },
  daily: [],
  models: [],
});

const refreshing = ref(false);
const initialLoading = ref(true); // 首次加载标记，区分"加载中"与"无数据"

// 本地日期 YYYY-MM-DD（用于 days 范围过滤）
function _dayKey(d) {
  const y = d.getFullYear();
  const m = ("0" + (d.getMonth() + 1)).slice(-2);
  const day = ("0" + d.getDate()).slice(-2);
  return y + "-" + m + "-" + day;
}

// 依据当前 filter，从 rawDaily 聚合出展示用 stats（纯内存，瞬时）
function applyFilter() {
  let minDay = null;
  if (filter.days && filter.days > 0) {
    const d = new Date();
    d.setDate(d.getDate() - (filter.days - 1));
    minDay = _dayKey(d);
  }
  const totals = { ...EMPTY_TOTALS };
  const models = {};
  const daily = [];
  for (const rec of rawDaily.value) {
    if (filter.appType !== "all" && rec.appType !== filter.appType) continue;
    if (minDay && rec.day < minDay) continue;
    daily.push({
      day: rec.day, appType: rec.appType,
      requests: rec.requests || 0, input: rec.input || 0, output: rec.output || 0,
      cacheRead: rec.cacheRead || 0, cacheCreate: rec.cacheCreate || 0, total: rec.total || 0,
    });
    totals.requests += rec.requests || 0;
    totals.input += rec.input || 0;
    totals.output += rec.output || 0;
    totals.cacheRead += rec.cacheRead || 0;
    totals.cacheCreate += rec.cacheCreate || 0;
    totals.total += rec.total || 0;
    for (const mid of Object.keys(rec.models || {})) {
      const b = rec.models[mid];
      const agg = models[mid] || { requests: 0, input: 0, output: 0, cacheRead: 0, cacheCreate: 0, total: 0 };
      agg.requests += b.requests || 0; agg.input += b.input || 0; agg.output += b.output || 0;
      agg.cacheRead += b.cacheRead || 0; agg.cacheCreate += b.cacheCreate || 0; agg.total += b.total || 0;
      models[mid] = agg;
    }
  }
  daily.sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
  const modelList = Object.keys(models)
    .map(mid => ({ model: mid, ...models[mid] }))
    .sort((a, b) => b.total - a.total);
  stats.value = { totals, daily, models: modelList };
}

// 扫描本地 CLI 日志（无缓存、异步），完成后按当前 filter 展示
async function refresh() {
  if (refreshing.value) return;
  refreshing.value = true;
  try {
    const api = getSkillNest();
    if (typeof api.scanUsageLogs !== "function") {
      appMessage.error("scanUsageLogs 不可用，请在 uTools 中重载插件（preload 缓存）");
      return;
    }
    const r = (await api.scanUsageLogs()) || { daily: [] };
    if (r.error) { appMessage.error("扫描出错：" + r.error); return; }
    rawDaily.value = r.daily || [];
    applyFilter();
  } catch (e) {
    appMessage.error("扫描失败：" + (e && e.message ? e.message : String(e)));
  } finally {
    refreshing.value = false;
    initialLoading.value = false;
  }
}

function setAppType(t) { filter.appType = t; applyFilter(); }
function setDays(d) { filter.days = d; applyFilter(); }

// 清除：记录清除时间戳（隐藏该时间点之前的历史），随后重新扫描
async function clearStats(appType) {
  const r = getSkillNest().clearStats(appType || "all") || { success: false };
  if (r.success) {
    appMessage.success("已清除统计数据");
    await refresh();
  } else {
    appMessage.error("清除失败" + (r.error ? "：" + r.error : ""));
  }
  return r;
}

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
