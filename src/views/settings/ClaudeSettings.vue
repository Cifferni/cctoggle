<script setup>
import { ref, onMounted } from "vue";
import { useMessage } from "naive-ui";
import { getSkillNest } from "../../composables/shared.js";

const message = useMessage();

const skipOnboarding = ref(false);
const loading = ref(false);

function load() {
  const api = getSkillNest();
  try {
    skipOnboarding.value = !!api.readClaudeOnboarding();
  } catch (e) {
    skipOnboarding.value = false;
  }
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
    <n-card size="small" :bordered="true">
      <template #header>
        <n-text depth="2" style="font-size: 12px; font-weight: 600;">通用配置</n-text>
      </template>

      <n-card size="small" :bordered="true" embedded>
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
    </n-card>
  </n-space>
</template>

<style scoped>
.claude-settings {
  padding: 0;
}
</style>
