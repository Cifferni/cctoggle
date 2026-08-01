# 后端详解

## 模块概览

| 模块 | 文件 | 行数 | 职责 |
|------|------|------|------|
| services.js | 入口 | ~170 | 组装 window.utoolsCctoggle API |
| utils.js | 工具 | ~220 | 路径常量、文件操作、ID 生成 |
| config-rw.js | 配置读写 | ~500 | 各 Agent 配置文件读写 |
| provider-db.js | 供应商 | ~300 | 供应商 CRUD、切换、导入导出 |
| skills.js | Skill | ~500 | SkillNest 管理、部署、搜索 |
| stats.js | 统计 | ~180 | 用量统计（无缓存扫描） |
| proxy.js | 代理 | ~450 | 路由组、代理启停、接管/还原 |
| proxy-daemon.js | 代理守护 | ~700 | 后台代理进程 |
| proxy-converter.js | 协议转换 | ~500 | OpenAI/Anthropic/Gemini 协议转换 |
| mcp.js | MCP | ~400 | MCP Server 配置管理 |
| sessions.js | 会话 | ~800 | 会话扫描、详情加载 |
| prompts.js | 提示词 | ~300 | 提示词 CRUD、备份恢复 |
| cleanup.js | 清理 | ~130 | 数据迁移、MCP 映射清理 |

---

## utils.js - 工具函数

```javascript
// public/preload/utils.js

// ===== 路径常量 =====
getHomeDir()                    // 获取用户主目录
getCodexAuthPath()              // ~/.codex/auth.json
getCodexConfigPath()            // ~/.codex/config.toml
getClaudeSettingsPath()         // ~/.claude/settings.json
getGeminiEnvPath()              // ~/.gemini/.env
getOpenClawConfigPath()         // ~/.openclaw/openclaw.json
getClaudeDesktopConfigPath()    // %APPDATA%/Claude/claude_desktop_config.json

// ===== 提示词文件路径 =====
getClaudeMdPath()               // ~/.claude/CLAUDE.md
getCodexAgentsMdPath()          // ~/.codex/AGENTS.md
getGeminiMdPath()               // ~/.gemini/GEMINI.md
getOpenClawWorkspaceDir()       // ~/.openclaw/workspace-*/
getOpenClawAgentsMdPath()       // ~/.openclaw/workspace-*/AGENTS.md

// ===== Agent 路径管理 =====
getDefaultConfigDirs()          // 获取默认配置目录
getAgentConfigPath(appType)     // 获取 Agent 配置路径（支持自定义）
getAgentSessionPath(appType)    // 获取 Agent 会话路径

// ===== 工具函数 =====
expandHome(p)                   // 展开 ~ 为 home 目录
ensureDir(filePath)             // 确保目录存在
generateId()                    // 生成唯一 ID
copyDirSync(src, dest)          // 同步复制目录

// ===== Codex 配置 =====
CODEX_BASE_INSTRUCTIONS         // Codex 基础指令
getCodexInstructions()          // 获取 Codex 指令
```

**路径管理机制：**
- 优先从 `utools.dbStorage` 读取自定义路径
- 无自定义则使用默认路径（`~/.agent/`）
- `expandHome()` 支持 `~` 展开
- `getAgentConfigPath()` 是所有路径的统一入口

---

## config-rw.js - 配置文件读写

