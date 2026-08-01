var utils = require("./utils");
var configRw = require("./config-rw");
var providerDb = require("./provider-db");
var skills = require("./skills");
var stats = require("./stats");
var proxy = require("./proxy");
var mcpDb = require("./mcp");
var sessions = require("./sessions");
var promptsDb = require("./prompts");
var cleanup = require("./cleanup");
window.utoolsCctoggle = {
    paths: {
        home: utils.getHomeDir(),
        codexAuth: utils.getCodexAuthPath(),
        codexConfig: utils.getCodexConfigPath(),
        claudeSettings: utils.getClaudeSettingsPath(),
        claudeDesktopConfig: utils.getClaudeDesktopConfigPath(),
        openclawConfig: utils.getOpenClawConfigPath(),
        geminiEnv: utils.getGeminiEnvPath()
    },
    getConfigPaths: function () {
        return utools.dbStorage.getItem("ccswitch_config_paths") || {};
    },
    setConfigPaths: function (paths) {
        utools.dbStorage.setItem("ccswitch_config_paths", paths);
    },
    getDefaultConfigDirs: utils.getDefaultConfigDirs,
    getCurrentConfigs: configRw.getCurrentConfigs,
    readCodexConfig: configRw.readCodexConfig,
    readClaudeSettings: configRw.readClaudeSettings,
    readGeminiEnv: configRw.readGeminiEnv,
    readOpenClawConfig: configRw.readOpenClawConfig,
    readClaudeDesktopConfig: configRw.readClaudeDesktopConfig,
    readClaudeOnboarding: configRw.readClaudeOnboarding,
    setClaudeOnboarding: configRw.setClaudeOnboarding,
    listProviders: providerDb.listProviders,
    getProvider: providerDb.getProvider,
    saveProvider: providerDb.saveProvider,
    deleteProvider: providerDb.deleteProvider,
    switchProvider: providerDb.switchProvider,
    getCurrentProviderId: providerDb.getCurrentProviderId,
    reapplyCurrent: providerDb.reapplyCurrent,
    setLastActiveApp: providerDb.setLastActiveApp,
    getLastActiveApp: providerDb.getLastActiveApp,
    clearStats: stats.clearStats,
    scanUsageLogs: stats.scanUsageLogs,
    exportAll: providerDb.exportAllProviders,
    importAll: providerDb.importProviders,
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
    getNestDir: skills.getNestDir,
    setNestDir: skills.setNestDir,
    listNestSkills: skills.listNestSkills,
    getNestSkillMeta: skills.getNestSkillMeta,
    deploySkill: skills.deploySkill,
    undeploySkill: skills.undeploySkill,
    getDeployRegistry: skills.getDeployRegistry,
    listDeployments: skills.listDeployments,
    listProjectTargets: skills.listProjectTargets,
    addProjectTarget: skills.addProjectTarget,
    removeProjectTarget: skills.removeProjectTarget,
    generateId: utils.generateId,
    getSyncMode: skills.getSyncMode,
    setSyncMode: skills.setSyncMode,
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
    listMcpServers: mcpDb.listMcpServers,
    getMcpServer: mcpDb.getMcpServer,
    saveMcpServer: mcpDb.saveMcpServer,
    deleteMcpServer: mcpDb.deleteMcpServer,
    toggleMcpServer: mcpDb.toggleMcpServer,
    syncFromConfigFiles: mcpDb.syncFromConfigFiles,
    scanSessions: sessions.scanSessions,
    loadSessionDetail: sessions.loadSessionDetail,
    deleteSession: sessions.deleteSession,
    clearAllSessions: sessions.clearAllSessions,
    clearSessionCache: sessions.clearSessionCache,
    listPrompts: promptsDb.listPrompts,
    getPrompt: promptsDb.getPrompt,
    savePrompt: promptsDb.savePrompt,
    deletePrompt: promptsDb.deletePrompt,
    duplicatePrompt: promptsDb.duplicatePrompt,
    exportPrompts: promptsDb.exportPrompts,
    importPrompts: promptsDb.importPrompts,
    readOriginalPrompt: promptsDb.readOriginalPrompt,
    readAllOriginalPrompts: promptsDb.readAllOriginalPrompts,
    backupOriginalPrompts: promptsDb.backupOriginalPrompts,
    backupSelectedPrompts: promptsDb.backupSelectedPrompts,
    getBackups: promptsDb.getBackups,
    restoreOriginalPrompt: promptsDb.restoreOriginalPrompt,
    restoreAllOriginalPrompts: promptsDb.restoreAllOriginalPrompts,
    applyPromptToAgent: promptsDb.applyPromptToAgent,
    togglePromptAgent: promptsDb.togglePromptAgent,
};
try {
    cleanup.migrateAgentPaths();
}
catch (e) {
    console.error("[Services] Migration failed:", e);
}
try {
    ["codex", "claude", "claude-desktop", "gemini"].forEach(function (appType) {
        providerDb.markCurrent(appType, providerDb.getCurrentProviderId(appType));
    });
}
catch (e) {
}
