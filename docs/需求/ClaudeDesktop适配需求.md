# Claude Desktop 适配需求

> 版本：v1
> 日期：2026-07-30
> 状态：待开发

---

## 一、功能概述

在现有 Claude Code（CLI）支持的基础上，新增 **Claude Desktop**（桌面端 Electron 应用）的适配，使用户可以通过 CCToggle 统一管理 Claude Desktop 的 API 供应商切换和 MCP Server 配置。

### 背景

| 维度 | Claude Code（CLI） | Claude Desktop（桌面端） |
|------|-------------------|------------------------|
| 配置文件 | `~/.claude/settings.json` | `%APPDATA%\Claude\claude_desktop_config.json`（Windows）<br>`~/Library/Application Support/Claude/claude_desktop_config.json`（macOS） |
| API 配置方式 | `env.ANTHROPIC_BASE_URL` / `env.ANTHROPIC_AUTH_TOKEN` | `env.ANTHROPIC_BASE_URL` / `env.ANTHROPIC_AUTH_TOKEN`（相同机制） |
| MCP 配置 | `~/.claude.json` 中的 `mcpServers` | 同配置文件中的 `mcpServers` |
| 应用类型标识 | `claude` | `claude-desktop` |

---

## 二、项目规范

> 详见 [utools-cctoggle-dev skill](../../.claude/skills/utools-cctoggle-dev/SKILL.md)
>
> - 代码风格：[code-style.md](../../.claude/skills/utools-cctoggle-dev/references/code-style.md)
> - 架构设计：[architecture.md](../../.claude/skills/utools-cctoggle-dev/references/architecture.md)

---

## 三、配置文件格式

### 3.1 文件路径

| 平台 | 路径 |
|------|------|
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

uTools 环境下使用 `utools.getPath("appData")` 拼接 `Claude/claude_desktop_config.json`。

### 3.2 配置文件结构

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://your-proxy.example.com",
    "ANTHROPIC_AUTH_TOKEN": "sk-ant-xxx"
  },
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"],
      "env": {
        "API_KEY": "xxx"
      }
    }
  }
}
```

### 3.3 与 Claude Code 的差异

| 差异点 | Claude Code | Claude Desktop |
|--------|------------|----------------|
| 配置文件 | `~/.claude/settings.json` | `%APPDATA%\Claude\claude_desktop_config.json` |
| MCP 配置位置 | `~/.claude.json` | 同配置文件内 `mcpServers` 字段 |
| 环境变量格式 | 嵌套在 `env` 对象内 | 嵌套在 `env` 对象内（一致） |
| 认证字段 | `ANTHROPIC_AUTH_TOKEN` 或 `ANTHROPIC_API_KEY` | `ANTHROPIC_AUTH_TOKEN` 或 `ANTHROPIC_API_KEY`（一致） |
| 应用内设置 | 无 GUI，纯配置文件 | 有 GUI 设置界面（但不支持自定义 API 端点） |

---

## 四、功能范围

### 4.1 API 供应商切换（核心功能）

将 Claude Desktop 作为独立的 app 类型 `claude-desktop`，支持：

- **供应商列表**：复用现有 Claude 预设供应商列表（`presets-claude.js`），Claude Desktop 与 Claude Code 共享供应商数据
- **一键切换**：点击供应商卡片 → 写入 `claude_desktop_config.json` 的 `env` 字段
- **当前状态**：读取配置文件判断当前激活的供应商

#### 切换写入逻辑

```javascript
// 切换供应商时写入的配置
{
  "env": {
    "ANTHROPIC_BASE_URL": provider.baseUrl,
    "ANTHROPIC_AUTH_TOKEN": provider.apiKey
    // ... 其他环境变量（model 等）
  },
  "mcpServers": {
    // 保留现有 MCP 配置，不覆盖
  }
}
```

**关键约束**：切换供应商时必须保留 `mcpServers` 字段，不能覆盖。

### 4.2 MCP Server 管理

将 Claude Desktop 纳入现有 MCP 管理体系：

- 在 MCP 管理页面的筛选栏中显示 `Claude Desktop` 标签
- 保存/删除 MCP Server 时自动同步到 `claude_desktop_config.json` 的 `mcpServers` 字段
- 同步格式与现有 Claude Desktop MCP 格式一致

### 4.3 配置文件读写

新增 preload 层的配置读写函数：

| 函数 | 说明 |
|------|------|
| `readClaudeDesktopConfig()` | 读取 Claude Desktop 配置文件 |
| `writeClaudeDesktopConfig(config)` | 写入 Claude Desktop 配置文件 |
| `switchProviderClaudeDesktop(provider)` | 切换供应商（保留 mcpServers） |

---

## 五、数据结构变更

### 5.1 APP_TYPES 扩展

```javascript
// shared.js
export const APP_TYPES = ["codex", "claude", "claude-desktop", "openclaw", "gemini"];