```javascript
// public/preload/config-rw.js

// ===== Codex 配置 =====
readCodexConfig()               // 读取 auth.json + config.toml
writeCodexConfig(auth, configToml) // 写入 Codex 配置
mergeCodexConfig(existing, incoming) // 合并 config.toml（保留未声明的键）

// ===== Claude 配置 =====
readClaudeSettings()            // 读取 settings.json
writeClaudeSettings(settings)   // 写入 settings.json

// ===== Claude Desktop 配置 =====
readClaudeDesktopConfig()       // 读取 claude_desktop_config.json
writeClaudeDesktopConfig(config) // 写入 claude_desktop_config.json

// ===== Gemini 配置 =====
readGeminiEnv()                 // 读取 .env 文件
writeGeminiEnv(env)             // 写入 .env 文件

// ===== OpenClaw 配置 =====
readOpenClawConfig()            // 读取 openclaw.json
writeOpenClawConfig(config)     // 写入 openclaw.json

// ===== 提示词读取 =====
readOriginalPrompt(agent)       // 读取 Agent 原始提示词
readAllOriginalPrompts()        // 读取所有 Agent 原始提示词

// ===== 当前配置 =====
getCurrentConfigs()             // 获取所有 Agent 当前配置
```

**Codex 配置合并逻辑：**
1. 解析现有 config.toml 为块（顶层键 + 表段）
2. 保留旧文件中本次未声明的顶层键
3. 用新内容替换本次声明的表段
4. 清除旧的 `model_providers.*` 表（避免残留）

---

## provider-db.js - 供应商管理

```javascript
// public/preload/provider-db.js

// ===== CRUD =====
listProviders(appType)          // 列出供应商（不含明文 apiKey）
getProvider(appType, id)        // 获取供应商详情（含明文 apiKey）
saveProvider(appType, data)     // 保存供应商（db + dbCryptoStorage）
deleteProvider(appType, id)     // 删除供应商（含清理路由组）

// ===== 切换 =====
switchProvider(appType, id)     // 切换供应商（写入配置文件）
getCurrentProviderId(appType)   // 获取当前供应商 ID
markCurrent(appType, id)        // 标记当前供应商
reapplyCurrent(appType)         // 重新应用当前供应商

// ===== 导入导出 =====
exportAllProviders()            // 导出所有供应商
importProviders(data)           // 导入供应商

// ===== 辅助 =====
setLastActiveApp(appType)       // 设置上次活跃 Agent
getLastActiveApp()              // 获取上次活跃 Agent
```

**数据存储：**
- 供应商数据：`utools.db`（PouchDB），键格式 `cctoggle_provider_{appType}_{id}`
- API Key：`utools.dbCryptoStorage`，键格式 `apikey_{appType}_{id}`
- 列表不返回明文，通过 `getProvider()` 单独读取

**切换流程：**
1. 读取供应商完整信息（含 apiKey）
2. 根据 configType 调用对应写入函数
3. 更新 isCurrent 标记
4. 返回成功/失败状态

---

## skills.js - Skill 管理

```javascript
// public/preload/skills.js

// ===== Nest 目录 =====
getNestDir()                    // 获取 Nest 目录路径
listNestSkills()                // 列出 Nest 中的 Skill
getNestSkillMeta(skillName)     // 获取 Skill 元数据
setNestSkillMeta(skillName, meta) // 设置 Skill 元数据

// ===== 部署注册表 =====
getDeployRegistry()             // 获取部署注册表
setDeployRegistry(reg)          // 设置部署注册表
listDeployments()               // 列出所有部署

// ===== 部署操作 =====
deploySkill(skillName, target)  // 部署 Skill 到目标
undeploySkill(skillName, target) // 取消部署
createLink(src, dest)           // 创建链接（junction/symlink/copy）

// ===== Skill 存储路径 =====
getSkillStoragePaths()          // 获取存储路径配置
setSkillStoragePaths(paths)     // 设置存储路径配置
getDefaultSkillDirs()           // 获取默认存储目录

// ===== 项目目标 =====
listProjectTargets()            // 列出项目目标
addProjectTarget(path, label)   // 添加项目目标
removeProjectTarget(id)         // 移除项目目标

// ===== Skill 仓库 =====
getSkillRepos()                 // 获取仓库列表
addSkillRepo(url, branch)       // 添加仓库
removeSkillRepo(url)            // 移除仓库
syncSkills(source, targets)     // 同步 Skill

// ===== Skill 搜索安装 =====
searchSkills(query)             // 搜索 Skill（远程仓库）
installSkill(skillName)         // 安装 Skill
removeNestSkill(skillName)      // 从 Nest 移除 Skill
```

