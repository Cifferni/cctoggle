import './assets/style.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index'
import { setupDynamicCommands } from './setup'

async function bootstrap() {
  // 浏览器开发模式：注入 mock API（仅开发环境）
  if (import.meta.env.DEV) {
    const { isUtoolsEnv, createBrowserApi } = await import('./utils/browser-adapter')
    if (!isUtoolsEnv()) {
      console.log('🌐 Running in browser mode - using dev API server')
      ;(window as any).utoolsCctoggle = createBrowserApi()
      ;(window as any).utools = {
        dbStorage: {
          getItem: (key: string) => {
            try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null }
          },
          setItem: (key: string, value: any) => localStorage.setItem(key, JSON.stringify(value)),
          removeItem: (key: string) => localStorage.removeItem(key),
        },
        copyText: (text: string) => navigator.clipboard.writeText(text),
        showSaveDialog: () => null,
        getPath: () => '',
      }
    }
  }

  const app = createApp(App)
  app.use(router)
  setupDynamicCommands()
  app.mount('#app')
}

bootstrap()
