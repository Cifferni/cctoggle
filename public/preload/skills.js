// uTools ccToggle - skills.js
// SkillNest 技能管理、部署、搜索

var utils = require("./utils");
var fs = utils.fs;
var path = utils.path;
var getHomeDir = utils.getHomeDir;
var expandHome = utils.expandHome;
var ensureDir = utils.ensureDir;
var copyDirSync = utils.copyDirSync;

// ===== SkillNest: Central Skill Nest + Deploy Engine =====

// --- Nest Directory ---

function getNestDir() {
  // 优先从配置读取
  var configured = utools.dbStorage.getItem('ccswitch_nest_dir');
  if (configured) {
    var expanded = expandHome(configured);
    ensureDir(expanded);
    return expanded;
  }

  // 使用默认路径（SkillNest 是独立的中央存储，不从 agent 路径派生）
  var home = getHomeDir();
  var nest = path.join(home, ".skillnest", "skills");
  ensureDir(nest);
  return nest;
}

// 校验技能名合法：非空、无路径分隔符、无 ".."，避免目录穿越
function _safeSkillName(name) {
  if (!name || typeof name !== "string") return false;
  if (name.indexOf("/") >= 0 || name.indexOf("\\") >= 0) return false;
  if (name === "." || name === "..") return false;
  if (name.indexOf("\0") >= 0) return false;
  return true;
}

// 断言 target 落在 root 目录内（防止拼接出的路径逃逸后被递归删除）
function _assertInside(root, target) {
  var r = path.resolve(root);
  var t = path.resolve(target);
  var rel = path.relative(r, t);
  if (rel === "" || rel === ".." || rel.indexOf(".." + path.sep) === 0 || path.isAbsolute(rel)) {
    throw new Error("unsafe path outside target root: " + target);
  }
}

// --- Nest Skill Listing ---

function listNestSkills() {
  var nest = getNestDir();
  try {
    if (!fs.existsSync(nest)) return [];
    var entries = fs.readdirSync(nest, { withFileTypes: true });
    var result = [];
    entries.forEach(function(e) {
      if (!e.isDirectory() || e.name.startsWith(".")) return;
      var skillPath = path.join(nest, e.name);
      var hasSkillMd = fs.existsSync(path.join(skillPath, "SKILL.md"));
      var meta = getNestSkillMeta(e.name);
      result.push({
        name: e.name,
        path: skillPath,
        hasSkillMd: hasSkillMd,
        repo: meta.repo || "",
        version: meta.version || "",
        installedAt: meta.installedAt || ""
      });
    });
    return result;
  } catch (e) { return []; }
}

function getNestSkillMeta(skillName) {
  try {
    var metaPath = path.join(getNestDir(), skillName, "meta.json");
    if (fs.existsSync(metaPath)) {
      return JSON.parse(fs.readFileSync(metaPath, "utf8"));
    }
  } catch(e) {}
  return {};
}

function setNestSkillMeta(skillName, meta) {
  var metaPath = path.join(getNestDir(), skillName, "meta.json");
  ensureDir(metaPath);
  var existing = getNestSkillMeta(skillName);
  Object.assign(existing, meta, { updatedAt: new Date().toISOString() });
  fs.writeFileSync(metaPath, JSON.stringify(existing, null, 2), "utf8");
}

// --- Deploy Registry ---

function getDeployRegistry() {
  try {
    return utools.dbStorage.getItem("ccswitch_nest_registry") || {};
  } catch(e) { return {}; }
}

function setDeployRegistry(reg) {
  utools.dbStorage.setItem("ccswitch_nest_registry", reg);
}

function listDeployments() {
  return getDeployRegistry();
}

// --- Create Link (Win junction / Unix symlink) ---

function createLink(src, dest) {
  _assertInside(path.dirname(dest), dest);
  ensureDir(dest);
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  var isWin = process.platform === "win32";
  if (isWin) {
    var srcVol = path.parse(src).root;
    var destVol = path.parse(dest).root;
    if (srcVol !== destVol) {
      copyDirSync(src, dest);
      return "copy";
    }
    fs.symlinkSync(src, dest, "junction");
    return "symlink";
  } else {
    fs.symlinkSync(src, dest, "dir");
    return "symlink";
  }
}

// --- Deploy Skill (nest to target) ---