**部署机制：**
- **symlink**：Windows 用 junction（免特权），Unix 用 dir symlink
- **copy**：跨盘时自动降级为复制模式
- 部署注册表存储在 `utools.dbStorage` 的 `ccswitch_nest_registry` 键

**安全验证：**
- `_safeSkillName()`：禁止 `/`、`\`、`..`、`\0`
- `_assertInside()`：防止目录穿越

---

## stats.js - 用量统计

```javascript
// public/preload/stats.js

// ===== 核心函数 =====
scanUsageLogs()                 // 扫描本地日志（异步，无缓存）
clearStats(appType)             // 清除统计（记录时间戳）

// ===== 内部函数 =====
_statDayKey(d)                  // 日期格式化 YYYY-MM-DD
_emptyBucket()                  // 空统计桶
_dayFromTs(ts)                  // 时间戳转日期
_getClearedAt()                 // 获取清除时间戳
_listJsonl(dir, out)            // 递归列出 .jsonl 文件
_parseLogFile(file, appType, clearedMs, acc) // 解析单个日志文件
```

**数据源：**
- Claude Code：`~/.claude/projects/**/*.jsonl`
  - `type: "assistant"` 行的 `message.usage`（单次增量）
  - `message.model` 归因模型
- Codex：`~/.codex/sessions/**/*.jsonl`
  - `token_count` 事件的 `last_token_usage`（增量）
  - `turn_context.payload.model` 归因模型
  - **禁止用 `total_token_usage`（累计值，会翻倍）**

**无缓存架构：**
- 每次直接扫描日志文件
- 异步 fs.promises 不卡 UI
- 实测 ~180 文件约 1.4s

**清除机制：**
- db 仅存 `cctoggle_stat_clearedAt` 文档
- 点清除写入当前时间戳
- 扫描时 `timestamp <= clearedMs` 的条目跳过

---

## proxy.js - 代理管理

```javascript
// public/preload/proxy.js

// ===== 路由组 CRUD =====
listRouteGroups(appType)        // 列出路由组
getRouteGroup(appType, id)      // 获取路由组
saveRouteGroup(group)           // 保存路由组
deleteRouteGroup(appType, id)   // 删除路由组

// ===== 代理启停 =====
startProxy(appType, groupId)    // 启动代理
stopProxy(appType)              // 停止代理
getProxyStatus(appType)         // 获取代理状态
reconcileProxies()              // 对账：领养孤儿代理

// ===== 接管/还原 =====
takeoverApp(appType, port)      // 接管 Agent 配置
restoreApp(appType)             // 还原 Agent 配置

// ===== 快捷操作 =====
toggleProxyQuick(appType)       // 快捷切换代理

// ===== 端口管理 =====
getProxyPort(appType)           // 获取代理端口
setProxyPort(appType, port)     // 设置代理端口

// ===== 事件监听 =====
onProxyEvent(callback)          // 监听代理事件
```

**代理架构：**
- 每个 Agent 独立的 daemon 窗口
- `utools.createBrowserWindow()` 创建隐藏窗口
- 通过 `webContents.send("cfg")` 传递配置
- `proxyRuntime` 存储运行时状态

**路由组配置：**
```javascript
{
  name: "未命名路由组",
  listenPort: 8788,
  strategy: "failover",  // failover / round-robin / weighted
  members: [{ providerId, weight, priority }],
  health: { intervalMs: 30000, timeoutMs: 5000, path: "/models" },
  breaker: { failThreshold: 3, cooldownMs: 60000, halfOpenProbe: 1 },
  timeoutMs: 30000,
  authToken: "utct-xxx",
}
```

**接管机制：**
1. 备份原始配置到 `cctoggle_route_backup`
2. 写入代理地址到 Agent 配置
3. 启动 daemon 监听
4. `restoreApp()` 从备份还原

---

## mcp.js - MCP 管理

```javascript
// public/preload/mcp.js

