<script setup lang="ts">
// @ts-nocheck TODO: 逐步添加类型注解后移除
import { ref, watch } from "vue";
import { NModal, NCard, NDescriptions, NDescriptionsItem, NDivider, NTag, NText, NSpace, NButton, NSpin } from "naive-ui";
import { APP_LABELS } from "../../composables/shared";
import { renderMarkdown } from "../../utils/markdown";
import { diffLines } from "diff";

const props = defineProps({
  show: { type: Boolean, default: false },
  session: { type: Object, default: null },
  messages: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["update:show", "export", "copyTo"]);

// 记录展开状态的集合
const expandedSet = ref(new Set());

function toggleExpand(idx) {
  if (expandedSet.value.has(idx)) {
    expandedSet.value.delete(idx);
  } else {
    expandedSet.value.add(idx);
  }
}

function isExpanded(idx) {
  return expandedSet.value.has(idx);
}

// 切换会话时重置展开状态
watch(() => props.session, () => {
  expandedSet.value = new Set();
});

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

function getToolSummary(block) {
  var input = block.input;
  if (!input) return "";
  var name = (block.name || "").toLowerCase();
  if (name === "edit" || name === "read" || name === "write") {
    var fp = input.file_path || input.path || "";
    if (fp) {
      var parts = fp.replace(/\\/g, "/").split("/");
      return parts.slice(-2).join("/");
    }
  }
  if (name === "bash") {
    var cmd = input.command || "";
    return cmd.length > 40 ? cmd.substring(0, 40) + "..." : cmd;
  }
  if (name === "grep") {
    return input.pattern || "";
  }
  if (name === "glob") {
    return input.pattern || "";
  }
  if (name === "agent") {
    return input.description || "";
  }
  if (name === "todowrite") return "";
  return "";
}

function formatToolInput(block) {
  var input = block.input;
  if (!input) return "";
  var name = (block.name || "").toLowerCase();
  // Write: 显示文件路径和内容摘要
  if (name === "write") {
    var wparts = [];
    if (input.file_path) wparts.push("文件: " + input.file_path);
    if (input.content) wparts.push("内容:\n" + (input.content.length > 500 ? input.content.substring(0, 500) + "..." : input.content));
    return wparts.join("\n\n");
  }
  // Bash: 显示命令
  if (name === "bash") {
    return input.command || "";
  }
  // Edit: 不用纯文本，用 diff 渲染（返回空，由模板处理）
  if (name === "edit") return "";
  // 其他: JSON 格式化
  try {
    return JSON.stringify(input, null, 2);
  } catch (e) {
    return String(input);
  }
}

function getEditDiff(block) {
  var input = block.input;
  if (!input || !input.old_string || !input.new_string) return [];
  return diffLines(input.old_string, input.new_string);
}

function getPreviewText(msg) {
  var blocks = msg.contentBlocks || [];
  for (var i = 0; i < blocks.length; i++) {
    if (blocks[i].type === "text" && blocks[i].text) {
      var t = blocks[i].text.replace(/\n/g, " ").trim();
      return t.length > 60 ? t.substring(0, 60) + "..." : t;
    }
    if (blocks[i].type === "thinking" && blocks[i].text) {
      return "💭 " + blocks[i].text.replace(/\n/g, " ").trim().substring(0, 40) + "...";
    }
    if (blocks[i].type === "tool_use") {
      return "🔧 " + (blocks[i].name || "");
    }
  }
  return "...";
}

</script>

<template>
  <n-modal :show="show" @update:show="onClose" :auto-focus="false">
    <n-card title="会话详情" closable @close="onClose" style="width: 100vw; height: 100vh; border-radius: 0;" content-style="padding: 16px 24px; overflow-y: auto;" footer-style="padding: 0 24px 16px; border-top: none;" :style="{ '--n-title-font-size': '16px' }">
      <template v-if="session">
        <!-- 会话信息 -->
        <n-descriptions :column="2" label-placement="left" bordered size="small">
          <n-descriptions-item label="标题" :span="2">{{ session.title }}</n-descriptions-item>
          <n-descriptions-item label="应用">
            <n-space :size="4" align="center">
              <n-tag size="tiny" :bordered="false">{{ APP_LABELS[session.app] || session.app }}</n-tag>
            </n-space>
          </n-descriptions-item>
          <n-descriptions-item v-if="session.model" label="模型">{{ session.model }}</n-descriptions-item>
          <n-descriptions-item v-if="session.projectPath" label="项目" :span="2">{{ session.projectPath }}</n-descriptions-item>
          <n-descriptions-item label="创建时间">{{ formatTime(session.createdAt) }}</n-descriptions-item>
          <n-descriptions-item label="更新时间">{{ formatTime(session.updatedAt) }}</n-descriptions-item>
          <n-descriptions-item label="消息数">{{ messages.length || session.messageCount }}</n-descriptions-item>
          <n-descriptions-item label="Tokens">{{ formatTokens(session.tokenUsage) }}</n-descriptions-item>
        </n-descriptions>

        <!-- 消息列表 -->
        <n-divider />
        <div class="detail-section-title">
          <n-text strong style="font-size: 14px;">对话记录</n-text>
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
          <div v-for="(msg, idx) in messages" :key="idx" class="message-item" :class="['message-item--' + msg.role, isExpanded(idx) ? 'message-item--open' : '']">
            <div class="message-summary" @click="toggleExpand(idx)">
              <span class="message-arrow" :class="{ 'message-arrow--open': isExpanded(idx) }">▶</span>
              <n-tag :type="msg.role === 'user' ? 'info' : 'success'" size="tiny" :bordered="false">
                {{ msg.role === 'user' ? '用户' : '助手' }}
              </n-tag>
              <span class="message-preview">{{ getPreviewText(msg) }}</span>
            </div>
            <div v-if="isExpanded(idx)" class="message-body">
              <template v-for="(block, bIdx) in (msg.contentBlocks || [])" :key="bIdx">
                <div v-if="block.type === 'text'" class="message-content markdown-body" v-html="renderMarkdown(block.text)"></div>
                <details v-else-if="block.type === 'thinking'" class="message-thinking">
                  <summary>💭 思考过程</summary>
                  <div class="message-thinking-body markdown-body" v-html="renderMarkdown(block.text)"></div>
                </details>
                <div v-else-if="block.type === 'tool_use'" class="message-tool-use">
                  <div class="message-tool-header">
                    🔧 {{ block.name }}<span v-if="getToolSummary(block)" class="message-tool-detail">{{ getToolSummary(block) }}</span>
                  </div>
                  <details v-if="block.input && Object.keys(block.input).length > 0" class="message-tool-input">
                    <summary>参数</summary>
                    <div v-if="block.name === 'Edit' && block.input.old_string" class="message-diff">
                      <div v-for="(part, pIdx) in getEditDiff(block)" :key="pIdx" class="message-diff-line" :class="{ 'message-diff--add': part.added, 'message-diff--del': part.removed }">
                        <pre class="message-diff-text">{{ part.value }}</pre>
                      </div>
                    </div>
                    <pre v-else class="message-tool-params">{{ formatToolInput(block) }}</pre>
                  </details>
                </div>
                <details v-else-if="block.type === 'tool_result'" class="message-tool-result">
                  <summary>📋 工具结果</summary>
                  <div class="message-tool-result-body markdown-body" v-html="renderMarkdown(block.text)"></div>
                </details>
              </template>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="detail-footer">
          <n-space :size="6">
            <n-button size="small" quaternary @click="emit('copyTo', session?.app)" :title="'复制 ' + (session?.app === 'codex' ? 'codex' : 'claude') + ' --resume 命令'">
              复制恢复命令
            </n-button>
            <n-button size="small" quaternary @click="emit('export', session)">导出</n-button>
            <n-button size="small" type="primary" @click="onClose">关闭</n-button>
          </n-space>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<style lang="scss" scoped>
.detail-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.detail-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid var(--border);
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
}

