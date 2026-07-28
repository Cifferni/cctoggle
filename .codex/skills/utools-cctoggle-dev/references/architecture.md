# 项目架构详解

## 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      uTools 插件容器                         │
├─────────────────────────────────────────────────────────────┤
│  前端 (浏览器环境)              │  后端 (Node.js 环境)        │
│  ┌───────────────────────┐     │  ┌───────────────────────┐ │
│  │      Vue 3 App        │     │  │   preload/services.js │ │
│  │  ┌─────────────────┐  │     │  │  ┌─────────────────┐  │ │
│  │  │    Router        │  │     │  │  │  Provider CRUD  │  │ │
│  │  │  /               │  │     │  │  │  Config R/W     │  │ │
│  │  │  /skills         │  │     │  │  │  Proxy Control  │  │ │
│  │  │  /stats          │  │     │  │  │  Skill Deploy   │  │ │
│  │  │  /settings       │  │     │  │  │  Usage Stats    │  │ │
│  │  └─────────────────┘  │     │  │  └─────────────────┘  │ │
│  │  ┌─────────────────┐  │     │  │                       │ │
│  │  │   Composables   │  │◀───▶│  │  window.utoolsCctoggle│ │
│  │  │  useProviders   │  │ IPC │  └───────────────────────┘ │
│  │  │  useRoutes      │  │     │            │               │
│  │  │  useSkills      │  │     │            ▼               │
│  │  │  useStats       │  │     │  ┌───────────────────────┐ │
│  │  └─────────────────┘  │     │  │     uTools API        │ │
│  │  ┌─────────────────┐  │     │  │  utools.db (PouchDB)  │ │
│  │  │   Components    │  │     │  │  utools.dbCryptoStorage│ │
│  │  │  ProviderCard   │  │     │  │  utools.dbStorage     │ │
│  │  │  ProviderForm   │  │     │  │  utools.getPath()     │ │
│  │  │  TabBar         │  │     │  │  utools.createBrowserWindow │ │
│  │  └─────────────────┘  │     │  └───────────────────────┘ │
│  └───────────────────────┘     │                            │
└─────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                          ┌───────────────────────┐
                          │    文件系统            │
                          │  ~/.codex/             │
                          │  ~/.claude/            │
                          │  ~/.openclaw/          │
                          │  ~/.gemini/            │
                          │  ~/.skillnest/         │
                          └───────────────────────┘
```

## 数据存储

### uTools 存储 API

| API | 用途 | 特点 |
|-----|------|------|
| `utools.db` | 供应商、路由组、统计 | PouchDB，支持 allDocs 前缀查询 |
| `utools.dbCryptoStorage` | API Key | 加密存储， getItem/setItem |
| `utools.dbStorage` | 配置、设置 | 普通存储，JSON 序列化 |

### 数据库键命名

```
cctoggle_provider_<appType>_<providerId>  # 供应商
cctoggle_route_<appType>_<routeId>        # 路由组
cctoggle_stat_<appType>_<YYYY-MM-DD>     # 每日统计
cctoggle_route_port                       # 端口配置
cctoggle_route_backup                     # 切换前备份
cctoggle_last_active_app                  # 上次活跃 Agent
ccswitch_skill_paths                      # Skill 存储路径
ccswitch_skill_repos                      # Skill 仓库
ccswitch_sync_mode                        # 同步模式
ccswitch_nest_registry                    # 部署注册表
ccswitch_project_targets                  # 项目目标
```

## 核心模块

### 1. Provider 管理

**数据流：**
```
UI (ProviderCard/ProviderForm)
    │
    ▼
useProviders.js
    │
    ├─ loadProviders()  ──▶ getSkillNest().listProviders(appType)
    ├─ switchProvider() ──▶ getSkillNest().switchProvider(appType, id)
    ├─ saveProvider()   ──▶ getSkillNest().saveProvider(appType, data)
    └─ deleteProvider() ──▶ getSkillNest().deleteProvider(appType, id)
    │
    ▼
services.js (preload)
    │
    ├─ listProviders()   ──▶ utools.db.allDocs(prefix)
    ├─ getProvider()     ──▶ utools.db.get(key) + dbCryptoStorage
    ├─ saveProvider()    ──▶ utools.db.put(doc) + dbCryptoStorage
    └─ switchProvider()  ──▶ writeXxxConfig() + markCurrent()
    │
    ▼
文件系统
    ├─ ~/.codex/auth.json + config.toml
    ├─ ~/.claude/settings.json
    ├─ ~/.openclaw/openclaw.json
    └─ ~/.gemini/.env
```

### 2. 代理路由

**组件：**
- `RoutesSection.vue` - 路由组 UI
- `useRoutes.js` - 路由状态管理
- `proxy-daemon.js` - 后台代理进程
- `proxy-converter.js` - 协议转换

**代理模式：**
```
Agent (Codex/Claude/Gemini)
    │
    ▼ (请求)
