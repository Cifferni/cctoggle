// 浏览器开发适配器
// 当不在 uTools 环境时，通过 HTTP API 访问真实数据

// 开发模式下走 Vite proxy（同源），避免 CORS 问题
const API_BASE = '/api';

// 同步 XHR — 用于必须同步返回的 API（如 listProviders）
function fetchApiSync(path: string): any {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `${API_BASE}${path}`, false); // false = synchronous
  xhr.send();
  try {
    const result = JSON.parse(xhr.responseText);
    return result;
  } catch { return null; }
}

function postApiSync(path: string, body: any): any {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', `${API_BASE}${path}`, false);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify(body));
  try { return JSON.parse(xhr.responseText); } catch { return null; }
}

// 检测是否在 uTools 环境
export function isUtoolsEnv(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).utools !== 'undefined';
}

// 创建浏览器兼容的 utoolsCctoggle API
export function createBrowserApi() {
  return {
    paths: {
      home: '',
      codexAuth: '',
      codexConfig: '',
      claudeSettings: '',
      claudeDesktopConfig: '',
      openclawConfig: '',
      geminiEnv: '',
    },

    // Agent 路径管理
    getConfigPaths() {
      try {
        return JSON.parse(localStorage.getItem('ccswitch_config_paths') || '{}');
      } catch { return {}; }
    },
    setConfigPaths(paths: Record<string, string>) {
      localStorage.setItem('ccswitch_config_paths', JSON.stringify(paths));
    },
    getDefaultConfigDirs() {
      return {
        claude: '~/.claude',
        codex: '~/.codex',
        gemini: '~/.gemini',
        openclaw: '~/.openclaw',
      };
    },

    // 配置读取 (同步)
    getCurrentConfigs: () => fetchApiSync('/configs'),
    readCodexConfig: () => fetchApiSync('/config/codex'),
    readClaudeSettings: () => fetchApiSync('/config/claude'),
    readGeminiEnv: () => fetchApiSync('/config/gemini'),
    readOpenClawConfig: () => fetchApiSync('/config/openclaw'),
    readClaudeDesktopConfig: () => fetchApiSync('/config/claude-desktop'),
    readClaudeOnboarding: () => false,
    setClaudeOnboarding: () => {},

    // Provider CRUD (同步调用，匹配原版 preload 行为)
    listProviders: (appType: string) => {
      const result = fetchApiSync(`/providers?appType=${appType}`);
      return Array.isArray(result) ? result : [];
    },
    getProvider: (appType: string, id: string) => fetchApiSync(`/provider?appType=${appType}&id=${id}`),
    saveProvider: (appType: string, data: any) => postApiSync('/provider', { appType, data }),
    deleteProvider: (appType: string, id: string) => postApiSync('/provider-delete', { appType, id }),

    // Switch
    switchProvider: (_appType: string, _id: string) => {
      // 在浏览器模式下，切换操作需要通过 API 服务器完成
      // 这里返回成功，实际切换由服务器处理
      return { success: true, providerName: 'Browser Mode' };
    },
    getCurrentProviderId: (appType: string) => fetchApiSync(`/provider/current?appType=${appType}`)?.id,
    reapplyCurrent: () => ({}),
    setLastActiveApp: (appType: string) => {
      localStorage.setItem('cctoggle_last_active_app', appType);
      return true;
    },
    getLastActiveApp: () => localStorage.getItem('cctoggle_last_active_app') || '',

    // 统计
    clearStats: (appType?: string) => postApiSync('/stats/clear', { appType }),
    scanUsageLogs: async () => fetchApiSync('/stats'),

    // Import/Export
    exportAll: () => ({ codex: [], claude: [], gemini: [], exportTime: new Date().toISOString() }),
    importAll: () => 0,

    // Skills (简化版)
    getDefaultSkillDirs: () => ({}),
    getSkillStoragePaths: () => ({}),
    setSkillStoragePaths: () => {},
    listAllSkills: () => ({ nest: [] }),
    listSkillsInDir: () => [],
    getSkillRepos: () => [],
    addSkillRepo: () => ({ success: true }),
    removeSkillRepo: () => ({ success: true }),
    syncSkills: () => ({ success: true }),
    toggleSkillToAgent: () => ({ success: true }),
    searchSkills: async () => [],
    installSkill: () => ({ success: true }),
    removeNestSkill: () => ({ success: true }),

    // SkillNest
    getNestDir: () => '',
    setNestDir: () => ({ success: true }),
    listNestSkills: () => [],
    getNestSkillMeta: () => ({}),
    deploySkill: () => ({ success: true }),
    undeploySkill: () => ({ success: true }),
    getDeployRegistry: () => ({}),
    listDeployments: () => ({}),

    // Project targets
    listProjectTargets: () => [],
    addProjectTarget: () => ({ success: true }),
    removeProjectTarget: () => ({ success: true }),

    // Utils
    generateId: () => Date.now().toString(36) + Math.random().toString(36).substring(2, 8),
    getSyncMode: () => 'manual',
    setSyncMode: () => {},

    // Proxy / Router (浏览器模式下不可用)
    listRouteGroups: () => [],
    getRouteGroup: () => null,
    saveRouteGroup: () => '',
    deleteRouteGroup: () => false,
    startProxy: () => ({ success: false, error: 'Not available in browser mode' }),
    stopProxy: () => ({ success: false, error: 'Not available in browser mode' }),
    getProxyStatus: () => ({ running: false }),
    onProxyEvent: () => {},
    takeoverApp: () => ({ success: false, error: 'Not available in browser mode' }),
    restoreApp: () => ({ success: false, error: 'Not available in browser mode' }),
    toggleProxyQuick: () => ({ success: false, error: 'Not available in browser mode' }),
    getProxyPort: () => 0,
    setProxyPort: () => ({ success: false, error: 'Not available in browser mode' }),

    // MCP Server
    listMcpServers: () => [],
    getMcpServer: () => null,
    saveMcpServer: () => '',
    deleteMcpServer: () => {},
    toggleMcpServer: () => false,
    syncFromConfigFiles: () => {},

    // Session management
    scanSessions: async (app?: string, opts?: { offset?: number; limit?: number; search?: string; sort?: string }) => {
      const params = new URLSearchParams();
      if (app) params.set('app', app);
      if (opts?.offset) params.set('offset', String(opts.offset));
      if (opts?.limit) params.set('limit', String(opts.limit));
      return fetchApiSync(`/sessions?${params}`);
    },
    loadSessionDetail: async (filePath: string) => {
      return fetchApiSync(`/session/detail?filePath=${encodeURIComponent(filePath)}`);
    },
    deleteSession: (filePath: string) => postApiSync('/session-delete', { filePath }),
    clearAllSessions: () => ({ success: true, count: 0, errors: [] }),
    clearSessionCache: () => {},

    // Prompt management
    listPrompts: () => [],
    getPrompt: () => null,
    savePrompt: () => ({ success: true }),
    deletePrompt: () => ({ success: true }),
    duplicatePrompt: () => ({ success: true }),
    exportPrompts: () => '[]',
    importPrompts: () => ({ success: true, count: 0 }),
    readOriginalPrompt: () => '',
    readAllOriginalPrompts: () => ({}),
    backupOriginalPrompts: () => ({ success: true, backups: {} }),
    backupSelectedPrompts: () => ({ success: true, backups: {} }),
    getBackups: () => ({}),
    restoreOriginalPrompt: () => ({ success: true }),
    restoreAllOriginalPrompts: () => ({}),
    applyPromptToAgent: () => ({ success: true }),
    togglePromptAgent: () => ({ success: true }),
  };
}
