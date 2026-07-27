<script setup>
import { useProviders } from "../composables/useProviders.js";
const { paths } = useProviders();
</script>

<template>
  <footer class="app-footer">
    <span>SkillNest ccToggle | {{ paths.codexConfig || '配置文件路径' }}</span>
  </footer>
</template>

<style scoped>
.app-footer {
  padding: 4px 16px;
  border-top: 1px solid var(--border);
  text-align: center;
  font-size: 10px;
  color: var(--text-muted);
  flex-shrink: 0;
}
</style>
