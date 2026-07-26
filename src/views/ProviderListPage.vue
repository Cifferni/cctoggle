<script setup>
import { ref, onMounted } from "vue";
import { useProviders } from "../composables/useProviders.js";
import TabBar from "../components/TabBar.vue";
import ProviderCard from "../components/ProviderCard.vue";
import ProviderForm from "../components/ProviderForm.vue";

const { providers, loadProviders, switchProvider, saveProvider, deleteProvider, getFullProvider } = useProviders();
const showForm = ref(false), editingId = ref(null), formInitialData = ref(null);
const pendingDeleteId = ref(null);

onMounted(() => loadProviders());

function onAdd() { editingId.value = null; formInitialData.value = null; showForm.value = true; }
function onEdit(id) { editingId.value = id; formInitialData.value = getFullProvider(id); showForm.value = true; }
function onDelete(id) { pendingDeleteId.value = id; }
function confirmDelete() { if (pendingDeleteId.value) deleteProvider(pendingDeleteId.value); pendingDeleteId.value = null; }
function cancelDelete() { pendingDeleteId.value = null; }
function onSave(data) {
  if (editingId.value) { data.id = editingId.value; data.sortOrder = providers.value.find(p => p.id === editingId.value)?.sortOrder || 0; }
  saveProvider(data); showForm.value = false; editingId.value = null;
}
</script>

<template>
  <div class="page">
    <div class="tab-bar-wrap">
      <TabBar />
    </div>
    <div class="page-body">
      <div class="page-header">
        <div class="page-stats">
          <span class="page-count">{{ providers.length }} 个供应商</span>
          <span v-if="providers.length" class="page-active">
            <span class="dot dot--green"></span>
            {{ providers.filter(p => p.isCurrent).length }} 已激活
          </span>
        </div>
        <button class="btn-add" @click="onAdd">+ 添加供应商</button>
      </div>

      <div v-if="providers.length === 0" class="page-empty">
        <div class="page-empty-icon">&#x1F512;</div>
        <p class="page-empty-title">暂无供应商配置</p>
        <p class="page-empty-desc">点击"+ 添加供应商"或从下方预设快速导入</p>
      </div>

      <ProviderCard v-for="p in providers" :key="p.id" :provider="p" @switch="switchProvider" @edit="onEdit" @delete="onDelete" />
    </div>

    <ProviderForm :visible="showForm" :initial-data="formInitialData" @close="showForm = false" @save="onSave" />

    <div v-if="pendingDeleteId" class="confirm-overlay" @click.self="cancelDelete">
      <div class="confirm-box">
        <p class="confirm-title">确定删除该供应商？</p>
        <p class="confirm-desc">删除后无法恢复。</p>
        <div class="confirm-actions">
          <button class="btn-cancel" @click="cancelDelete">取消</button>
          <button class="btn-danger" @click="confirmDelete">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.tab-bar-wrap {
  padding: 10px 20px 0;
  flex-shrink: 0;
}
.page-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 20px 16px;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.page-stats { display: flex; align-items: center; gap: 12px; }
.page-count { font-size: 14px; font-weight: 500; color: var(--text-secondary); }
.page-active { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-muted); }
.dot { width: 7px; height: 7px; border-radius: 50%; }
.dot--green { background: var(--success); }

.btn-add {
  padding: 7px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 12px; font-weight: 500;
  background: none; color: var(--text-secondary);
  cursor: pointer; transition: all .15s;
}
.btn-add:hover { background: var(--bg-hover); color: var(--text); border-color: var(--text-muted); }

.page-empty { text-align: center; padding: 60px 20px; }
.page-empty-icon { font-size: 48px; opacity: .2; margin-bottom: 16px; }
.page-empty-title { font-size: 15px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }
.page-empty-desc { font-size: 13px; color: var(--text-muted); }

.confirm-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,.35);
  display: flex; align-items: center; justify-content: center;
}
.confirm-box {
  width: 300px; background: var(--bg);
  border: 1px solid var(--border); border-radius: 8px;
  padding: 20px; box-shadow: 0 8px 32px rgba(0,0,0,.2);
}
.confirm-title { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 6px; }
.confirm-desc { font-size: 13px; color: var(--text-muted); margin-bottom: 18px; }
.confirm-actions { display: flex; justify-content: flex-end; gap: 8px; }
.confirm-actions button {
  padding: 6px 16px; border-radius: 6px; font-size: 13px; font-weight: 500;
  cursor: pointer; border: 1px solid var(--border);
}
.btn-cancel { background: none; color: var(--text-secondary); }
.btn-cancel:hover { background: var(--bg-hover); color: var(--text); }
.btn-danger { background: #e5484d; color: #fff; border-color: #e5484d; }
.btn-danger:hover { background: #d43c41; }
</style>
