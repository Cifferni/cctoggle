<script setup>
import { onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useDialog } from "naive-ui";
import { useStats } from "../composables/useStats.js";
import EChart from "../components/EChart.vue";

const dialog = useDialog();

const router = useRouter();
const { APP_TYPES, APP_LABELS, filter, stats, refreshing, initialLoading, refresh, setAppType, setDays, clearStats, cacheHitRate } = useStats();

const DAY_OPTIONS = [
  { v: 7, label: "近 7 天" },
  { v: 30, label: "近 30 天" },
  { v: 0, label: "全部" },
];

// 无缓存：进页直接扫描本地日志（异步不卡 UI），切换 agent/天数在内存中过滤
onMounted(() => { refresh(); });

function fmt(n) {
  n = Number(n) || 0;
  if (n >= 1e8) return (n / 1e8).toFixed(2) + " 亿";
  if (n >= 1e4) return (n / 1e4).toFixed(1) + " 万";
  return n.toLocaleString("en-US");
}

const hitRate = computed(() => (cacheHitRate() * 100).toFixed(1));
const hasData = computed(() => stats.value.totals.requests > 0);

function onClear() {
  dialog.warning({
    title: "清除统计",
    content: "确定清除" + APP_LABELS[filter.appType] + "的统计数据吗？将隐藏此刻之前的历史用量，之后的用量会继续统计。",
    positiveText: "清除",
    negativeText: "取消",
    onPositiveClick: function () {
      clearStats(filter.appType);
    },
  });
}

// ── 图表配置（Chart.js） ──
const axisColor = "#94a3b8";
const gridColor = "rgba(148,163,184,.15)";

const commonScaleOpts = {
  ticks: { color: axisColor, callback: v => fmt(v) },
  grid: { color: gridColor },
};
const commonLegend = { labels: { color: axisColor, boxWidth: 12, padding: 12 } };

const trendData = computed(() => {
  const labels = stats.value.daily.map(d => d.day.slice(5));
  return {
    labels,
    datasets: [
      { label: "输入", type: "bar", data: stats.value.daily.map(d => d.input || 0), backgroundColor: "#d97706", stack: "tok", order: 2 },
      { label: "输出", type: "bar", data: stats.value.daily.map(d => d.output || 0), backgroundColor: "#22c55e", stack: "tok", order: 2 },
      { label: "缓存命中", type: "line", data: stats.value.daily.map(d => d.cacheRead || 0), borderColor: "#f59e0b", backgroundColor: "rgba(245,158,11,.15)", tension: .3, fill: false, order: 1 },
    ],
  };
});

const trendOpts = {
  responsive: true, maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  plugins: { legend: commonLegend, tooltip: { callbacks: { label: ctx => ctx.dataset.label + ": " + fmt(ctx.parsed.y) } } },
  scales: { x: { ticks: { color: axisColor } }, y: { ...commonScaleOpts, stacked: true } },
};

const modelBarData = computed(() => {
  const list = stats.value.models.slice(0, 8).reverse();
  return {
    labels: list.map(m => m.model),
    datasets: [{ data: list.map(m => m.total), backgroundColor: "#e67e22", borderRadius: 4, barPercentage: .6 }],
  };
});

const modelBarOpts = {
  indexAxis: "y",
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => "Tokens: " + fmt(ctx.parsed.x) } } },
  scales: {
    x: { ...commonScaleOpts },
    y: { ticks: { color: axisColor }, grid: { display: false } },
  },
};

const cacheData = computed(() => {
  const t = stats.value.totals;
  return {
    labels: ["缓存命中", "新增输入"],
    datasets: [{
      data: [t.cacheRead || 0, t.input || 0],
      backgroundColor: ["#f59e0b", "#d97706"],
      borderWidth: 0,
    }],
  };
});

const cacheOpts = {
  responsive: true, maintainAspectRatio: false,
  cutout: "55%",
  plugins: {
    legend: { position: "bottom", ...commonLegend },
    tooltip: { callbacks: { label: ctx => ctx.label + ": " + fmt(ctx.parsed) + " (" + Math.round(ctx.parsed / ctx.dataset.data.reduce((a, b) => a + b, 0) * 100) + "%)" } },
  },
};
</script>


