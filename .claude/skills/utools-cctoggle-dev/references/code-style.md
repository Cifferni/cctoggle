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

## TypeScript

### 变量声明

```typescript
// ✓ 正确
const API_URL = "https://api.example.com";
let count = 0;
const items = ref<string[]>([]);

// ✗ 错误
var oldStyle = "禁止使用 var";
```

### 类型注解

```typescript
// ✓ 函数参数和返回值
function switchProvider(appType: AppType, id: string): SwitchResult {
  // ...
}

// ✓ 变量类型
const providers = ref<Provider[]>([]);
const isDark = ref(false);

// ✓ 接口定义
interface Provider {
  id: string
  name: string
  baseUrl: string
  model: string
}

// ✗ 避免 any（使用 unknown 或具体类型）
const data: any = {};  // 禁止
const data: Record<string, unknown> = {};  // 正确
```

### 泛型

```typescript
// ✓ ref 泛型
const providers = ref<Provider[]>([]);
const activeTab = ref<AppType>("codex");

// ✓ computed 泛型
const count = computed<number>(() => items.value.length);

// ✓ 函数泛型
function toPlain<T>(v: T): T { /* ... */ }
```

### 导入

```typescript
// ✓ 类型导入用 import type
import type { Provider, AppType } from "../types/utools-cctoggle";

// ✓ 值导入
import { ref, computed } from "vue";
import { getSkillNest } from "./shared";

// ✗ 不带 .js 后缀（Vite bundler 解析）
import { getSkillNest } from "./shared.js";  // 禁止
```

### 函数定义

```typescript
// ✓ 箭头函数（回调）
const handler = () => { /* ... */ };
items.map(item => item.name);
setTimeout(() => { /* ... */ }, 100);

// ✓ 普通函数（需要 this 或提升时）
function getProvider(id: string): Provider | null {
  return providers.value.find(p => p.id === id) ?? null;
}

// ✗ 禁止
var fn = function() { /* ... */ };
```

### 字符串

```typescript
// ✓ 模板字符串
const msg = `已切换到 ${provider.name}`;
const url = `${baseUrl}/v1/models`;

// ✗ 字符串拼接
var msg = "已切换到 " + provider.name;
```

### 解构

```typescript
// ✓ 解构赋值
const { name, baseUrl, model } = provider;
const { success, error } = switchProvider(id);

// ✓ 函数参数解构（加类型）
function createProvider({ name, baseUrl, model }: ProviderInput): void {
  // ...
}
```

### 可选链和空值合并

```typescript
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
<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { Provider } from "../types/utools-cctoggle";

// Props（泛型语法）
const props = defineProps<{
  provider: Provider
  editable?: boolean
}>();

// Emits（泛型语法）
const emit = defineEmits<{
  switch: [id: string]
  edit: [provider: Provider]
  delete: [id: string]
}>();

// 响应式状态
const isExpanded = ref(false);

// 计算属性
const displayName = computed(() => props.provider.name || "Unnamed");

// 方法
function handleSwitch(): void {
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
<script setup lang="ts">
// 1. 导入
import { ref, computed } from "vue";
import type { Provider } from "../types/utools-cctoggle";
import { useProviders } from "../composables/useProviders";

// 2. Props & Emits
const props = defineProps<{ /* ... */ }>();
const emit = defineEmits<{ /* ... */ }>();

// 3. Composables
const { providers, loadProviders } = useProviders();

// 4. 响应式状态
const searchQuery = ref("");

// 5. 计算属性
const filteredProviders = computed(() => /* ... */);

// 6. 方法
function handleSearch(): void { /* ... */ }

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

```typescript
// composables/useFeature.ts
import { ref, computed } from "vue";
import { getSkillNest } from "./shared";
import type { FeatureItem } from "../types/utools-cctoggle";

// 模块级状态（单例）
const data = ref<FeatureItem[]>([]);

