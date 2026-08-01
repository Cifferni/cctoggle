---
name: utools-cctoggle-dev
description: Development standards for the uTools CCToggle plugin - AI provider management, skill deployment, MCP, sessions, prompts
---

# uTools CCToggle 开发规范

## 项目定位

**CCToggle** 是一个 uTools 插件，用于统一管理 AI CLI 工具配置并一键切换 API 供应商。

### 核心功能
- 供应商管理：添加、编辑、删除和切换多个 AI API 供应商（80+ 内置预设）
- 代理路由：支持协议转换（OpenAI/Anthropic/Gemini）和多供应商负载均衡
- Skill 管理：部署、卸载和同步 AI Skills 到多个 Agent 目录
- 用量统计：追踪 API 调用量和 token 使用情况（热力图可视化）
- 会话管理：浏览、搜索、导出 Claude/Codex/OpenClaw 的历史会话
- 提示词管理：创建、编辑、关联和应用提示词模板
- MCP 服务器管理：添加、编辑、开关 MCP 服务器配置
- 主题系统：支持多主题切换（琥珀色、午夜蓝、深空黑）
- Agent 路径配置：自定义各 Agent 配置文件路径
- 项目目标管理：管理 Skill 部署的项目目标路径

### 支持的 Agent
| Agent | 配置类型 | 配置文件路径 |
|-------|----------|-------------|
| Codex | openai | `~/.codex/auth.json` + `~/.codex/config.toml` |
| Claude | anthropic | `~/.claude/settings.json` |
| Claude Desktop | anthropic | `~/.claude-desktop/config.json` |
| OpenClaw | openclaw | `~/.openclaw/openclaw.json` |
| Gemini | gemini | `~/.gemini/.env` |

---

## 技术栈

- **语言**: TypeScript 5.9+（前端 + 后端 preload）
- **前端**: Vue 3.5+ / Vite 6+ / Vue Router 4
- **UI**: Naive UI 2.44+ / @vicons/ionicons5 + 自定义 SVG
- **图表**: Chart.js 4 + vue-chartjs 5 + chartjs-chart-matrix（热力图）
- **Markdown**: marked 18+
- **样式**: Sass/SCSS / BEM 命名 / CSS 自定义属性
- **包管理**: pnpm / UTF-8 无 BOM
- **运行环境**: uTools 插件（preload 为 Node.js CommonJS，前端为浏览器环境）

---

## 命令

```bash
pnpm dev              # 启动开发服务器 (http://localhost:5173)
pnpm build            # 完整构建（preload + 前端类型检查 + Vite 打包）
pnpm build:preload    # 仅编译 preload TypeScript → public/preload/
pnpm type-check       # 仅前端类型检查（vue-tsc --noEmit）
pnpm preview          # 预览生产构建
```

---

## 目录结构

```
src/
├── components/          # 可复用 UI 组件（PascalCase, .vue）
├── composables/         # 业务逻辑（camelCase, use* 前缀, .ts）
├── views/               # 页面级组件（.vue）
├── data/                # 静态数据和预设（.ts）
├── themes/              # 主题系统（.ts）
├── types/               # TypeScript 类型定义
│   ├── utools-cctoggle.d.ts  # preload API 完整类型
│   └── env.d.ts              # 全局环境声明
├── preload/             # 后端源码（TypeScript, 编译输出到 public/preload/）
├── utils/               # 工具函数（.ts）
├── assets/images/agents/ # Agent SVG 图标
├── router/index.ts, setup.ts, App.vue, main.ts, style.css

public/preload/          # 后端编译产物（tsc 输出, .gitignore 排除）
├── services.js          # 入口：组装 window.utoolsCctoggle
├── package.json         # uTools preload 模块配置
├── proxy-daemon.html    # 代理守护进程页面
```

---

## 路由

