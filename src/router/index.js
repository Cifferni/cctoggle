import { createRouter, createMemoryHistory } from "vue-router";
import ProviderListPage from "../views/ProviderListPage.vue";
import SettingsPage from "../views/SettingsPage.vue";
import SkillsPage from "../views/SkillsPage.vue";
import RoutesSettings from "../views/settings/RoutesSettings.vue";
import StorageSettings from "../views/settings/StorageSettings.vue";

const routes = [
  { path: "/", component: ProviderListPage },
  { path: "/skills", component: SkillsPage },
  { path: "/stats", component: () => import("../views/StatsPage.vue") },
  {
    path: "/settings",
    component: SettingsPage,
    children: [
      { path: "", redirect: "/settings/routes" },
      { path: "routes", component: RoutesSettings },
      { path: "storage", component: StorageSettings },
    ],
  },
];

export default createRouter({
  history: createMemoryHistory(),
  routes,
});

