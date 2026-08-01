import './style.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index'
import { setupDynamicCommands } from './setup'

const app = createApp(App)
app.use(router)
setupDynamicCommands()
app.mount('#app')
