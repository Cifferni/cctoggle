<script setup>
import { ref, onMounted } from "vue";
import { NButton, NCard, NDrawer, NDrawerContent, NModal, NSpace, NText, useMessage } from "naive-ui";
import { usePrompts } from "../composables/usePrompts.js";
import PromptCard from "../components/PromptCard.vue";
import PromptEditor from "../components/PromptEditor.vue";
import PromptPreview from "../components/PromptPreview.vue";

const message = useMessage();

const {
  prompts, loading, activePrompt, ALL_AGENTS, AGENT_LABELS,
  originalPrompts,
  loadPrompts, deletePrompt,
  setActivePrompt, exportPrompts, importPrompts,
  loadBackups, backupOriginalPrompts, loadOriginalPrompts,
  restoreOriginalPrompt, restoreAllOriginalPrompts, hasBackup,
} = usePrompts();

// UI state
const showEditor = ref(false);
const showPreview = ref(false);
const showRestore = ref(false);
const editingPrompt = ref(null);
const viewingAgent = ref(null);
const viewingContent = ref("");

// Load prompts on mount
onMounted(() => {
  loadPrompts();
  loadBackups();
  loadOriginalPrompts();
});

// Create new prompt
function handleCreate() {
  editingPrompt.value = null;
  showEditor.value = true;
}

// Edit prompt
function handleEdit(prompt) {
  editingPrompt.value = { ...prompt };
  showEditor.value = true;
}

// Save prompt
function handleSave() {
  message.success("提示词已保存");
  showEditor.value = false;
  editingPrompt.value = null;
}

// Delete prompt
function handleDelete(prompt) {
  const result = deletePrompt(prompt.id);
  if (result.success) {
    message.success("提示词已删除");
    if (showPreview.value && activePrompt.value?.id === prompt.id) {
      showPreview.value = false;
      setActivePrompt(null);
    }
  } else {
    message.error("删除失败");
  }
}

// Export prompts
function handleExport() {
  const json = exportPrompts();
  if (json) {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prompts-export.json";
    a.click();
    URL.revokeObjectURL(url);
    message.success("导出成功");
  }
}