utoolsCctoggle-proxy (127.0.0.1:8788)
    │
    ├─ 校验 authToken
    ├─ 选择成员 (failover/round-robin/weighted)
    ├─ 协议转换 (如需要)
    │   ├─ OpenAI Responses → Chat Completions
    │   ├─ Anthropic Messages → OpenAI Chat
    │   └─ ...
    ├─ 转发请求到上游供应商
    └─ 返回响应 + 记录用量
```

**Codex 协议模型（apiFormat / wireApi）：**

Codex 客户端只会发 Responses API 请求。供应商能否接收，取决于其真实协议：

| apiFormat | 代理行为 | wireApi | 典型上游 |
|---|---|---|---|
| `""` / `openai_responses` | 透传（不转换） | `responses` | OpenAI 官方、火山 `/api/plan/v3`、豆包、grok、minimax |
| `openai_chat` | Responses → Chat Completions | `chat` | DeepSeek、通义、Kimi、智谱、硅基流动 |
| `anthropic` | Responses → Anthropic Messages | `responses` | Anthropic 协议网关 |

- 表单层已合并为单一「上游协议」下拉（`ProviderForm.vue` 的 `codexProtocol` + `PROTOCOL_FIELDS`），
  底层仍存 `apiFormat` + `wireApi` 双字段：`apiFormat` 供代理转换用，`wireApi` 写入 config.toml。
- **两字段从不同时生效**：直连只看 `wireApi`；走代理接管时 takeover 用虚拟 provider 强制
  `wire_api=responses`（services.js），忽略成员的 `wireApi`，只有 `apiFormat` 决定是否转换。
- 选错协议是协议错配报错的根源，选择标准是**看供应商文档声明的 API 协议**，不能靠域名一刀切
  （同一域名可能多端点多协议，如火山 `/api/plan/v3`=Responses、`/api/coding/v3`=Chat）。

**透传兼容处理（`proxy-daemon.js` forward）：**

代理写入 Codex config 时给 base_url 注入伪前缀 `/v1`，透传到自带路径段的上游需特殊处理：
- **剥 `/v1`**：仅当上游 baseUrl 带路径段时剥（如火山 `/api/plan/v3` → `/api/plan/v3/responses`，
  否则拼成 `/api/plan/v3/v1/responses` 而 404）。纯域名上游保留标准 `/v1/responses`。
- **reasoning 自适应重试**：部分 Responses 上游（火山 `ark-code-latest`）不支持 `reasoning` 参数
  返回 400；捕获后剥离 `reasoning` 重试一次。官方支持 reasoning 的端点不触发，功能不退化。

### 3. Skill 管理

**存储结构：**
```
~/.skillnest/skills/           # Nest 目录（中央仓库）
├── skill-a/
│   ├── SKILL.md
│   └── meta.json
└── skill-b/
    └── SKILL.md

~/.codex/skills/               # Agent 目录（部署目标）
~/.claude/skills/
~/.gemini/skills/
```

**部署模式：**
- `symlink` - 符号链接/Junction（推荐，节省空间）
- `copy` - 复制文件（跨盘时自动使用）

## 路由配置

```javascript
// src/router/index.js
const routes = [
  { path: "/", component: ProviderListPage },           // 主页
  { path: "/skills", component: SkillsPage },           // Skill 管理
  { path: "/stats", component: StatsPage },             // 用量统计
  {
    path: "/settings",
    component: SettingsPage,
    children: [
      { path: "routes", component: RoutesSettings },    // 代理路由设置
      { path: "storage", component: StorageSettings },  // 存储路径设置
    ]
  }
];
```

使用 `createMemoryHistory()`，因为 uTools 插件不支持 URL hash。

## 状态管理

### 全局状态

```javascript
// composables/shared.js
export const APP_TYPES = ["codex", "claude", "openclaw", "gemini"];

export const APP_LABELS = {
  codex: "Codex",
  claude: "Claude",
  openclaw: "OpenClaw",
  gemini: "Gemini",
};

export const APP_ICONS = {
  codex: "⚡",
  claude: "🧠",
  openclaw: "🐾",
  gemini: "💎",
};
```

### 响应式状态

```javascript
// composables/useProviders.js
const providers = ref([]);
const _activeTab = ref("codex");

// composables/useRoutes.js
const runtime = reactive({
  codex: _emptyRt(),
  claude: _emptyRt(),
  gemini: _emptyRt(),
});
```

## 配置文件格式

### Codex config.toml

```toml
model_provider = "custom"
model = "gpt-5.4"
model_reasoning_effort = "high"
disable_response_storage = true
model_catalog_json = "utoolscctoggle-model-catalog.json"

[model_providers.custom]
name = "custom"
base_url = "https://api.example.com/v1"
wire_api = "responses"
requires_openai_auth = false
```

### Claude settings.json

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.example.com",
    "ANTHROPIC_MODEL": "claude-sonnet-4-20250514",
    "ANTHROPIC_AUTH_TOKEN": "sk-xxx"
  }
}
```

### Gemini .env

```
GOOGLE_GEMINI_BASE_URL=https://api.example.com
GEMINI_MODEL=gemini-2.5-pro
GEMINI_API_KEY=xxx
```
