<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const tabs = [
  { path: "/settings/routes",  label: "路由 / 代理" },
  { path: "/settings/storage", label: "Skill 存储" },
];

const activePath = computed(() => route.path);

function go(p) {
  if (route.path !== p) router.push(p);
}
</script>

<template>
  <div class="settings-page">
    <header class="sub-header">
      <router-link to="/" class="back-btn" title="Back">&#8592;</router-link>
      <span class="sub-title">设置</span>
    </header>

    <nav class="sub-tabs">
      <button
        v-for="t in tabs" :key="t.path"
        class="sub-tab"
        :class="{ 'sub-tab--active': activePath === t.path }"
        @click="go(t.path)"
      >{{ t.label }}</button>
    </nav>

    <div class="sub-content">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.sub-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.back-btn {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border: none; background: none; border-radius: var(--radius);
  color: var(--text-secondary); font-size: 16px;
  cursor: pointer; text-decoration: none; transition: all .15s;
}
.back-btn:hover { background: var(--bg-hover); color: var(--text); }
.sub-title { font-size: 13px; font-weight: 600; color: var(--text-secondary); }

.sub-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--border);
  padding: 0 20px;
  flex-shrink: 0;
}
.sub-tab {
  padding: 10px 20px;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all .15s;
}
.sub-tab:hover { color: var(--text); }
.sub-tab--active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}
.sub-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}
</style>

