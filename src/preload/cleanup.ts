// @ts-nocheck TODO: 逐步添加类型注解后移除
// uTools ccToggle - cleanup.js
// 统一数据清理 / 迁移逻辑

// ─────────── MCP mapping 清理 ───────────
// 移除 mapping 中存在但所有配置文件中都找不到定义、且未被禁用的残留条目

function cleanMcpMapping(mapping, configs, allApps) {
  var changed = false;
  allApps.forEach(function (app) {
    var configServers = configs[app] || {};
    var before = (mapping[app] || []).length;
    mapping[app] = (mapping[app] || []).filter(function (name) {
      // 配置文件中有定义 → 保留
      if (configServers[name]) return true;
      // 禁用列表中 → 保留
      if ((mapping.disabled || []).indexOf(name) !== -1) return true;
      // 其他 app 的配置文件中有定义 → 保留
      for (var i = 0; i < allApps.length; i++) {
        if (allApps[i] !== app && (configs[allApps[i]] || {})[name]) return true;
      }
      // 残留条目，移除
      changed = true;
      return false;
    });
  });
  return changed;
}

// ─────────── Agent 路径数据迁移 ───────────
// 处理旧版本数据迁移到新的统一 Agent 路径配置

var MIGRATION_VERSION = 3;
var MIGRATION_KEY = "ccswitch_migration_version";

function getMigrationVersion() {
  try {
    return utools.dbStorage.getItem(MIGRATION_KEY) || 0;
  } catch (e) {
    return 0;
  }
}

function setMigrationVersion(version) {
  utools.dbStorage.setItem(MIGRATION_KEY, version);
}

// 获取默认的 skill 目录
function getDefaultSkillDirs() {
  var path = require("path");
  var os = require("os");
  var home;
  try {
    home = utools.getPath("home");
  } catch (e) {
    home = os.homedir();
  }
  return {
    codex: path.join(home, ".codex", "skills"),
    claude: path.join(home, ".claude", "skills"),
    gemini: path.join(home, ".gemini", "skills"),
    opencode: path.join(home, ".config", "opencode", "skills"),
    openclaw: path.join(home, ".openclaw", "skills")
  };
}

// 执行数据迁移
function migrateAgentPaths() { 
  var currentVersion = getMigrationVersion();

  if (currentVersion >= MIGRATION_VERSION) {
    return; // 已经是最新版本
  }

  // V2 迁移：将旧的 skill_paths 合并到 config_paths
  if (currentVersion < 2) {
    try {
      var oldSkillPaths = utools.dbStorage.getItem("ccswitch_skill_paths");
      var configPaths = utools.dbStorage.getItem("ccswitch_config_paths") || {};

      // 如果旧数据存在且新数据为空，进行迁移
      if (oldSkillPaths && Object.keys(configPaths).length === 0) {
        var defaultSkillDirs = getDefaultSkillDirs();

        // 从旧的 skill 路径推导出 agent 配置路径
        Object.keys(oldSkillPaths).forEach(function(app) {
          var skillPath = oldSkillPaths[app];
          var defaultSkillDir = defaultSkillDirs[app];

          // 如果用户自定义了 skill 路径
          if (skillPath && skillPath !== defaultSkillDir) {
            // 从 skill 路径推导出 agent 路径
            var agentPath = skillPath.replace(/[\/\\]skills$/, "");
            if (agentPath !== skillPath) {
              configPaths[app] = agentPath;
            }
          }
        });

        // 只有在有数据需要迁移时才保存
        if (Object.keys(configPaths).length > 0) {
          utools.dbStorage.setItem("ccswitch_config_paths", configPaths);
          console.log("[Cleanup] V2: Migrated skill paths to config paths:", configPaths);
        }
      }

      // 迁移独立的会话路径配置（如果存在）
      var oldSessionPaths = utools.dbStorage.getItem("ccswitch_session_paths");
      if (oldSessionPaths && Object.keys(configPaths).length > 0) {
        Object.keys(oldSessionPaths).forEach(function(app) {
          var sessionPath = oldSessionPaths[app];
          if (sessionPath) {
            // 从会话路径推导出 agent 路径
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
    } catch (e) {
      console.error("[Cleanup] V2 migration failed:", e);
    }
  }

  // V3 迁移：清理已废弃的 proxy 孤儿管理数据
  if (currentVersion < 3) {
    cleanStaleProxyData();
  }

  setMigrationVersion(MIGRATION_VERSION);
}

// ─────────── 旧 proxy 孤儿管理数据清理 ───────────
// 移除已废弃的 cctoggle_proxy_live_* 和 cctoggle_proxy_ctl_* db 文档

function cleanStaleProxyData() {
  var apps = ["codex", "claude", "gemini", "openclaw"];
  var removed = 0;
  apps.forEach(function (app) {
    ["cctoggle_proxy_live_", "cctoggle_proxy_ctl_"].forEach(function (prefix) {
      var id = prefix + app;
      try {
        var doc = utools.db.get(id);
        if (doc) { utools.db.remove(doc); removed++; }
      } catch (e) {}
    });
  });
  if (removed) console.log("[Cleanup] Removed " + removed + " stale proxy db docs");
}

module.exports = {
  cleanMcpMapping: cleanMcpMapping,
  migrateAgentPaths: migrateAgentPaths,
  getMigrationVersion: getMigrationVersion,
};