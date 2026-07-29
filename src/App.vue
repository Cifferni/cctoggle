<script setup>
import { useTheme } from './composables/useTheme.js'
import { zhCN, dateZhCN } from 'naive-ui'
import AppFooter from './components/AppFooter.vue'
import ToastHost from './components/ToastHost.vue'
import ConfirmHost from './components/ConfirmHost.vue'

const { theme, themeOverrides, isDark } = useTheme()
</script>

<template>
  <n-config-provider :locale="zhCN" :date-locale="dateZhCN" :theme="theme" :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-notification-provider>
        <n-dialog-provider>
          <div class="app-shell" :class="{ dark: isDark }">
            <main class="app-main">
              <router-view />
            </main>
            <AppFooter />
            <ToastHost />
            <ConfirmHost />
          </div>
        </n-dialog-provider>
      </n-notification-provider>
    </n-message-provider>
  </n-config-provider>
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
