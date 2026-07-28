// Shared constants and utilities across composables

export const APP_TYPES = ["codex", "claude", "openclaw", "gemini"];

export const APP_LABELS = {
  codex: "Codex",
  claude: "Claude",
  openclaw: "OpenClaw",
  gemini: "Gemini",
  all: "全部",
};

export const APP_ICONS = {
  codex: "\u26A1",
  claude: "\u{1F9E0}",
  openclaw: "\u{1F43E}",
  gemini: "\u{1F48E}",
};

// Safe accessor for window.utoolsCctoggle API with fallback stubs
export function getSkillNest() {
  return window.utoolsCctoggle || {
    listProviders: () => [],
    switchProvider: () => ({ success: false, error: "not in uTools" }),
    saveProvider: () => "",
    deleteProvider: () => {},
    getProvider: () => null,
    getProxyStatus: () => ({ running: false }),
    startProxy: () => ({ success: false }),
    stopProxy: () => ({ success: false }),
    onProxyEvent: () => {},
    toggleProxyQuick: () => ({ success: false }),
    takeoverApp: () => ({ success: false }),
    restoreApp: () => ({ success: false }),
    getProxyPort: () => 8788,
    setProxyPort: () => ({ success: false }),
    listRouteGroups: () => [],
    saveRouteGroup: () => "",
    deleteRouteGroup: () => false,
    clearStats: () => ({ success: false }),
    scanUsageLogs: () => ({ daily: [] }),
    paths: {},
  };
}

// Recursively convert Vue reactive/ref proxies to plain objects
// Avoids "An object could not be cloned" errors in uTools IPC
export function toPlain(v) {
  if (v == null) return v;
  if (Array.isArray(v)) return v.map(toPlain);
  if (typeof v === "object") {
    const o = {};
    for (const k of Object.keys(v)) o[k] = toPlain(v[k]);
    return o;
  }
  return v;
}