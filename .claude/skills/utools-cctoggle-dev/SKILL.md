---
name: utools-cctoggle-dev
description: Development standards for the uTools ccToggle/SkillNest plugin - AI provider management and skill deployment
---

# uTools ccToggle / SkillNest 开发规范

## 项目定位

**ccToggle** (又名 **SkillNest**) 是一个 uTools 插件，用于统一管理 AI Skills 并一键切换 API 供应商。

### 核心功能
- 供应商管理：添加、编辑、删除和切换多个 AI API 供应商
- 代理路由：支持协议转换（OpenAI/Anthropic/Chat）和多供应商负载均衡
- Skill 管理：部署、卸载和同步 AI Skills 到多个 Agent 目录
- 用量统计：追踪 API 调用量和 token 使用情况

### 支持的 Agent
| Agent | 配置类型 | 配置文件路径 |
|-------|----------|-------------|
| Codex | openai | `~/.codex/auth.json` + `~/.codex/config.toml` |
| Claude | anthropic | `~/.claude/settings.json` |
| OpenClaw | openclaw | `~/.openclaw/openclaw.json` |
| Gemini | gemini | `~/.gemini/.env` |

---

## 技术栈

- **前端**: Vue 3.5+ / Vite 6+ / Vue Router 4 / ECharts 6+
- **样式**: Sass/SCSS（已安装 `sass` 作为 devDependency）
- **包管理**: pnpm（使用 `pnpm-lock.yaml`）
- **编码**: UTF-8 无 BOM（**禁止**使用带 BOM 的编码）
- **运行环境**: uTools 插件（preload 为 Node.js，前端为浏览器环境）

---

## 命令

```bash
pnpm dev          # 启动开发服务器 (http://localhost:5173)
pnpm build        # 生产环境构建到 dist/
pnpm preview      # 预览生产构建
```

---

## 目录结构

```
src/
├── components/          # 可复用的 UI 组件（PascalCase）
│   ├── ProviderCard.vue     # 供应商卡片展示
│   ├── ProviderForm.vue     # 供应商表单（侧边栏面板）
│   ├── TabBar.vue           # Agent 切换标签栏
│   ├── PresetChips.vue      # 预设筛选标签
│   ├── RoutesSection.vue    # 代理路由配置区
│   ├── SkillListSection.vue # Skill 列表区
│   ├── SkillInstallSection.vue
│   ├── SkillStorageSection.vue
│   ├── AppFooter.vue        # 底部栏
│   ├── EChart.vue           # ECharts 封装
│   ├── ToastHost.vue        # 通知提示容器
│   └── ConfirmHost.vue      # 应用内确认弹窗容器（替代 window.confirm）
├── composables/         # 状态管理与业务逻辑（camelCase, use* 前缀）
│   ├── useProviders.js      # 供应商 CRUD + 切换
│   ├── useRoutes.js         # 代理路由管理
│   ├── useSkills.js         # Skill 管理
│   ├── useStats.js          # 用量统计
│   ├── useTheme.js          # 主题管理（亮/暗模式、主题切换、CSS 变量同步）
│   ├── useToast.js          # 通知提示
│   ├── useConfirm.js        # 确认弹窗（Promise<boolean>）
│   └── shared.js            # 共享常量、工具函数、getSkillNest()
├── views/               # 页面级组件（PascalCase + Page 后缀）
│   ├── ProviderListPage.vue # 主页 - 供应商列表
│   ├── SkillsPage.vue       # Skill 管理页
│   ├── StatsPage.vue        # 用量统计页
│   ├── SettingsPage.vue     # 设置页（含子路由）
│   └── settings/
│       ├── RoutesSettings.vue
│       ├── StorageSettings.vue
│       └── SyncSettings.vue
├── data/                # 静态数据和预设
│   ├── providers.js         # 供应商元数据（PROVIDERS 常量）
│   ├── presets.js           # 预设聚合器（合并元数据+差异）
│   ├── presets-codex.js     # Codex 专用预设
│   ├── presets-claude.js    # Claude 专用预设
│   ├── presets-openclaw.js  # OpenClaw 专用预设
│   └── presets-gemini.js    # Gemini 专用预设
├── themes/              # 主题系统
│   ├── index.js             # 主题注册表，导出 themes 列表和工具函数
│   ├── amber.js             # 琥珀暖光主题定义（当前默认）
│   └── buildOverrides.js    # 生成 Naive UI themeOverrides
├── router/index.js      # Vue Router 配置（memory history）
├── setup.js             # uTools 动态命令注册
├── App.vue              # 根组件
├── main.js              # 入口文件
└── style.css            # 全局基础样式（圆角等，颜色由 useTheme 动态注入）

public/
├── preload/
│   ├── services.js          # 入口：加载各模块，组装 window.utoolsCctoggle
│   ├── utils.js             # 工具函数、路径常量、copyDirSync
│   ├── config-rw.js         # Codex/Claude/Gemini/OpenClaw 配置读写与切换
│   ├── provider-db.js       # 供应商 CRUD、切换、导入导出
│   ├── skills.js            # SkillNest 技能管理、部署、搜索
│   ├── stats.js             # 用量统计（扫描本地 CLI 会话日志）
│   ├── proxy.js             # 路由组、代理启停、接管/还原、端口管理
│   ├── proxy-daemon.js      # 代理守护进程
│   ├── proxy-converter.js   # 协议转换器
│   └── package.json
├── plugin.json          # uTools 插件配置
└── logo.png
```

