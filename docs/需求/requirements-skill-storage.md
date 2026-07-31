# Agent 路径配置整合需求

## 背景

当前系统中存在多个硬编码的路径配置，需要统一管理：

1. **Skill 存储**：`SkillStorageSection.vue` 未使用，`StorageSettings.vue` 已有设置
2. **SkillNest 目录**：硬编码为 `~/.skillnest/skills`
3. **MCP 配置文件**：硬编码（如 `~/.claude.json`、`~/.codex/config.toml`）
4. **会话存储路径**：硬编码（如 `~/.claude/projects`、`~/.codex/sessions`）

**当前问题**：
- 所有路径都是硬编码的，无法配置
- 应该让所有路径跟随 agent 配置，统一管理

## 需求目标

1. 将 Skill 存储路径设置整合到通用存储设置页面
2. 添加 Agent 配置路径设置功能
3. **让安装 skill 的目录跟随 agent 配置**
4. **让 MCP 配置文件路径跟随 agent 配置**
5. **让会话存储路径跟随 agent 配置**
6. **让统计数据路径跟随 agent 配置**
7. **让 Provider 切换的配置文件路径跟随 agent 配置**
8. **让提示词文件路径跟随 agent 配置**

## 具体需求

### 1. 整合现有功能

将 `SkillStorageSection.vue` 中的功能整合到 `StorageSettings.vue`：

- **Agent 存储路径**：各 agent 的 skill 存储路径设置（codex, claude, gemini, openclaw）
- **同步方式**：软链接 vs 复制同步的选择
- **项目同步目标**：项目目录的添加和管理

### 2. 新增 Agent 配置路径设置

为每个 agent 添加配置目录路径设置：

| Agent | 配置目录示例 | 说明 |
|-------|-------------|------|
| Claude | `~/.claude` | Claude Code 配置目录 |
| Codex | `~/.codex` | Codex 配置目录 |
| Gemini | `~/.gemini` | Gemini 配置目录 |
| OpenClaw | `~/.openclaw` | OpenClaw 配置目录 |

**配置路径用途**：
- 存储 agent 的全局配置文件
- 存储 agent 的 API 密钥和认证信息
- 存储 agent 的自定义设置

### 3. 🆕 安装目录跟随 agent 配置

**当前逻辑（问题）**：
```javascript
// public/preload/skills.js:16-21
function getNestDir() {
  var home = getHomeDir();
  var nest = path.join(home, ".skillnest", "skills");  // 硬编码
  return nest;
}
```

**目标逻辑（改进）**：
```javascript
function getNestDir() {
  // 优先从配置读取
  var configured = utools.dbStorage.getItem('ccswitch_nest_dir');
  if (configured) return expandHome(configured);

  // 默认使用第一个配置的 agent 目录
  var paths = getSkillStoragePaths();
  var firstAgent = Object.keys(paths)[0];
  if (firstAgent && paths[firstAgent]) {
    return expandHome(paths[firstAgent]);
  }

  // 兜底：使用默认路径
  return path.join(getHomeDir(), ".skillnest", "skills");
}
```

**安装流程改进**：
1. 用户在设置页面配置 agent 存储路径
2. 安装 skill 时，使用配置的 agent 目录
3. 支持选择安装到哪个 agent（如果配置了多个）

### 4. 🆕 MCP 配置文件路径跟随 agent 配置

**当前逻辑（问题）**：
```javascript
// public/preload/mcp.js:16-21
var CONFIG_PATHS = {
  claude: function () { return path.join(getHomeDir(), ".claude.json"); },  // 硬编码
  "claude-desktop": function () { return utils.getClaudeDesktopConfigPath(); },
  codex: function () { return path.join(getHomeDir(), ".codex", "config.toml"); },  // 硬编码
  openclaw: function () { return path.join(getHomeDir(), ".openclaw", "openclaw.json"); },  // 硬编码
};
```

**目标逻辑（改进）**：
```javascript
var CONFIG_PATHS = {
  claude: function () {
    var configured = getAgentConfigPath("claude");
    return configured || path.join(getHomeDir(), ".claude.json");
  },
  codex: function () {
    var configured = getAgentConfigPath("codex");
    return configured || path.join(getHomeDir(), ".codex", "config.toml");
  },
  openclaw: function () {
    var configured = getAgentConfigPath("openclaw");
    return configured || path.join(getHomeDir(), ".openclaw", "openclaw.json");
  },
};
```

**配置路径用途**：
- 读取 MCP Server 配置
- 写入 MCP Server 配置
- 同步配置文件

### 5. 🆕 会话存储路径跟随 agent 配置

**当前逻辑（问题）**：
```javascript
// public/preload/sessions.js
// Claude 会话
var projectsDir = path.join(home, ".claude", "projects");  // 硬编码

// Codex 会话
var sessionsDir = path.join(home, ".codex", "sessions");  // 硬编码

// Claude Desktop 会话
var projectsDir = path.join(home, ".claude-desktop", "projects");  // 硬编码
```