// ===== CRUD =====
listMcpServers()                // 列出所有 MCP 服务器
getMcpServer(id)                // 获取 MCP 服务器
saveMcpServer(data)             // 保存 MCP 服务器
deleteMcpServer(id)             // 删除 MCP 服务器
toggleMcpServer(id)             // 切换启用/禁用

// ===== 配置同步 =====
syncFromConfigFiles()           // 从配置文件同步
```

**数据存储：**
- db 映射：`cctoggle_mcp_apps`（存储各 Agent 关联的 MCP 名称）
- 配置文件：实际 MCP 配置在各 Agent 配置文件中
- `disabled` 数组：存储禁用的 MCP 名称

**配置文件路径：**
```javascript
CONFIG_PATHS = {
  claude: () => ~/.claude.json,
  "claude-desktop": () => %APPDATA%/Claude/claude_desktop_config.json,
  codex: () => ~/.codex/config.toml,
  openclaw: () => ~/.openclaw/openclaw.json,
}
```

---

## sessions.js - 会话管理

```javascript
// public/preload/sessions.js

// ===== 扫描 =====
scanSessions(appType, options)  // 扫描会话（分页、搜索、排序）
loadSessionDetail(filePath)     // 加载会话详情

// ===== 操作 =====
deleteSession(filePath)         // 删除会话
clearAllSessions(filePaths)     // 批量清空会话
clearSessionCache()             // 清理会话缓存
```

**扫描优化：**
- 大文件只读头尾（4KB），提取元数据
- 消息数估算：头尾各数一遍
- 扫描缓存：30秒 TTL
- 会话详情缓存：按需加载

**会话元数据：**
```javascript
{
  id: "session_id",
  title: "会话标题",
  app: "claude",
  filePath: "/path/to/session.jsonl",
  projectPath: "/path/to/project",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  messageCount: 100,
  tokenUsage: 50000,
  lastModel: "claude-sonnet-4-20250514",
}
```

**支持的 Agent：**
- Claude：`~/.claude/projects/**/sessions/*.jsonl`
- Claude Desktop：`~/.claude-desktop/projects/**/sessions/*.jsonl`
- Codex：`~/.codex/sessions/**/*.jsonl`
- OpenClaw：`~/.openclaw/sessions/**/*.jsonl`

---

## prompts.js - 提示词管理

```javascript
// public/preload/prompts.js

// ===== CRUD =====
listPrompts()                   // 列出所有提示词
getPrompt(id)                   // 获取提示词
savePrompt(data)                // 保存提示词
deletePrompt(id)                // 删除提示词
duplicatePrompt(id)             // 复制提示词

// ===== 导入导出 =====
exportPrompts()                 // 导出为 JSON
importPrompts(jsonString)       // 从 JSON 导入

// ===== Agent 关联 =====
togglePromptAgent(promptId, agent) // 切换关联状态
applyPromptToAgent(promptId, agent) // 应用到 Agent

// ===== 备份恢复 =====
backupOriginalPrompts()         // 备份原始提示词
backupSelectedPrompts(agents)   // 备份选中 Agent
getBackups()                    // 获取备份列表
restoreOriginalPrompt(agent)    // 恢复单个 Agent
restoreAllOriginalPrompts()     // 恢复所有 Agent

// ===== 原始提示词 =====
readOriginalPrompt(agent)       // 读取 Agent 原始提示词
readAllOriginalPrompts()        // 读取所有 Agent 原始提示词
```

**数据存储：**
- 提示词数据：`utools.db` 的 `cctoggle_prompts` 键
- 备份数据：`utools.db` 的 `cctoggle_prompts_backup` 键
- 深拷贝确保纯 JSON 对象

**提示词结构：**
```javascript
{
  id: "prompt_xxx",
  name: "提示词名称",
  description: "描述",
  content: "内容",
  agents: ["codex", "claude"],
  variables: ["variable1"],
  tags: ["标签"],
  isTemplate: false,
  templateId: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
}
```

**应用流程：**
1. 读取提示词内容
2. 读取 Agent 原始提示词
3. 备份原始提示词
4. 将提示词写入 Agent 配置文件
5. 更新关联状态

---

## cleanup.js - 数据清理

```javascript
// public/preload/cleanup.js

