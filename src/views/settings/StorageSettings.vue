<script setup>
import { ref } from "vue";
import SkillStorageSection from "../../components/SkillStorageSection.vue";
import SyncSettings from "./SyncSettings.vue";

const syncOpen = ref(false);
</script>

<template>
  <div class="storage-settings">
    <SkillStorageSection />

    <section class="section collapse-card" :class="{ 'collapse-card--open': syncOpen }">
      <button class="section-title" @click="syncOpen = !syncOpen" :aria-expanded="syncOpen">
        <span class="section-title-left">
          <span class="section-caret" :class="{ 'section-caret--open': syncOpen }">&#9656;</span>
          同步方式
        </span>
        <span class="section-hint">{{ syncOpen ? '点击收起' : '点击展开' }}</span>
      </button>
      <div v-if="syncOpen" class="section-body">
        <SyncSettings />
      </div>
    </section>
  </div>
</template>

<style scoped>
.storage-settings {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.collapse-card {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-card);
  transition: border-color .15s, box-shadow .15s;
}
.collapse-card:hover { border-color: var(--primary); box-shadow: 0 1px 3px rgba(0,0,0,.04); }
.collapse-card--open { border-color: var(--primary); }
.section-title {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  border: none;
  background: none;
  padding: 12px 14px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  transition: color .15s;
}
.section-title:hover { color: var(--primary); }
.section-title-left { display: flex; align-items: center; gap: 8px; }
.section-caret {
  display: inline-block;
  font-size: 11px;
  color: var(--text-muted);
  transition: transform .15s;
}
.section-caret--open { transform: rotate(90deg); color: var(--primary); }
.section-hint {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 400;
}
.section-body { padding: 4px 14px 14px; }
</style>