**目标逻辑（改进）**：
```javascript
// Claude 会话
function getClaudeSessionDir() {
  var configured = getAgentSessionPath("claude");
  return configured || path.join(getHomeDir(), ".claude", "projects");
}

// Codex 会话
function getCodexSessionDir() {
  var configured = getAgentSessionPath("codex");
  return configured || path.join(getHomeDir(), ".codex", "sessions");
}
```

**会话路径用途**：
- 扫描会话列表
- 读取会话详情
- 删除会话
- 导出会话

### 6. 🆕 统计数据路径跟随 agent 配置

**当前逻辑（问题）**：
```javascript
// public/preload/stats.js:138-141
var roots = [
  { dir: path.join(home, ".claude", "projects"), appType: "claude" },  // 硬编码
  { dir: path.join(home, ".codex", "sessions"), appType: "codex" },    // 硬编码
];
```

**目标逻辑（改进）**：
```javascript
function scanUsageLogs() {
  var home = getHomeDir();
  var cleared = _getClearedAt();
  var sessionPaths = getSessionPaths();  // 从配置读取

  var roots = [
    { dir: sessionPaths.claude || path.join(home, ".claude", "projects"), appType: "claude" },
    { dir: sessionPaths.codex || path.join(home, ".codex", "sessions"), appType: "codex" },
  ];
  // ... 继续扫描逻辑
}
```

**统计数据用途**：
- 用量统计图表
- Token 消耗分析
- 模型使用分布
- 缓存命中率

### 7. 🆕 Provider 切换配置文件路径跟随 agent 配置

**当前逻辑（问题）**：
```javascript
// public/preload/config-rw.js
// Claude 切换
function switchProviderClaude(provider) {
  // 写入 ~/.claude/settings.json  // 硬编码
}

// Codex 切换
function switchProviderCodex(provider) {
  // 写入 ~/.codex/auth.json       // 硬编码
  // 写入 ~/.codex/config.toml     // 硬编码
}

// Gemini 切换
function switchProviderGemini(provider) {
  // 写入 ~/.gemini/.env           // 硬编码
}

// OpenClaw 切换
function switchProviderOpenclaw(provider) {
  // 写入 ~/.openclaw/openclaw.json  // 硬编码
}
```

**目标逻辑（改进）**：
```javascript
// 从配置读取路径
function getConfigPath(appType) {
  var configPaths = getConfigPaths();
  var home = getHomeDir();

  var defaults = {
    claude: path.join(home, ".claude", "settings.json"),
    codex: path.join(home, ".codex", "config.toml"),
    gemini: path.join(home, ".gemini", ".env"),
    openclaw: path.join(home, ".openclaw", "openclaw.json"),
  };

  return configPaths[appType] || defaults[appType];
}

function switchProviderClaude(provider) {
  var configPath = getConfigPath("claude");
  // 写入配置...
}
```

**Provider 切换涉及的配置文件**：

| Agent | 配置文件 | 用途 |
|-------|----------|------|
| Claude | ~/.claude/settings.json | API 配置、模型设置 |
| Codex | ~/.codex/auth.json | 认证信息 |
| Codex | ~/.codex/config.toml | 模型配置 |
| Gemini | ~/.gemini/.env | API Key 和配置 |
| OpenClaw | ~/.openclaw/openclaw.json | Provider 配置 |
| Claude Desktop | %APPDATA%/Claude/claude_desktop_config.json | 桌面端配置 |

### 8. 🆕 提示词文件路径跟随 agent 配置

**当前逻辑（问题）**：
```javascript
// public/preload/utils.js
function getClaudeMdPath() {
  return path.join(getHomeDir(), ".claude", "CLAUDE.md");  // 硬编码
}

function getCodexAgentsMdPath() {
  return path.join(getHomeDir(), ".codex", "AGENTS.md");  // 硬编码
}

function getGeminiMdPath() {
  return path.join(getHomeDir(), ".gemini", "GEMINI.md");  // 硬编码
}

function getOpenClawAgentsMdPath() {
  return path.join(getHomeDir(), ".openclaw", "workspace-*", "AGENTS.md");  // 硬编码
}
```

**目标逻辑（改进）**：
```javascript
function getPromptFilePath(appType) {
  var configPaths = getConfigPaths();
  var home = getHomeDir();

  var defaults = {
    claude: path.join(home, ".claude", "CLAUDE.md"),
    codex: path.join(home, ".codex", "AGENTS.md"),
    gemini: path.join(home, ".gemini", "GEMINI.md"),
    openclaw: path.join(home, ".openclaw", "AGENTS.md"),
  };

  // 如果配置了 agent 目录，提示词文件在该目录下
  if (configPaths[appType]) {
    var dir = expandHome(configPaths[appType]);
    var filenames = {
      claude: "CLAUDE.md",
      codex: "AGENTS.md",
      gemini: "GEMINI.md",
      openclaw: "AGENTS.md",
    };
    return path.join(dir, filenames[appType]);
  }

  return defaults[appType];
}
```

