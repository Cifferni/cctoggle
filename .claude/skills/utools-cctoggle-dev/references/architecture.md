# 项目架构详解

## 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                       uTools 插件容器                            │
├─────────────────────────────────────────────────────────────────┤
│  前端 (浏览器环境)                │  后端 (Node.js 环境)          │
│  ┌─────────────────────────┐     │  ┌─────────────────────────┐ │
│  │      Vue 3 App          │     │  │   preload/ (13 模块)    │ │
│  │  ┌───────────────────┐  │     │  │  ┌─────────────────┐   │ │
│  │  │    Router          │  │     │  │  │  services.js    │   │ │
│  │  │  /                 │  │     │  │  │  (入口, 组装 API)│   │ │
│  │  │  /skills           │  │     │  │  │  ├─ provider-db │   │ │
│  │  │  /prompts          │  │     │  │  │  ├─ config-rw   │   │ │
│  │  │  /stats            │  │     │  │  │  ├─ proxy       │   │ │
│  │  │  /mcp              │  │     │  │  │  ├─ skills      │   │ │
│  │  │  /sessions         │  │     │  │  │  ├─ stats       │   │ │
│  │  │  /settings         │  │     │  │  │  ├─ mcp         │   │ │
│  │  └───────────────────┘  │     │  │  │  ├─ sessions     │   │ │
│  │  ┌───────────────────┐  │     │  │  │  ├─ prompts      │   │ │
│  │  │   Composables     │  │◀───▶│  │  │  └─ cleanup      │   │ │
│  │  │  useProviders     │  │ IPC │  │  │                    │   │ │
│  │  │  useRoutes        │  │     │  │  │ window.utoolsCctoggle│  │ │
│  │  │  useSkills        │  │     │  │  └─────────────────┘   │ │
│  │  │  useStats         │  │     │  │                         │ │
│  │  │  useSession       │  │     │  └─────────────────────────┘ │
│  │  │  useMcp           │  │     │              │               │
│  │  │  usePrompts       │  │     │              ▼               │
│  │  │  useTheme         │  │     │  ┌─────────────────────────┐ │
│  │  └───────────────────┘  │     │  │     uTools API          │ │
│  │  ┌───────────────────┐  │     │  │  utools.db (PouchDB)    │ │
│  │  │   Components      │  │     │  │  utools.dbCryptoStorage │ │
│  │  │  ProviderCard     │  │     │  │  utools.dbStorage       │ │
│  │  │  ProviderForm     │  │     │  │  utools.getPath()       │ │
│  │  │  TabBar           │  │     │  │  utools.createBrowserWindow│ │
│  │  │  SessionCard      │  │     │  └─────────────────────────┘ │
│  │  │  PromptCard       │  │     │                               │
│  │  │  McpCard          │  │     │                               │
│  │  └───────────────────┘  │     │                               │
│  └─────────────────────────┘     │                               │
└─────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                          ┌───────────────────────┐
                          │    文件系统            │
                          │  ~/.codex/             │
                          │  ~/.claude/            │
                          │  ~/.claude-desktop/    │
                          │  ~/.openclaw/          │
                          │  ~/.gemini/            │
                          │  ~/.cctoggle/          │
                          └───────────────────────┘
```

---

## 数据存储

### uTools 存储 API

| API | 用途 | 特点 |
|-----|------|------|
| `utools.db` | 供应商、路由组、统计清除时间戳 | PouchDB，支持 allDocs 前缀查询 |
| `utools.dbCryptoStorage` | API Key | 加密存储，getItem/setItem |
| `utools.dbStorage` | 配置、设置、MCP、提示词、会话 | 普通存储，JSON 序列化 |

### 数据库键命名

```
cctoggle_provider_<appType>_<providerId>  # 供应商
cctoggle_route_<appType>_<routeId>        # 路由组
cctoggle_stat_clearedAt                   # 统计清除时间戳 { claude: ms, codex: ms }
cctoggle_route_port                       # 端口配置
cctoggle_route_backup                     # 切换前备份
cctoggle_last_active_app                  # 上次活跃 Agent
ccswitch_skill_paths                      # Skill 存储路径
ccswitch_skill_repos                      # Skill 仓库
ccswitch_sync_mode                        # 同步模式
ccswitch_nest_registry                    # 部署注册表
ccswitch_project_targets                  # 项目目标
ccswitch_config_paths                     # Agent 配置路径
```

---

## 核心模块概览

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
provider-db.js / config-rw.js (preload)
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
    ├─ ~/.claude-desktop/config.json
    ├─ ~/.openclaw/openclaw.json
    └─ ~/.gemini/.env
```

