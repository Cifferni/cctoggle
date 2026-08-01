<script setup lang="ts">
// @ts-nocheck TODO: 逐步添加类型注解后移除
import { computed } from "vue";
import { NCard, NText, NSpace, NTag, NButton, NIcon } from "naive-ui";
import { usePrompts } from "../composables/usePrompts";

const props = defineProps({
  prompt: { type: Object, required: true },
});

const emit = defineEmits(["close", "edit"]);

const { AGENT_LABELS } = usePrompts();

// Agent tags
const agentTags = computed(() => {
  if (!props.prompt.agents?.length) return [];
  return props.prompt.agents.map(agent => ({
    label: AGENT_LABELS[agent] || agent,
    value: agent,
  }));
});
</script>

<template>
  <n-card
    style="width: 90%; max-width: 700px; max-height: 85vh;"
    :title="prompt.name"
    :bordered="false"
    size="small"
  >
    <template #header-extra>
      <n-space :size="4">
        <n-button size="small" quaternary @click="emit('edit', prompt)">
          编辑
        </n-button>
        <n-button size="small" quaternary @click="emit('close')">
          关闭
        </n-button>
      </n-space>
    </template>

    <div class="prompt-preview">
      <div v-if="prompt.description" class="prompt-preview__desc">
        <n-text depth="3">{{ prompt.description }}</n-text>
      </div>

      <div class="prompt-preview__meta">
        <n-space :size="8" align="center">
          <n-text depth="3" strong>关联 Agent：</n-text>
          <n-tag
            v-for="tag in agentTags"
            :key="tag.value"
            size="small"
            :bordered="false"
            type="info"
          >
            {{ tag.label }}
          </n-tag>
        </n-space>
      </div>

      <div class="prompt-preview__content">
        <n-text>{{ prompt.content }}</n-text>
      </div>
    </div>
  </n-card>
</template>

<style lang="scss" scoped>
.prompt-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px 0;
}

.prompt-preview__desc {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.prompt-preview__meta {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.prompt-preview__content {
  padding: 16px;
  background: var(--bg-hover);
  border-radius: 6px;
  white-space: pre-wrap;
  font-size: 13px;
  line-height: 1.6;
  max-height: 400px;
  overflow-y: auto;
}
</style>
