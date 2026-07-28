import { refreshOnEnter } from "./composables/useProviders.js";

export function setupDynamicCommands() {
  if (typeof utools === "undefined" || typeof utools.onPluginEnter !== "function") return;

  // 插件加载即清理历史动态注册的供应商快捷命令（曾经通过 setFeature 注册的 switch_*）
  cleanupDynamicFeatures();

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

    // 每次进入再兜底清理一次
    cleanupDynamicFeatures();

    if (!window.utoolsCctoggle) return;

    // 对账：领养孤儿代理、清理已死/过期的残留状态
    try { window.utoolsCctoggle.reconcileProxies && window.utoolsCctoggle.reconcileProxies(); } catch (e) {}

    // 进入插件：重新应用已激活供应商并刷新列表
    refreshOnEnter();
  });
}

function cleanupDynamicFeatures() {
  try {
    if (typeof utools.removeFeature !== "function") return;
    let features = [];
    if (typeof utools.getFeatures === "function") {
      features = utools.getFeatures() || [];
    }
    let removed = 0;
    for (const f of features) {
      const code = f?.code || f;
      if (typeof code === "string" && code.startsWith("switch_")) {
        utools.removeFeature(code);
        removed++;
      }
    }
    console.log(`[cctoggle] cleanupDynamicFeatures: found ${features.length}, removed ${removed}`);
  } catch (e) {
    console.warn("[cctoggle] cleanupDynamicFeatures failed", e);
  }
}
