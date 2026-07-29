<script setup>
import { computed } from "vue";
const props = defineProps({ provider: Object });
const emit = defineEmits(["switch", "edit", "delete"]);

// 代理需求判定：agent 原生协议与供应商协议不一致时需要代理接管。
// 仅对 Codex(configType=openai) 供应商判定；apiFormat 标注了上游真实协议。
const proxyHint = computed(() => {
  const p = props.provider || {};
  if (p.configType !== "openai") return null;
  const af = p.apiFormat || "";
  if (af === "anthropic") {
    return { level: "required", label: "需代理", tip: "该供应商为 Anthropic 协议，Codex 无法直连，必须开启代理接管。" };
  }
  if (af === "openai_chat") {
    return { level: "optional", label: "可代理", tip: "该供应商仅支持 Chat Completions。可直连(连接协议选 Chat)，或走代理接管获得协议转换与多供应商切换。" };
  }
  return null;
});
const CAT_LABELS = {
  official: "官方", cn_official: "国内官方", partner: "合作",
  prime: "Prime", third_party: "第三方", custom: "自定义",
};
</script>

<template>
  <div class="card" :class="{ 'card--current': provider.isCurrent }">

    <div class="card-body">
      <div class="card-title">
        {{ provider.name }}
        <span v-if="provider.isCurrent" class="badge badge--active">当前</span>
        <span v-if="provider.category && provider.category!=='custom'"
          class="badge" :class="'badge--cat-' + provider.category">{{ CAT_LABELS[provider.category] || provider.category }}</span>
        <span class="badge badge--type">{{ provider.configType }}</span>
        <span v-if="proxyHint" class="badge" :class="'badge--proxy-' + proxyHint.level" :title="proxyHint.tip">{{ proxyHint.label }}</span>
      </div>
      <div class="card-meta">
        <span v-if="provider.baseUrl" class="card-url">{{ provider.baseUrl }}</span>
        <span v-if="provider.baseUrl && provider.model">&middot;</span>
        <span class="card-model">{{ provider.model }}</span>
        <span v-if="provider.models && provider.models.length" class="card-extras">+{{ provider.models.length }} 模型</span>
      </div>
      <div v-if="provider.remark" class="card-remark" :title="provider.remark">{{ provider.remark }}</div>
    </div>
    <div class="card-actions">
      <button class="btn btn--switch" :class="{ 'btn--active': provider.isCurrent }" @click="emit('switch', provider.id)" :disabled="provider.isCurrent">
        {{ provider.isCurrent ? '已激活' : '切换' }}
      </button>
      <button class="btn btn--ghost" @click="emit('edit', provider.id)">编辑</button>
      <button class="btn btn--ghost btn--danger" @click="emit('delete', provider.id)">删除</button>
    </div>
  </div>
</template>

<style scoped>
.card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-radius: var(--radius-lg);
  margin-bottom: 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  transition: all .15s;
}
.card:hover { border-color: var(--text-muted); }
.card--current {
  border-color: var(--primary);
  border-left: 3px solid var(--primary);
  background: var(--primary-light);
  padding-left: 15px;
  box-shadow: 0 1px 4px rgba(217,119,6,.1);
}

.card-body { flex: 1; min-width: 0; }

.card-title {
  display: flex; align-items: center; gap: 8px;
  font-weight: 600; font-size: 14px; margin-bottom: 3px;
}
.badge {
  font-size: 10px; padding: 2px 8px; border-radius: 20px;
  font-weight: 500; white-space: nowrap;
}
.badge--active { background: var(--primary); color: #fff; }
.badge--proxy-required { background: #fdecec; color: #c0392b; border: 1px solid #f5c6cb; cursor: help; }
.badge--proxy-optional { background: #eef4fd; color: #2b6cb0; border: 1px solid #cdddf5; cursor: help; }
.badge--type {
  background: var(--bg-hover); color: var(--text-secondary);
  text-transform: uppercase; letter-spacing: .3px;
}
.badge--cat-official { background: #dbeafe; color: #1d4ed8; }
.badge--cat-cn_official { background: #dcfce7; color: #15803d; }
.badge--cat-partner { background: #fef3c7; color: #b45309; }
.badge--cat-prime { background: #fae8ff; color: #a21caf; }
.badge--cat-third_party { background: var(--bg-hover); color: var(--text-secondary); }

.card-meta {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--text-muted);
}
.card-url { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-model { font-family: "SF Mono", "Fira Code", monospace; font-size: 11px; color: var(--text-secondary); }
.card-extras { color: var(--primary); font-size: 11px; }
.card-remark { margin-top: 4px; font-size: 12px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.card-actions { display: flex; gap: 6px; flex-shrink: 0; margin-left: 8px; }

.btn {
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 12px; font-weight: 500;
  cursor: pointer;
  background: var(--bg);
  color: var(--text-secondary);
  white-space: nowrap;
  transition: all .15s;
}
.btn:hover { background: var(--bg-hover); color: var(--text); }
.btn:disabled { opacity: .4; cursor: default; }

.btn--switch {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
  box-shadow: 0 1px 3px rgba(217,119,6,.25);
}
.btn--switch:hover { background: var(--primary-hover); }

.btn--active {
  background: var(--primary-light);
  color: var(--primary);
  border-color: var(--primary);
  box-shadow: none;
  font-weight: 600;
}

.btn--ghost {
  border: 1px solid transparent;
  background: none;
  color: var(--text-secondary);
}
.btn--ghost:hover { background: var(--bg-hover); color: var(--text); border-color: var(--border); }
.btn--danger:hover { color: var(--danger); background: var(--danger-light); border-color: var(--danger); }
</style>
