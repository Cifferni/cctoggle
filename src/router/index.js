import { createRouter, createMemoryHistory } from "vue-router";
import ProviderListPage from "../views/ProviderListPage.vue";
import SkillsPage from "../views/SkillsPage.vue";

const routes = [
  { path: "/", component: ProviderListPage },
  { path: "/skills", component: SkillsPage },
  { path: "/stats", component: () => import("../views/StatsPage.vue") },
  { path: "/mcp", component: () => import("../views/McpPage.vue") },
  {
    path: "/settings",
    component: () => import("../views/SettingsPage.vue"),
    children: [
      { path: "", redirect: "/settings/claude" },
      { path: "routes", component: () => import("../views/settings/RoutesSettings.vue") },
      { path: "storage", component: () => import("../views/settings/StorageSettings.vue") },
      { path: "claude", component: () => import("../views/settings/ClaudeSettings.vue") },
    ],
  },
];

export default createRouter({
  history: createMemoryHistory(),
  routes,
});

