// uTools ccToggle - migration.js
// 数据迁移：处理旧版本数据兼容性

var utils = require("./utils");
var skills = require("./skills");
var getHomeDir = utils.getHomeDir;
var getDefaultConfigDirs = utils.getDefaultConfigDirs;

// 迁移版本号
var MIGRATION_VERSION = 2;
var MIGRATION_KEY = "ccswitch_migration_version";

// 获取当前迁移版本
function getMigrationVersion() {
  try {
    return utools.dbStorage.getItem(MIGRATION_KEY) || 0;
  } catch (e) {
    return 0;
  }
}

// 设置迁移版本
function setMigrationVersion(version) {
  utools.dbStorage.setItem(MIGRATION_KEY, version);
}

// 执行数据迁移
function migrate() {
  var currentVersion = getMigrationVersion();

  if (currentVersion >= MIGRATION_VERSION) {
    return; // 已经是最新版本
  }

  // 版本 0 -> 1: 初始版本，无需迁移
  // 版本 1 -> 2: 统一 Agent 路径配置
  if (currentVersion < 2) {
    migrateV2();
  }

  setMigrationVersion(MIGRATION_VERSION);
}

// V2 迁移：将旧的 skill_paths 合并到 config_paths
function migrateV2() {
  try {
    var oldSkillPaths = utools.dbStorage.getItem("ccswitch_skill_paths");
    var configPaths = utools.dbStorage.getItem("ccswitch_config_paths") || {};

    // 如果旧数据存在且新数据为空，进行迁移
    if (oldSkillPaths && Object.keys(configPaths).length === 0) {
      var defaultSkillDirs = skills.getDefaultSkillDirs();

      // 从旧的 skill 路径推导出 agent 配置路径
      // 例如：~/.claude/skills -> ~/.claude
      Object.keys(oldSkillPaths).forEach(function(app) {
        var skillPath = oldSkillPaths[app];
        var defaultSkillDir = defaultSkillDirs[app];

        // 如果用户自定义了 skill 路径
        if (skillPath && skillPath !== defaultSkillDir) {
          // 尝试从 skill 路径推导出 agent 路径
          // 例如：~/custom/skills -> ~/custom
          var agentPath = skillPath.replace(/[\/\\]skills$/, "");
          if (agentPath !== skillPath) {
            configPaths[app] = agentPath;
          }
        }
      });

      // 只有在有数据需要迁移时才保存
      if (Object.keys(configPaths).length > 0) {
        utools.dbStorage.setItem("ccswitch_config_paths", configPaths);
        console.log("[Migration] V2: Migrated skill paths to config paths:", configPaths);
      }
    }

    // 迁移独立的会话路径配置（如果存在）
    var oldSessionPaths = utools.dbStorage.getItem("ccswitch_session_paths");
    if (oldSessionPaths && Object.keys(configPaths).length > 0) {
      Object.keys(oldSessionPaths).forEach(function(app) {
        var sessionPath = oldSessionPaths[app];
        if (sessionPath) {
          // 从会话路径推导出 agent 路径
          // 例如：~/.claude/projects -> ~/.claude
          var agentPath = sessionPath
            .replace(/[\/\\]projects$/, "")
            .replace(/[\/\\]sessions$/, "")
            .replace(/[\/\\]agents$/, "");
          if (agentPath !== sessionPath && !configPaths[app]) {
            configPaths[app] = agentPath;
          }
        }
      });
      utools.dbStorage.setItem("ccswitch_config_paths", configPaths);
    }

    // 清理旧数据（可选：保留一段时间以便回滚）
    // utools.dbStorage.removeItem("ccswitch_skill_paths");
    // utools.dbStorage.removeItem("ccswitch_session_paths");

  } catch (e) {
    console.error("[Migration] V2 migration failed:", e);
  }
}

module.exports = {
  migrate: migrate,
  getMigrationVersion: getMigrationVersion,
};
