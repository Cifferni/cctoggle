<script setup>
import { ref, onMounted } from "vue";
import TabBar from "./components/TabBar.vue";
import AppFooter from "./components/AppFooter.vue";

const isDark = ref(window.matchMedia("(prefers-color-scheme: dark)").matches);
onMounted(() => {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => isDark.value = e.matches);
});
</script>

<template>
  <div class="h-screen flex flex-col text-[13px] leading-relaxed select-none" :class="[isDark ? 'dark' : '', 'bg-bg text-text']">
    <header class="flex items-center justify-between px-5 py-3 border-b border-border/50 shrink-0 bg-bg/80 backdrop-blur-sm">
      <TabBar />
      <router-link to="/settings" class="text-text-secondary hover:text-text hover:bg-bg-hover w-9 h-9 flex items-center justify-center rounded-lg text-lg no-underline transition-all" active-class="!text-primary !bg-badge" title="设置">&#9881;</router-link>
    </header>
    <main class="flex-1 overflow-hidden">
      <router-view />
    </main>
    <AppFooter />
  </div>
</template>