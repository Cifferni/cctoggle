// Shared constants and utilities across composables

export const APP_TYPES = ["codex", "claude", "claude-desktop", "openclaw", "gemini"];

export const APP_OPTIONS = [
  { value: "claude", label: "Claude" },
  { value: "claude-desktop", label: "Claude Desktop" },
  { value: "codex", label: "Codex" },
  { value: "openclaw", label: "OpenClaw" },
];

export const APP_LABELS = {
  codex: "Codex",
  claude: "Claude",
  "claude-desktop": "Desktop",
  openclaw: "OpenClaw",
  gemini: "Gemini",
  all: "全部",
};

import codexIcon from "../assets/images/agents/codex.svg";
import claudeIcon from "../assets/images/agents/claude.svg";
import claudeDesktopIcon from "../assets/images/agents/claude-desktop.svg";
import openclawIcon from "../assets/images/agents/openclaw.svg";
import geminiIcon from "../assets/images/agents/gemini.svg";

export const APP_ICONS = {
  codex: codexIcon,
  claude: claudeIcon,
  "claude-desktop": claudeDesktopIcon,
  openclaw: openclawIcon,
  gemini: geminiIcon,
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
    reconcileProxies: () => {},
    scanUsageLogs: () => ({ daily: [] }),
    listMcpServers: () => [],
    getMcpServer: () => null,
    saveMcpServer: () => "",
    deleteMcpServer: () => {},
    toggleMcpServer: () => false,
    syncFromConfigFiles: () => {},
    readClaudeOnboarding: () => false,
    setClaudeOnboarding: () => {},
    scanSessions: () => ({ sessions: [] }),
    loadSessionDetail: async () => [],
    deleteSession: () => ({ success: false }),
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