**提示词文件用途**：
- 读取系统提示词
- 编辑系统提示词
- 提示词管理页面

### 9. UI 布局设计

在 `StorageSettings.vue` 页面中按以下顺序组织：

1. **Agent 存储路径**（已有，用于 skill 存储）
2. **🆕 Agent 配置路径**（新增，用于 MCP 配置文件 + Provider 切换 + 提示词文件）
3. **🆕 Agent 会话路径**（新增，用于会话数据和统计）
4. **同步方式**（已有）
5. **项目同步目标**（已有）

### 10. 数据结构

需要扩展 `useSkills.js` composable：

```javascript
// 新增：Agent 配置路径（MCP 配置文件 + Provider 切换 + 提示词文件）
const configPaths = ref({});

function loadConfigPaths() {
  configPaths.value = _ccs().getConfigPaths();
}

function saveConfigPaths(paths) {
  _ccs().setConfigPaths(paths);
  configPaths.value = { ...paths };
}

// 新增：Agent 会话路径（会话数据 + 统计数据）
const sessionPaths = ref({});

function loadSessionPaths() {
  sessionPaths.value = _ccs().getSessionPaths();
}

function saveSessionPaths(paths) {
  _ccs().setSessionPaths(paths);
  sessionPaths.value = { ...paths };
}
```

### 11. 后端 API

需要修改/新增以下 API：

```javascript
// 修改：获取安装目录（从配置读取）
getNestDir: () => { /* 从配置读取，不再硬编码 */ }

// 新增：设置安装目录
setNestDir: (dir) => {}

// 新增：获取 agent 配置路径（MCP 配置文件 + Provider 切换 + 提示词文件）
getConfigPaths: () => ({})
setConfigPaths: (paths) => {}
getDefaultConfigDirs: () => ({})

// 新增：获取 agent 会话路径（会话数据 + 统计数据）
getSessionPaths: () => ({})
setSessionPaths: (paths) => {}
getDefaultSessionDirs: () => ({})
```

## 实现步骤

### 步骤 1：清理冗余组件
- 删除未使用的 `SkillStorageSection.vue`

### 步骤 2：修改 getNestDir()
- 从配置读取安装目录
- 支持跟随 agent 配置
- 提供默认值

### 步骤 3：修改 MCP 配置文件路径
- 修改 `CONFIG_PATHS` 从配置读取
- 添加 `getAgentConfigPath()` 函数
- 提供默认值

### 步骤 4：修改会话存储路径
- 修改会话扫描函数从配置读取
- 添加 `getAgentSessionPath()` 函数
- 提供默认值

### 步骤 5：修改统计数据路径
- 修改 `scanUsageLogs()` 从配置读取会话路径
- 统计数据与会话数据共用同一路径配置

### 步骤 6：修改 Provider 切换配置文件路径
- 修改 `switchProviderClaude()` 等函数从配置读取路径
- 配置路径与 MCP 配置文件路径共用
- 提供默认值

### 步骤 7：修改提示词文件路径
- 修改 `getClaudeMdPath()` 等函数从配置读取路径
- 配置路径与 MCP 配置文件路径共用
- 提供默认值

### 步骤 8：扩展 useSkills.js
- 添加 `configPaths` 状态和方法
- 添加 `sessionPaths` 状态和方法

### 步骤 9：更新 StorageSettings.vue
- 添加"Agent 配置路径"设置区域
- 添加"Agent 会话路径"设置区域
- 优化 UI 布局和样式

### 步骤 10：后端实现
- 在 `preload/services.js` 中添加配置路径相关 API
- 实现默认配置目录的获取逻辑

## 验证标准

1. 所有 agent 的 skill 存储路径可正常设置和保存
2. 所有 agent 的配置路径可正常设置和保存
3. 所有 agent 的会话路径可正常设置和保存
4. 安装 skill 时使用配置的 agent 目录
5. MCP 配置文件读写使用配置的路径
6. 会话扫描使用配置的路径
7. 统计数据扫描使用配置的路径
8. Provider 切换使用配置的路径
9. 提示词文件读写使用配置的路径
10. 同步方式可正常切换
11. 项目同步目标可正常添加和删除
12. 设置在重启后保持不变

## 相关文件

- `src/components/SkillStorageSection.vue`（待删除）
- `src/views/settings/StorageSettings.vue`（主要修改）
- `src/composables/useSkills.js`（扩展）
- `public/preload/services.js`（后端 API）
- `public/preload/skills.js`（修改 getNestDir）
- `public/preload/mcp.js`（修改 CONFIG_PATHS）
- `public/preload/sessions.js`（修改会话路径）
- `public/preload/stats.js`（修改统计数据路径）
- `public/preload/config-rw.js`（修改 Provider 切换路径）
- `public/preload/utils.js`（修改提示词文件路径）