// ===== MCP 清理 =====
cleanMcpMapping(mapping, configs, allApps) // 清理残留 MCP 映射

// ===== 数据迁移 =====
migrateAgentPaths()             // 迁移 Agent 路径配置
getMigrationVersion()           // 获取迁移版本
```

**迁移逻辑：**
- V2 迁移：将旧的 `ccswitch_skill_paths` 合并到 `ccswitch_config_paths`
- 从 skill 路径推导出 agent 路径
- 合并独立的 `ccswitch_session_paths` 配置
- 幂等执行，已迁移则跳过

**清理逻辑：**
- 检查 mapping 中的 MCP 名称是否在配置文件中存在
- 保留禁用列表中的条目
- 移除所有配置文件中都找不到的残留条目

---

## 前后端通信机制

### 通信架构
```
前端 (浏览器环境)                    后端 (Node.js 环境)
┌─────────────────┐                ┌─────────────────┐
│   Vue 3 App     │                │   preload/      │
│   composables   │◀── window ───▶│   services.js   │
│   components    │   .utoolsCctoggle                 │
└─────────────────┘                └─────────────────┘
```

### 实现方式
1. **后端暴露 API**：`services.js` 组装所有模块函数到 `window.utoolsCctoggle`
2. **前端安全访问**：`getSkillNest()` 提供 fallback stubs
3. **IPC 通信**：uTools 内部机制，通过 `window` 对象桥接

### 代码示例
```javascript
// 后端 (services.js)
window.utoolsCctoggle = {
  listProviders: providerDb.listProviders,
  switchProvider: providerDb.switchProvider,
  // ... 更多 API
};

// 前端 (composables/shared.js)
export function getSkillNest() {
  return window.utoolsCctoggle || {
    listProviders: () => [],
    switchProvider: () => ({ success: false, error: "not in uTools" }),
    // ... fallback stubs
  };
}

// 前端使用
const providers = getSkillNest().listProviders(appType);
```

### 注意事项
- 前端不能直接访问 Node.js API（fs、path 等）
- 后端不能直接访问 Vue 响应式数据
- 需要 `toPlain()` 将 Vue 代理转为普通对象
- uTools 插件重启后 preload 缓存会失效

---

## 数据存储方式

### 1. utools.db（PouchDB）
```javascript
// 存储结构化数据
utools.db.put({ _id: "key", data: value });
utools.db.get("key");
utools.db.allDocs("prefix_");  // 前缀查询

// 用于：供应商、路由组、统计清除时间戳
// 特点：支持文档版本（_rev）、前缀查询
```

### 2. utools.dbCryptoStorage
```javascript
// 加密存储敏感数据
utools.dbCryptoStorage.setItem("key", value);
utools.dbCryptoStorage.getItem("key");
utools.dbCryptoStorage.removeItem("key");

// 用于：API Key
// 特点：加密存储，getItem 返回明文
```

### 3. utools.dbStorage
```javascript
// 普通键值存储
utools.dbStorage.setItem("key", value);
utools.dbStorage.getItem("key");
utools.dbStorage.removeItem("key");

// 用于：配置、设置、MCP 映射、提示词、会话缓存
// 特点：JSON 序列化，简单易用
```

### 数据库键命名规范
```
cctoggle_provider_{appType}_{providerId}  # 供应商
cctoggle_route_{appType}_{routeId}        # 路由组
cctoggle_stat_clearedAt                   # 统计清除时间戳
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
