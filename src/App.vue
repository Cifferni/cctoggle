<script setup>
import { ref, onMounted } from "vue";
import AppFooter from "./components/AppFooter.vue";
import ToastHost from "./components/ToastHost.vue";
import ConfirmHost from "./components/ConfirmHost.vue";

const isDark = ref(window.matchMedia("(prefers-color-scheme: dark)").matches);
onMounted(() => {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => isDark.value = e.matches);
});
</script>

<template>
  <div class="app-shell" :class="{ dark: isDark }">
    <main class="app-main">
      <router-view />
    </main>
    <AppFooter />
    <ToastHost />
    <ConfirmHost />
  </div>
</template>

<style scoped>
.app-shell {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--text);
  user-select: none;
}
.app-main {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>