```typescript
// router/index.ts — createMemoryHistory()
/              → ProviderListPage    # 主页
/skills        → SkillsPage          # Skill 管理
/prompts       → PromptsPage         # 提示词管理（懒加载）
/stats         → StatsPage           # 用量统计（懒加载）
/mcp           → McpPage             # MCP 管理（懒加载）
/sessions      → SessionPage         # 会话浏览（懒加载）
/settings      → SettingsPage（懒加载）
  /claude      → ClaudeSettings      # Claude 设置（默认子路由）
  /routes      → RoutesSettings      # 代理路由设置
  /storage     → StorageSettings     # 存储路径设置
```

**路由特性：**
- 使用 `createMemoryHistory()`（uTools 插件无需浏览器历史）
- 主页和 Skills 页面同步加载，其余页面懒加载（`() => import(...)`）
- `/settings` 默认重定向到 `/settings/claude`

---

## 编码规范

详见 → `references/code-style.md`

**关键要点：**
- `<script setup lang="ts">` + `defineProps`/`defineEmits`（泛型语法）
- 组件 PascalCase，composable camelCase + `use` 前缀，文件 `.ts`
- **禁止** `var`、`window.confirm/alert/prompt`、Options API
- 提示用 `appMessage`，确认用 `appDialog`（`useAppMessage.ts`）
- SCSS + BEM + CSS 变量，禁止 `!important` 和内联样式
- 导入路径不带 `.js` 后缀（Vite bundler 解析）

---

## 架构模式

详见 → `references/architecture.md`

**数据流：**
```
UI (Vue SFC) ↔ Composables (reactive) ↔ window.utoolsCctoggle (preload) ↔ 文件系统/uTools API
```

**后端模块（13 个 TypeScript 源码）：**
`services`(入口) + `utils` + `config-rw` + `provider-db` + `skills` + `stats` + `proxy`/`proxy-daemon`/`proxy-converter` + `mcp` + `sessions` + `prompts` + `cleanup`

源码在 `src/preload/`，`tsc` 编译输出到 `public/preload/`（CommonJS，可读 JS，不开压缩）。

**循环依赖**：`provider-db` ↔ `proxy`，通过懒加载 `require("./proxy")` 打破。

**安全访问**：前端通过 `getSkillNest()` 访问后端 API，返回类型为 `UtoolsCctoggle`。

---

## 共享常量

```typescript
// composables/shared.ts
APP_TYPES: AppType[]  = ["codex", "claude", "claude-desktop", "openclaw", "gemini"]
APP_LABELS: Record<string, string>  = { codex, claude, "claude-desktop": "Desktop", openclaw, gemini, all: "全部" }
APP_ICONS: Record<string, string>   = { codex: SVG, claude: SVG, ... }  // 从 assets/images/agents/ 导入
APP_OPTIONS = [{ value, label }]    // 用于下拉选择（不含 gemini）
```

### 工具函数
```typescript
// composables/shared.ts
getSkillNest(): UtoolsCctoggle  // 访问 window.utoolsCctoggle API（类型安全）
hasSkillNest(): boolean         // 检查 preload API 是否可用
toPlain<T>(v: T): T             // Vue 响应式代理 → 普通对象（避免 IPC 克隆错误）
```

---

## 安全规范

- API Key 用 `utools.dbCryptoStorage` 加密存储，`listProviders` 不返回明文
- 技能名称验证：禁止 `/`、`\`、`..`、`\0`
- 路径断言 `_assertInside(root, target)` 防目录穿越

---

## Git 规范

```
<type>(<scope>): <description>
```

type: `feat` / `fix` / `docs` / `style` / `refactor` / `test` / `chore`

scope: `codex` / `claude` / `claude-desktop` / `gemini` / `openclaw` / `proxy` / `skill` / `stats` / `session` / `mcp` / `prompt` / `theme` / `ui`

---

## 详细文档

- **前端详解** → `references/frontend.md`（组件、Composables、页面、消息提示）
- **后端详解** → `references/backend.md`（模块、API、数据存储、通信机制）
- **数据系统** → `references/data-system.md`（主题、预设、提示词模板、供应商元数据）
- **架构详解** → `references/architecture.md`（整体架构、配置文件、数据迁移）
- **代码风格** → `references/code-style.md`（编码规范、最佳实践）
- **常见问题** → `references/faq.md`（调试、扩展、数据存储）
