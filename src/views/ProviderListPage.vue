<script setup>
import { ref, computed, onMounted } from "vue";
import { useProviders } from "../composables/useProviders";
import TabBar from "../components/TabBar.vue";
import ProviderCard from "../components/ProviderCard.vue";
import ProviderForm from "../components/ProviderForm.vue";

const { providers, loadProviders, switchProvider, saveProvider, deleteProvider, getFullProvider } = useProviders();
const showForm = ref(false), editingId = ref(null), formInitialData = ref(null);

const currentProvider = computed(() => providers.value.find(p => p.isCurrent));
const otherProviders = computed(() => providers.value.filter(p => !p.isCurrent));

onMounted(() => loadProviders());

function onAdd() { editingId.value = null; formInitialData.value = null; showForm.value = true; }
function onEdit(id) { editingId.value = id; formInitialData.value = getFullProvider(id); showForm.value = true; }
function onDelete(id) { deleteProvider(id); }
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
        <n-text depth="3" style="font-size: 14px; font-weight: 500;">{{ providers.length }} 个供应商</n-text>
        <n-button type="primary" size="small" @click="onAdd">+ 添加供应商</n-button>
      </div>

      <n-empty v-if="providers.length === 0" description="暂无供应商配置" style="padding: 60px 0;">
        <template #extra>
          <n-text depth="3" style="font-size: 13px;">点击「+ 添加供应商」开始</n-text>
        </template>
      </n-empty>

      <template v-else>
        <ProviderCard v-if="currentProvider" :provider="currentProvider" @switch="switchProvider" @edit="onEdit" @delete="onDelete" />

        <div v-if="otherProviders.length" class="providers-section">
          <div class="section-label">
            <n-text depth="3">其他供应商</n-text>
            <n-tag size="tiny" :bordered="false" round>{{ otherProviders.length }}</n-tag>
          </div>
          <n-grid :cols="2" :x-gap="8" :y-gap="8" responsive="screen" :item-responsive="true">
            <n-gi v-for="p in otherProviders" :key="p.id" :span="1">
              <ProviderCard :provider="p" compact @switch="switchProvider" @edit="onEdit" @delete="onDelete" />
            </n-gi>
          </n-grid>
        </div>
      </template>
    </div>

    <ProviderForm :visible="showForm" :initial-data="formInitialData" @close="showForm = false" @save="onSave" />
  </div>
</template>

<style scoped>
.page {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.tab-bar-wrap {
  padding: 0 10px;
  flex-shrink: 0;
}
.page-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 36px;
  padding: 0 10px;
}

/* ── Inactive providers section ── */
.providers-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .8px;
  color: var(--text-muted);
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}
</style>
