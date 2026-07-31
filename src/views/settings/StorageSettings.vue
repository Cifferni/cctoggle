<script setup>
import { ref, onMounted, computed } from "vue";
import { useSkills } from "../../composables/useSkills.js";
import { APP_ICONS } from "../../composables/shared.js";

const {
  ALL_APPS, APP_LABELS,
  storagePaths, nestSkills, projectTargets, syncMode,
  configPaths,
  loadStoragePaths, saveStoragePaths,
  loadNestSkills, loadProjectTargets, addProjectTarget, removeProjectTarget,
  loadSyncMode, saveSyncMode,
  loadConfigPaths, saveConfigPaths,
} = useSkills();

onMounted(() => {
  loadStoragePaths();
  loadNestSkills();
  loadProjectTargets();
  loadSyncMode();
  loadConfigPaths();
});

const agents = ALL_APPS.filter(a => ["codex", "claude", "gemini", "openclaw"].includes(a));
const agentIcons = APP_ICONS;

const nestDir = computed(() => {
  const fn = window.utoolsCctoggle?.getNestDir;
  return fn ? fn() : "~/.skillnest/skills";
});

// Storage path editing
const editingAgent = ref(null);
const editValue = ref("");

function startEdit(app) {
  editingAgent.value = app;
  editValue.value = storagePaths.value[app] || "";
}
function confirmEdit(app) {
  saveStoragePaths({ ...storagePaths.value, [app]: editValue.value });
  editingAgent.value = null;
}
function cancelEdit() {
  editingAgent.value = null;
}
function resetDefault(app) {
  const fn = window.utoolsCctoggle?.getDefaultSkillDirs || (() => ({}));
  const defaults = fn();
  saveStoragePaths({ ...storagePaths.value, [app]: defaults[app] || `~/.generic/skills`.replace("generic", app) });
  editingAgent.value = null;
}

// Config path editing
const editingConfigAgent = ref(null);
const editConfigValue = ref("");

function startEditConfig(app) {
  editingConfigAgent.value = app;
  editConfigValue.value = configPaths.value[app] || "";
}
function confirmEditConfig(app) {
  saveConfigPaths({ ...configPaths.value, [app]: editConfigValue.value });
  editingConfigAgent.value = null;
}
function cancelEditConfig() {
  editingConfigAgent.value = null;
}
function resetDefaultConfig(app) {
  const fn = window.utoolsCctoggle?.getDefaultConfigDirs || (() => ({}));
  const defaults = fn();
  saveConfigPaths({ ...configPaths.value, [app]: defaults[app] || "" });
  editingConfigAgent.value = null;
}

// Project targets
const newProjectPath = ref("");
const newProjectLabel = ref("");

function addProject() {
  if (!newProjectPath.value) return;
  addProjectTarget(newProjectPath.value, newProjectLabel.value || newProjectPath.value);
  newProjectPath.value = "";
  newProjectLabel.value = "";
}
</script>

