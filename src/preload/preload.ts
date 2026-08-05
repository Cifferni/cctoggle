// @ts-nocheck TODO: 逐步添加类型注解后移除
// uTools ccToggle - preload.ts
// 主入口：UtoolsPreload 类，统一初始化和 API 暴露
import { ProviderStore } from './provider-db';
import { ProxyManager } from './proxy';
import { McpManager } from './mcp';
import { SessionManager } from './sessions';
import { PromptManager } from './prompts';
import { SkillManager } from './skills';
import { StatsCollector } from './stats';
import { DataMigration } from './cleanup';
import { ConnectionTester } from './test-connection';
import { ProfileStore } from './profile-db';
import * as configRw from './config-rw';
import * as utils from './utils';
class UtoolsPreload {
  constructor() {
    this.init();
  }

  private init(): void {
    // 1. 执行数据迁移
    try {
      DataMigration.migrateAgentPaths();
    } catch (e) {
      console.error("[Preload] Migration failed:", e);
    }

    // 2. 标记当前供应商
    try {
      ["codex", "claude", "claude-desktop", "gemini"].forEach(function (appType) {
        ProviderStore.markCurrent(appType, ProviderStore.getCurrentProviderId(appType));
      });
    } catch (e) {
      // ignore startup errors
    }

    // 3. 暴露 API
    this.exposeApi();
  }

