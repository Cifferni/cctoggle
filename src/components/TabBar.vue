<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useProviders } from "../composables/useProviders.js";
import { useRoutes } from "../composables/useRoutes.js";

const { APP_TYPES, APP_LABELS, APP_ICONS, activeTab, setActiveTab } = useProviders();
const { runtime, toggleQuick } = useRoutes();
const router = useRouter();

const proxyOn = computed(() => !!runtime[activeTab()]?.running);

function onToggleProxy() {
  const r = toggleQuick(activeTab());
  if (!r.success && r.error === "no providers") {
    window.utools?.showNotification?.("当前 App 还没有供应商，请先在「供应商」页添加");
  } else if (!r.success) {
    window.utools?.showNotification?.("操作失败：" + (r.error || "unknown"));
  } else {
    window.utools?.showNotification?.(r.running ? "路由已开启" : "路由已关闭");
  }
}
</script>

<template>
  <nav class="tab-bar">
    <button class="tab tab--stats" title="用量统计" @click="router.push('/stats')">
      <span class="tab-icon">📊</span>统计
    </button>
    <button
      v-for="t in APP_TYPES" :key="t"
      class="tab"
      :class="{ 'tab--active': activeTab() === t }"
      @click="setActiveTab(t)"
    >
      <span class="tab-icon">{{ APP_ICONS[t] }}</span>
      {{ APP_LABELS[t] }}
    </button>
    <span class="tab-divider"></span>

    <!-- 代理开关：打开即为当前 App 开启代理 -->
    <label
      class="proxy-switch"
      :title="proxyOn ? APP_LABELS[activeTab()] + ' 代理运行中，点击关闭' : '打开以为 ' + APP_LABELS[activeTab()] + ' 开启代理'"
    >
      <span class="proxy-switch__label">代理</span>
      <button
        type="button"
        role="switch"
        :aria-checked="proxyOn"
        class="switch"
        :class="{ 'switch--on': proxyOn }"
        @click="onToggleProxy"
      >
        <span class="switch__knob"></span>
      </button>
    </label>

    <button class="tab tab--nav" @click="router.push('/skills')">Skill管理</button>
    <button class="tab tab--nav" @click="router.push('/settings')">&#9881;</button>
  </nav>
</template>

<style scoped>
.tab-bar {
  display: flex;
  gap: 2px;
  background: var(--bg-hover);
  padding: 3px;
  border-radius: 9px;
}
.tab {
  padding: 5px 14px;
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: all .15s;
}
.tab:hover { color: var(--text); }
.tab--active {
  background: var(--primary);
  color: #fff !important;
  box-shadow: 0 1px 3px rgba(59,130,246,.3);
}
.tab-icon { margin-right: 5px; }
.tab--stats { color: var(--primary); font-weight: 600; }
.tab--stats:hover { background: var(--bg-card); }
.tab-divider { margin-left: auto; width: 1px; background: var(--border); margin-top: 3px; margin-bottom: 3px; margin-right: 4px; border-radius: 1px; }
.tab--nav {
  padding: 5px 12px;
  font-size: 12px;
}

/* 代理开关 */
.proxy-switch {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  cursor: pointer;
  user-select: none;
}
.proxy-switch__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}
.switch {
  position: relative;
  width: 38px;
  height: 20px;
  border: none;
  border-radius: 999px;
  background: var(--text-muted);
  cursor: pointer;
  padding: 0;
  transition: background .2s;
}
.switch--on { background: #22c55e; }
.switch__knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0,0,0,.25);
  transition: transform .2s;
}
.switch--on .switch__knob { transform: translateX(18px); }
</style>
