<script setup lang="ts">
// @ts-nocheck TODO: 逐步添加类型注解后移除
import { computed } from "vue";
const props = defineProps({ provider: Object, compact: Boolean });
const emit = defineEmits(["switch", "edit", "delete"]);
const contentStyle = computed(() => props.compact ? { padding: '12px 12px' } : { padding: '8px 12px' });

const proxyHint = computed(() => {
  const p = props.provider || {};
  if (p.configType !== "openai") return null;
  const af = p.apiFormat || "";
  if (af === "anthropic") return { level: "required", label: "需代理", tip: "该供应商为 Anthropic 协议，Codex 无法直连，必须开启代理接管。" };
  if (af === "openai_chat") return { level: "optional", label: "可代理", tip: "该供应商仅支持 Chat Completions。可直连(连接协议选 Chat)，或走代理接管获得协议转换与多供应商切换。" };
  return null;
});

const CAT_LABELS = { official: "官方", cn_official: "国内官方", partner: "合作", prime: "Prime", third_party: "第三方", custom: "自定义" };
const CAT_COLORS = {
  official: { color: "rgba(59,130,246,.12)", textColor: "#3b82f6" },
  cn_official: { color: "rgba(34,197,94,.12)", textColor: "#22c55e" },
  partner: { color: "rgba(245,158,11,.12)", textColor: "#f59e0b" },
  prime: { color: "rgba(168,85,247,.12)", textColor: "#a855f7" },
};
</script>

<template>
  <n-card size="small" :bordered="true" :content-style="contentStyle"
    class="provider-card" :class="{ 'provider-card--active': provider.isCurrent }">

    <!-- Full layout -->
    <div v-if="!compact" class="provider-row">
      <div class="provider-info">
        <div class="provider-name">
          <n-text strong>{{ provider.name }}</n-text>
          <n-tag v-if="provider.isCurrent" type="success" size="tiny" round :bordered="false">当前</n-tag>
          <n-tag
            v-if="provider.category && provider.category !== 'custom'"
            size="tiny" round :bordered="false"
            :color="CAT_COLORS[provider.category]"
          >{{ CAT_LABELS[provider.category] }}</n-tag>
          <n-tag size="tiny" :bordered="false">{{ provider.configType }}</n-tag>
          <n-tooltip v-if="proxyHint" trigger="hover">
            <template #trigger>
              <n-tag size="tiny" round :bordered="false" :type="proxyHint.level === 'required' ? 'error' : 'info'">{{ proxyHint.label }}</n-tag>
            </template>
            {{ proxyHint.tip }}
          </n-tooltip>
        </div>
        <div class="provider-meta">
          <span v-if="provider.baseUrl" class="meta-url">{{ provider.baseUrl }}</span>
          <span v-if="provider.baseUrl && provider.model" class="meta-dot">&middot;</span>
          <span class="meta-model">{{ provider.model }}</span>
          <span v-if="provider.remark" class="meta-remark" :title="provider.remark">{{ provider.remark }}</span>
        </div>
      </div>
      <n-space :size="4" align="center" :wrap="false" class="provider-actions">
        <n-button
          :type="provider.isCurrent ? 'default' : 'primary'"
          :secondary="provider.isCurrent"
          size="tiny"
          :disabled="provider.isCurrent"
          @click="emit('switch', provider.id, $event)"
        >{{ provider.isCurrent ? '已激活' : '切换' }}</n-button>
        <n-button quaternary size="tiny" @click="emit('edit', provider.id)">编辑</n-button>
        <n-popconfirm @positive-click="emit('delete', provider.id)">
          <template #trigger>
            <n-button quaternary type="error" size="tiny">删除</n-button>
          </template>
          确定删除该供应商？
        </n-popconfirm>
      </n-space>
    </div>

    <!-- Compact grid layout -->
    <div v-else class="compact-grid">
      <div class="compact-info">
        <div class="compact-row1">
          <n-text strong class="compact-name">{{ provider.name }}</n-text>
          <span class="meta-model">{{ provider.model }}</span>
        </div>
        <div class="compact-row2" :title="provider.remark">{{ provider.remark || '' }}</div>
      </div>
      <n-space :size="4" align="center" :wrap="false" class="compact-actions">
        <n-button
          :type="provider.isCurrent ? 'default' : 'primary'"
          :secondary="provider.isCurrent"
          size="tiny"
          :disabled="provider.isCurrent"
          @click="emit('switch', provider.id, $event)"
        >{{ provider.isCurrent ? '已激活' : '切换' }}</n-button>
        <n-button quaternary size="tiny" @click="emit('edit', provider.id)">编辑</n-button>
        <n-popconfirm @positive-click="emit('delete', provider.id)">
          <template #trigger>
            <n-button quaternary type="error" size="tiny">删除</n-button>
          </template>
          确定删除该供应商？
        </n-popconfirm>
      </n-space>
    </div>
  </n-card>
</template>

<style scoped>
.provider-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.provider-info { flex: 1; min-width: 0; }
.provider-actions { flex-shrink: 0; }

.provider-name {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  margin-bottom: 2px;
  flex-wrap: nowrap;
}

.provider-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-muted);
  overflow: hidden;
}
.meta-url {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.meta-model {
  font-family: "SF Mono", "Cascadia Code", "Consolas", monospace;
  font-size: 11px;
  color: var(--text-secondary);
}
.meta-dot { color: var(--text-muted); }
.meta-remark {
  margin-left: 4px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Compact grid layout ── */
.compact-grid {
  display: flex;
  align-items: center;
  gap: 12px;
}
.compact-info {
  flex: 1;
  min-width: 0;
}
.compact-row1 {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.compact-actions {
  flex-shrink: 0;
}
.compact-name {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
  color: var(--text-primary);
}
.compact-name-model .meta-model {
  color: var(--primary-color);
  opacity: .7;
}
.compact-row2 {
  font-size: 11px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 16px;
  height: 16px;
  margin-top: 4px;
}

/* ── Hover effect (compact cards only) ── */
.provider-card:not(.provider-card--active) {
  transition: all 0.2s ease;
  cursor: pointer;
}
.provider-card:not(.provider-card--active):hover {
  border-color: var(--primary);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

/* ── Active provider — strong visual treatment ── */
.provider-card--active {
  border-left: 3px solid var(--primary);
  background: var(--primary-light);
  box-shadow: 0 2px 8px rgba(217,119,6,.15);
}
.provider-card--active .provider-name {
  font-size: 14px;
  font-family: "SF Mono", "Cascadia Code", "Consolas", monospace;
}
</style>