<template>
  <n-space vertical :size="12" class="storage-settings">
    <!-- SkillNest 仓库 -->
    <n-card size="small" :bordered="true">
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

    <!-- Agent 存储路径 -->
    <n-card size="small" :bordered="true">
      <template #header>
        <n-text depth="2" style="font-size: 12px; font-weight: 600;">Agent 存储路径</n-text>
      </template>

      <n-space vertical :size="8">
        <n-card
          v-for="a in agents"
          :key="a"
          size="small"
          :bordered="true"
          embedded
        >
          <n-space align="center" :size="8" style="margin-bottom: 4px;">
            <img :src="agentIcons[a]" :alt="APP_LABELS[a]" style="width: 16px; height: 16px; object-fit: contain;" />
            <n-text strong style="font-size: 12px; flex: 1;">{{ APP_LABELS[a] }}</n-text>
            <n-button
              v-if="editingAgent !== a"
              text
              size="tiny"
              @click="startEdit(a)"
            >
              编辑 ›
            </n-button>
          </n-space>

          <!-- 展示态 -->
          <n-tooltip v-if="editingAgent !== a" trigger="hover" placement="top-start">
            <template #trigger>
              <n-button text block class="path-btn" @click="startEdit(a)">
                <n-text
                  :type="storagePaths[a] ? 'default' : 'warning'"
                  code
                  style="font-size: 11px; flex: 1; text-align: left;"
                >
                  {{ storagePaths[a] || "未设置" }}
                </n-text>
              </n-button>
            </template>
            点击编辑存储路径
          </n-tooltip>

          <!-- 编辑态 -->
          <n-space v-else vertical :size="6">
            <n-input
              v-model:value="editValue"
              :placeholder="'~/.generic/skills'.replace('generic', a)"
              size="small"
              :autofocus="true"
              @keydown.enter="confirmEdit(a)"
              @keydown.escape="cancelEdit"
            />
            <n-space justify="end" :size="6">
              <n-button size="tiny" quaternary @click="resetDefault(a)">重置默认</n-button>
              <n-button size="tiny" type="primary" @click="confirmEdit(a)">确认</n-button>
            </n-space>
          </n-space>
        </n-card>
      </n-space>
    </n-card>

    <!-- Agent 配置路径 -->
    <n-card size="small" :bordered="true">
      <template #header>
        <n-text depth="2" style="font-size: 12px; font-weight: 600;">Agent 配置路径</n-text>
      </template>
      <template #header-extra>
        <n-text depth="3" style="font-size: 11px;">配置 · 会话 · MCP · Provider · 提示词</n-text>
      </template>

      <n-space vertical :size="8">
        <n-card
          v-for="a in agents"
          :key="'config-' + a"
          size="small"
          :bordered="true"
          embedded
        >
          <n-space align="center" :size="8" style="margin-bottom: 4px;">
            <img :src="agentIcons[a]" :alt="APP_LABELS[a]" style="width: 16px; height: 16px; object-fit: contain;" />
            <n-text strong style="font-size: 12px; flex: 1;">{{ APP_LABELS[a] }}</n-text>
            <n-button
              v-if="editingConfigAgent !== a"
              text
              size="tiny"
              @click="startEditConfig(a)"
            >
              编辑 ›
            </n-button>
          </n-space>

          <!-- 展示态 -->
          <n-tooltip v-if="editingConfigAgent !== a" trigger="hover" placement="top-start">
            <template #trigger>
              <n-button text block class="path-btn" @click="startEditConfig(a)">
                <n-text
                  :type="configPaths[a] ? 'default' : 'warning'"
                  code
                  style="font-size: 11px; flex: 1; text-align: left;"
                >
                  {{ configPaths[a] || "未设置" }}
                </n-text>
              </n-button>
            </template>
            点击编辑配置路径（会话、MCP、Provider、提示词等路径均从此派生）
          </n-tooltip>

          <!-- 编辑态 -->
          <n-space v-else vertical :size="6">
            <n-input
              v-model:value="editConfigValue"
              :placeholder="'~/.generic'.replace('generic', a)"
              size="small"
              :autofocus="true"
              @keydown.enter="confirmEditConfig(a)"
              @keydown.escape="cancelEditConfig"
            />
            <n-space justify="end" :size="6">
              <n-button size="tiny" quaternary @click="resetDefaultConfig(a)">重置默认</n-button>
              <n-button size="tiny" type="primary" @click="confirmEditConfig(a)">确认</n-button>
            </n-space>
          </n-space>
        </n-card>
      </n-space>
    </n-card>

    <!-- 同步方式 -->
    <n-card size="small" :bordered="true">
      <template #header>
        <n-text depth="2" style="font-size: 12px; font-weight: 600;">同步方式</n-text>
      </template>

      <n-space vertical :size="6">
        <n-card
          size="small"
          :bordered="true"
          :class="{ 'sync-card--active': syncMode === 'symlink' }"
          style="cursor: pointer;"
          @click="saveSyncMode('symlink')"
        >
          <n-space align="center" :size="8">
            <n-radio :checked="syncMode === 'symlink'" />
            <div>
              <n-text strong style="font-size: 12px; display: block;">软链接</n-text>
              <n-text depth="3" style="font-size: 11px;">不占磁盘，改一处全局生效 (Win 用 junction 免特权)</n-text>
            </div>
          </n-space>
        </n-card>
        <n-card
          size="small"
          :bordered="true"
          :class="{ 'sync-card--active': syncMode === 'copy' }"
          style="cursor: pointer;"
          @click="saveSyncMode('copy')"
        >
          <n-space align="center" :size="8">
            <n-radio :checked="syncMode === 'copy'" />
            <div>
              <n-text strong style="font-size: 12px; display: block;">复制同步</n-text>
              <n-text depth="3" style="font-size: 11px;">跨平台通用，将 skill 复制到目标 agent 目录</n-text>
            </div>
          </n-space>
        </n-card>
      </n-space>
    </n-card>

    <!-- 项目同步目标 -->
    <n-card size="small" :bordered="true">
      <template #header>
        <n-text depth="2" style="font-size: 12px; font-weight: 600;">项目同步目标</n-text>
      </template>

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
              <n-popconfirm @positive-click="removeProjectTarget(p.id)">
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
        <n-input v-model:value="newProjectPath" placeholder="项目路径" size="small" style="flex: 1;" @keydown.enter="addProject" />
        <n-button type="primary" size="small" @click="addProject">添加</n-button>
      </n-space>
    </n-card>
  </n-space>
</template>

<style scoped>
.storage-settings {
  padding: 0;
}

.path-btn {
  padding: 4px 8px !important;
  border-radius: 4px;
  border: 1px dashed var(--border);
  transition: all .15s;
  text-align: left;
  width: 100%;
}
.path-btn:hover {
  border-color: var(--primary);
  background: var(--primary-light);
}

.sync-card--active {
  border-color: var(--primary) !important;
  background: var(--primary-light) !important;
}
</style>