.message-item {
  border-radius: 8px;
  background: var(--bg-card);
  border: 1px solid var(--border);

  &--user {
    border-left: 3px solid #2080f0;
  }

  &--assistant {
    border-left: 3px solid #18a058;
  }

  &--open .message-summary {
    border-bottom: 1px solid var(--border);
  }
}

.message-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: var(--bg-hover);
  }
}

.message-arrow {
  font-size: 10px;
  color: var(--text-secondary);
  transition: transform 0.15s;
  flex-shrink: 0;

  &--open {
    transform: rotate(90deg);
  }
}

.message-preview {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.message-body {
  padding: 8px 10px;
}

.message-thinking {
  font-size: 12px;
  color: var(--text-secondary);
  border: 1px dashed var(--border);
  border-radius: 4px;
  padding: 0;
  margin-top: 4px;

  summary {
    cursor: pointer;
    padding: 4px 8px;
    font-size: 11px;
    color: var(--text-secondary);
    user-select: none;

    &:hover {
      background: var(--bg-hover);
    }
  }

  &[open] summary {
    border-bottom: 1px dashed var(--border);
  }
}

.message-thinking-body {
  padding: 6px 8px;
  max-height: 200px;
  overflow-y: auto;
}

.message-tool-use {
  font-size: 11px;
  color: var(--text-secondary);
  background: var(--bg-hover);
  border-radius: 4px;
  margin-top: 2px;
  overflow: hidden;
}

.message-tool-header {
  padding: 3px 8px;
}

.message-tool-detail {
  margin-left: 6px;
  opacity: 0.7;
  font-size: 10px;
}

.message-tool-input {
  border-top: 1px solid var(--border);

  summary {
    cursor: pointer;
    padding: 3px 8px;
    font-size: 10px;
    user-select: none;

    &:hover { background: var(--bg-card); }
  }

  &[open] summary {
    border-bottom: 1px solid var(--border);
  }
}

.message-tool-params {
  margin: 0;
  padding: 6px 8px;
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
  font-family: monospace;
}

.message-diff {
  max-height: 250px;
  overflow-y: auto;
  font-size: 11px;
  line-height: 1.5;
}

.message-diff-line {
  margin: 0;
}

.message-diff-text {
  margin: 0;
  padding: 0 8px;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-diff--add {
  background: rgba(40, 167, 69, 0.15);

  .message-diff-text {
    color: #28a745;
  }
}

.message-diff--del {
  background: rgba(220, 53, 69, 0.15);

  .message-diff-text {
    color: #dc3545;
  }
}

.message-tool-result {
  font-size: 12px;
  color: var(--text-secondary);
  border: 1px dashed var(--border);
  border-radius: 4px;
  padding: 0;
  margin-top: 4px;

  summary {
    cursor: pointer;
    padding: 4px 8px;
    font-size: 11px;
    color: var(--text-secondary);
    user-select: none;

    &:hover {
      background: var(--bg-hover);
    }
  }

  &[open] summary {
    border-bottom: 1px dashed var(--border);
  }
}

.message-tool-result-body {
  padding: 6px 8px;
  max-height: 300px;
  overflow-y: auto;
  font-size: 11px;
  line-height: 1.5;
}

.message-content {
  font-size: 12px;
  line-height: 1.6;
  color: var(--text);
  word-break: break-word;
  margin: 0;

  &.markdown-body {
    :deep(h1),
    :deep(h2),
    :deep(h3) {
      margin: 8px 0 6px;
      font-weight: 600;
    }

    :deep(h1) { font-size: 15px; }
    :deep(h2) { font-size: 14px; }
    :deep(h3) { font-size: 13px; }

    :deep(p) {
      margin: 6px 0;
    }

    :deep(code) {
      background: var(--bg-hover);
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 11px;
      font-family: monospace;
    }

    :deep(pre) {
      background: var(--bg-hover);
      padding: 8px 10px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 6px 0;
    }

    :deep(pre code) {
      background: none;
      padding: 0;
    }

    :deep(blockquote) {
      border-left: 3px solid var(--primary);
      padding-left: 10px;
      margin: 6px 0;
      color: var(--text-secondary);
    }

    :deep(ul),
    :deep(ol) {
      padding-left: 18px;
      margin: 6px 0;
    }

    :deep(li) {
      margin: 2px 0;
    }

    :deep(a) {
      color: var(--primary);
      text-decoration: none;
    }

    :deep(a:hover) {
      text-decoration: underline;
    }

    :deep(table) {
      border-collapse: collapse;
      width: 100%;
      margin: 6px 0;
    }

    :deep(th),
    :deep(td) {
      border: 1px solid var(--border);
      padding: 4px 8px;
      text-align: left;
    }

    :deep(th) {
      background: var(--bg-hover);
      font-weight: 600;
    }

    :deep(hr) {
      border: none;
      border-top: 1px solid var(--border);
      margin: 12px 0;
    }

    :deep(img) {
      max-width: 100%;
      border-radius: 4px;
    }
  }
}
</style>