<template>
  <div class="page">
    <div class="stats-topbar">
      <div class="stats-title">
        <button class="back-btn" @click="router.push('/')" title="返回">←</button>
        <span class="stats-h1">用量统计</span>
      </div>
      <div class="stats-actions">
        <button class="refresh-btn" :disabled="refreshing" @click="refresh">
          <span :class="{ spin: refreshing }">↻</span> {{ refreshing ? "扫描中…" : "刷新" }}
        </button>
        <button class="clear-btn" @click="onClear">清除统计</button>
      </div>
    </div>

    <div class="stats-filters">
      <div class="seg">
        <button class="seg-btn" :class="{ on: filter.appType === 'all' }" @click="setAppType('all')">全部</button>
        <button v-for="t in APP_TYPES" :key="t" class="seg-btn" :class="{ on: filter.appType === t }" @click="setAppType(t)">{{ APP_LABELS[t] }}</button>
      </div>
      <div class="seg">
        <button v-for="o in DAY_OPTIONS" :key="o.v" class="seg-btn" :class="{ on: filter.days === o.v }" @click="setDays(o.v)">{{ o.label }}</button>
      </div>
    </div>

    <div v-if="hasData" class="stats-body">
      <div class="cards">
        <div class="card"><div class="card-label">真实消耗 Tokens</div><div class="card-num">{{ fmt(stats.totals.total) }}</div></div>
        <div class="card"><div class="card-label">总请求数</div><div class="card-num">{{ fmt(stats.totals.requests) }}</div></div>
        <div class="card"><div class="card-label">新增输入</div><div class="card-num">{{ fmt(stats.totals.input) }}</div></div>
        <div class="card"><div class="card-label">Output</div><div class="card-num">{{ fmt(stats.totals.output) }}</div></div>
        <div class="card"><div class="card-label">缓存创建</div><div class="card-num">{{ fmt(stats.totals.cacheCreate) }}</div></div>
        <div class="card"><div class="card-label">缓存命中</div><div class="card-num">{{ fmt(stats.totals.cacheRead) }}</div></div>
        <div class="card card--accent"><div class="card-label">缓存命中率</div><div class="card-num">{{ hitRate }}%</div></div>
      </div>

      <div class="panels">
        <div class="panel panel--wide">
          <div class="panel-title">Token 趋势</div>
          <EChart type="bar" :data="trendData" :options="trendOpts" height="240px" />
        </div>
        <div class="panel panel--wide">
          <div class="panel-title">模型用量排行</div>
          <EChart type="bar" :data="modelBarData" :options="modelBarOpts" height="260px" />
        </div>
        <div class="panel">
          <div class="panel-title">缓存命中占比</div>
          <EChart type="pie" :data="cacheData" :options="cacheOpts" height="240px" />
        </div>
        <div class="panel">
          <div class="panel-title">模型分布</div>
          <div class="model-list">
            <div v-if="!stats.models.length" class="model-empty">暂无模型数据</div>
            <div v-for="m in stats.models.slice(0, 8)" :key="m.model" class="model-row">
              <span class="model-name" :title="m.model">{{ m.model }}</span>
              <span class="model-val">{{ fmt(m.total) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="initialLoading" class="empty">
      <div class="loading-spinner"></div>
      <div class="empty-title">正在扫描日志…</div>
      <div class="empty-desc">首次加载需要扫描本地会话日志，请稍候</div>
    </div>

    <div v-else class="empty">
      <div class="empty-icon">📊</div>
      <div class="empty-title">暂无统计数据</div>
      <div class="empty-desc">用量数据来自 Claude Code / Codex 的本地会话日志。<br/>使用过对应 CLI 后，点击右上角「刷新」即可汇总用量。</div>
    </div>
  </div>
</template>


<style scoped>
.page { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.stats-topbar { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px 6px; }
.stats-title { display: flex; align-items: center; gap: 8px; }
.back-btn { border: none; background: var(--bg-hover); color: var(--text-secondary); width: 26px; height: 26px; border-radius: 7px; cursor: pointer; font-size: 15px; }
.back-btn:hover { color: var(--text); }
.stats-h1 { font-size: 15px; font-weight: 600; color: var(--text); }
.clear-btn { border: 1px solid var(--border); background: none; color: #ef4444; padding: 5px 12px; border-radius: 7px; cursor: pointer; font-size: 12px; }
.clear-btn:hover { background: rgba(239,68,68,.1); }
.stats-actions { display: flex; align-items: center; gap: 8px; }
.refresh-btn { border: 1px solid var(--border); background: none; color: var(--text-secondary); padding: 5px 12px; border-radius: 7px; cursor: pointer; font-size: 12px; display: inline-flex; align-items: center; gap: 4px; }
.refresh-btn:hover:not(:disabled) { color: var(--text); background: var(--bg-hover); }
.refresh-btn:disabled { opacity: .6; cursor: default; }
.refresh-btn .spin { display: inline-block; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.stats-filters { display: flex; gap: 10px; flex-wrap: wrap; padding: 4px 14px 8px; }
.seg { display: flex; gap: 2px; background: var(--bg-hover); padding: 3px; border-radius: 9px; }
.seg-btn { border: none; background: none; color: var(--text-secondary); padding: 4px 12px; border-radius: 7px; cursor: pointer; font-size: 12px; }
.seg-btn:hover { color: var(--text); }
.seg-btn.on { background: var(--primary); color: #fff; }

.stats-body { flex: 1; overflow-y: auto; padding: 4px 14px 14px; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-bottom: 12px; }
.card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; }
.card--accent { border-color: var(--primary); }
.card-label { font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }
.card-num { font-size: 20px; font-weight: 700; color: var(--text); }

.panels { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.panel { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; }
.panel--wide { grid-column: 1 / -1; }
.panel-title { font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; }

.model-list { display: flex; flex-direction: column; gap: 6px; }
.model-empty { color: var(--text-muted); font-size: 12px; padding: 12px 0; text-align: center; }
.model-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: var(--bg-hover); border-radius: 6px; }
.model-name { font-size: 12px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 65%; }
.model-val { font-size: 12px; font-weight: 600; color: var(--primary); }

.empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: var(--text-muted); }
.empty-icon { font-size: 40px; }
.empty-title { font-size: 15px; font-weight: 600; color: var(--text-secondary); }
.empty-desc { font-size: 12px; text-align: center; line-height: 1.6; }
.loading-spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin .8s linear infinite; }
</style>