export const APP_LABELS = {
  codex: "Codex",
  claude: "Claude",
  "claude-desktop": "Claude Desktop",
  openclaw: "OpenClaw",
  gemini: "Gemini",
  all: "全部",
};
```

### 5.2 APP_ICONS 扩展

复用 Claude 图标（同一品牌），或新增专用图标：

```javascript
export const APP_ICONS = {
  // ...
  "claude-desktop": claudeDesktopIcon, // 或复用 claudeIcon
};
```

### 5.3 路径配置扩展

```javascript
// utils.js
function getClaudeDesktopConfigPath() {
  if (process.platform === "darwin") {
    return path.join(getHomeDir(), "Library", "Application Support", "Claude", "claude_desktop_config.json");
  }
  // Windows: %APPDATA%\Claude\claude_desktop_config.json
  const appData = utools.getPath("appData");
  return path.join(appData, "Claude", "claude_desktop_config.json");
}
```

---

## 六、预设系统

### 6.1 预设文件

新建 `src/data/presets-claude-desktop.js`，或复用 `presets-claude.js`：

**方案 A：独立预设文件**（推荐）

```javascript
// presets-claude-desktop.js
// 与 presets-claude.js 内容基本一致，但 settingsConfig 结构适配 Desktop 格式
export default [
  {
    provider: "claude_official",
    // Desktop 不需要额外配置，使用官方 API
  },
  {
    provider: "kimi",
    baseUrl: "https://api.moonshot.cn/anthropic",
    model: "kimi-k2.7-code",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://api.moonshot.cn/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "kimi-k2.7-code"
      }
    }
  },
  // ... 其他供应商
];
```

**方案 B：共享预设文件**

直接复用 `presets-claude.js`，在运行时通过 app 类型区分写入目标。

### 6.2 预设合并逻辑

与现有 Claude 预设合并逻辑一致，从 `providers.js` 合并基础信息。

---

## 七、UI 变更

### 7.1 TabBar

在 TabBar 的应用切换区域新增 `Claude Desktop` 标签：

```
┌──────────────────────────────────────────────────┐
│  Codex │ Claude │ Claude Desktop │ OpenClaw │ Gemini │
└──────────────────────────────────────────────────┘
```

### 7.2 供应商列表页

- 切换到 `Claude Desktop` 标签后，显示可用的供应商列表
- 供应商数据与 Claude Code 共享（复用 presets-claude.js）
- 点击供应商卡片 → 写入 Claude Desktop 配置文件

### 7.3 MCP 管理页

- 应用筛选栏新增 `Claude Desktop` 选项
- 保存 MCP Server 时可选择同步到 Claude Desktop

---

## 八、文件结构变更

```
src/
├── composables/
│   └── shared.js                    # 新增 claude-desktop 类型
├── data/
│   └── presets-claude-desktop.js    # 新建：Desktop 专用预设（或复用）
public/
├── preload/
│   ├── utils.js                     # 新增 getClaudeDesktopConfigPath()
│   ├── config-rw.js                 # 新增 read/writeClaudeDesktopConfig()
│   └── services.js                  # 新增 Claude Desktop 相关 API
```

---

## 九、实现步骤

### 阶段一：基础设施

1. `utils.js`：新增 `getClaudeDesktopConfigPath()`
2. `config-rw.js`：新增 `readClaudeDesktopConfig()` / `writeClaudeDesktopConfig()` / `switchProviderClaudeDesktop()`
3. `services.js`：暴露新 API 到 `window.utoolsCctoggle`
4. `shared.js`：新增 `claude-desktop` 到 `APP_TYPES` / `APP_LABELS` / `APP_ICONS`

### 阶段二：预设与供应商

5. 创建 `presets-claude-desktop.js`（或配置共享逻辑）
6. `presets.js`：注册新预设文件

### 阶段三：UI 集成

7. `TabBar.vue`：新增 Claude Desktop 标签
8. `ProviderListPage.vue`：支持 claude-desktop 类型的供应商列表和切换
9. `useProviders.js`：支持 claude-desktop 的供应商 CRUD 和切换

### 阶段四：MCP 集成

10. `mcp.js`：MCP 同步支持 `claude-desktop` 目标
11. `McpPage.vue`：筛选栏新增 Claude Desktop

### 阶段五：统计集成

12. `stats.js`：评估是否支持 Claude Desktop 的使用统计（取决于 Desktop 是否输出日志）

---

## 十、验收标准

- [ ] TabBar 显示 Claude Desktop 标签，可切换
- [ ] 切换到 Claude Desktop 后显示供应商列表
- [ ] 点击供应商卡片正确写入 `claude_desktop_config.json`（保留 mcpServers）
- [ ] 切换供应商后 Claude Desktop 能连接到目标 API
- [ ] MCP 管理页支持 Claude Desktop 筛选
- [ ] MCP Server 保存时正确同步到 Claude Desktop 配置文件
- [ ] 配置文件不存在时自动创建
- [ ] 跨平台路径正确（Windows / macOS）

---

## 十一、风险与待确认项

| 项目 | 说明 | 状态 |
|------|------|------|
| Desktop 环境变量生效方式 | Claude Desktop 是否读取配置文件中的 `env` 字段作为进程环境变量？需实测确认 | 待确认 |
| Desktop 版本兼容性 | 不同版本的 Claude Desktop 配置格式是否有差异？ | 待确认 |
| 图标资源 | 是否需要为 Claude Desktop 设计独立图标？ | 待确认 |
| 使用统计 | Claude Desktop 是否输出可解析的会话日志？ | 待确认 |
| Linux 支持 | Claude Desktop 是否有 Linux 版本？路径如何处理？ | 待确认 |
