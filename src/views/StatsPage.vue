<script setup>
import { onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useStats } from "../composables/useStats.js";
import EChart from "../components/EChart.vue";

const router = useRouter();
const { APP_TYPES, APP_LABELS, filter, stats, loadStats, setAppType, setDays, clearStats, cacheHitRate } = useStats();

const DAY_OPTIONS = [
  { v: 7, label: "近 7 天" },
  { v: 30, label: "近 30 天" },
  { v: 0, label: "全部" },
];

onMounted(() => loadStats());

function fmt(n) {
  n = Number(n) || 0;
  if (n >= 1e8) return (n / 1e8).toFixed(2) + " 亿";
  if (n >= 1e4) return (n / 1e4).toFixed(1) + " 万";
  return n.toLocaleString("en-US");
}

const hitRate = computed(() => (cacheHitRate() * 100).toFixed(1));
const hasData = computed(() => stats.value.totals.requests > 0);

function onClear() {
  if (window.confirm("确定清空" + APP_LABELS[filter.appType] + "的统计数据吗？此操作不可恢复。")) {
    clearStats(filter.appType);
  }
}

// ── 图表配置 ──
const axisColor = "#94a3b8";
const gridColor = "rgba(148,163,184,.15)";

const trendOption = computed(() => {
  const days = stats.value.daily.map(d => d.day.slice(5));
  const input = stats.value.daily.map(d => d.input || 0);
  const output = stats.value.daily.map(d => d.output || 0);
  const cache = stats.value.daily.map(d => d.cacheRead || 0);
  return {
    tooltip: { trigger: "axis" },
    legend: { data: ["输入", "输出", "缓存命中"], textStyle: { color: axisColor }, top: 0 },
    grid: { left: 8, right: 12, top: 30, bottom: 4, containLabel: true },
    xAxis: { type: "category", data: days, axisLabel: { color: axisColor }, axisLine: { lineStyle: { color: gridColor } } },
    yAxis: { type: "value", axisLabel: { color: axisColor, formatter: v => fmt(v) }, splitLine: { lineStyle: { color: gridColor } } },
    series: [
      { name: "输入", type: "bar", stack: "tok", data: input, itemStyle: { color: "#3b82f6" } },
      { name: "输出", type: "bar", stack: "tok", data: output, itemStyle: { color: "#22c55e" } },
      { name: "缓存命中", type: "line", data: cache, smooth: true, itemStyle: { color: "#f59e0b" } },
    ],
  };
});

const providerOption = computed(() => {
  const list = stats.value.providers.slice(0, 8).reverse();
  return {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: p => p[0].name + "<br/>Tokens: " + fmt(p[0].value) },
    grid: { left: 8, right: 24, top: 8, bottom: 4, containLabel: true },
    xAxis: { type: "value", axisLabel: { color: axisColor, formatter: v => fmt(v) }, splitLine: { lineStyle: { color: gridColor } } },
    yAxis: { type: "category", data: list.map(p => p.name), axisLabel: { color: axisColor }, axisLine: { lineStyle: { color: gridColor } } },
    series: [{ type: "bar", data: list.map(p => p.total), itemStyle: { color: "#6366f1", borderRadius: [0, 4, 4, 0] }, barWidth: "60%" }],
  };
});

const cacheOption = computed(() => {
  const t = stats.value.totals;
  const hit = t.cacheRead || 0;
  const miss = Math.max(0, (t.input || 0) - hit);
  return {
    tooltip: { trigger: "item", formatter: p => p.name + ": " + fmt(p.value) + " (" + p.percent + "%)" },
    legend: { bottom: 0, textStyle: { color: axisColor } },
    series: [{
      type: "pie", radius: ["55%", "78%"], center: ["50%", "45%"], avoidLabelOverlap: false,
      label: { show: false }, labelLine: { show: false },
      data: [
        { value: hit, name: "缓存命中", itemStyle: { color: "#f59e0b" } },
        { value: miss, name: "新增输入", itemStyle: { color: "#3b82f6" } },
      ],
    }],
  };
});
</script>


<template>
  <div class="page">
    <div class="stats-topbar">
      <div class="stats-title">
        <button class="back-btn" @click="router.push('/')" title="返回">←</button>
        <span class="stats-h1">用量统计</span>
      </div>
      <button class="clear-btn" @click="onClear">清空统计</button>
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
          <EChart :option="trendOption" height="240px" />
        </div>
        <div class="panel">
          <div class="panel-title">缓存命中占比</div>
          <EChart :option="cacheOption" height="240px" />
        </div>
        <div class="panel panel--wide">
          <div class="panel-title">供应商用量排行</div>
          <EChart :option="providerOption" height="260px" />
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

    <div v-else class="empty">
      <div class="empty-icon">📊</div>
      <div class="empty-title">暂无统计数据</div>
      <div class="empty-desc">统计仅在使用「代理」转发请求时采集。<br/>开启代理并使用对应 CLI 后，这里会显示真实用量。</div>
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
</style>
