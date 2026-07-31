<script setup>
import { computed } from "vue";
import { useMessage, useDialog } from "naive-ui";
import { usePrompts } from "../composables/usePrompts.js";

const props = defineProps({
  prompt: { type: Object, required: true },
});

const emit = defineEmits(["edit", "delete", "updated"]);

const message = useMessage();
const dialog = useDialog();
const { ALL_AGENTS, AGENT_LABELS, togglePromptAgent, applyPromptToAgent } = usePrompts();

// Truncate content for preview
function truncateContent(content, maxLength = 80) {
  if (!content) return "";
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + "...";
}

// Check if agent is associated
function isAgentAssociated(agent) {
  return props.prompt.agents?.includes(agent);
}

// Toggle agent association
function handleToggleAgent(agent) {
  const result = togglePromptAgent(props.prompt.id, agent);
  if (result.success) {
    emit("updated");
  }
}

// Apply prompt to agent (with auto-deselect others)
function handleApply(agent) {
  if (!isAgentAssociated(agent)) {
    message.warning("请先关联该 Agent");
    return;
  }
  const result = applyPromptToAgent(props.prompt.id, agent);
  if (result.success) {
    message.success(`已应用到 ${AGENT_LABELS[agent]}`);
    emit("updated");
  } else {
    message.error("应用失败：" + (result.error || "未知错误"));
  }
}

// Delete with confirmation dialog
function confirmDelete() {
  dialog.warning({
    title: "删除提示词",
    content: `确定删除提示词「${props.prompt.name}」？`,
    positiveText: "删除",
    negativeText: "取消",
    onPositiveClick: () => {
      emit("delete", props.prompt);
    },
  });
}
</script>

<template>
  <div class="prompt-item" @click="emit('edit', prompt)">
    <div class="prompt-icon">📝</div>
    <div class="prompt-info">
      <span class="prompt-name">{{ prompt.name }}</span>
      <span v-if="prompt.description" class="prompt-desc">{{ prompt.description }}</span>
      <span class="prompt-preview">{{ truncateContent(prompt.content) }}</span>
    </div>
    <div class="prompt-agents" @click.stop>
      <button
        v-for="agent in ALL_AGENTS"
        :key="agent"
        class="agent-chip"
        :class="{ 'agent-chip--on': isAgentAssociated(agent) }"
        :title="isAgentAssociated(agent) ? '点击取消关联' : '点击关联'"
        @click="handleToggleAgent(agent)"
      >
        {{ AGENT_LABELS[agent] }}
      </button>
    </div>
    <div class="prompt-actions" @click.stop>
      <button
        class="btn-delete"
        title="删除"
        @click="confirmDelete"
      >✕</button>
    </div>
  </div>
</template>

<style scoped>
.prompt-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-card);
  transition: border-color .15s;
  cursor: pointer;
}

.prompt-item:hover {
  border-color: var(--primary);
}

.prompt-icon {
  font-size: 18px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.prompt-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.prompt-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
}

.prompt-desc {
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.prompt-preview {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.prompt-agents {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
}

.agent-chip {
  padding: 3px 10px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--bg);
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  color: var(--text-muted);
  white-space: nowrap;
  transition: all .15s;
}

.agent-chip:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.agent-chip--on {
  border-color: var(--primary);
  color: var(--primary);
}

.prompt-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.btn-delete {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 4px;
  background: none;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: all .15s;
}

.btn-delete:hover {
  border-color: var(--danger, #e74c3c);
  color: var(--danger, #e74c3c);
  background: rgba(231, 76, 60, 0.06);
}
</style>
