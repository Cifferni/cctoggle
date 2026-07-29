<script setup>
import { computed, onMounted, ref, h } from "vue";
import { useSkills } from "../composables/useSkills.js";
import { APP_ICONS } from "../composables/shared.js";
const { ALL_APPS, APP_LABELS, storagePaths, nestSkills, projectTargets, loadStoragePaths, saveStoragePaths, loadNestSkills, loadProjectTargets, addProjectTarget, removeProjectTarget } = useSkills();
onMounted(() => {
  loadStoragePaths();
  loadNestSkills();
  loadProjectTargets();
});

const agents = ALL_APPS.filter(a => ["codex", "claude", "gemini", "openclaw"].includes(a));
const icons = APP_ICONS;
const sectionOpen = ref(false);
const editingAgent = ref(null);
const newProjectPath = ref("");
const newProjectLabel = ref("");
const nestDir = computed(() => {
  const fn = window.utoolsCctoggle?.getNestDir;
  return fn ? fn() : "~/.skillnest/skills";
});

function startEdit(app) {
  editingAgent.value = app;
}
function onChange(app, value) {
  saveStoragePaths({ ...storagePaths.value, [app]: value });
}
function resetDefault(app) {
  const fn = window.utoolsCctoggle?.getDefaultSkillDirs || (() => ({}));
  const defaults = fn();
  saveStoragePaths({ ...storagePaths.value, [app]: defaults[app] || `~/.generic/skills`.replace("generic", app) });
  editingAgent.value = null;
}
function addProject() {
  if (!newProjectPath.value) return;
  addProjectTarget(newProjectPath.value, newProjectLabel.value || newProjectPath.value);
  newProjectPath.value = "";
  newProjectLabel.value = "";
}
</script>

<template>
  <n-card size="small" :bordered="true" class="storage-section">
    <template #header>
      <n-space align="center" :size="8" style="cursor: pointer;" @click="sectionOpen = !sectionOpen">
        <n-text depth="2" style="font-size: 12px; font-weight: 600;">Skill 存储与同步</n-text>
      </n-space>
    </template>
    <template #header-extra>
      <n-button text size="small" @click="sectionOpen = !sectionOpen">
        <template #icon>
          <span class="caret" :class="{ 'caret--open': sectionOpen }">▶</span>
        </template>
      </n-button>
    </template>

    <n-space v-if="sectionOpen" vertical :size="0" class="hub">
      <!-- 源：SkillNest 仓库 -->
      <n-card size="small" :bordered="true" class="source-card">
        <n-space align="center" :size="10">
          <span style="font-size: 20px;">🏠</span>
          <div style="flex: 1; min-width: 0;">
            <n-text strong style="font-size: 13px; display: block;">SkillNest</n-text>
            <n-text code style="font-size: 11px;">{{ nestDir }}</n-text>
          </div>
          <n-tag type="success" size="small" :bordered="false" round>
            {{ nestSkills.length }} skill
          </n-tag>
        </n-space>
      </n-card>

      <!-- 流向线 + Agent 目录 -->
      <div class="flow">
        <div v-for="a in agents" :key="a" class="flow__row">
          <div class="flow__line">
            <span class="flow__dot"></span>
          </div>
          <div class="flow__target">
            <n-space align="center" :size="6" style="margin-bottom: 2px;">
              <img :src="icons[a]" :alt="APP_LABELS[a]" style="width: 16px; height: 16px; object-fit: contain;" />
              <n-text strong style="font-size: 12px;">{{ APP_LABELS[a] }}</n-text>
            </n-space>

            <!-- 编辑态 -->
            <n-space v-if="editingAgent === a" vertical :size="4">
              <n-input
                :value="storagePaths[a] || ''"
                @update:value="onChange(a, $event)"
                :placeholder="'~/.generic/skills'.replace('generic', a)"
                size="small"
                :autofocus="true"
                @blur="editingAgent = null"
              />
              <n-button size="tiny" quaternary @click="resetDefault(a)">重置默认</n-button>
            </n-space>

            <!-- 展示态 -->
            <n-tooltip v-else trigger="hover" placement="top-start">
              <template #trigger>
                <n-button
                  text
                  block
                  class="path-btn"
                  @click="startEdit(a)"
                >
                  <n-space align="center" :size="6" style="width: 100%;">
                    <n-text
                      :type="storagePaths[a] ? 'default' : 'warning'"
                      code
                      style="font-size: 11px; flex: 1; text-align: left;"
                    >
                      {{ storagePaths[a] || "未设置" }}
                    </n-text>
                    <n-text depth="3" style="font-size: 10px; flex-shrink: 0;">编辑 ›</n-text>
                  </n-space>
                </n-button>
              </template>
              点击编辑存储路径
            </n-tooltip>
          </div>
        </div>
      </div>

      <!-- 项目同步目标 -->
      <n-divider style="margin: 12px 0 8px;">
        <n-text depth="3" style="font-size: 11px; font-weight: 600; letter-spacing: .5px;">项目同步目标</n-text>
      </n-divider>

      <n-list v-if="projectTargets.length" bordered size="small" :show-divider="false">
        <n-list-item v-for="p in projectTargets" :key="p.id">
          <n-thing>
            <template #header>
              <n-space align="center" :size="8">
                <n-text strong style="font-size: 12px;">{{ p.label }}</n-text>
                <n-text code depth="3" style="font-size: 11px;">{{ p.path }}</n-text>
              </n-space>
            </template>
            <template #header-extra>
              <n-popconfirm @positive-click="removeProject(p.id)">
                <template #trigger>
                  <n-button text type="error" size="small">移除</n-button>
                </template>
                确定移除「{{ p.label }}」？
              </n-popconfirm>
            </template>
          </n-thing>
        </n-list-item>
      </n-list>
      <n-empty v-else description="暂无项目目录" size="small" style="padding: 8px 0;" />

      <n-space align="center" :size="6" style="margin-top: 8px;">
        <n-input v-model:value="newProjectLabel" placeholder="名称" size="small" style="width: 80px;" />
        <n-input v-model:value="newProjectPath" placeholder="项目路径" size="small" style="flex: 1;" />
        <n-button type="primary" size="small" @click="addProject">添加</n-button>
      </n-space>
    </n-space>
  </n-card>
</template>

<style scoped>
.caret {
  font-size: 11px;
  transition: transform .2s ease;
  display: inline-block;
}
.caret--open { transform: rotate(90deg); }

/* ── 源节点 ── */
.source-card {
  background: var(--primary-light);
  border-color: var(--primary);
}

/* ── 流向线 ── */
.flow {
  display: flex;
  flex-direction: column;
  padding-left: 20px;
  border-left: 2px solid var(--border);
  margin-left: 18px;
}

.flow__row {
  display: flex;
  align-items: flex-start;
  position: relative;
  padding: 8px 0;
}

.flow__line {
  position: relative;
  width: 20px;
  flex-shrink: 0;
}
.flow__line::before {
  content: "";
  position: absolute;
  top: 14px;
  left: -11px;
  width: 20px;
  height: 2px;
  background: var(--border);
}
.flow__dot {
  position: absolute;
  top: 9px;
  left: -12px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
  border: 2px solid var(--bg-card);
  z-index: 1;
}

.flow__target {
  flex: 1;
  min-width: 0;
}

/* ── 路径按钮 ── */
.path-btn {
  padding: 4px 8px !important;
  border-radius: 4px;
  border: 1px dashed var(--border);
  transition: all .15s;
  text-align: left;
}
.path-btn:hover {
  border-color: var(--primary);
  background: var(--bg-hover);
}
</style>
