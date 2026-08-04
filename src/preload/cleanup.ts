// uTools ccToggle - cleanup.ts
// 统一数据清理 / 迁移逻辑

const MIGRATION_VERSION = 4;
const MIGRATION_KEY = "ccswitch_migration_version";

export class DataMigration {
  static cleanMcpMapping(mapping: any, configs: any, allApps: string[]): boolean {
    let changed = false;
    allApps.forEach(function (app) {
      const configServers = configs[app] || {};
      const before = (mapping[app] || []).length;
      mapping[app] = (mapping[app] || []).filter(function (name: string) {
        if (configServers[name]) return true;
        if ((mapping.disabled || []).indexOf(name) !== -1) return true;
        for (let i = 0; i < allApps.length; i++) {
          if (allApps[i] !== app && (configs[allApps[i]] || {})[name]) return true;
        }
        changed = true;
        return false;
      });
    });
    return changed;
  }

  static getMigrationVersion(): number {
    try {
      return utools.dbStorage.getItem(MIGRATION_KEY) || 0;
    } catch (e) {
      return 0;
    }
  }

  static setMigrationVersion(version: number): void {
    utools.dbStorage.setItem(MIGRATION_KEY, version);
  }

  static getDefaultSkillDirs(): Record<string, string> {
    const path = require("path");
    const os = require("os");
    let home: string;
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

  static migrateAgentPaths(): void {
    const currentVersion = DataMigration.getMigrationVersion();
    console.log("[Cleanup] migrateAgentPaths: currentVersion=" + currentVersion + ", target=" + MIGRATION_VERSION);

    if (currentVersion >= MIGRATION_VERSION) {
      console.log("[Cleanup] Already at latest version, skipping");
      return;
    }

    // V2 迁移：将旧的 skill_paths 合并到 config_paths
    if (currentVersion < 2) {
      try {
        const oldSkillPaths = utools.dbStorage.getItem("ccswitch_skill_paths");
        const configPaths = utools.dbStorage.getItem("ccswitch_config_paths") || {};

        if (oldSkillPaths && Object.keys(configPaths).length === 0) {
          const defaultSkillDirs = DataMigration.getDefaultSkillDirs();

          Object.keys(oldSkillPaths).forEach(function(app) {
            const skillPath = oldSkillPaths[app];
            const defaultSkillDir = defaultSkillDirs[app];

            if (skillPath && skillPath !== defaultSkillDir) {
              const agentPath = skillPath.replace(/[\/\\]skills$/, "");
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

        const oldSessionPaths = utools.dbStorage.getItem("ccswitch_session_paths");
        if (oldSessionPaths && Object.keys(configPaths).length > 0) {
          Object.keys(oldSessionPaths).forEach(function(app) {
            const sessionPath = oldSessionPaths[app];
            if (sessionPath) {
              const agentPath = sessionPath
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
      const apps = ["codex", "claude", "claude-desktop", "gemini", "openclaw"];
      let removed = 0;
      apps.forEach(function (app) {
        ["cctoggle_proxy_live_", "cctoggle_proxy_ctl_"].forEach(function (prefix) {
          const id = prefix + app;
          try {
            const doc = utools.db.get(id);
            if (doc) { utools.db.remove(doc); removed++; }
          } catch (e) {}
        });
      });
      if (removed) console.log("[Cleanup] Removed " + removed + " stale proxy db docs");
    }

    // V7 迁移：skillnest → cctoggle 目录迁移
    if (currentVersion < 3) {
      DataMigration.migrateSkillnestDir();
    }

    DataMigration.setMigrationVersion(MIGRATION_VERSION);
  }

  static migrateSkillnestDir(): void {
    const fs = require("fs");
    const path = require("path");
    const os = require("os");

    let home: string;
    try {
      home = utools.getPath("home");
    } catch (e) {
      home = os.homedir();
    }

    const oldNest = path.join(home, ".skillnest", "skills");
    const oldParent = path.join(home, ".skillnest");
    const newNest = path.join(home, ".cctoggle", "skills");

    if (fs.existsSync(oldNest)) {
      console.log("[Cleanup] Migrating ~/.skillnest/skills → ~/.cctoggle/skills");

      try {
        const newDir = path.dirname(newNest);
        if (!fs.existsSync(newDir)) {
          fs.mkdirSync(newDir, { recursive: true });
        }

        const entries = fs.readdirSync(oldNest, { withFileTypes: true });
        let copied = 0;
        entries.forEach(function(entry: any) {
          if (!entry.isDirectory() || entry.name.startsWith(".")) return;
          try {
            DataMigration.copyDirSync(path.join(oldNest, entry.name), path.join(newNest, entry.name));
            copied++;
          } catch (e) {
            console.error("[Cleanup] Failed to copy skill:", entry.name, e.message);
          }
        });
        console.log("[Cleanup] Copied " + copied + " skills");

        DataMigration.redeploySymlinks(newNest);

        fs.rmSync(oldNest, { recursive: true, force: true });
        console.log("[Cleanup] Removed ~/.skillnest/skills");

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

  static copyDirSync(src: string, dest: string): void {
    const fs = require("fs");
    const path = require("path");

    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    fs.readdirSync(src, { withFileTypes: true }).forEach(function(entry: any) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        DataMigration.copyDirSync(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }

  static redeploySymlinks(newNestDir: string): void {
    const fs = require("fs");
    const path = require("path");

    try {
      const reg = utools.dbStorage.getItem("ccswitch_nest_registry") || {};
      let fixed = 0;

      Object.keys(reg).forEach(function(skillName) {
        const deployments = reg[skillName] || [];
        deployments.forEach(function(dep: any) {
          if (dep.mode !== "symlink") return;

          const targetDir = DataMigration.resolveTargetDir(dep.target);
          if (!targetDir) return;

          const linkPath = path.join(targetDir, skillName);
          const newSrc = path.join(newNestDir, skillName);

          try {
            if (!fs.existsSync(newSrc)) return;

            if (fs.existsSync(linkPath)) {
              const stat = fs.lstatSync(linkPath);
              if (stat.isSymbolicLink()) {
                fs.unlinkSync(linkPath);
              }
            }

            const isWin = process.platform === "win32";
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

  static resolveTargetDir(target: string): string | null {
    const path = require("path");
    const os = require("os");

    let home: string;
    try {
      home = utools.getPath("home");
    } catch (e) {
      home = os.homedir();
    }

    const defaultDirs: Record<string, string> = {
      codex: path.join(home, ".codex", "skills"),
      claude: path.join(home, ".claude", "skills"),
      gemini: path.join(home, ".gemini", "skills"),
      openclaw: path.join(home, ".openclaw", "skills"),
    };

    return defaultDirs[target] || null;
  }
}
