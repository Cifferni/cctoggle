# 代码风格指南

## 通用规则

### 文件编码
- **必须**使用 UTF-8 无 BOM 编码
- **禁止**使用 `Set-Content -Encoding UTF8`（会添加 BOM）

```powershell
# 正确
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($path, $content, $utf8NoBom)

# 错误
Set-Content -Path $path -Value $content -Encoding UTF8  # 会添加 BOM
```

### 缩进
- 使用 **2 空格**缩进
- **禁止**使用 Tab

---

## JavaScript/Vue

### 变量声明

```javascript
// ✓ 正确
const API_URL = "https://api.example.com";
let count = 0;
const items = ref([]);

// ✗ 错误
var oldStyle = "禁止使用 var";
```

### 函数定义

```javascript
// ✓ 箭头函数（回调）
const handler = () => { /* ... */ };
items.map(item => item.name);
setTimeout(() => { /* ... */ }, 100);

// ✓ 普通函数（需要 this 或提升时）
function getProvider(id) {
  return providers.value.find(p => p.id === id);
}

// ✗ 禁止
var fn = function() { /* ... */ };
```

### 字符串

```javascript
// ✓ 模板字符串
const msg = `已切换到 ${provider.name}`;
const url = `${baseUrl}/v1/models`;

// ✗ 字符串拼接
var msg = "已切换到 " + provider.name;
```

### 解构

```javascript
// ✓ 解构赋值
const { name, baseUrl, model } = provider;
const { success, error } = switchProvider(id);

// ✓ 函数参数解构
function createProvider({ name, baseUrl, model }) {
  // ...
}
```

### 可选链和空值合并

```javascript
// ✓ 可选链
const model = provider?.model || "default";
const port = runtime?.codex?.port ?? 8788;

// ✗ 冗余检查
const model = provider && provider.model ? provider.model : "default";
```

---

## Vue 组件

### script setup

```vue
<script setup>
import { ref, computed, watch } from "vue";

// Props
const props = defineProps({
  provider: { type: Object, required: true },
  editable: { type: Boolean, default: false }
});

// Emits
const emit = defineEmits(["switch", "edit", "delete"]);

// 响应式状态
const isExpanded = ref(false);

// 计算属性
const displayName = computed(() => props.provider.name || "Unnamed");

// 方法
function handleSwitch() {
  emit("switch", props.provider.id);
}

// 监听器
watch(() => props.provider.id, (newId) => {
  isExpanded.value = false;
});
</script>
```

### 模板语法

```vue
<template>
  <!-- 条件渲染 -->
  <div v-if="provider.isCurrent" class="badge">当前</div>
  <div v-else class="badge">未激活</div>

  <!-- 列表渲染 -->
  <div v-for="item in items" :key="item.id">
    {{ item.name }}
  </div>

  <!-- 事件处理 -->
  <button @click="handleSwitch" :disabled="provider.isCurrent">
    切换
  </button>

  <!-- 属性绑定 -->
  <div :class="{ 'card--current': provider.isCurrent }">
    {{ provider.name }}
  </div>
</template>
```

### 组件组织顺序

```vue
<script setup>
// 1. 导入
import { ref, computed } from "vue";
import { useProviders } from "../composables/useProviders.js";

// 2. Props & Emits
const props = defineProps({ /* ... */ });
const emit = defineEmits(["/* ... */"]);

// 3. Composables
const { providers, loadProviders } = useProviders();

// 4. 响应式状态
const searchQuery = ref("");

// 5. 计算属性
const filteredProviders = computed(() => /* ... */);

// 6. 方法
function handleSearch() { /* ... */ }

// 7. 监听器
watch(searchQuery, () => { /* ... */ });
</script>

<template>
  <!-- 1. 根元素 -->
  <div class="component">
    <!-- 2. 子组件 -->
    <ChildComponent />

    <!-- 3. 内容 -->
    <div>...</div>
  </div>
</template>

<style scoped>
/* 1. 布局 */
.component { display: flex; }

/* 2. 元素 */
.component__header { padding: 16px; }

/* 3. 修饰符 */
.component--active { border-color: var(--primary); }
</style>
```