---

## 编码规范

### JavaScript/Vue

#### 通用规则
- 使用 ES modules (import/export)
- 优先 `const`，其次 `let`，**禁止 `var`**（`public/preload/*.js` 除外，因其运行在 Node.js 环境且为历史代码，模块间使用 CommonJS `require`/`module.exports`）
- 使用箭头函数作为回调
- 使用模板字符串替代字符串拼接
- 文件编码：**UTF-8 无 BOM**

#### Vue 组件
- 使用 `<script setup>` 语法
- 使用 `defineProps()` 定义 props（对象形式声明类型）
- 使用 `defineEmits()` 定义 emits
- 组件命名：**PascalCase**（如 `ProviderCard.vue`）
- Composable 命名：**camelCase**，以 `use` 前缀（如 `useProviders.js`）

#### 交互规范（重要）
- **禁止使用系统弹窗** `window.confirm` / `window.alert` / `window.prompt`——在 uTools 独立窗口中样式突兀、不受控。
  - 提示消息用 `toast`（`useToast.js`）
  - 需要用户确认的操作用 `confirm()`（`useConfirm.js`，返回 `Promise<boolean>`）：
    ```javascript
    import { confirm } from "../composables/useConfirm.js";
    const ok = await confirm("确定清空统计吗？此操作不可恢复。",
      { title: "清空统计", confirmText: "清空", danger: true });
    if (ok) clearStats();
    ```
  - `ToastHost` 与 `ConfirmHost` 已在 `App.vue` 根部挂载，新页面直接调用上述 API 即可。

#### 示例

```vue
<script setup>
import { computed } from "vue";

const props = defineProps({
  provider: { type: Object, required: true }
});

const emit = defineEmits(["switch", "edit", "delete"]);

const displayName = computed(() => props.provider.name || "Unnamed");
</script>

<template>
  <div class="card" :class="{ 'card--current': provider.isCurrent }">
    <span class="card__name">{{ displayName }}</span>
    <button @click="emit('switch', provider.id)">切换</button>
  </div>
</template>

<style lang="scss" scoped>
.card {
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);

  &--current {
    border-color: var(--primary);
    background: var(--primary-light);
  }

  &__name {
    font-weight: 500;
  }
}
</style>
```

---

### CSS/SCSS

#### 样式语言
- 优先使用 SCSS（`<style lang="scss" scoped>`），利用变量、嵌套、mixin 等特性
- 简单组件可用普通 CSS

#### 命名规范
- 使用 BEM 风格：`.block__element--modifier`
- 类名使用 kebab-case

#### 主题系统

项目采用模块化主题架构，支持亮/暗模式切换和主题持久化。

**目录结构：**
```
src/themes/
├── index.js          # 主题注册表，导出 themes 列表和工具函数
├── amber.js          # 琥珀暖光主题定义（当前默认）
└── buildOverrides.js # 生成 Naive UI themeOverrides
```

