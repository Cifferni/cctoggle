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

var MIGRATION_VERSION = 4;
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
  console.log("[Cleanup] migrateAgentPaths: currentVersion=" + currentVersion + ", target=" + MIGRATION_VERSION);

  if (currentVersion >= MIGRATION_VERSION) {
    console.log("[Cleanup] Already at latest version, skipping");
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

  // V6 迁移：清理已废弃的 proxy 孤儿管理数据
  if (currentVersion < 6) {
    var apps = ["codex", "claude", "claude-desktop", "gemini", "openclaw"];
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

  // V7 迁移：skillnest → cctoggle 目录迁移
  if (currentVersion < 3) {
    migrateSkillnestDir();
  }

  setMigrationVersion(MIGRATION_VERSION);
}

// ─────────── skillnest → cctoggle 目录迁移 ───────────

function migrateSkillnestDir() {
  var fs = require("fs");
  var path = require("path");
  var os = require("os");

  var home;
  try {
    home = utools.getPath("home");
  } catch (e) {
    home = os.homedir();
  }

  var oldNest = path.join(home, ".skillnest", "skills");
  var oldParent = path.join(home, ".skillnest");
  var newNest = path.join(home, ".cctoggle", "skills");

  // 如果旧目录存在，执行迁移
  if (fs.existsSync(oldNest)) {
    console.log("[Cleanup] Migrating ~/.skillnest/skills → ~/.cctoggle/skills");

    try {
      // 1. 创建新目录
      var newDir = path.dirname(newNest);
      if (!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir, { recursive: true });
      }

      // 2. 复制旧目录的所有 skill 到新目录
      var entries = fs.readdirSync(oldNest, { withFileTypes: true });
      var copied = 0;
      entries.forEach(function(entry) {
        if (!entry.isDirectory() || entry.name.startsWith(".")) return;
        try {
          copyDirSync(path.join(oldNest, entry.name), path.join(newNest, entry.name));
          copied++;
        } catch (e) {
          console.error("[Cleanup] Failed to copy skill:", entry.name, e.message);
        }
      });
      console.log("[Cleanup] Copied " + copied + " skills");

      // 3. 重新部署软链接
      redeploySymlinks(newNest);

      // 4. 删除旧目录
      fs.rmSync(oldNest, { recursive: true, force: true });
      console.log("[Cleanup] Removed ~/.skillnest/skills");

      // 5. 清理空的父目录
      if (fs.existsSync(oldParent) && fs.readdirSync(oldParent).length === 0) {
        fs.rmdirSync(oldParent);
        console.log("[Cleanup] Removed empty ~/.skillnest");
      }

      console.log("[Cleanup] Migration completed successfully");
    } catch (e) {
      console.error("[Cleanup] Migration failed:", e.message);
    }
  }
}

// 复制目录（递归）
function copyDirSync(src, dest) {
  var fs = require("fs");
  var path = require("path");

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  fs.readdirSync(src, { withFileTypes: true }).forEach(function(entry) {
    var srcPath = path.join(src, entry.name);
    var destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// 重新部署软链接
function redeploySymlinks(newNestDir) {
  var fs = require("fs");
  var path = require("path");

  try {
    var reg = utools.dbStorage.getItem("ccswitch_nest_registry") || {};
    var fixed = 0;

    Object.keys(reg).forEach(function(skillName) {
      var deployments = reg[skillName] || [];
      deployments.forEach(function(dep) {
        if (dep.mode !== "symlink") return;

        var targetDir = resolveTargetDir(dep.target);
        if (!targetDir) return;

        var linkPath = path.join(targetDir, skillName);
        var newSrc = path.join(newNestDir, skillName);

        try {
          if (!fs.existsSync(newSrc)) return;

          if (fs.existsSync(linkPath)) {
            var stat = fs.lstatSync(linkPath);
            if (stat.isSymbolicLink()) {
              fs.unlinkSync(linkPath);
            }
          }

          // 创建新链接
          var isWin = process.platform === "win32";
          if (isWin) {
            fs.symlinkSync(newSrc, linkPath, "junction");
          } else {
            fs.symlinkSync(newSrc, linkPath, "dir");
          }
          fixed++;
        } catch (e) {
          console.error("[Cleanup] Failed to redeploy symlink:", skillName, e.message);
        }
      });
    });

    if (fixed > 0) {
      console.log("[Cleanup] Redeployed " + fixed + " symlinks");
    }
  } catch (e) {
    console.error("[Cleanup] Redeploy failed:", e.message);
  }
}

// 解析部署目标目录
function resolveTargetDir(target) {
  var path = require("path");
  var os = require("os");

  var home;
  try {
    home = utools.getPath("home");
  } catch (e) {
    home = os.homedir();
  }

  var defaultDirs = {
    codex: path.join(home, ".codex", "skills"),
    claude: path.join(home, ".claude", "skills"),
    gemini: path.join(home, ".gemini", "skills"),
    openclaw: path.join(home, ".openclaw", "skills"),
  };

  return defaultDirs[target] || null;
}

module.exports = {
  cleanMcpMapping: cleanMcpMapping,
  migrateAgentPaths: migrateAgentPaths,
  getMigrationVersion: getMigrationVersion,
};