### 2. 代理路由

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
    └─ 返回响应（发 proxy-usage 事件，仅供面板实时提示；统计不依赖它，见「用量统计」）
```

### 3. Skill 管理

**存储结构：**
```
~/.cctoggle/skills/            # Nest 目录（中央仓库）
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

### 4. 用量统计

**数据源为本地 CLI 会话日志，且无缓存**（每次直接扫描；旧的代理事件采集在关面板后会丢数据，已废弃）：

```
~/.claude/projects/**/*.jsonl        # assistant 行 message.usage（增量）+ message.model
~/.codex/sessions/**/rollout-*.jsonl # token_count 事件 last_token_usage（增量，勿用 total_token_usage）
                                     # model 取自 turn_context.payload.model
    │
    ▼ scanUsageLogs()  ← 进页自动 + 「刷新」按钮触发；异步 fs.promises 不卡 UI
每次全量扫描 → 聚合 → 返回 { daily: [{ appType, day, ...6字段, models }] }（不写 db）
    │
    ▼ useStats.js 存内存 rawDaily；切换 agent/天数在内存 applyFilter() 过滤
StatsPage 渲染 totals / daily / models / 热力图
```

- **不缓存**：db 不存聚合数据，避免游标/幂等/单文档膨胀等复杂度。代价是每次扫描 ~1.4s（异步不卡）。
- **「清除」= 记录时间戳**：`clearStats(appType)` 把当前时间写入 `cctoggle_stat_clearedAt` 的对应 agent 字段
  （`all` 则写两个）。扫描时 `timestamp <= clearedMs` 的条目跳过，隐藏历史。日志不动，不可撤销。

### 5. 会话管理

**功能：**
- 分页加载 + 无限滚动（每页 20 条）
- 搜索和排序（按时间、名称、今日活跃）
- 导出会话为 Markdown 或 JSON
- 删除单个会话或批量清空

### 6. 提示词管理

**功能：**
- 创建/编辑/复制/删除提示词模板
- 将提示词关联到指定 Agent（Codex、Claude、Gemini、OpenClaw）
- 一键应用提示词到 Agent 配置文件
- 备份和恢复 Agent 的原始提示词
- JSON 格式导入/导出
- Markdown 渲染预览

### 7. MCP 服务器管理

**功能：**
- 列表展示、添加、编辑、删除 MCP 服务器
- 开关启用/禁用
- 从 Agent 配置文件同步 MCP 配置

---

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

---

## Agent 路径配置

### 配置存储
```javascript
// public/preload/services.js
getConfigPaths: function() {
  return utools.dbStorage.getItem("ccswitch_config_paths") || {};
},
setConfigPaths: function(paths) {
  utools.dbStorage.setItem("ccswitch_config_paths", paths);
},
```

### 默认路径
```javascript
// public/preload/utils.js
getDefaultConfigDirs() {
  return {
    codex: { auth: "~/.codex/auth.json", config: "~/.codex/config.toml" },
    claude: { settings: "~/.claude/settings.json" },
    "claude-desktop": { config: "~/.claude-desktop/config.json" },
    openclaw: { config: "~/.openclaw/openclaw.json" },
    gemini: { env: "~/.gemini/.env" },
  };
}
```

### 数据迁移
```javascript
// public/preload/cleanup.js
MIGRATION_VERSION = 2
MIGRATION_KEY = "ccswitch_migration_version"

// V2 迁移：将旧的 skill_paths 合并到 config_paths
function migrateAgentPaths() {
  // 1. 检查迁移版本
  // 2. 读取旧的 ccswitch_skill_paths
  // 3. 从 skill 路径推导出 agent 路径
  // 4. 合并到 ccswitch_config_paths
  // 5. 更新迁移版本
}
```

**迁移逻辑：**
- 启动时自动执行（`services.js`）
- 从旧的 `ccswitch_skill_paths` 推导出 agent 配置路径
- 合并独立的 `ccswitch_session_paths` 配置
- 幂等执行，已迁移则跳过

---

## 详细文档

- **前端详解** → `references/frontend.md`（组件、Composables、页面、消息提示）
- **后端详解** → `references/backend.md`（模块、API、数据存储、通信机制）
- **数据系统** → `references/data-system.md`（主题、预设、提示词模板、供应商元数据）
- **代码风格** → `references/code-style.md`（编码规范、最佳实践）
- **常见问题** → `references/faq.md`（调试、扩展、数据存储）