**核心模块：**
- `useTheme.js` — 主题 composable，管理当前主题、亮/暗模式、CSS 变量同步
- `themes/index.js` — 主题注册表，新增主题在此添加到 `themes` 数组
- `themes/amber.js` — 琥珀暖光主题，定义颜色和组件样式
- `themes/buildOverrides.js` — 从主题定义生成 Naive UI themeOverrides

**颜色变量（由 useTheme.js 动态注入 CSS 自定义属性）：**

| 变量 | 亮色值 | 暗色值 | 说明 |
|------|--------|--------|------|
| `--bg` | `#fffbf5` | `#1a1410` | 页面背景 |
| `--bg-card` | `#fff8f0` | `#231e18` | 卡片背景 |
| `--bg-hover` | `#fef3e2` | `#2e2720` | 悬停背景 |
| `--border` | `#f0dcc8` | `#3d342a` | 边框色 |
| `--text` | `#1c1410` | `#f5efe8` | 主文字 |
| `--text-secondary` | `#6b5a4e` | `#c4b5a5` | 次要文字 |
| `--text-muted` | `#9a8a7e` | `#8a7a6a` | 弱化文字 |
| `--primary` | `#d97706` | `#f59e0b` | 品牌主色（琥珀） |
| `--primary-hover` | `#b45309` | `#fbbf24` | 品牌悬停 |
| `--primary-pressed` | `#92400e` | `#d97706` | 品牌按下 |
| `--primary-suppl` | `rgba(217,119,6,0.1)` | `rgba(245,158,11,0.15)` | 品牌辅助底 |
| `--primary-light` | `#fef3c7` | `#3d2e10` | 品牌浅底 |
| `--danger` | `#dc2626` | `#f87171` | 危险色 |
| `--danger-light` | `#fef2f2` | `#3b1a1a` | 危险浅底 |
| `--success` | `#16a34a` | `#34d399` | 成功色 |

**Naive UI 主题覆盖（buildOverrides.js）：**

自动从主题定义生成，关键映射：
- `common.primaryColor*` → 品牌色系
- `Card.color` / `List.color` → `bgCard`
- `Input.borderFocus` / `boxShadowFocus` → 品牌色 + `primarySuppl`
- `DataTable.thColor` → `primaryLight`
- `Select.peers.InternalSelection` → 品牌色系

**新增主题：**
1. 在 `src/themes/` 创建 `xxx.js`，导出主题对象（参考 amber.js 结构）
2. 在 `src/themes/index.js` 的 `themes` 数组中添加
3. 主题对象需包含 `name`、`label`、`colors`（light/dark）、`components`

**硬编码颜色规范：**

组件中的 box-shadow、图表等硬编码颜色也需使用暖色：
- 主色相关 shadow：`rgba(217,119,6, .1~.3)` 而非蓝色
- 图表配色：输入 `#d97706`、输出 `#22c55e`、缓存 `#f59e0b`、模型柱 `#e67e22`

---

## 架构模式

### 数据流

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────────┐
│   UI 组件    │────▶│  Composables │────▶│ window.utoolsCctoggle   │
│  (Vue SFC)  │◀────│ (reactive)   │◀────│  (preload services.js)  │
└─────────────┘     └──────────────┘     └──────────┬──────────────┘
                           │                        │ require()
                           ▼                        ▼
                    ┌──────────────┐     ┌─────────────────────────┐
                    │ 响应式状态    │     │  utils / config-rw /    │
                    │ ref/reactive │     │  provider-db / skills / │
                    └──────────────┘     │  stats / proxy          │
                                         └──────────┬──────────────┘
                                                    │
                                                    ▼
                                         ┌─────────────────────────┐
                                         │  uTools API / 文件系统   │
                                         │  utools.db (PouchDB)    │
                                         └─────────────────────────┘
```

### Composable 模式

所有业务逻辑封装在 composable 中，通过 `getSkillNest()` 访问后端 API：

```javascript
// composables/useProviders.js
import { ref } from "vue";
import { toast } from "./useToast.js";
import { getSkillNest, toPlain } from "./shared.js";

const providers = ref([]);
const _activeTab = ref("codex");