function deploySkill(skillName, target) {
  var nest = getNestDir();
  if (!_safeSkillName(skillName)) {
    return { success: false, error: "invalid skill name: " + skillName };
  }
  var srcPath = path.join(nest, skillName);
  if (!fs.existsSync(srcPath) || !fs.existsSync(path.join(srcPath, "SKILL.md"))) {
    return { success: false, error: "skill not found in nest: " + skillName };
  }

  var allPaths = getSkillStoragePaths();
  var destDir = expandHome(allPaths[target]);
  if (!destDir) {
    var projects = listProjectTargets();
    var proj = projects.find(function(p) { return p.id === target; });
    if (proj) {
      destDir = expandHome(proj.path);
    } else {
      return { success: false, error: "unknown target: " + target };
    }
  }
  ensureDir(destDir);
  var destPath = path.join(destDir, skillName);
  _assertInside(destDir, destPath);

  var mode = getSyncMode();

  try {
    if (mode === "symlink") {
      createLink(srcPath, destPath);
    } else {
      if (fs.existsSync(destPath)) {
        fs.rmSync(destPath, { recursive: true, force: true });
      }
      copyDirSync(srcPath, destPath);
    }

    var reg = getDeployRegistry();
    if (!reg[skillName]) reg[skillName] = [];
    var existing = reg[skillName].find(function(d) { return d.target === target; });
    if (existing) {
      existing.mode = mode;
    } else {
      reg[skillName].push({ target: target, mode: mode, deployedAt: new Date().toISOString() });
    }
    setDeployRegistry(reg);

    return { success: true, mode: mode };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// --- Undeploy Skill ---

function undeploySkill(skillName, target) {
  if (!_safeSkillName(skillName)) {
    return { success: false, error: "invalid skill name: " + skillName };
  }
  var allPaths = getSkillStoragePaths();
  var destDir = expandHome(allPaths[target]);
  if (!destDir) {
    var projects = listProjectTargets();
    var proj = projects.find(function(p) { return p.id === target; });
    if (proj) destDir = expandHome(proj.path);
  }
  if (!destDir) return { success: false, error: "unknown target: " + target };

  var destPath = path.join(destDir, skillName);
  _assertInside(destDir, destPath);
  if (!fs.existsSync(destPath)) {
    return { success: false, error: "not deployed to " + target };
  }

  try {
    var stat = fs.lstatSync(destPath);
    if (stat.isSymbolicLink()) {
      fs.unlinkSync(destPath);
    } else {
      fs.rmSync(destPath, { recursive: true, force: true });
    }

    var reg = getDeployRegistry();
    if (reg[skillName]) {
      reg[skillName] = reg[skillName].filter(function(d) { return d.target !== target; });
      if (reg[skillName].length === 0) delete reg[skillName];
    }
    setDeployRegistry(reg);

    return { success: true, action: "removed" };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// --- Toggle (deploy/undeploy) ---

function toggleSkillToAgent(skillName, sourceApp, targetApp) {
  var reg = getDeployRegistry();
  var deployed = reg[skillName] && reg[skillName].find(function(d) { return d.target === targetApp; });
  if (deployed) {
    return undeploySkill(skillName, targetApp);
  } else {
    return deploySkill(skillName, targetApp);
  }
}

// --- Project Targets ---

var _projectTargets = null;

function listProjectTargets() {
  if (_projectTargets) return _projectTargets;
  try {
    _projectTargets = utools.dbStorage.getItem("ccswitch_project_targets") || [];
    return _projectTargets;
  } catch(e) { return []; }
}

function addProjectTarget(pathStr, label) {
  var targets = listProjectTargets();
  if (targets.find(function(t) { return t.path === pathStr; })) {
    return { success: false, error: "target already exists" };
  }
  var id = "project_" + Date.now().toString(36);
  targets.push({ id: id, path: pathStr, label: label || pathStr, addedAt: new Date().toISOString() });
  _projectTargets = targets;
  utools.dbStorage.setItem("ccswitch_project_targets", targets);
  return { success: true, id: id };
}

function removeProjectTarget(id) {
  var targets = listProjectTargets().filter(function(t) { return t.id !== id; });
  _projectTargets = targets;
  utools.dbStorage.setItem("ccswitch_project_targets", targets);
  return { success: true };
}

// --- Skills Registry & Search ---

function getDefaultSkillDirs() {
  var home = getHomeDir();
  return {
    codex: path.join(home, '.codex', 'skills'),
    claude: path.join(home, '.claude', 'skills'),
    gemini: path.join(home, '.gemini', 'skills'),
    opencode: path.join(home, '.config', 'opencode', 'skills'),
    openclaw: path.join(home, '.openclaw', 'skills')
  };
}

function getSkillStoragePaths() {
  // 优先从 agent 配置路径派生
  var configPaths = {};
  try {
    configPaths = utools.dbStorage.getItem("ccswitch_config_paths") || {};
  } catch (e) { configPaths = {}; }

  // 如果有配置，从配置路径派生 skill 目录
  if (Object.keys(configPaths).length > 0) {
    var result = {};
    Object.keys(configPaths).forEach(function(app) {
      if (configPaths[app]) {
        result[app] = path.join(expandHome(configPaths[app]), "skills");
      }
    });
    // 补充未配置的 agent 使用默认路径
    var defaults = getDefaultSkillDirs();
    Object.keys(defaults).forEach(function(app) {
      if (!result[app]) {
        result[app] = defaults[app];
      }
    });
    return result;
  }

  // 兼容旧的独立存储路径配置（向后兼容）
  var saved = utools.dbStorage.getItem('ccswitch_skill_paths');
  if (saved) {
    // 如果旧数据存在，尝试迁移
    // 将旧数据转换为新的 config_paths 格式
    var defaultSkillDirs = getDefaultSkillDirs();
    var migratedConfigPaths = {};
    Object.keys(saved).forEach(function(app) {
      if (saved[app] && saved[app] !== defaultSkillDirs[app]) {
        // 从 skill 路径推导出 agent 路径
        var agentPath = saved[app].replace(/[\/\\]skills$/, "");
        if (agentPath !== saved[app]) {
          migratedConfigPaths[app] = agentPath;
        }
      }
    });

    // 如果有需要迁移的数据，保存到新格式
    if (Object.keys(migratedConfigPaths).length > 0) {
      utools.dbStorage.setItem("ccswitch_config_paths", migratedConfigPaths);
      // 重新计算结果
      var result2 = {};
      Object.keys(migratedConfigPaths).forEach(function(app) {
        if (migratedConfigPaths[app]) {
          result2[app] = path.join(expandHome(migratedConfigPaths[app]), "skills");
        }
      });
      var defaults2 = getDefaultSkillDirs();
      Object.keys(defaults2).forEach(function(app) {
        if (!result2[app]) {
          result2[app] = defaults2[app];
        }
      });
      return result2;
    }

    return saved;
  }

  // 首次使用，返回默认值
  var defaults3 = getDefaultSkillDirs();
  return defaults3;
}

function setSkillStoragePaths(paths) {
  utools.dbStorage.setItem('ccswitch_skill_paths', paths);
}

function getSkillRepos() {
  return utools.dbStorage.getItem('ccswitch_skill_repos') || [];
}

function addSkillRepo(repoUrl, branch) {
  var repos = getSkillRepos();
  if (repos.find(function(r) { return r.url === repoUrl; })) {
    return { success: false, error: 'repo already exists' };
  }
  repos.push({ url: repoUrl, branch: branch || 'main', addedAt: new Date().toISOString() });
  utools.dbStorage.setItem('ccswitch_skill_repos', repos);
  return { success: true };
}

function removeSkillRepo(repoUrl) {
  utools.dbStorage.setItem('ccswitch_skill_repos', getSkillRepos().filter(function(r) { return r.url !== repoUrl; }));
  return { success: true };
}

function getSyncMode() {
  return utools.dbStorage.getItem('ccswitch_sync_mode') || 'symlink';
}

function setSyncMode(mode) {
  utools.dbStorage.setItem('ccswitch_sync_mode', mode);
}

// --- Skills Search ---

function mapSkill(s) {
  return {
    name: s.name || s.skillId,
    repo: s.source ? "https://github.com/" + s.source : "",
    path: s.skillId || "",
    desc: s.source || "",
    installs: s.installs || 0
  };
}

function searchSkills(query) {
  var https = require("https");
  var url = query
    ? "https://www.skills.sh/api/search?q=" + encodeURIComponent(query) + "&limit=50"
    : "https://www.skills.sh/api/search?limit=200";
  return new Promise(function(resolve) {
    try {
      var req = https.get(url, { timeout: 8000 }, function(res) {
        var data = "";
        res.on("data", function(c) { data += c; });
        res.on("end", function() {
          try {
            var json = JSON.parse(data);
            resolve((json.skills || []).map(mapSkill));
          } catch(e) {
            resolve([]);
          }
        });
      });
      req.on("timeout", function() { req.destroy(); });
      req.on("error", function() { resolve([]); });
      req.end();
    } catch(e) {
      resolve([]);
    }
  });
}

// --- Install / List / Sync (nest-first) ---

function listSkillsInDir(dir) {
  try {
    dir = expandHome(dir);
    if (!fs.existsSync(dir)) return [];
    var out = [];
    function isDirLike(full, dirent) {
      // Dirent.isDirectory() returns false for junctions/symlinks on Windows.
      // Fall back to stat (which follows the link) so deployed skills are counted.
      if (dirent && dirent.isDirectory()) return true;
      try {
        var st = fs.statSync(full);
        return st.isDirectory();
      } catch(_) { return false; }
    }
    function walk(base, rel) {
      var entries;
      try { entries = fs.readdirSync(base, { withFileTypes: true }); } catch(_) { return; }
      entries.forEach(function(e) {
        if (e.name.startsWith(".")) return;
        var full = path.join(base, e.name);
        var r = rel ? rel + "/" + e.name : e.name;
        if (isDirLike(full, e)) {
          if (fs.existsSync(path.join(full, "SKILL.md"))) {
            out.push({ name: r, path: full, hasSkillMd: true });
          } else {
            // Only recurse into real directories to avoid symlink loops.
            if (e.isDirectory()) walk(full, r);
          }
        }
      });
    }
    walk(dir, "");
    return out;
  } catch(e) { return []; }
}

function listAllSkills() {
  var result = { nest: listNestSkills() };
  var paths = getSkillStoragePaths() || {};
  Object.keys(paths).forEach(function(app) {
    result[app] = listSkillsInDir(paths[app]);
  });
  return result;
}

function installSkill(name, repo, subPath, branch) {
  try {
    if (!_safeSkillName(name)) return { success: false, error: "invalid skill name" };
    var nest = getNestDir();
    var target = path.join(nest, name);
    _assertInside(nest, target);
    if (fs.existsSync(target) && fs.existsSync(path.join(target, "SKILL.md"))) {
      return { success: false, error: "already installed" };
    }
    ensureDir(target);
    // Best-effort placeholder: write meta + minimal SKILL.md so UI can see it.
    // Actual git clone would require child_process; keep synchronous no-op here.
    setNestSkillMeta(name, { repo: repo || "", subPath: subPath || "", branch: branch || "main", installedAt: new Date().toISOString() });
    var skillMd = path.join(target, "SKILL.md");
    if (!fs.existsSync(skillMd)) {
      fs.writeFileSync(skillMd, "# " + name + "\n\nInstalled from: " + (repo || "(local)") + "\n", "utf8");
    }
    return { success: true, path: target };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

function removeNestSkill(skillName) {
  if (!_safeSkillName(skillName)) return { success: false, error: "invalid skill name" };
  var nest = getNestDir();
  var target = path.join(nest, skillName);
  _assertInside(nest, target);
  try {
    // Undeploy from all targets first
    var reg = getDeployRegistry();
    if (reg[skillName]) {
      reg[skillName].slice().forEach(function(d) {
        undeploySkill(skillName, d.target);
      });
    }
    // Remove the skill directory
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
    }
    // Clean up meta.json
    var metaPath = path.join(getNestDir(), skillName, "meta.json");
    if (fs.existsSync(metaPath)) {
      fs.rmSync(metaPath, { recursive: true, force: true });
    }
    return { success: true };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

function syncSkills(sourceApp, targetApps) {
  // Legacy shim: for each nest skill, deploy to each target
  try {
    var nestList = listNestSkills();
    var results = [];
    (targetApps || []).forEach(function(t) {
      nestList.forEach(function(s) {
        results.push({ skill: s.name, target: t, result: deploySkill(s.name, t) });
      });
    });
    return { success: true, results: results };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// 设置安装目录
function setNestDir(dir) {
  if (dir) {
    utools.dbStorage.setItem('ccswitch_nest_dir', dir);
  } else {
    utools.dbStorage.removeItem('ccswitch_nest_dir');
  }
  return { success: true };
}

module.exports = {
  getNestDir: getNestDir,
  setNestDir: setNestDir,
  listNestSkills: listNestSkills,
  getNestSkillMeta: getNestSkillMeta,
  setNestSkillMeta: setNestSkillMeta,
  getDeployRegistry: getDeployRegistry,
  setDeployRegistry: setDeployRegistry,
  listDeployments: listDeployments,
  createLink: createLink,
  deploySkill: deploySkill,
  undeploySkill: undeploySkill,
  toggleSkillToAgent: toggleSkillToAgent,
  listProjectTargets: listProjectTargets,
  addProjectTarget: addProjectTarget,
  removeProjectTarget: removeProjectTarget,
  getDefaultSkillDirs: getDefaultSkillDirs,
  getSkillStoragePaths: getSkillStoragePaths,
  setSkillStoragePaths: setSkillStoragePaths,
  getSkillRepos: getSkillRepos,
  addSkillRepo: addSkillRepo,
  removeSkillRepo: removeSkillRepo,
  getSyncMode: getSyncMode,
  setSyncMode: setSyncMode,
  searchSkills: searchSkills,
  listSkillsInDir: listSkillsInDir,
  listAllSkills: listAllSkills,
  installSkill: installSkill,
  removeNestSkill: removeNestSkill,
  syncSkills: syncSkills,
};
