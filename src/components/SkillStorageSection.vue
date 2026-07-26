<script setup>
import { computed, onMounted, ref } from "vue";
import { useSkills } from "../composables/useSkills.js";
const { ALL_APPS, APP_LABELS, storagePaths, nestSkills, projectTargets, loadStoragePaths, saveStoragePaths, loadNestSkills, loadProjectTargets, addProjectTarget, removeProjectTarget } = useSkills();
onMounted(() => {
  loadStoragePaths();
  loadNestSkills();
  loadProjectTargets();
});

const agents = ALL_APPS.filter(a => ["codex", "claude", "gemini"].includes(a));
const icons = { codex: "\u26A1", claude: "\u{1F9E0}", gemini: "\u{1F48E}" };
const sectionOpen = ref(false);
const expanded = ref(null);
const newProjectPath = ref("");
const nestDir = computed(function() {
  var fn = window.skillNest?.getNestDir || window.ccSwitch?.getNestDir;
  return fn ? fn() : "~/.skillnest/skills";
});
const newProjectLabel = ref("");

function toggle(app) {
  expanded.value = expanded.value === app ? null : app;
}
function onChange(app, e) {
  saveStoragePaths({ ...storagePaths.value, [app]: e.target.value });
}
function resetDefault(app) {
  const fn = window.skillNest?.getDefaultSkillDirs || (() => ({}));
  const defaults = fn();
  saveStoragePaths({ ...storagePaths.value, [app]: defaults[app] || `~/.generic/skills`.replace("generic", app) });
}
function addProject() {
  if (!newProjectPath.value) return;
  addProjectTarget(newProjectPath.value, newProjectLabel.value || newProjectPath.value);
  newProjectPath.value = "";
  newProjectLabel.value = "";
}
function removeProject(id) {
  removeProjectTarget(id);
}
</script>

<template>
  <section class="section collapse-card" :class="{ 'collapse-card--open': sectionOpen }">
    <button class="section-title" @click="sectionOpen = !sectionOpen" :aria-expanded="sectionOpen">
      <span class="section-title-left">
        <span class="section-caret" :class="{ 'section-caret--open': sectionOpen }">&#9656;</span>
        Skill 安装目录与同步目标
      </span>
      <span class="section-hint">{{ sectionOpen ? '点击收起' : '点击展开' }}</span>
    </button>
    <div v-if="sectionOpen" class="accordion">

      <div class="panel panel--open" style="background: var(--primary-light); border-color: var(--primary);">
        <div class="nest-info">
          <span class="nest-icon">&#x1F3E1;</span>
          <span class="nest-label">统一存放目录 (SkillNest)</span>
          <span class="nest-path">{{ nestDir }}</span>
          <span class="nest-count">{{ nestSkills.length }} 个 skill</span>
        </div>
      </div>

      <div v-for="a in agents" :key="a" class="panel" :class="{ 'panel--open': expanded === a }">
        <button class="panel-trigger" @click="toggle(a)">
          <span class="trigger-left">
            <span class="agent-icon">{{ icons[a] }}</span>
            <span class="agent-name">{{ APP_LABELS[a] }}</span>
            <span v-if="expanded !== a" class="agent-path">{{ storagePaths[a] || "未设置" }}</span>
          </span>
          <span class="trigger-caret" :class="{ 'trigger-caret--open': expanded === a }">&#9656;</span>
        </button>
        <div v-if="expanded === a" class="panel-body">
          <div class="path-edit">
            <input
              :value="storagePaths[a] || ''"
              @change="onChange(a, $event)"
              :placeholder="'~/.generic/skills'.replace('generic', a)"
              class="path-input"
            >
            <button class="btn-reset" @click="resetDefault(a)">重置默认</button>
          </div>
        </div>
      </div>

      <div class="section-subtitle">项目目录</div>
      <div v-for="p in projectTargets" :key="p.id" class="panel panel--project">
        <div class="project-item">
          <span class="project-label">{{ p.label }}</span>
          <span class="project-path">{{ p.path }}</span>
          <button class="btn-remove" @click="removeProject(p.id)">&times;</button>
        </div>
      </div>
      <div v-if="projectTargets.length === 0" class="panel" style="padding: 10px 14px; color: var(--text-muted); font-size: 12px;">
        暂无项目目录，添加后可将 skill 同步到项目目录
      </div>
      <div class="add-project">
        <input v-model="newProjectLabel" placeholder="项目名称" class="path-input" style="flex: 0 0 100px;">
        <input v-model="newProjectPath" placeholder="项目路径，如 D:\proj\.agents\skills" class="path-input">
        <button class="btn-add" @click="addProject">添加</button>
      </div>

    </div>
  </section>
