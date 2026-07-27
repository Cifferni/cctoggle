import { refreshOnEnter } from "./composables/useProviders.js";

export function setupDynamicCommands() {
  if (typeof utools === "undefined" || typeof utools.onPluginEnter !== "function") return;

  utools.onPluginEnter(({ code, type, payload }) => {
    if (code && code.startsWith("switch_")) {
      const parts = code.replace("switch_", "").split("_");
      const app = parts[0];
      const id = parts.slice(1).join("_");
      const result = window.utoolsCctoggle?.switchProvider(app, id);
      if (result?.success) {
        utools.showNotification(`已切换到 ${result.providerName}`);
        utools.outPlugin();
      }
      return;
    }

    if (!window.utoolsCctoggle) return;

    // 进入插件：重新应用已激活供应商并刷新列表
    refreshOnEnter();

    const apps = ["codex", "claude", "gemini"];
    const appLabels = { codex: "Codex", claude: "Claude", gemini: "Gemini" };
    const prefixes = { codex: "cx", claude: "cc", gemini: "gm" };

    for (const app of apps) {
      const providers = window.utoolsCctoggle.listProviders(app) || [];
      for (const p of providers) {
        utools.setFeature({
          code: `switch_${app}_${p.id}`,
          explain: `${appLabels[app]} - ${p.name}` + (p.model ? ` (${p.model})` : ""),
          cmds: [`${prefixes[app]} ${p.name}`, `${p.name} 切换`],
        });
      }
    }
  });
}