// Import prompts
function handleImport() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = importPrompts(event.target.result);
      if (result.success) {
        message.success(`成功导入 ${result.count} 个提示词`);
      } else {
        message.error("导入失败：" + result.error);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// Backup original prompts
function handleViewContent(agent) {
  viewingAgent.value = agent;
  viewingContent.value = originalPrompts.value[agent] || "";
}

// Backup original prompts
function handleBackup() {
  const result = backupOriginalPrompts();
  if (result.success) {
    message.success("已备份原始提示词");
  } else {
    message.error("备份失败：" + (result.error || "未知错误"));
  }
}

// Restore single agent prompt
function handleRestore(agent) {
  const result = restoreOriginalPrompt(agent);
  if (result.success) {
    message.success(`已恢复 ${AGENT_LABELS[agent]} 的原始提示词`);
  } else {
    message.error(`恢复失败：${result.error}`);
  }
}

// Restore all prompts
function handleRestoreAll() {
  const result = restoreAllOriginalPrompts();
  if (result.success) {
    message.success("已恢复所有原始提示词");
  } else {
    message.error("恢复失败");
  }
}
</script>

<template>
  <div class="prompts-page">
    <header class="sub-header">
      <router-link to="/" class="back-btn" title="返回">&#8592;</router-link>
      <span class="sub-title">提示词管理</span>
      <div class="sub-header__actions">
        <n-button size="small" quaternary @click="handleBackup">备份原始</n-button>
        <n-button size="small" quaternary @click="showRestore = true">恢复原始</n-button>
        <n-button size="small" quaternary @click="handleImport">导入</n-button>
        <n-button size="small" quaternary @click="handleExport">导出</n-button>
        <n-button type="primary" size="small" @click="handleCreate">+ 新建</n-button>
      </div>
    </header>

    <div class="sub-content">
      <div v-if="loading" class="prompts-page__loading">
        <n-text depth="3">加载中...</n-text>
      </div>

      <div v-else-if="prompts.length === 0" class="prompts-page__empty">
        <n-text depth="3">暂无提示词</n-text>
        <n-space :size="8" justify="center" style="margin-top: 12px;">
          <n-button size="small" @click="handleCreate">新建提示词</n-button>
        </n-space>
      </div>

      <div v-else class="prompts-page__list">
        <PromptCard
          v-for="prompt in prompts"
          :key="prompt.id"
          :prompt="prompt"
          @edit="handleEdit"
          @delete="handleDelete"
          @updated="loadPrompts"
        />
      </div>
    </div>

    <!-- Editor Drawer -->
    <PromptEditor
      v-model:show="showEditor"
      :prompt="editingPrompt"
      @save="handleSave"
      @cancel="showEditor = false"
    />

    <!-- Preview Modal -->
    <n-modal :show="showPreview" @update:show="showPreview = $event">
      <PromptPreview
        v-if="activePrompt"
        :prompt="activePrompt"
        @close="showPreview = false"
        @edit="(p) => { showPreview = false; handleEdit(p); }"
      />
    </n-modal>

    <!-- Restore Drawer -->
    <n-drawer :show="showRestore" :width="'50%'" @update:show="showRestore = $event">
      <n-drawer-content title="恢复原始提示词" closable>
        <div class="restore-list">
          <div v-for="agent in ALL_AGENTS" :key="agent" class="restore-item">
            <div class="restore-info">
              <span class="restore-agent">{{ AGENT_LABELS[agent] }}</span>
              <span class="restore-status" v-if="hasBackup(agent)">
                已备份
              </span>
              <span class="restore-status restore-status--none" v-else>
                未备份
              </span>
            </div>
            <div class="restore-content" v-if="originalPrompts[agent]">
              <pre>{{ originalPrompts[agent].substring(0, 80) }}{{ originalPrompts[agent].length > 80 ? '...' : '' }}</pre>
            </div>
            <div class="restore-content restore-content--empty" v-else>
              无提示词内容
            </div>
            <div class="restore-actions">
              <n-button
                v-if="originalPrompts[agent]"
                size="tiny"
                quaternary
                @click="handleViewContent(agent)"
              >
                查看
              </n-button>
              <n-button
                size="tiny"
                quaternary
                :disabled="!hasBackup(agent)"
                @click="handleRestore(agent)"
              >
                恢复
              </n-button>
            </div>
          </div>
        </div>

        <template #footer>
          <n-space justify="end">
            <n-button @click="showRestore = false">取消</n-button>
            <n-button type="warning" @click="handleRestoreAll">恢复全部</n-button>
          </n-space>
        </template>
      </n-drawer-content>
    </n-drawer>

    <!-- View Content Modal -->
    <n-modal :show="!!viewingAgent" @update:show="viewingAgent = null">
      <n-card
        style="width: 600px; max-width: 90vw; max-height: 80vh;"
        :title="viewingAgent ? AGENT_LABELS[viewingAgent] + ' 原始提示词' : ''"
        :bordered="false"
        size="small"
      >
        <template #header-extra>
          <n-button quaternary size="small" @click="viewingAgent = null">关闭</n-button>
        </template>
        <pre v-if="viewingContent" class="view-content">{{ viewingContent }}</pre>
        <n-text v-else depth="3" style="display: block; padding: 20px; text-align: center;">暂无提示词内容</n-text>
      </n-card>
    </n-modal>
  </div>
</template>

<style lang="scss" scoped>
.prompts-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sub-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.back-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  border-radius: var(--radius);
  color: var(--text-secondary);
  font-size: 16px;
  cursor: pointer;
  text-decoration: none;
  transition: all .15s;

  &:hover {
    background: var(--bg-hover);
    color: var(--text);
  }
}

.sub-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  flex: 1;
}

.sub-header__actions {
  display: flex;
  gap: 8px;
}

.sub-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.prompts-page__loading,
.prompts-page__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.prompts-page__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.restore-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.restore-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-hover);
}

.restore-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.restore-agent {
  font-size: 13px;
  font-weight: 600;
}

.restore-status {
  font-size: 11px;
  color: var(--success);
}

.restore-status--none {
  color: var(--text-muted);
}

.restore-content {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-card);
  padding: 8px;
  border-radius: 4px;
  max-height: 60px;
  overflow: hidden;
}

.restore-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
  font-size: 11px;
}

.restore-content--empty {
  color: var(--text-muted);
  font-style: italic;
}

.restore-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.view-content {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.6;
  max-height: 60vh;
  overflow-y: auto;
  background: var(--bg-hover);
  padding: 12px;
  border-radius: 6px;
}
</style>
