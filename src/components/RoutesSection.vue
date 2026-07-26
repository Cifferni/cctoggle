<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useProviders } from "../composables/useProviders.js";
import { useRoutes } from "../composables/useRoutes.js";

const { APP_LABELS, activeTab, providers, loadProviders } = useProviders();
const { runtime, refreshStatus, getProxyPort, setProxyPort } = useRoutes();

const currentApp = computed(() => activeTab());
const rt = computed(() => runtime[currentApp.value] || {});
const isRunning = computed(() => !!rt.value.running);

// —— 端口编辑 ——
const portInput = ref(8788);
const saveMsg = ref("");

function syncPort() {
  portInput.value = isRunning.value ? (rt.value.port || getProxyPort(currentApp.value)) : getProxyPort(currentApp.value);
}

function onSavePort() {
  saveMsg.value = "";
  const r = setProxyPort(currentApp.value, Number(portInput.value));
  if (r.success) {
    saveMsg.value = "已保存";
    window.utools?.showNotification?.("代理端口已保存：" + r.port);
    setTimeout(() => (saveMsg.value = ""), 2000);
  } else {
    saveMsg.value = r.error === "proxy is running" ? "运行中无法修改" : ("保存失败：" + (r.error || "unknown"));
  }
}

// —— 地址 & 复制 ——
const proxyUrl = computed(() => "http://127.0.0.1:" + (isRunning.value ? rt.value.port : portInput.value));
const copied = ref(false);
function copyUrl() {
  try {
    if (window.utools?.copyText) window.utools.copyText(proxyUrl.value);
    else navigator.clipboard?.writeText(proxyUrl.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch (e) {}
}

// —— 当前使用的 provider / 模型 ——
const activeProvider = computed(() => {
  const members = rt.value.members || [];
  if (!members.length) return null;
  const id = rt.value.lastMemberId;
  return members.find((m) => m.id === id) || members[0];
});
const activeModel = computed(() => {
  const ap = activeProvider.value;
  if (!ap) return "";
  const p = (providers.value || []).find((x) => x.id === ap.id);
  return p?.model || "";
});

// —— 指标 ——
const now = ref(Date.now());
let timer = null;
const successRate = computed(() => {
  const done = (rt.value.reqSuccess || 0) + (rt.value.reqFail || 0);
  if (!done) return "-";
  return Math.round(((rt.value.reqSuccess || 0) / done) * 100) + "%";
});
const uptime = computed(() => {
  if (!isRunning.value || !rt.value.startedAt) return "-";
  let s = Math.max(0, Math.floor((now.value - rt.value.startedAt) / 1000));
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  const pad = (n) => String(n).padStart(2, "0");
  return (h > 0 ? h + ":" : "") + pad(m) + ":" + pad(s);
});

function reload() {
  refreshStatus(currentApp.value);
  loadProviders();
  syncPort();
}
onMounted(() => {
  reload();
  timer = setInterval(() => {
    now.value = Date.now();
    refreshStatus(currentApp.value);
  }, 1000);
});
onUnmounted(() => { if (timer) clearInterval(timer); });
watch(currentApp, reload);
watch(isRunning, syncPort);
</script>

<template>
  <div class="routes-section">
    <!-- 1. 状态 -->
    <div class="row-status">
      <span class="badge" :class="isRunning ? 'badge--on' : 'badge--off'">
        {{ isRunning ? "运行中" : "已停止" }}
      </span>
      <span class="status-app">{{ APP_LABELS[currentApp] }} 代理</span>
    </div>

    <!-- 2. 代理地址 + 复制 / 编辑 -->
    <div class="card">
      <div class="card-title">代理地址</div>
      <div class="addr-row">
        <template v-if="isRunning">
          <code class="addr">{{ proxyUrl }}</code>
          <button class="btn" @click="copyUrl">{{ copied ? "已复制" : "复制" }}</button>
        </template>
        <template v-else>
          <span class="addr-prefix">http://127.0.0.1:</span>
          <input v-model.number="portInput" type="number" min="1024" max="65535" class="port-input" />
          <button class="btn" @click="copyUrl">{{ copied ? "已复制" : "复制" }}</button>
          <button class="btn btn--primary" @click="onSavePort">保存</button>
          <span v-if="saveMsg" class="save-msg">{{ saveMsg }}</span>
        </template>
      </div>
      <div class="hint" v-if="isRunning">运行中不可修改，关闭代理后可编辑端口。</div>
      <div class="hint" v-else>修改端口后点「保存」生效（下次开启代理时使用）。</div>
    </div>

    <!-- 3. 当前使用 -->
    <div class="card">
      <div class="card-title">当前使用</div>
      <div class="use-row">
        <span class="use-label">Agent</span>
        <span class="use-val">{{ APP_LABELS[currentApp] }}</span>
      </div>
      <div class="use-row">
        <span class="use-label">供应商</span>
        <span class="use-val">{{ activeProvider ? activeProvider.name : (isRunning ? "等待请求…" : "-") }}</span>
      </div>
      <div class="use-row">
        <span class="use-label">模型</span>
        <span class="use-val">{{ activeModel || "-" }}</span>
      </div>
    </div>

    <!-- 4. 指标 -->
    <div class="metrics">
      <div class="metric">
        <div class="metric-num">{{ rt.activeConn || 0 }}</div>
        <div class="metric-label">活跃连接</div>
      </div>
      <div class="metric">
        <div class="metric-num">{{ rt.reqTotal || 0 }}</div>
        <div class="metric-label">请求数</div>
      </div>
      <div class="metric">
        <div class="metric-num">{{ successRate }}</div>
        <div class="metric-label">成功率</div>
      </div>
      <div class="metric">
        <div class="metric-num">{{ uptime }}</div>
        <div class="metric-label">运行时长</div>
      </div>
    </div>

    <!-- 5. 成员健康 + 日志 -->
    <div v-if="isRunning" class="members">
      <div class="members-title">成员健康</div>
      <div v-for="m in rt.members" :key="m.id" class="mem-row">
        <span class="mem-dot" :class="'mem-' + m.state"></span>
        <span class="mem-name">{{ m.name }}</span>
        <span class="mem-state">{{ m.state }}</span>
        <span class="mem-latency">{{ m.latency || '-' }}ms</span>
        <span v-if="m.fails" class="mem-fails">失败{{ m.fails }}次</span>
      </div>
      <div v-if="!(rt.members && rt.members.length)" class="empty">暂无成员数据</div>
    </div>

    <details v-if="isRunning" class="log-wrap">
      <summary>实时日志（{{ (rt.logs && rt.logs.length) || 0 }}）</summary>
      <div class="log">
        <div v-for="(l, i) in (rt.logs || []).slice(-50)" :key="i"
             class="log-line" :class="'log-' + l.level">
          [{{ new Date(l.ts).toLocaleTimeString() }}] {{ l.msg }}
          <span v-if="l.meta">· {{ JSON.stringify(l.meta) }}</span>
        </div>
        <div v-if="!(rt.logs && rt.logs.length)" class="empty">暂无日志</div>
      </div>
    </details>

    <div v-if="!isRunning" class="tip">
      代理未启动。在主页 TabBar 点击「代理」开关即可开启。
    </div>
  </div>
</template>

<style scoped>
.routes-section { display: flex; flex-direction: column; gap: 10px; }
.empty { color: var(--text-muted); font-size: 12px; padding: 8px; text-align: center; }
.tip { color: var(--text-muted); font-size: 12px; padding: 10px; text-align: center; border: 1px dashed var(--border); border-radius: 8px; }

.row-status { display: flex; align-items: center; gap: 10px; }
.badge { padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
.badge--on { background: rgba(34,197,94,.15); color: #16a34a; }
.badge--off { background: var(--bg-hover); color: var(--text-muted); }
.status-app { font-size: 13px; font-weight: 600; color: var(--text); }

.card { border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; }
.card-title { font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; }
.addr-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.addr { background: var(--bg-hover); padding: 4px 8px; border-radius: 6px; font-size: 12px; font-family: monospace; }
.addr-prefix { font-size: 12px; font-family: monospace; color: var(--text-secondary); }
.port-input { width: 84px; padding: 4px 8px; border: 1px solid var(--border); border-radius: 6px; font-size: 12px; background: var(--bg); color: var(--text); }
.btn { padding: 4px 12px; border: 1px solid var(--border); background: var(--bg); color: var(--text); border-radius: 6px; font-size: 12px; cursor: pointer; }
.btn:hover { background: var(--bg-hover); }
.btn--primary { background: var(--primary); color: #fff; border-color: var(--primary); }
.save-msg { font-size: 12px; color: #16a34a; }
.hint { font-size: 11px; color: var(--text-muted); margin-top: 6px; }

.use-row { display: flex; font-size: 12px; padding: 3px 0; }
.use-label { width: 60px; color: var(--text-muted); }
.use-val { color: var(--text); font-weight: 500; }

.metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.metric { border: 1px solid var(--border); border-radius: 8px; padding: 10px 6px; text-align: center; }
.metric-num { font-size: 18px; font-weight: 700; color: var(--text); }
.metric-label { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

.members { border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; }
.members-title { font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; }
.mem-row { display: flex; align-items: center; gap: 8px; font-size: 12px; padding: 3px 0; }
.mem-dot { width: 7px; height: 7px; border-radius: 50%; }
.mem-closed { background: #22c55e; }
.mem-half-open { background: #eab308; }
.mem-open { background: #ef4444; }
.mem-name { flex: 1; }
.mem-state { font-size: 11px; color: var(--text-muted); min-width: 50px; }
.mem-latency { font-size: 11px; color: var(--text-muted); min-width: 48px; }
.mem-fails { font-size: 11px; color: #f97316; }

.log { max-height: 200px; overflow: auto; font-family: monospace; font-size: 11px; background: var(--bg-hover); padding: 6px; border-radius: 4px; }
.log-line { padding: 1px 0; white-space: pre-wrap; }
.log-error { color: #dc2626; }
.log-warn { color: #ea580c; }
</style>