</template>

<style scoped>
.collapse-card {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-card);
  transition: border-color .15s, box-shadow .15s;
  padding: 0 !important;
}
.collapse-card:hover { border-color: var(--primary); box-shadow: 0 1px 3px rgba(0,0,0,.04); }
.collapse-card--open { border-color: var(--primary); }
.collapse-card > .section-title {
  padding: 12px 14px !important;
  margin-bottom: 0 !important;
}
.collapse-card > .accordion { padding: 4px 14px 14px; }
.section-title-left { display: flex; align-items: center; gap: 8px; }
.section-caret {
  display: inline-block;
  font-size: 11px;
  color: var(--text-muted);
  transition: transform .15s;
}
.section-caret--open { transform: rotate(90deg); color: var(--primary); }
.section-hint {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 400;
}
.section { padding: 4px 0; }
.section-title {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  border: none;
  background: none;
  padding: 8px 2px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
  transition: color .15s;
}
.section-title:hover { color: var(--primary); }
.section-arrow { font-size: 10px; color: var(--text-muted); }
.section-subtitle {
  font-size: 11px; font-weight: 600; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: .5px;
  margin: 12px 0 6px 2px;
}

.accordion { display: flex; flex-direction: column; gap: 6px; }

.panel {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-card);
  overflow: hidden;
  transition: border-color .15s;
}
.panel:hover { border-color: var(--text-muted); }
.panel--open { border-color: var(--primary); }
.panel--project { padding: 10px 14px; }

.nest-info {
  display: flex; align-items: center; gap: 8px; padding: 12px 14px;
}
.nest-icon { font-size: 18px; }
.nest-label { font-weight: 600; font-size: 13px; flex-shrink: 0; }
.nest-path {
  font-size: 11px; color: var(--text-secondary);
  font-family: "SF Mono", "Fira Code", monospace;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.nest-count { font-size: 11px; color: var(--primary); margin-left: auto; flex-shrink: 0; }

.panel-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--text);
  font-size: 13px;
  text-align: left;
  transition: background .1s;
}
.panel-trigger:hover { background: var(--bg-hover); }

.trigger-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}
.agent-icon { font-size: 16px; flex-shrink: 0; }
.agent-name { font-weight: 600; font-size: 13px; flex-shrink: 0; }
.agent-path {
  font-size: 11px; color: var(--text-muted);
  font-family: "SF Mono", "Fira Code", monospace;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.trigger-arrow { display: none; }
.trigger-caret {
  display: inline-block;
  font-size: 11px;
  color: var(--text-muted);
  transition: transform .15s;
  margin-left: 8px;
  flex-shrink: 0;
}
.trigger-caret--open { transform: rotate(90deg); color: var(--primary); }
.panel { cursor: default; }
.panel-trigger { position: relative; }
.panel:not(.panel--open):hover .panel-trigger { background: var(--bg-hover); }

.panel-body { padding: 0 14px 12px; }
.path-edit { display: flex; gap: 8px; }
.path-input {
  flex: 1; padding: 7px 10px;
  border: 1px solid var(--border); border-radius: 6px;
  font-size: 12px; font-family: "SF Mono", "Fira Code", monospace;
  background: var(--bg); color: var(--text); outline: none;
  transition: border-color .15s;
}
.path-input:focus { border-color: var(--primary); }

.btn-reset, .btn-add, .btn-remove {
  padding: 7px 12px; border: 1px solid var(--border); border-radius: 6px;
  font-size: 11px; font-weight: 500; background: none;
  color: var(--text-muted); cursor: pointer; white-space: nowrap;
  transition: all .15s;
}
.btn-reset:hover, .btn-add:hover {
  background: var(--bg-hover); color: var(--text); border-color: var(--text-muted);
}
.btn-remove {
  padding: 4px 10px; font-size: 14px; line-height: 1;
}
.btn-remove:hover { color: var(--danger); border-color: var(--danger); background: var(--danger-light); }

.project-item {
  display: flex; align-items: center; gap: 10px;
}
.project-label { font-weight: 500; font-size: 13px; flex-shrink: 0; }
.project-path {
  font-size: 11px; color: var(--text-muted); font-family: monospace;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;
}

.add-project {
  display: flex; gap: 6px; margin-top: 6px;
}
</style>


