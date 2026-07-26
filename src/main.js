import "./style.css";
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router/index.js";
import { setupDynamicCommands } from "./setup.js";

const app = createApp(App);
app.use(router);
setupDynamicCommands();
app.mount("#app");