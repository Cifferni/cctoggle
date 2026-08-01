function cleanMcpMapping(mapping, configs, allApps) {
    var changed = false;
    allApps.forEach(function (app) {
        var configServers = configs[app] || {};
        var before = (mapping[app] || []).length;
        mapping[app] = (mapping[app] || []).filter(function (name) {
            if (configServers[name])
                return true;
            if ((mapping.disabled || []).indexOf(name) !== -1)
                return true;
            for (var i = 0; i < allApps.length; i++) {
                if (allApps[i] !== app && (configs[allApps[i]] || {})[name])
                    return true;
            }
            changed = true;
            return false;
        });
    });
    return changed;
}
var MIGRATION_VERSION = 2;
var MIGRATION_KEY = "ccswitch_migration_version";
function getMigrationVersion() {
    try {
        return utools.dbStorage.getItem(MIGRATION_KEY) || 0;
    }
    catch (e) {
        return 0;
    }
}
function setMigrationVersion(version) {
    utools.dbStorage.setItem(MIGRATION_KEY, version);
}
function getDefaultSkillDirs() {
    var path = require("path");
    var os = require("os");
    var home;
    try {
        home = utools.getPath("home");
    }
    catch (e) {
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
function migrateAgentPaths() {
    var currentVersion = getMigrationVersion();
    if (currentVersion >= MIGRATION_VERSION) {
        return;
    }
    if (currentVersion < 2) {
        try {
            var oldSkillPaths = utools.dbStorage.getItem("ccswitch_skill_paths");
            var configPaths = utools.dbStorage.getItem("ccswitch_config_paths") || {};
            if (oldSkillPaths && Object.keys(configPaths).length === 0) {
                var defaultSkillDirs = getDefaultSkillDirs();
                Object.keys(oldSkillPaths).forEach(function (app) {
                    var skillPath = oldSkillPaths[app];
                    var defaultSkillDir = defaultSkillDirs[app];
                    if (skillPath && skillPath !== defaultSkillDir) {
                        var agentPath = skillPath.replace(/[\/\\]skills$/, "");
                        if (agentPath !== skillPath) {
                            configPaths[app] = agentPath;
                        }
                    }
                });
                if (Object.keys(configPaths).length > 0) {
                    utools.dbStorage.setItem("ccswitch_config_paths", configPaths);
                    console.log("[Cleanup] V2: Migrated skill paths to config paths:", configPaths);
                }
            }
            var oldSessionPaths = utools.dbStorage.getItem("ccswitch_session_paths");
            if (oldSessionPaths && Object.keys(configPaths).length > 0) {
                Object.keys(oldSessionPaths).forEach(function (app) {
                    var sessionPath = oldSessionPaths[app];
                    if (sessionPath) {
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
        }
        catch (e) {
            console.error("[Cleanup] V2 migration failed:", e);
        }
    }
    setMigrationVersion(MIGRATION_VERSION);
}
module.exports = {
    cleanMcpMapping: cleanMcpMapping,
    migrateAgentPaths: migrateAgentPaths,
    getMigrationVersion: getMigrationVersion,
};
