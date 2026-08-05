// uTools ccToggle - cleanup.ts
// 数据清理 / 迁移逻辑（幂等，无需版本号）

export class DataMigration {
  static cleanMcpMapping(mapping: any, configs: any, allApps: string[]): boolean {
    let changed = false;
    allApps.forEach(function (app) {
      const configServers = configs[app] || {};
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

  /** 主入口：逐项检查，按需执行 */
  static migrateAgentPaths(): void {
    DataMigration.migrateSkillnestDir();
    DataMigration.migrateToProfileStructure();
    DataMigration.migrateLastActiveApp();
    DataMigration.cleanStaleProxyDocs();
  }

  /** skillnest → cctoggle 目录迁移 */
  static migrateSkillnestDir(): void {
    const fs = require("fs");
    const path = require("path");
    const os = require("os");

    let home: string;
    try { home = utools.getPath("home"); } catch (e) { home = os.homedir(); }

    const oldNest = path.join(home, ".skillnest", "skills");
    if (!fs.existsSync(oldNest)) return;

    const newNest = path.join(home, ".cctoggle", "skills");
    try {
      const newDir = path.dirname(newNest);
      if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });

      const entries = fs.readdirSync(oldNest, { withFileTypes: true });
      let copied = 0;
      entries.forEach(function(entry: any) {
        if (!entry.isDirectory() || entry.name.startsWith(".")) return;
        try {
          DataMigration.copyDirSync(path.join(oldNest, entry.name), path.join(newNest, entry.name));
          copied++;
        } catch (e: any) {
          console.error("[Cleanup] Failed to copy skill:", entry.name, e.message);
        }
      });
      console.log("[Cleanup] Copied " + copied + " skills");

      DataMigration.redeploySymlinks(newNest);

      fs.rmSync(oldNest, { recursive: true, force: true });
      const oldParent = path.join(home, ".skillnest");
      if (fs.existsSync(oldParent) && fs.readdirSync(oldParent).length === 0) {
        fs.rmdirSync(oldParent);
      }
    } catch (e: any) {
      console.error("[Cleanup] Skillnest migration failed:", e.message);
    }
  }

  /** 供应商 → default profile（检查 default profile 是否存在） */
  static migrateToProfileStructure(): void {
    const PROFILE_KEY = "cctoggle_profile_default";
    const DB_PREFIX = "cctoggle_provider_";

    // 已有 default profile → 跳过
    if (utools.db.get(PROFILE_KEY)) return;

    try {
      const allDocs = utools.db.allDocs(DB_PREFIX) || [];
      const providers: Record<string, Record<string, any>> = {};
      const keysToDelete: any[] = [];

      allDocs.forEach(function (doc: any) {
        const suffix = doc._id.replace(DB_PREFIX, "");
        const sepIdx = suffix.indexOf("_");
        if (sepIdx < 0) return;

        const appType = suffix.substring(0, sepIdx);
        const providerId = suffix.substring(sepIdx + 1);
        if (!providers[appType]) providers[appType] = {};

        const provider: Record<string, any> = { id: providerId };
        Object.keys(doc).forEach(function (k) {
          if (k !== "_id" && k !== "_rev" && k !== "id") provider[k] = doc[k];
        });
        providers[appType][providerId] = provider;
        keysToDelete.push(doc);
      });

      const now = new Date().toISOString();
      utools.db.put({
        _id: PROFILE_KEY,
        id: "default",
        name: "全局默认",
        createdAt: now,
        updatedAt: now,
        providers: providers,
        lastActiveApp: "",
      });

      keysToDelete.forEach(function (doc: any) {
        try { utools.db.remove(doc); } catch (e) {}
      });

      console.log("[Cleanup] Migrated " + keysToDelete.length + " providers into default profile");
    } catch (e: any) {
      console.error("[Cleanup] Profile migration failed:", e.message);
    }
  }

  /** lastActiveApp 迁入 profile（检查 dbStorage 旧 key 是否存在） */
  static migrateLastActiveApp(): void {
    const KEY = "cctoggle_last_active_app";
    try {
      const raw = utools.dbStorage.getItem(KEY);
      if (!raw) return;  // 无旧 key → 跳过

      const lastActiveApp = (typeof raw === "object") ? (raw.value || "") : raw;
      if (lastActiveApp) {
        const docs = utools.db.allDocs("cctoggle_profile_") || [];
        docs.forEach(function (doc: any) {
          if (doc.lastActiveApp) return;
          doc.lastActiveApp = lastActiveApp;
          utools.db.put(doc);
        });
      }

      utools.dbStorage.removeItem(KEY);
      console.log("[Cleanup] Migrated lastActiveApp into profiles");
    } catch (e: any) {
      console.error("[Cleanup] lastActiveApp migration failed:", e.message);
    }
  }

  /** 清理废弃的 proxy 孤儿数据 */
  static cleanStaleProxyDocs(): void {
    const apps = ["codex", "claude", "claude-desktop", "gemini", "openclaw"];
    let removed = 0;
    apps.forEach(function (app) {
      ["cctoggle_proxy_live_", "cctoggle_proxy_ctl_"].forEach(function (prefix) {
        try {
          const doc = utools.db.get(prefix + app);
          if (doc) { utools.db.remove(doc); removed++; }
        } catch (e) {}
      });
    });
    if (removed) console.log("[Cleanup] Removed " + removed + " stale proxy docs");
  }

  // ── 工具方法 ──

  static copyDirSync(src: string, dest: string): void {
    const fs = require("fs");
    const path = require("path");
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
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
        (reg[skillName] || []).forEach(function(dep: any) {
          if (dep.mode !== "symlink") return;
          const targetDir = DataMigration.resolveTargetDir(dep.target);
          if (!targetDir) return;

          const linkPath = path.join(targetDir, skillName);
          const newSrc = path.join(newNestDir, skillName);
          try {
            if (!fs.existsSync(newSrc)) return;
            if (fs.existsSync(linkPath)) {
              const stat = fs.lstatSync(linkPath);
              if (stat.isSymbolicLink()) fs.unlinkSync(linkPath);
            }
            fs.symlinkSync(newSrc, linkPath, process.platform === "win32" ? "junction" : "dir");
            fixed++;
          } catch (e: any) {
            console.error("[Cleanup] Failed to redeploy symlink:", skillName, e.message);
          }
        });
      });

      if (fixed > 0) console.log("[Cleanup] Redeployed " + fixed + " symlinks");
    } catch (e: any) {
      console.error("[Cleanup] Redeploy failed:", e.message);
    }
  }

  static resolveTargetDir(target: string): string | null {
    const path = require("path");
    const os = require("os");
    let home: string;
    try { home = utools.getPath("home"); } catch (e) { home = os.homedir(); }

    const defaultDirs: Record<string, string> = {
      codex: path.join(home, ".codex", "skills"),
      claude: path.join(home, ".claude", "skills"),
      gemini: path.join(home, ".gemini", "skills"),
      openclaw: path.join(home, ".openclaw", "skills"),
    };
    return defaultDirs[target] || null;
  }
}
