<script setup>
import { ref, onMounted, computed } from "vue";
import { darkTheme, lightTheme } from "naive-ui";
import AppFooter from "./components/AppFooter.vue";
import ToastHost from "./components/ToastHost.vue";
import ConfirmHost from "./components/ConfirmHost.vue";

const isDark = ref(window.matchMedia("(prefers-color-scheme: dark)").matches);
onMounted(() => {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => isDark.value = e.matches);
});

const theme = computed(() => isDark.value ? darkTheme : lightTheme);
const themeOverrides = computed(() => ({
  common: {
    primaryColor: isDark.value ? "#f59e0b" : "#d97706",
    primaryColorHover: isDark.value ? "#fbbf24" : "#b45309",
    primaryColorPressed: isDark.value ? "#d97706" : "#92400e",
    primaryColorSuppl: isDark.value ? "rgba(245,158,11,0.15)" : "rgba(217,119,6,0.1)",
    borderRadius: "8px",
    borderRadiusSmall: "6px",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: "13px",
    fontSizeMini: "11px",
    fontSizeTiny: "11px",
    fontSizeSmall: "12px",
    fontSizeMedium: "13px",
    fontSizeLarge: "14px",
    heightMini: "24px",
    heightTiny: "28px",
    heightSmall: "32px",
    heightMedium: "34px",
    heightLarge: "40px",
  },
  Card: {
    borderRadius: "8px",
    borderColor: isDark.value ? "#3d342a" : "#f0dcc8",
    color: isDark.value ? "#231e18" : "#fff8f0",
    colorModal: isDark.value ? "#231e18" : "#fff8f0",
    titleFontWeight: "600",
    titleFontSize: "13px",
    paddingSmall: "12px 14px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  },
  Button: {
    borderRadiusMedium: "6px",
    borderRadiusSmall: "6px",
    fontWeight: "500",
    paddingSmall: "0 14px",
    paddingMedium: "0 18px",
  },
  Input: {
    borderRadius: "6px",
    borderHover: isDark.value ? "#f59e0b" : "#d97706",
    borderFocus: isDark.value ? "#f59e0b" : "#d97706",
    boxShadowFocus: isDark.value ? "0 0 0 2px rgba(245,158,11,0.2)" : "0 0 0 2px rgba(217,119,6,0.15)",
  },
  InputNumber: {
    borderRadius: "6px",
  },
  Tag: {
    borderRadius: "12px",
    fontWeight: "500",
  },
  Collapse: {
    borderColor: isDark.value ? "#3d342a" : "#f0dcc8",
  },
  List: {
    borderColor: isDark.value ? "#3d342a" : "#f0dcc8",
    color: isDark.value ? "#231e18" : "#fff8f0",
  },
  Divider: {
    borderColor: isDark.value ? "#3d342a" : "#f0dcc8",
  },
  Alert: {
    borderRadius: "8px",
  },
  Statistic: {
    labelFontWeight: "500",
    labelFontSize: "11px",
    valueFontWeight: "700",
    valueFontSize: "18px",
  },
  Descriptions: {
    borderColor: isDark.value ? "#3d342a" : "#f0dcc8",
    labelColor: isDark.value ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
    labelFontWeight: "500",
    thColor: isDark.value ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
  },
  Code: {
    borderRadius: "6px",
    textColor: isDark.value ? "#f5efe8" : "#3d2e10",
    color: isDark.value ? "#2e2720" : "#fef3e2",
  },
}));
</script>

<template>
  <n-config-provider :theme="theme" :theme-overrides="themeOverrides">
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