export function useFeature() {
  // 计算属性
  const count = computed(() => data.value.length);

  // 方法
  function load(): void {
    data.value = getSkillNest().someApi();
  }

  function addItem(item: FeatureItem): void {
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

```typescript
function safeApiCall<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch (e) {
    console.error("API call failed:", e);
    return null;
  }
}

// 使用
const provider = safeApiCall(() => getSkillNest().getProvider(appType, id));
```

---

## 数据定义

### 预设数据

```typescript
// src/data/presets-codex.ts
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

```typescript
// ✓ 使用 const 或 export + 类型注解
export const APP_TYPES: AppType[] = ["codex", "claude", "openclaw", "gemini"];

export const APP_LABELS: Record<string, string> = {
  codex: "Codex",
  claude: "Claude",
};
```

---

## 注释风格

### 单行注释

```javascript
// 获取当前供应商
function getCurrentProvider() { /* ... */ }
```

### 多行注释

```typescript
/**
 * 切换供应商
 * @param appType - Agent 类型
 * @param providerId - 供应商 ID
 */
function switchProvider(appType: AppType, providerId: string): SwitchResult { /* ... */ }
```

### TODO/FIXME

```javascript
// TODO: 添加缓存机制
// FIXME: 修复跨盘符号链接问题
// HACK: 临时 workaround，待上游修复
```

---

## 禁止事项

### TypeScript

```typescript
// ✗ 禁止 var
var old = "使用 const 或 let";

// ✗ 禁止 == (除 null/undefined 检查)
if (value == null) { }  // 可以
if (value == "0") { }   // 禁止

// ✗ 禁止 any（使用 unknown 或具体类型）
const data: any = {};  // 禁止
const data: Record<string, unknown> = {};  // 正确

// ✗ 禁止导入路径带 .js 后缀
import { getSkillNest } from "./shared.js";  // 禁止
import { getSkillNest } from "./shared";      // 正确

// ✗ @ts-nocheck 仅用于迁移期间，新代码禁止使用
```

### Vue

```vue
<!-- ✗ 禁止 -->
<script>
export default {
  // 不使用 Options API
}
</script>

<!-- ✗ 禁止不带 lang="ts" -->
<script setup>
// 应使用 <script setup lang="ts">
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

---

## Naive UI 使用规范

### 组件导入

```typescript
// ✓ 按需导入（推荐）
import { NButton, NCard, NInput } from "naive-ui";

// ✓ 使用 unplugin-auto-import（自动导入）
// 无需手动导入，直接使用 <n-button> 等组件
```

### 主题使用

```typescript
// ✓ 使用 useTheme() 获取主题配置
import { useTheme } from "../composables/useTheme";
const { theme, themeOverrides, isDark } = useTheme();

// ✓ 在 App.vue 中配置 n-config-provider
<n-config-provider :theme="theme" :theme-overrides="themeOverrides">
  <!-- 应用内容 -->
</n-config-provider>
```

### 消息提示

```typescript
// ✓ 使用 appMessage（composable 中）
import { appMessage } from "../composables/useAppMessage";
appMessage.success("操作成功");

// ✓ 使用 useMessage（组件中）
import { useMessage } from "naive-ui";
const message = useMessage();
message.success("操作成功");
```

### 对话框

```typescript
// ✓ 使用 appDialog（composable 中）
import { appDialog } from "../composables/useAppMessage";
appDialog.warning({
  title: "确认删除",
  content: "确定要删除吗？",
  positiveText: "确定",
  negativeText: "取消",
  onPositiveClick: () => { /* 执行删除 */ },
});

// ✓ 使用 useDialog（组件中）
import { useDialog } from "naive-ui";
const dialog = useDialog();
dialog.warning({ /* 配置 */ });
```

---

## Vue 3 最佳实践

### 响应式数据

```typescript
// ✓ 使用 ref（基本类型）
const count = ref(0);
const name = ref("");

// ✓ 使用 ref 泛型（复杂类型）
const providers = ref<Provider[]>([]);

// ✓ 使用 reactive（对象类型）
const form = reactive({
  name: "",
  baseUrl: "",
  model: "",
});

// ✓ 使用 computed（计算属性）
const fullName = computed(() => firstName.value + " " + lastName.value);
```

### 生命周期

```typescript
// ✓ 使用 onMounted
onMounted(() => {
  loadProviders();
});

// ✓ 使用 onUnmounted
onUnmounted(() => {
  if (timer) clearInterval(timer);
});
```

### 监听器

```typescript
// ✓ watch（单个源）
watch(searchQuery, (newVal) => {
  runSearch(newVal);
});

// ✓ watch（多个源）
watch([() => form.baseUrl, () => form.model], ([url, model]) => {
  // 处理变化
});

// ✓ watchEffect（自动追踪依赖）
watchEffect(() => {
  console.log(count.value);
});
```

---

## 异步处理

### async/await

```typescript
// ✓ 使用 async/await
async function loadProviders(): Promise<void> {
  loading.value = true;
  try {
    const result = await getSkillNest().listProviders();
    providers.value = result;
  } catch (e) {
    console.error("Failed to load providers:", e);
    appMessage.error("加载失败");
  } finally {
    loading.value = false;
  }
}
```

### Promise

```typescript
// ✓ 使用 Promise.all（并行请求）
async function loadStats(): Promise<void> {
  const results = await Promise.all(
    apps.map(app => getSkillNest().scanSessions(app.key))
  );
  // 处理结果
}
```

### 防抖处理

```typescript
// ✓ 搜索防抖
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, (q) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => runSearch(q), 250);
});
```

---

## 错误处理

### try-catch

```typescript
// ✓ 统一错误处理
function safeApiCall<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch (e: unknown) {
    console.error("API call failed:", e);
    appMessage.error("操作失败：" + ((e as Error).message || "未知错误"));
    return null;
  }
}
```

### 用户提示

```javascript
// ✓ 成功提示
appMessage.success("操作成功");

// ✓ 警告提示
appMessage.warning("请注意");

// ✓ 错误提示
appMessage.error("操作失败");

// ✓ 信息提示
appMessage.info("提示信息");
```
