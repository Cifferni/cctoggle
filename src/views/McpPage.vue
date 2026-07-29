<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { NIcon } from "naive-ui";
import { ArrowBackOutline } from "@vicons/ionicons5";
import { useMcp } from "../composables/useMcp.js";
import { APP_LABELS, APP_ICONS } from "../composables/shared.js";
import { confirm } from "../composables/useConfirm.js";
import McpCard from "../components/McpCard.vue";
import McpForm from "../components/McpForm.vue";

const router = useRouter();
const { mcpServers, loadServers, saveServer, deleteServer, toggleServer, getServer, syncFromConfigFiles } = useMcp();

const showForm = ref(false);
const editingId = ref(null);
const formInitialData = ref(null);

const AGENT_APPS = [
  { key: "claude", label: "Claude" },
  { key: "claude-desktop", label: "Claude Desktop" },
  { key: "codex", label: "Codex" },
  { key: "openclaw", label: "OpenClaw" },
];

const agentStats = computed(() => {
  var counts = {};
  AGENT_APPS.forEach(function (f) { counts[f.key] = 0; });
  mcpServers.value.forEach(function (s) {
    (s.apps || []).forEach(function (app) {
      if (counts.hasOwnProperty(app)) counts[app] += 1;
    });
  });
  return AGENT_APPS.map(function (f) {
    return { app: f.key, label: f.label, icon: APP_ICONS[f.key] || null, count: counts[f.key] || 0 };
  });
});

onMounted(() => loadServers());

function onAdd() {
  editingId.value = null;
  formInitialData.value = null;
  showForm.value = true;
}

function onEdit(id) {
  editingId.value = id;
  formInitialData.value = getServer(id);
  showForm.value = true;
}

async function onDelete(id) {
  const ok = await confirm("确定删除该 MCP Server？删除后将自动清理关联应用配置文件中的对应条目。", {
    title: "删除 MCP Server",
    confirmText: "删除",
    danger: true,
  });
  if (ok) deleteServer(id);
}

function onSave(data) {
  saveServer(data);
  showForm.value = false;
  editingId.value = null;
}

function onUpdateApps(id, apps) {
  var server = getServer(id);
  if (server) saveServer(Object.assign({}, server, { apps: apps }));
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div class="page-header__left">
        <button class="back-btn" title="返回" @click="router.back()">
          <n-icon :size="16"><arrow-back-outline /></n-icon>
        </button>
        <span class="page-title">MCP 管理</span>
        <n-tag size="tiny" :bordered="false" round>{{ mcpServers.length }}</n-tag>
      </div>
      <n-space :size="6">
        <n-button size="small" quaternary @click="syncFromConfigFiles" title="从 Agent 配置文件同步 MCP Server">
          ↻ 刷新
        </n-button>
        <n-button type="primary" size="small" @click="onAdd">+ 添加</n-button>
      </n-space>
    </div>

    <div class="dash-grid">
      <div v-for="stat in agentStats" :key="stat.app" class="dash-card" :class="{ 'dash-card--zero': stat.count === 0 }">
        <div class="dash-icon" :class="'dash-icon--' + stat.app">
          <img v-if="stat.icon" :src="stat.icon" :alt="stat.label" class="dash-icon-img" />
        </div>
        <div class="dash-body">
          <span class="dash-agent">{{ stat.label }}</span>
          <span v-if="stat.count" class="dash-num">{{ stat.count }}</span>
          <span v-else class="dash-num dash-num--zero">—</span>
          <span class="dash-unit">MCP</span>
        </div>
      </div>
    </div>

    <div class="page-body">
      <n-empty v-if="mcpServers.length === 0" description="暂无 MCP Server 配置" style="padding: 60px 0;">
        <template #extra>
          <n-text depth="3" style="font-size: 13px;">点击「+ 添加」开始配置 MCP Server</n-text>
        </template>
      </n-empty>

      <McpCard
        v-for="s in mcpServers" :key="s.id"
        :server="s"
        @edit="onEdit" @delete="onDelete" @toggle="toggleServer"
        @update-apps="onUpdateApps"
      />
    </div>

    <McpForm :visible="showForm" :initial-data="formInitialData" @close="showForm = false" @save="onSave" />
  </div>
</template>

<style scoped>
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
}
.back-btn:hover {
  background: var(--bg-hover);
  color: var(--text);
}
.page-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.dash-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  padding: 0 20px 8px;
  flex-shrink: 0;
}
.dash-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  transition: border-color .15s, box-shadow .15s;
}
.dash-card:hover {
  border-color: var(--primary);
  box-shadow: 0 1px 4px rgba(217,119,6,.1);
}
.dash-card--zero {
  opacity: .55;
}
.dash-card--zero:hover {
  border-color: var(--text-muted);
  box-shadow: none;
}
.dash-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  background: var(--bg-hover);
}
.dash-icon-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}
.dash-icon--codex { background: #fef3c7; }
.dash-icon--claude { background: #ede9fe; }
.dash-icon--claude-desktop { background: #ede9fe; }
.dash-icon--openclaw { background: #d1fae5; }
.dash-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.dash-agent {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
}
.dash-num {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
}
.dash-num--zero {
  color: var(--text-muted);
  font-size: 18px;
}
.dash-unit {
  font-size: 10px;
  color: var(--text-muted);
}

.page-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
