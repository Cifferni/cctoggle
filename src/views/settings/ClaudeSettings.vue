<script setup lang="ts">
// @ts-nocheck TODO: 逐步添加类型注解后移除
import { ref, onMounted } from "vue";
import { useMessage } from "naive-ui";
import { getSkillNest, APP_ICONS, APP_LABELS } from "../../composables/shared.js";
import { useSkills } from "../../composables/useSkills.js";
import { useTheme } from "../../composables/useTheme.js";

const message = useMessage();
const { currentThemeName, themes, setTheme } = useTheme();

const skipOnboarding = ref(false);
const loading = ref(false);

// Agent 路径配置
const {
  configPaths,
  loadConfigPaths, saveConfigPaths,
} = useSkills();

const agents = ["codex", "claude", "gemini", "openclaw"];
const agentIcons = APP_ICONS;

// Agent path editing
const editingAgent = ref(null);
const editValue = ref("");

function startEdit(app) {
  editingAgent.value = app;
  editValue.value = configPaths.value[app] || "";
}
function confirmEdit(app) {
  saveConfigPaths({ ...configPaths.value, [app]: editValue.value });
  editingAgent.value = null;
}
function cancelEdit() {
  editingAgent.value = null;
}
function resetDefault(app) {
  const fn = window.utoolsCctoggle?.getDefaultConfigDirs || (() => ({}));
  const defaults = fn();
  saveConfigPaths({ ...configPaths.value, [app]: defaults[app] || "" });
  editingAgent.value = null;
}

function load() {
  const api = getSkillNest();
  try {
    skipOnboarding.value = !!api.readClaudeOnboarding();
  } catch (e) {
    skipOnboarding.value = false;
  }
  loadConfigPaths();
}

onMounted(load);

function onChange(val) {
  loading.value = true;
  try {
    const api = getSkillNest();
    api.setClaudeOnboarding(val);
    skipOnboarding.value = val;
    message.success(val ? "已开启跳过初次安装确认" : "已关闭跳过初次安装确认");
  } catch (e) {
    message.error("操作失败：" + (e.message || e));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <n-space vertical :size="12" class="claude-settings">
    <!-- Agent 路径配置 -->
    <n-card size="small" :bordered="true">
      <template #header>
        <n-text depth="2" style="font-size: 12px; font-weight: 600;">Agent 路径</n-text>
      </template>
      <template #header-extra>
        <n-text depth="3" style="font-size: 11px;">Skill 存储 · 配置 · 会话 · MCP · Provider · 提示词</n-text>
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
                  :type="configPaths[a] ? 'default' : 'warning'"
                  code
                  style="font-size: 11px; flex: 1; text-align: left;"
                >
                  {{ configPaths[a] || "未设置" }}
                </n-text>
              </n-button>
            </template>
            点击编辑 Agent 路径（Skill 存储、配置、会话、MCP、Provider、提示词等均从此派生）
          </n-tooltip>

          <!-- 编辑态 -->
          <n-space v-else vertical :size="6">
            <n-input
              v-model:value="editValue"
              :placeholder="'~/.generic'.replace('generic', a)"
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

    <!-- 跳过初次安装确认 -->
    <n-card size="small" :bordered="true">
      <n-space align="center" :size="12">
        <div style="flex: 1; min-width: 0;">
          <n-text strong style="font-size: 12px; display: block;">
            跳过初次安装确认
          </n-text>
          <n-text depth="3" style="font-size: 11px;">
            开启后 Claude Code 将跳过首次运行的 onboarding 确认界面
          </n-text>
        </div>
        <n-switch
          :value="skipOnboarding"
          :loading="loading"
          @update:value="onChange"
        />
      </n-space>
    </n-card>

    <!-- 主题设置 -->
    <n-card size="small" :bordered="true">
      <n-space align="center" :size="12">
        <n-text strong style="font-size: 12px;">主题风格</n-text>
        <n-radio-group :value="currentThemeName" @update:value="setTheme" size="small">
          <n-radio-button
            v-for="t in themes" :key="t.name"
            :value="t.name"
          >{{ t.label }}</n-radio-button>
        </n-radio-group>
      </n-space>
    </n-card>
  </n-space>
</template>

<style scoped>
.claude-settings {
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
</style>