---

## CSS

### 命名规范 (BEM)

```css
/* 块 */
.card { }

/* 元素 */
.card__header { }
.card__body { }
.card__footer { }

/* 修饰符 */
.card--current { }
.card--disabled { }

/* 元素修饰符 */
.card__title--large { }
```

### 类名风格

```css
/* ✓ kebab-case */
.provider-card { }
.provider-card__header { }

/* ✗ 驼峰或下划线 */
.providerCard { }
.provider_card { }
```

### CSS 变量

```css
/* ✓ 使用 CSS 变量 */
.btn {
  background: var(--primary);
  color: var(--text);
  border-radius: var(--radius);
}

/* ✗ 硬编码值 */
.btn {
  background: #3b82f6;
  color: #0f172a;
  border-radius: 8px;
}
```

### 选择器特异性

```css
/* ✓ 保持低特异性 */
.card { }
.card__title { }

/* ✗ 避免过度嵌套 */
.app .container .card .header .title { }
```

### 响应式设计

```css
/* 移动优先 */
.card {
  padding: 12px;
}

/* 平板及以上 */
@media (min-width: 768px) {
  .card {
    padding: 16px;
  }
}
```

---

## Composable 模式

### 基本结构

```javascript
// composables/useFeature.js
import { ref, computed } from "vue";
import { getSkillNest } from "./shared.js";

// 模块级状态（单例）
const data = ref([]);

export function useFeature() {
  // 计算属性
  const count = computed(() => data.value.length);

  // 方法
  function load() {
    data.value = getSkillNest().someApi();
  }

  function addItem(item) {
    getSkillNest().saveItem(item);
    load();
  }

  // 返回公共 API
  return {
    data,
    count,
    load,
    addItem,
  };
}
```

### 错误处理

```javascript
function safeApiCall(fn) {
  try {
    return fn();
  } catch (e) {
    console.error("API call failed:", e);
    return null;
  }
}

// 使用
const provider = safeApiCall(() => getSkillNest().getProvider(id));
```

---

## 数据定义

### 预设数据

```javascript
// src/data/presets-codex.js
export default [
  {
    provider: "openai_official",
    model: "gpt-5.4",
    reasoningEffort: "high",
    wireApi: "responses",
  },
  {
    provider: "deepseek",
    model: "deepseek-coder",
    baseUrl: "https://api.deepseek.com/v1",
    wireApi: "chat",
    apiFormat: "openai_chat",
  },
];
```

### 常量定义

```javascript
// ✓ 使用 const 或 export
export const APP_TYPES = ["codex", "claude", "openclaw", "gemini"];

// ✓ 使用 Object.freeze 对象常量
export const APP_LABELS = Object.freeze({
  codex: "Codex",
  claude: "Claude",
});
```

---

## 注释风格

### 单行注释

```javascript
// 获取当前供应商
function getCurrentProvider() { /* ... */ }
```

### 多行注释

```javascript
/**
 * 切换供应商
 * @param {string} appType - Agent 类型
 * @param {string} providerId - 供应商 ID
 * @returns {{ success: boolean, error?: string }}
 */
function switchProvider(appType, providerId) { /* ... */ }
```

### TODO/FIXME

```javascript
// TODO: 添加缓存机制
// FIXME: 修复跨盘符号链接问题
// HACK: 临时 workaround，待上游修复
```

---

## 禁止事项

### JavaScript

```javascript
// ✗ 禁止 var
var old = "使用 const 或 let";

// ✗ 禁止 == (除 null/undefined 检查)
if (value == null) { }  // 可以
if (value == "0") { }   // 禁止

// ✗ 禁止 any 类型 (TypeScript)
// @ts-ignore  // 仅在必要时使用
```

### Vue

```vue
<!-- ✗ 禁止 -->
<script>
export default {
  // 不使用 Options API
}
</script>

<!-- ✗ 禁止 -->
<style>
/* 不使用全局样式（scoped 组件中） */
</style>
```

### CSS

```css
/* ✗ 禁止 !important */
.btn { color: red !important; }

/* ✗ 禁止内联样式 */
<div style="color: red;">
```
