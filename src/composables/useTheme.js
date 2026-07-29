import { ref, computed, watch } from 'vue'
import { darkTheme, lightTheme } from 'naive-ui'
import { themes, defaultThemeName, getThemeByName, buildOverrides } from '../themes/index.js'

const STORAGE_KEY = 'cctoggle-theme'

// ---- 全局单例状态（多个组件调用 useTheme 共享同一份状态）----
const currentThemeName = ref(localStorage.getItem(STORAGE_KEY) || defaultThemeName)
const isDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)

// 监听系统暗色模式变化
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    isDark.value = e.matches
  })
}

/** 将颜色变量同步到 CSS 自定义属性 */
function syncCssVars(colors) {
  const root = document.documentElement
  const map = {
    '--bg': colors.bg,
    '--bg-card': colors.bgCard,
    '--bg-hover': colors.bgHover,
    '--border': colors.border,
    '--text': colors.text,
    '--text-secondary': colors.textSecondary,
    '--text-muted': colors.textMuted,
    '--primary': colors.primary,
    '--primary-hover': colors.primaryHover,
    '--primary-light': colors.primaryLight,
    '--danger': colors.danger,
    '--danger-light': colors.dangerLight,
    '--success': colors.success,
  }
  for (const [key, val] of Object.entries(map)) {
    root.style.setProperty(key, val)
  }
}

export function useTheme() {
  // ---- 计算属性 ----
  const currentTheme = computed(() => getThemeByName(currentThemeName.value))
  const themeColors = computed(() =>
    isDark.value ? currentTheme.value.colors.dark : currentTheme.value.colors.light
  )
  const theme = computed(() => (isDark.value ? darkTheme : lightTheme))
  const themeOverrides = computed(() => buildOverrides(currentTheme.value, isDark.value))

  // ---- 同步 CSS 变量 ----
  watch(themeColors, colors => syncCssVars(colors), { immediate: true })

  // ---- 持久化主题名称 ----
  watch(currentThemeName, name => {
    localStorage.setItem(STORAGE_KEY, name)
  })

  // ---- 方法 ----
  function setTheme(name) {
    if (themes.some(t => t.name === name)) {
      currentThemeName.value = name
    }
  }

  function toggleDark() {
    isDark.value = !isDark.value
  }

  return {
    // 响应式状态
    theme,
    themeOverrides,
    isDark,
    currentThemeName,
    // 主题列表（供选择器用）
    themes,
    // 方法
    setTheme,
    toggleDark,
  }
}
