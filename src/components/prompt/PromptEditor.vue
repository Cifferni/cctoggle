<script setup lang="ts">
// @ts-nocheck TODO: 逐步添加类型注解后移除
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import {
  NDrawer, NDrawerContent, NInput, NButton, NSpace, NText, NTabs, NTabPane,
} from "naive-ui";
import { usePrompts } from "../../composables/usePrompts";
import { useAiOptimize } from "../../composables/useAiOptimize";
import { renderMarkdown } from "../../utils/markdown";

const props = defineProps({
  show: { type: Boolean, default: false },
  prompt: { type: Object, default: null },
});

const emit = defineEmits(["update:show", "save", "cancel"]);

const { savePrompt } = usePrompts();
const { streaming: aiStreaming, optimize, abort: abortAi } = useAiOptimize();

// Form state
const formData = ref({
  id: null,
  name: "",
  description: "",
  content: "",
  tags: [],
});

const activeTab = ref("edit");
const isSaving = ref(false);

// Rendered markdown content
const renderedContent = computed(() => {
  return renderMarkdown(formData.value.content) || '<p style="color: var(--text-secondary);">暂无内容</p>';
});

// Watch for prompt prop changes
watch(() => props.prompt, (newPrompt) => {
  if (newPrompt) {
    formData.value = {
      id: newPrompt.id || null,
      name: newPrompt.name || "",
      description: newPrompt.description || "",
      content: newPrompt.content || "",
      tags: newPrompt.tags || [],
    };
  } else {
    resetForm();
  }
}, { immediate: true });

// Reset form
function resetForm() {
  formData.value = {
    id: null,
    name: "",
    description: "",
    content: "",
    agents: [],
    tags: [],
  };
}

// Save handler
async function handleSave() {
  if (!formData.value.name.trim()) {
    return;
  }

  isSaving.value = true;
  try {
    const result = await savePrompt(formData.value);
    if (result.success) {
      emit("save", result.prompt);
      emit("update:show", false);
    }
  } finally {
    isSaving.value = false;
  }
}

// Cancel handler
function handleCancel() {
  resetForm();
  emit("cancel");
  emit("update:show", false);
}

// AI Optimize handler
async function handleAiOptimize() {
  const content = formData.value.content.trim();
  if (!content) return;

  try {
    await optimize(content, (text) => {
      formData.value.content = text;
    });
  } catch {
    // 用户中止或错误，不做额外处理
  }
}

// Keyboard shortcuts
function handleKeydown(e) {
  if (e.ctrlKey && e.key === "s") {
    e.preventDefault();
    handleSave();
  }
  if (e.key === "Escape") {
    handleCancel();
  }
}

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <n-drawer :show="show" :width="'50%'" @update:show="emit('update:show', $event)">
    <n-drawer-content :title="prompt?.id ? '编辑提示词' : '新建提示词'" closable>
      <n-tabs v-model:value="activeTab" type="line" size="small" class="prompt-editor__tabs">
        <n-tab-pane name="edit" tab="编辑">
          <div class="prompt-editor__form">
            <div class="prompt-editor__field">
              <n-text depth="3" class="prompt-editor__label">名称 *</n-text>
              <n-input
                v-model:value="formData.name"
                placeholder="输入提示词名称"
                size="small"
              />
            </div>

            <div class="prompt-editor__field">
              <n-text depth="3" class="prompt-editor__label">描述</n-text>
              <n-input
                v-model:value="formData.description"
                placeholder="输入描述（可选）"
                size="small"
              />
            </div>

            <div class="prompt-editor__field">
              <div class="prompt-editor__label-row">
                <n-text depth="3" class="prompt-editor__label">内容</n-text>
                <n-button
                  size="tiny"
                  quaternary
                  type="primary"
                  :loading="aiStreaming"
                  :disabled="!formData.content.trim()"
                  @click="aiStreaming ? abortAi() : handleAiOptimize()"
                >
                  {{ aiStreaming ? '中止' : '✨ AI 优化' }}
                </n-button>
              </div>
              <n-input
                v-model:value="formData.content"
                type="textarea"
                placeholder="输入提示词内容（支持 Markdown）"
                :autosize="{ minRows: 12, maxRows: 25 }"
                :disabled="aiStreaming"
              />
            </div>
          </div>
        </n-tab-pane>

        <n-tab-pane name="preview" tab="预览">
          <div class="prompt-editor__preview markdown-body" v-html="renderedContent"></div>
        </n-tab-pane>
      </n-tabs>

      <template #footer>
        <n-space justify="end">
          <n-button size="small" @click="handleCancel">取消</n-button>
          <n-button
            type="primary"
            size="small"
            :loading="isSaving"
            :disabled="!formData.name.trim() || aiStreaming"
            @click="handleSave"
          >
            保存 (Ctrl+S)
          </n-button>
        </n-space>
      </template>
    </n-drawer-content>
  </n-drawer>
</template>

<style lang="scss" scoped>
.prompt-editor__tabs {
  :deep(.n-tabs-nav) {
    margin-bottom: 12px;
  }
}

.prompt-editor__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.prompt-editor__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.prompt-editor__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.prompt-editor__label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.prompt-editor__preview {
  background: var(--bg-hover);
  border-radius: 6px;
  padding: 16px;
  font-size: 13px;
  line-height: 1.6;
  overflow-y: auto;
}

.markdown-body {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text);

  :deep(h1),
  :deep(h2),
  :deep(h3) {
    margin: 12px 0 8px;
    font-weight: 600;
  }

  :deep(h1) {
    font-size: 18px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }

  :deep(h2) {
    font-size: 16px;
  }

  :deep(h3) {
    font-size: 14px;
  }

  :deep(p) {
    margin: 8px 0;
  }

  :deep(code) {
    background: var(--bg-card);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    font-family: monospace;
  }

  :deep(pre) {
    background: var(--bg-card);
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 8px 0;
  }

  :deep(pre code) {
    background: none;
    padding: 0;
  }

  :deep(blockquote) {
    border-left: 3px solid var(--primary);
    padding-left: 12px;
    margin: 8px 0;
    color: var(--text-secondary);
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 20px;
    margin: 8px 0;
  }

  :deep(li) {
    margin: 4px 0;
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
    margin: 8px 0;
  }

  :deep(th),
  :deep(td) {
    border: 1px solid var(--border);
    padding: 8px 12px;
    text-align: left;
  }

  :deep(th) {
    background: var(--bg-card);
    font-weight: 600;
  }

  :deep(hr) {
    border: none;
    border-top: 1px solid var(--border);
    margin: 16px 0;
  }

  :deep(img) {
    max-width: 100%;
    border-radius: 4px;
  }
}
</style>