  private exposeApi(): void {
    window.utoolsCctoggle = {
      // Paths
      paths: {
        home: utils.getHomeDir(),
        codexAuth: utils.getCodexAuthPath(),
        codexConfig: utils.getCodexConfigPath(),
        claudeSettings: utils.getClaudeSettingsPath(),
        claudeDesktopConfig: utils.getClaudeDesktopConfigPath(),
        openclawConfig: utils.getOpenClawConfigPath(),
        geminiEnv: utils.getGeminiEnvPath()
      },

      // Agent 路径管理
      getConfigPaths: function() {
        return utools.dbStorage.getItem("ccswitch_config_paths") || {};
      },
      setConfigPaths: function(paths) {
        utools.dbStorage.setItem("ccswitch_config_paths", paths);
      },
      getDefaultConfigDirs: utils.getDefaultConfigDirs,

      // Config read
      getCurrentConfigs: configRw.getCurrentConfigs,
      readCodexConfig: configRw.readCodexConfig,
      readClaudeSettings: configRw.readClaudeSettings,
      readGeminiEnv: configRw.readGeminiEnv,
      readOpenClawConfig: configRw.readOpenClawConfig,
      readClaudeDesktopConfig: configRw.readClaudeDesktopConfig,
      readClaudeOnboarding: configRw.readClaudeOnboarding,
      setClaudeOnboarding: configRw.setClaudeOnboarding,

      // Provider CRUD
      listProviders: ProviderStore.listProviders,
      getProvider: ProviderStore.getProvider,
      saveProvider: ProviderStore.saveProvider,
      deleteProvider: ProviderStore.deleteProvider,

      // Switch
      switchProvider: ProviderStore.switchProvider,
      getCurrentProviderId: ProviderStore.getCurrentProviderId,
      reapplyCurrent: ProviderStore.reapplyCurrent,
      setLastActiveApp: ProviderStore.setLastActiveApp,
      getLastActiveApp: ProviderStore.getLastActiveApp,

      // 统计
      clearStats: StatsCollector.clearStats,
      scanUsageLogs: StatsCollector.scanUsageLogs,

      // Import/Export
      exportAll: ProviderStore.exportAllProviders,
      importAll: ProviderStore.importProviders,

      // Skills management
      getDefaultSkillDirs: SkillManager.getDefaultSkillDirs,
      getSkillStoragePaths: SkillManager.getSkillStoragePaths,
      setSkillStoragePaths: SkillManager.setSkillStoragePaths,
      listAllSkills: SkillManager.listAllSkills,
      listSkillsInDir: SkillManager.listSkillsInDir,
      getSkillRepos: SkillManager.getSkillRepos,
      addSkillRepo: SkillManager.addSkillRepo,
      removeSkillRepo: SkillManager.removeSkillRepo,
      syncSkills: SkillManager.syncSkills,
      toggleSkillToAgent: SkillManager.toggleSkillToAgent,
      searchSkills: SkillManager.searchSkills,
      installSkill: SkillManager.installSkill,
      removeNestSkill: SkillManager.removeNestSkill,

      // CCToggle Skills
      getNestDir: SkillManager.getNestDir,
      setNestDir: SkillManager.setNestDir,
      listNestSkills: SkillManager.listNestSkills,
      getNestSkillMeta: SkillManager.getNestSkillMeta,
      deploySkill: SkillManager.deploySkill,
      undeploySkill: SkillManager.undeploySkill,
      getDeployRegistry: SkillManager.getDeployRegistry,
      listDeployments: SkillManager.listDeployments,

      // Project targets
      listProjectTargets: SkillManager.listProjectTargets,
      addProjectTarget: SkillManager.addProjectTarget,
      removeProjectTarget: SkillManager.removeProjectTarget,

      // Utils
      generateId: utils.generateId,
      getSyncMode: SkillManager.getSyncMode,
      setSyncMode: SkillManager.setSyncMode,

      // Proxy / Router
      listRouteGroups: ProxyManager.listRouteGroups,
      getRouteGroup: ProxyManager.getRouteGroup,
      saveRouteGroup: ProxyManager.saveRouteGroup,
      deleteRouteGroup: ProxyManager.deleteRouteGroup,
      startProxy: ProxyManager.startProxy,
      stopProxy: ProxyManager.stopProxy,
      getProxyStatus: ProxyManager.getProxyStatus,
      onProxyEvent: ProxyManager.onProxyEvent,
      takeoverApp: ProxyManager.takeoverApp,
      restoreApp: ProxyManager.restoreApp,
      toggleProxyQuick: ProxyManager.toggleProxyQuick,
      getProxyPort: ProxyManager.getProxyPort,
      setProxyPort: ProxyManager.setProxyPort,

      // MCP Server management
      listMcpServers: McpManager.listMcpServers,
      getMcpServer: McpManager.getMcpServer,
      saveMcpServer: McpManager.saveMcpServer,
      deleteMcpServer: McpManager.deleteMcpServer,
      toggleMcpServer: McpManager.toggleMcpServer,
      syncFromConfigFiles: McpManager.syncFromConfigFiles,

      // Session management
      scanSessions: SessionManager.scanSessions,
      loadSessionDetail: SessionManager.loadSessionDetail,
      deleteSession: SessionManager.deleteSession,
      clearAllSessions: SessionManager.clearAllSessions,
      clearSessionCache: SessionManager.clearSessionCache,

      // Prompt management
      listPrompts: PromptManager.listPrompts,
      getPrompt: PromptManager.getPrompt,
      savePrompt: PromptManager.savePrompt,
      deletePrompt: PromptManager.deletePrompt,
      duplicatePrompt: PromptManager.duplicatePrompt,
      exportPrompts: PromptManager.exportPrompts,
      importPrompts: PromptManager.importPrompts,
      readOriginalPrompt: PromptManager.readOriginalPrompt,
      readAllOriginalPrompts: PromptManager.readAllOriginalPrompts,
      backupOriginalPrompts: PromptManager.backupOriginalPrompts,
      backupSelectedPrompts: PromptManager.backupSelectedPrompts,
      getBackups: PromptManager.getBackups,
      restoreOriginalPrompt: PromptManager.restoreOriginalPrompt,
      restoreAllOriginalPrompts: PromptManager.restoreAllOriginalPrompts,
      applyPromptToAgent: PromptManager.applyPromptToAgent,
      togglePromptAgent: PromptManager.togglePromptAgent,

      // Test connection
      testConnection: ConnectionTester.testConnection,
      fetchAvailableModels: ConnectionTester.fetchAvailableModels,

      // Profile 管理
      listProfiles: ProfileStore.listProfiles,
      getProfile: ProfileStore.getProfile,
      saveProfile: ProfileStore.saveProfile,
      deleteProfile: ProfileStore.deleteProfile,
      activateProfile: ProfileStore.activateProfile,
      deactivateProfile: ProfileStore.deactivateProfile,
      getActiveProfileId: ProfileStore.getActiveProfileId,
    };
  }
}

// 启动
new UtoolsPreload();
