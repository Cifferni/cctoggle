import { ref } from "vue";

// Use skillNest if available, fallback to ccSwitch for backward compat
const _ccs = () => window.skillNest || window.ccSwitch || {
  getSkillStoragePaths: () => ({}),
  setSkillStoragePaths: () => {},
  listAllSkills: () => ({}),
  getSkillRepos: () => [],
  addSkillRepo: () => ({ success: false }),
  removeSkillRepo: () => {},
  syncSkills: () => ({ success: false }),
  toggleSkillToAgent: () => ({ success: false }),
  searchSkills: () => [],
  getSyncMode: () => 'symlink',
  setSyncMode: () => {},
  installSkill: () => ({ success: false }),

  // Nest stubs
  getNestDir: () => "",
  listNestSkills: () => [],
  getNestSkillMeta: () => ({}),
  deploySkill: () => ({ success: false }),
  undeploySkill: () => ({ success: false }),
  getDeployRegistry: () => ({}),
  listDeployments: () => ({}),
  listProjectTargets: () => [],
  addProjectTarget: () => ({ success: false }),
  removeProjectTarget: () => {},
};

const ALL_APPS = ["codex", "claude", "gemini", "opencode", "openclaw"];
const APP_LABELS = { codex: "Codex", claude: "Claude", gemini: "Gemini", opencode: "OpenCode", openclaw: "OpenClaw" };

const storagePaths = ref({});
const allSkills = ref({});
const nestSkills = ref([]);
const deployments = ref({});
const projectTargets = ref([]);
const repos = ref([]);

function loadStoragePaths() {
  storagePaths.value = _ccs().getSkillStoragePaths();
}

function saveStoragePaths(paths) {
  _ccs().setSkillStoragePaths(paths);
  storagePaths.value = { ...paths };
}

function loadAllSkills() {
  allSkills.value = _ccs().listAllSkills();
}

function loadNestSkills() {
  nestSkills.value = _ccs().listNestSkills();
}

function loadDeployments() {
  deployments.value = _ccs().getDeployRegistry();
}

function loadProjectTargets() {
  projectTargets.value = _ccs().listProjectTargets();
}

function addProjectTarget(pathStr, label) {
  const r = _ccs().addProjectTarget(pathStr, label);
  loadProjectTargets();
  return r;
}

function removeProjectTarget(id) {
  _ccs().removeProjectTarget(id);
  loadProjectTargets();
}

function deploy(skillName, target) {
  const r = _ccs().deploySkill(skillName, target);
  loadDeployments();
  loadAllSkills();
  return r;
}

function undeploy(skillName, target) {
  const r = _ccs().undeploySkill(skillName, target);
  loadDeployments();
  loadAllSkills();
  return r;
}

const syncMode = ref("symlink");

function loadSyncMode() {
  syncMode.value = _ccs().getSyncMode();
}

function saveSyncMode(mode) {
  syncMode.value = mode;
  _ccs().setSyncMode(mode);
}

function loadRepos() {
  repos.value = _ccs().getSkillRepos();
}

function addRepo(url, branch) {
  const r = _ccs().addSkillRepo(url, branch);
  loadRepos();
  return r;
}

function removeRepo(url) {
  _ccs().removeSkillRepo(url);
  loadRepos();
}

function syncSkillsTo(sourceApp, targetApps) {
  const r = _ccs().syncSkills(sourceApp, targetApps);
  loadAllSkills();
  return r;
}

export function useSkills() {
  return {
    ALL_APPS, APP_LABELS,
    storagePaths, allSkills, nestSkills, deployments, projectTargets, repos,
    loadStoragePaths, saveStoragePaths,
    loadAllSkills, loadNestSkills, loadDeployments, loadProjectTargets,
    addProjectTarget, removeProjectTarget,
    deploy, undeploy,
    loadRepos, addRepo, removeRepo,
    syncSkillsTo, syncMode, loadSyncMode, saveSyncMode,
  };
}