export function useProviders() {
  function loadProviders() {
    providers.value = getSkillNest().listProviders(_activeTab.value);
  }

  function switchProvider(id) {
    const result = getSkillNest().switchProvider(_activeTab.value, id);
    if (result.success) {
      loadProviders();
      toast.success("已切换到 " + result.providerName);
    }
    return result;
  }

  function saveProvider(data) {
    getSkillNest().saveProvider(_activeTab.value, toPlain(data));
    loadProviders();
  }

  return { providers, loadProviders, switchProvider, saveProvider };
}
```

### 后端 API 暴露

后端服务通过 `window.utoolsCctoggle` 暴露 API（入口文件 `public/preload/services.js`，由 6 个模块组成）：

```javascript
// public/preload/services.js — 入口，require 各模块后组装
var utils = require("./utils");        // 工具函数、路径常量
var configRw = require("./config-rw"); // 配置读写与切换
var providerDb = require("./provider-db"); // 供应商 CRUD
var skills = require("./skills");      // SkillNest 技能管理
var stats = require("./stats");        // 用量统计
var proxy = require("./proxy");        // 代理路由

window.utoolsCctoggle = {
  // 供应商管理 (provider-db.js)
  listProviders, getProvider, saveProvider, deleteProvider,
  switchProvider, getCurrentProviderId, reapplyCurrent,

  // 代理路由 (proxy.js)
  startProxy, stopProxy, getProxyStatus, toggleProxyQuick,
  takeoverApp, restoreApp,

  // Skill 管理 (skills.js)
  listNestSkills, deploySkill, undeploySkill, installSkill,

  // 统计（无缓存，数据源为本地 CLI 会话日志，stats.js）
  scanUsageLogs, clearStats,

  // 配置读取 (config-rw.js)
  readCodexConfig, readClaudeSettings, readGeminiEnv,
};
```

**模块依赖关系**：
```
utils.js          ← 无依赖
config-rw.js      ← utils
skills.js         ← utils
stats.js          ← utils
provider-db.js    ← config-rw + proxy（懒加载，打破循环）
proxy.js          ← config-rw + provider-db
```

**循环依赖处理**：`provider-db.js` 和 `proxy.js` 互相依赖。`provider-db.js` 在函数体内通过 `require("./proxy")` 懒加载 proxy 模块，Node.js 模块缓存保证运行时所有函数已就绪。

### 前端安全访问

前端通过 `getSkillNest()` 安全访问后端 API，包含 fallback stubs：

```javascript
// composables/shared.js
export function getSkillNest() {
  return window.utoolsCctoggle || {
    listProviders: () => [],
    switchProvider: () => ({ success: false, error: "not in uTools" }),
    // ... 其他 stub
  };
}
```

---

## 数据模型

### Provider（供应商）

```javascript
{
  id: string,                    // 唯一标识 (Date.now().toString(36) + random)
  name: string,                  // 供应商名称
  baseUrl: string,               // API 端点 URL
  apiKey: string,                // API 密钥（加密存储在 dbCryptoStorage）
  model: string,                 // 默认模型 ID
  models: string[],              // 可用模型列表
  configType: "openai" | "anthropic" | "gemini" | "openclaw",
  category: "official" | "cn_official" | "partner" | "third_party" | "custom",
  isCurrent: boolean,            // 是否为当前激活供应商
  remark: string,                // 备注
  icon: string,                  // 图标标识
  iconColor: string,             // 图标颜色
  // Codex 专属
  wireApi: "responses" | "chat",
  apiFormat: "" | "openai_chat" | "anthropic",
  reasoningEffort: "low" | "medium" | "high",
  modelCatalog: Array<{model, displayName, contextWindow}>,
  extraConfig: string,           // 自定义 config.toml 片段
  // Claude 专属
  authField: "ANTHROPIC_AUTH_TOKEN" | "ANTHROPIC_API_KEY",
  settingsConfig: { env: Record<string, string> },
  // OpenClaw 专属
  apiProtocol: string,
  suggestedDefaults: object,
  // 通用
  createdAt: string,             // ISO 时间戳
  sortOrder: number,
}
```

### RouteGroup（路由组）

```javascript
{
  id: string,
  appType: string,               // "codex" | "claude" | "gemini"
  name: string,                  // 路由组名称
  listenPort: number,            // 监听端口 (默认 8788)
  strategy: "failover" | "round-robin" | "weighted",
  members: Array<{
    providerId: string,
    priority: number,
    weight: number
  }>,
  health: {
    intervalMs: number,          // 健康检查间隔 (默认 30000)
    timeoutMs: number,           // 超时时间 (默认 5000)
    path: string                 // 健康检查路径
  },
  breaker: {
    failThreshold: number,       // 熔断阈值 (默认 3)
    cooldownMs: number           // 冷却时间 (默认 60000)
  },
  authToken: string,             // 代理访问令牌
  timeoutMs: number,             // 请求超时 (默认 30000)
}
```

---

## 安全规范

### API Key 存储
- 使用 `utools.dbCryptoStorage` 加密存储 API Key
- 列表接口（`listProviders`）**不返回**明文 Key
- 单独通过 `getProvider` 获取完整数据

### 路径安全
- 验证技能名称：禁止 `/`、`\`、`..`、`\0`
- 防止目录穿越攻击

```javascript
function _safeSkillName(name) {
  if (!name || typeof name !== "string") return false;
  if (name.indexOf("/") >= 0 || name.indexOf("\\") >= 0) return false;
  if (name === "." || name === "..") return false;
  if (name.indexOf("\0") >= 0) return false;
  return true;
}
```

### 路径断言

```javascript
function _assertInside(root, target) {
  const r = path.resolve(root);
  const t = path.resolve(target);
  const rel = path.relative(r, t);
  if (rel === "" || rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("unsafe path outside target root: " + target);
  }
}
```

---

## Git 规范

### 提交信息格式

```
<type>(<scope>): <description>
```

### 类型
| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复 bug |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 重构 |
| `test` | 测试相关 |
| `chore` | 构建/工具/依赖 |

### 范围
- `codex` - Codex 相关
- `claude` - Claude 相关
- `gemini` - Gemini 相关
- `openclaw` - OpenClaw 相关
- `proxy` - 代理路由
- `skill` - Skill 管理
- `stats` - 用量统计
- `ui` - 界面组件

### 示例

```
feat(codex): add model catalog support
fix(claude): guard apiKey write to avoid undefined auth token
chore(proxy): rebrand takeover placeholder names to utoolscctoggle
```

---

## 开发流程

### 新增供应商预设

1. 在 `src/data/providers.js` 的 `PROVIDERS` 中添加供应商元数据
2. 在对应的 `src/data/presets-*.js` 中添加预设配置
3. 预设会通过 `src/data/presets.js` 自动聚合

### 新增 Agent 支持

1. 在 `src/composables/shared.js` 的 `APP_TYPES` 中添加新类型
2. 在 `src/data/` 中创建 `presets-<agent>.js`
3. 在 `public/preload/config-rw.js` 中实现配置读写逻辑，在 `public/preload/provider-db.js` 中添加对应的 CRUD
4. 更新 `src/components/ProviderForm.vue` 的表单字段
5. 更新 `src/components/TabBar.vue` 的标签显示

### 修复 Bug

1. 定位问题所在层（UI / Composable / Backend）
2. 修复并添加必要的防护性检查
3. 测试边界情况

---

## 测试要点

### 关键测试场景

- [ ] 新增/编辑/删除供应商
- [ ] 切换供应商后配置文件正确更新
- [ ] 代理启动/停止/切换
- [ ] Skill 安装/卸载/同步
- [ ] 用量统计准确性
- [ ] 深色模式显示正常

---

## 常见问题

### Q: 为什么使用 `window.utoolsCctoggle` 而不是标准 API？

A: uTools 插件的 preload 脚本运行在 Node.js 环境，而前端运行在浏览器环境。通过 `window` 对象暴露 API 是两者通信的桥梁。

### Q: `toPlain()` 函数的作用？

A: 将 Vue 响应式代理对象转换为普通对象，避免 uTools IPC 通信时出现 "An object could not be cloned" 错误。

### Q: 如何调试 preload 脚本？

A: 在 uTools 开发者工具中，preload 脚本的 `console.log` 输出会显示在开发者工具的控制台中。preload 由 7 个模块组成（`services.js` 入口 + 6 个功能模块），修改任一模块后需重启 uTools 才能生效。

### Q: 用量统计的数据从哪来？为什么不是代理采集的？

A: **统计数据源是两个 CLI 的本地会话日志，与代理无关**（`scanUsageLogs` in `stats.js`）：

- Claude Code：`~/.claude/projects/**/*.jsonl`，取 `type:"assistant"` 行的 `message.usage`（单次增量）+ `message.model`
- Codex：`~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`，取 `token_count` 事件的 **`last_token_usage`（增量）**，
  model 从 `turn_context.payload.model` 归因。**禁止用 `total_token_usage`（累计值，会翻倍）**。

历史上曾用「代理转发时上报 usage」采集，但有致命缺陷（见下条），已废弃。代理仍会发 `proxy-usage` 事件，
但仅用于面板打开时的实时提示，不再写库。

**无缓存架构**：`scanUsageLogs()` 每次直接扫描日志、聚合、返回全部按天原始记录 `{ daily: [...] }`，**不在 db 存
任何聚合数据**。前端 `useStats.js` 把结果存内存（`rawDaily`），切换 agent/天数时在内存 `applyFilter()` 过滤，
无需重新扫描。放弃缓存是刻意的——日志才是事实源，缓存换来的秒开不值得背上游标/幂等/膨胀的复杂度。

**异步不卡 UI**：`scanUsageLogs`/`_listJsonl`/`_parseLogFile` 全用 `fs.promises.*` 并逐文件 `await`，让出渲染
进程主线程。实测 ~180 文件约 1.4s，期间只转圈不冻结。

**「清除」= 记录时间戳，不删数据**：db 仅存一个 `cctoggle_stat_clearedAt` 文档 `{ claude: ms, codex: ms }`。
点清除写入当前时间戳（`all` 则两个都写）；扫描时 `timestamp <= clearedMs` 的条目被跳过，即隐藏该时间点之前的
历史。日志本身不动，清除不可撤销（无恢复入口）。

**扫描时机**：进入统计页自动扫一次 + 顶栏「刷新」按钮手动触发（`useStats.js` 的 `refresh()`）。

### Q: 为什么「关掉 uTools 面板后用 CLI，统计一直为空」？（架构陷阱）

A: 这是旧「代理采集」方案的根因，也是 uTools 多窗口架构的通用陷阱：

- 代理跑在 `createBrowserWindow` 起的**独立隐藏 daemon 窗口**里，通过 `utools.sendToParent(channel, data)` 上报。
- `sendToParent` 落地为**主窗口**的 `parent-message` 事件——**只有主 UI 窗口存活并注册了监听器时才有接收方**。
- 用户「开代理 → 关面板 → 用 CLI」时主窗口已销毁，daemon 照常转发（代理能用），但每个 `proxy-usage`
  事件无人接收、被直接丢弃 → 统计永远为空。

**教训**：任何需要「面板关闭后仍持续」的数据持久化，都不能依赖主窗口的 IPC 监听器。要么在 daemon 内直接写
`utools.db`（daemon 也能访问），要么改用不依赖运行时的数据源（如本次改成扫本地日志）。`proxy-stat` 只在
面板打开时才需要，所以这个坑平时看不出来。

A: 这类是 Codex 代理透传/转换的协议错配，排查顺序（详见 `references/architecture.md` 的 Codex 协议模型）：

1. **`missing tools.function`**：上游是 Responses 端点，却被当成 Chat Completions 转换了。
   检查供应商「上游协议」应选 **Responses 兼容**（`apiFormat=openai_responses`），而非 Chat Completions。
   判断依据是供应商文档声明的协议，不能靠域名猜（火山 `/api/plan/v3`=Responses、`/api/coding/v3`=Chat）。
2. **404 `.../v3/v1/responses`**：上游 baseUrl 自带路径段时，代理注入的伪前缀 `/v1` 未剥离。
   已在 `proxy-daemon.js` forward 处理（仅带路径段时剥 `/v1`）。
3. **400 `reasoning not supported`**：上游不支持 `reasoning` 参数。已由 forward 的自适应重试处理
   （剥离 reasoning 重试一次）。
4. **改配置后仍报错**：代理进程内存里的成员是启动时快照，改 provider 后必须**重启代理接管**
   才会重新下发 cfg（`switchProvider` 不会热更新正在运行的代理）。
5. **调试手段**：在 `proxy-daemon.js` forward 里临时 `appendFileSync` 落盘转发决策与上游响应体，
   定位后务必删除临时诊断代码。
