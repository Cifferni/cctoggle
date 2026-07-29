// uTools ccToggle - services.js
// 入口文件：加载各模块，组装 window.utoolsCctoggle API

var utils = require("./utils");
var configRw = require("./config-rw");
var providerDb = require("./provider-db");
var skills = require("./skills");
var stats = require("./stats");
var proxy = require("./proxy");

window.utoolsCctoggle = {
  // Paths
  paths: {
    home: utils.getHomeDir(),
    codexAuth: utils.getCodexAuthPath(),
    codexConfig: utils.getCodexConfigPath(),
    claudeSettings: utils.getClaudeSettingsPath(),
    openclawConfig: utils.getOpenClawConfigPath(),
    geminiEnv: utils.getGeminiEnvPath()
  },

  // Config read
  getCurrentConfigs: configRw.getCurrentConfigs,
  readCodexConfig: configRw.readCodexConfig,
  readClaudeSettings: configRw.readClaudeSettings,
  readGeminiEnv: configRw.readGeminiEnv,
  readOpenClawConfig: configRw.readOpenClawConfig,

  // Provider CRUD
  listProviders: providerDb.listProviders,
  getProvider: providerDb.getProvider,
  saveProvider: providerDb.saveProvider,
  deleteProvider: providerDb.deleteProvider,

  // Switch
  switchProvider: providerDb.switchProvider,
  getCurrentProviderId: providerDb.getCurrentProviderId,
  reapplyCurrent: providerDb.reapplyCurrent,
  setLastActiveApp: providerDb.setLastActiveApp,
  getLastActiveApp: providerDb.getLastActiveApp,

  // 统计（无缓存：直接扫描本地 CLI 会话日志）
  clearStats: stats.clearStats,
  scanUsageLogs: stats.scanUsageLogs,

  // Import/Export
  exportAll: providerDb.exportAllProviders,
  importAll: providerDb.importProviders,

  // Skills management
  getDefaultSkillDirs: skills.getDefaultSkillDirs,
  getSkillStoragePaths: skills.getSkillStoragePaths,
  setSkillStoragePaths: skills.setSkillStoragePaths,
  listAllSkills: skills.listAllSkills,
  listSkillsInDir: skills.listSkillsInDir,
  getSkillRepos: skills.getSkillRepos,
  addSkillRepo: skills.addSkillRepo,
  removeSkillRepo: skills.removeSkillRepo,
  syncSkills: skills.syncSkills,
  toggleSkillToAgent: skills.toggleSkillToAgent,
  searchSkills: skills.searchSkills,
  installSkill: skills.installSkill,
  removeNestSkill: skills.removeNestSkill,

  // SkillNest
  getNestDir: skills.getNestDir,
  listNestSkills: skills.listNestSkills,
  getNestSkillMeta: skills.getNestSkillMeta,
  deploySkill: skills.deploySkill,
  undeploySkill: skills.undeploySkill,
  getDeployRegistry: skills.getDeployRegistry,
  listDeployments: skills.listDeployments,

  // Project targets
  listProjectTargets: skills.listProjectTargets,
  addProjectTarget: skills.addProjectTarget,
  removeProjectTarget: skills.removeProjectTarget,

  // Utils
  generateId: utils.generateId,
  getSyncMode: skills.getSyncMode,
  setSyncMode: skills.setSyncMode,

  // Proxy / Router
  listRouteGroups: proxy.listRouteGroups,
  getRouteGroup: proxy.getRouteGroup,
  saveRouteGroup: proxy.saveRouteGroup,
  deleteRouteGroup: proxy.deleteRouteGroup,
  startProxy: proxy.startProxy,
  stopProxy: proxy.stopProxy,
  getProxyStatus: proxy.getProxyStatus,
  reconcileProxies: proxy.reconcileProxies,
  onProxyEvent: proxy.onProxyEvent,
  takeoverApp: proxy.takeoverApp,
  restoreApp: proxy.restoreApp,
  toggleProxyQuick: proxy.toggleProxyQuick,
  getProxyPort: proxy.getProxyPort,
  setProxyPort: proxy.setProxyPort,
};


// --- Startup: mark current providers ---

try {
  ["codex", "claude", "gemini"].forEach(function (appType) {
    providerDb.markCurrent(appType, providerDb.getCurrentProviderId(appType));
  });
} catch (e) {
  // ignore startup errors
}
