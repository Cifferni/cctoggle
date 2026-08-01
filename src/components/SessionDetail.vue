<script setup lang="ts">
// @ts-nocheck TODO: 逐步添加类型注解后移除
import { NDrawer, NDrawerContent, NDescriptions, NDescriptionsItem, NDivider, NTag, NText, NSpace, NButton, NSpin } from "naive-ui";
import { APP_LABELS } from "../composables/shared";

const props = defineProps({
  show: { type: Boolean, default: false },
  session: { type: Object, default: null },
  messages: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["update:show", "export", "copyTo"]);

function onClose() {
  emit("update:show", false);
}

function formatTime(ts) {
  if (!ts) return "—";
  try {
    var d = new Date(ts);
    var y = d.getFullYear();
    var m = ("0" + (d.getMonth() + 1)).slice(-2);
    var day = ("0" + d.getDate()).slice(-2);
    var h = ("0" + d.getHours()).slice(-2);
    var min = ("0" + d.getMinutes()).slice(-2);
    return `${y}-${m}-${day} ${h}:${min}`;
  } catch (e) {
    return ts;
  }
}

function formatTokens(n) {
  if (!n) return "—";
  return n.toLocaleString();
}

function truncateContent(content, maxLen) {
  if (!content) return "";
  maxLen = maxLen || 500;
  if (content.length <= maxLen) return content;
  return content.substring(0, maxLen) + "...";
}
</script>

<template>
  <n-drawer :show="show" :width="480" placement="right" @update:show="onClose">
    <n-drawer-content title="会话详情" closable>
      <template v-if="session">
        <!-- 会话信息 -->
        <n-descriptions :column="1" label-placement="left" bordered size="small">
          <n-descriptions-item label="标题">{{ session.title }}</n-descriptions-item>
          <n-descriptions-item label="应用">
            <n-space :size="4" align="center">
              <n-tag size="tiny" :bordered="false">{{ APP_LABELS[session.app] || session.app }}</n-tag>
            </n-space>
          </n-descriptions-item>
          <n-descriptions-item v-if="session.projectPath" label="项目">{{ session.projectPath }}</n-descriptions-item>
          <n-descriptions-item v-if="session.model" label="模型">{{ session.model }}</n-descriptions-item>
          <n-descriptions-item label="创建时间">{{ formatTime(session.createdAt) }}</n-descriptions-item>
          <n-descriptions-item label="更新时间">{{ formatTime(session.updatedAt) }}</n-descriptions-item>
          <n-descriptions-item label="消息数">{{ session.messageCount }}</n-descriptions-item>
          <n-descriptions-item label="Tokens">{{ formatTokens(session.tokenUsage) }}</n-descriptions-item>
        </n-descriptions>

        <!-- 消息列表 -->
        <n-divider />
        <div class="detail-section-title">
          <n-text strong style="font-size: 13px;">对话记录</n-text>
          <n-tag v-if="messages.length" size="tiny" :bordered="false" round>{{ messages.length }}</n-tag>
        </div>

        <div v-if="loading" class="detail-loading">
          <n-spin size="small" />
          <n-text depth="3" style="font-size: 12px;">加载中...</n-text>
        </div>

        <div v-else-if="messages.length === 0" class="detail-empty">
          <n-text depth="3" style="font-size: 12px;">暂无消息记录</n-text>
        </div>

        <div v-else class="message-list">
          <div v-for="(msg, idx) in messages" :key="idx" class="message-item" :class="'message-item--' + msg.role">
            <n-tag :type="msg.role === 'user' ? 'info' : 'success'" size="tiny" :bordered="false">
              {{ msg.role === 'user' ? 'User' : 'Assistant' }}
            </n-tag>
            <pre class="message-content">{{ truncateContent(msg.content) }}</pre>
          </div>
        </div>
      </template>

      <template #footer>
        <n-space justify="space-between" style="width: 100%;">
          <n-space :size="6">
            <n-button size="small" quaternary @click="emit('copyTo', session?.app)" :title="'复制 ' + (session?.app === 'codex' ? 'codex' : 'claude') + ' --resume 命令'">
              复制恢复命令
            </n-button>
          </n-space>
          <n-space :size="6">
            <n-button size="small" quaternary @click="emit('export', session)">导出</n-button>
            <n-button size="small" type="primary" @click="onClose">关闭</n-button>
          </n-space>
        </n-space>
      </template>
    </n-drawer-content>
  </n-drawer>
</template>

<style lang="scss" scoped>
.detail-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.detail-loading,
.detail-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 0;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.message-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  border: 1px solid var(--border);

  &--user {
    border-left: 3px solid #2080f0;
  }

  &--assistant {
    border-left: 3px solid #18a058;
  }
}

.message-content {
  font-size: 12px;
  line-height: 1.6;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  font-family: inherit;
}
</style>
