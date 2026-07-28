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
│   └── ToastHost.vue        # 通知提示容器
├── composables/         # 状态管理与业务逻辑（camelCase, use* 前缀）
│   ├── useProviders.js      # 供应商 CRUD + 切换
│   ├── useRoutes.js         # 代理路由管理
│   ├── useSkills.js         # Skill 管理
│   ├── useStats.js          # 用量统计
│   ├── useToast.js          # 通知提示
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
├── router/index.js      # Vue Router 配置（memory history）
├── setup.js             # uTools 动态命令注册
├── App.vue              # 根组件
├── main.js              # 入口文件
└── style.css            # 全局 CSS 变量

public/
├── preload/
│   ├── services.js          # 后端服务（Node.js, 1800+ 行）
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
- 优先 `const`，其次 `let`，**禁止 `var`**（`public/preload/services.js` 除外，因其运行在 Node.js 环境且为历史代码）
- 使用箭头函数作为回调
- 使用模板字符串替代字符串拼接
- 文件编码：**UTF-8 无 BOM**

#### Vue 组件
- 使用 `<script setup>` 语法
- 使用 `defineProps()` 定义 props（对象形式声明类型）
- 使用 `defineEmits()` 定义 emits
- 组件命名：**PascalCase**（如 `ProviderCard.vue`）
- Composable 命名：**camelCase**，以 `use` 前缀（如 `useProviders.js`）

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
```

---

### CSS

#### 命名规范
- 使用 BEM 风格：`.block__element--modifier`
- 类名使用 kebab-case

#### CSS 变量（定义在 style.css）

```css
:root {
  --bg: #ffffff;
  --bg-card: #f8fafc;
  --bg-hover: #f1f5f9;
  --text: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --primary: #3b82f6;
  --primary-hover: #2563eb;
  --primary-light: #eff6ff;
  --danger: #ef4444;
  --danger-light: #fef2f2;
  --border: #e2e8f0;
  --radius: 8px;
  --radius-lg: 12px;
}

.dark {
  --bg: #0f0f1a;
  --bg-card: #1a1a2e;
  --bg-hover: #252540;
  --text: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --border: #334155;
}
```

---

## 架构模式

### 数据流

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────────┐
│   UI 组件    │────▶│  Composables │────▶│ window.utoolsCctoggle   │
│  (Vue SFC)  │◀────│ (reactive)   │◀────│  (preload services.js)  │
└─────────────┘     └──────────────┘     └─────────────────────────┘
                           │                        │
                           ▼                        ▼
                    ┌──────────────┐     ┌─────────────────────────┐
                    │ 响应式状态    │     │  uTools API / 文件系统   │
                    │ ref/reactive │     │  utools.db (PouchDB)    │
                    └──────────────┘     └─────────────────────────┘
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

后端服务通过 `window.utoolsCctoggle` 暴露 API（定义在 `public/preload/services.js`）：

```javascript
window.utoolsCctoggle = {
  // 供应商管理
  listProviders, getProvider, saveProvider, deleteProvider,
  switchProvider, getCurrentProviderId, reapplyCurrent,

  // 代理路由
  startProxy, stopProxy, getProxyStatus, toggleProxyQuick,
  takeoverApp, restoreApp,

  // Skill 管理
  listNestSkills, deploySkill, undeploySkill, installSkill,

  // 统计
  getStats, clearStats,

  // 配置读取
  readCodexConfig, readClaudeSettings, readGeminiEnv,
};
```

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
3. 在 `public/preload/services.js` 中实现配置读写逻辑
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

A: 在 uTools 开发者工具中，preload 脚本的 `console.log` 输出会显示在开发者工具的控制台中。

### Q: Codex 走代理报 `missing tools.function` / 404 / `reasoning not supported` 怎么排查？

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
