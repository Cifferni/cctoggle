// Dynamic uTools commands - register each saved provider as a searchable command
// Called once on plugin enter

export function setupDynamicCommands() {
  if (typeof utools === "undefined" || typeof utools.onPluginEnter !== "function") return;

  utools.onPluginEnter(({ code, type, payload }) => {
    // Reload providers and register each as a dynamic feature
    if (!window.skillNest) return;
    
    const apps = ["codex", "claude", "gemini"];
    const appLabels = { codex: "Codex", claude: "Claude", gemini: "Gemini" };

    apps.forEach(app => {
      const providers = window.skillNest.listProviders(app);
      providers.forEach(p => {
        // Register a dynamic command: "ccs {name}" or "{name} 切换"
        const prefix = app === "codex" ? "cx" : app === "claude" ? "cc" : "gm";
        utools.setFeature({
          code: `switch_${app}_${p.id}`,
          explain: `${appLabels[app]} - ${p.name} (${p.model})`,
          cmds: [`${prefix} ${p.name}`, `${p.name} 切换`],
        });
      });
    });
  });

  // Listen for dynamic command selection
  utools.onPluginEnter(({ code, type, payload }) => {
    if (code && code.startsWith("switch_")) {
      const parts = code.replace("switch_", "").split("_");
      const app = parts[0];
      const id = parts.slice(1).join("_");
      const result = window.skillNest.switchProvider(app, id);
      if (result.success) {
        utools.showNotification(`已切换到 ${result.providerName}`);
        utools.outPlugin();
      }
    }
  });
}