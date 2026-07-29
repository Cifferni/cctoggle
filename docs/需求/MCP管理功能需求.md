# MCP 管理功能需求原型

> 版本：v5  
> 日期：2026-07-29  
> 状态：待开发

---

## 一、功能概述

新增 MCP（Model Context Protocol）服务器配置管理模块，让用户可以在 utools-cctoggle 中统一管理各类 MCP Server，方便在 Claude、Codex 等 AI 应用中使用。

---

## 二、项目规范

> 详见 [utools-cctoggle-dev skill](../../.claude/skills/utools-cctoggle-dev/SKILL.md)
> 
> - 代码风格：[code-style.md](../../.claude/skills/utools-cctoggle-dev/references/code-style.md)
> - 架构设计：[architecture.md](../../.claude/skills/utools-cctoggle-dev/references/architecture.md)

---

## 三、页面布局

```
┌─────────────────────────────────────────────────┐
│ ←  MCP管理                          [+ 添加]   │  ← sub-header + 操作按钮
├─────────────────────────────────────────────────┤
│  全部 │ Claude │ Codex │ OpenClaw               │  ← 应用筛选
├─────────────────────────────────────────────────┤
│                                                 │
│  (MCP Server 列表)                               │  ← sub-content
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 四、MCP Server 列表

### 页面结构

```
┌─────────────────────────────────────────────────┐
│  全部 │ Claude │ Codex │ OpenClaw    [+ 添加]   │  ← 筛选栏 + 操作按钮
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ 🟢 Filesystem Server                    │    │  ← MCP 卡片
│  │    stdio · 已启用 · Claude, Codex       │    │
│  │    npx @modelcontextprotocol/server...  │    │
│  │                            [编辑] [删除] │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ 🔴 GitHub Server                        │    │
│  │    stdio · 已禁用 · Claude              │    │
│  │    npx @modelcontextprotocol/server...  │    │
│  │                            [编辑] [删除] │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 卡片信息

| 字段 | 说明 |
|------|------|
| 名称 | MCP Server 名称 |
| 类型标签 | `stdio` / `sse` / `streamable-http` |
| 状态 | 已启用（绿）/ 已禁用（灰）/ 错误（红） |
| 关联应用 | 显示关联的 AI 应用图标 |
| 命令/URL | 配置摘要（单行截断） |

### 操作

- **添加**：打开添加抽屉
- **编辑**：打开编辑抽屉
- **删除**：确认后删除
- **启用/禁用**：卡片上的开关

---

## 五、添加/编辑抽屉

### 布局（参考 ProviderForm）

```
┌─────────────────────────────────────────────┐
│  添加 MCP Server                        [X] │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─ 基本信息 ─────────────────────────────┐ │
│  │  名称: [________________]              │ │
│  │  类型: [stdio ▼]                       │ │
│  │  描述: [________________]              │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  ┌─ 传输配置 ─────────────────────────────┐ │
│  │  (根据类型动态显示)                     │ │
│  │                                        │ │
│  │  [stdio 模式]                          │ │
│  │  命令: [npx________________]           │ │
│  │  参数: [-y, @modelcontextprotocol...]  │ │
│  │  环境变量: [+ 添加]                    │ │
│  │                                        │ │
│  │  [sse/http 模式]                       │ │
│  │  URL: [https://____________]           │ │
│  │  Headers: [________________]           │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  ┌─ 高级设置 ─────────────────────────────┐ │
│  │  超时(秒): [30]                        │ │
│  │  自动启动: [✓]                         │ │
│  │  关联应用: [✓Claude] [✓Codex] [ ]Open  │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  ┌─ 配置预览 ─────────────────────────────┐ │
│  │  {                                     │ │
│  │    "command": "npx",                   │ │
│  │    "args": ["-y", "@modelcontext..."]  │ │
│  │  }                                     │ │
│  └────────────────────────────────────────┘ │
│                                             │
├─────────────────────────────────────────────┤
│                           [取消]  [保存]     │
└─────────────────────────────────────────────┘
```

---

## 六、存储格式设计

### 存储架构：集中存储 + 自动同步

```
┌─────────────────────────────────────┐
│  utools-cctoggle 统一存储            │  ← 主数据源
│  (utools 插件数据)                   │
└──────────────┬──────────────────────┘
               │ 保存/删除时自动同步
               ▼
┌─────────────────────────────────────┐
│  ~/.claude.json                     │  ← Claude
│  ~/.codex/config.toml               │  ← Codex
│  ~/.openclaw/openclaw.json          │  ← OpenClaw
└─────────────────────────────────────┘
```

### 数据结构

**存储位置**：`window.utoolsCctoggle.getMcpConfig()` / `setMcpConfig()`

**格式**：
```javascript
{
  "mcpServers": {
    "mcp_abc123": {
      "id": "mcp_abc123",
      "name": "Filesystem",
      "type": "stdio",                    // "stdio" | "sse" | "streamable-http"
      "description": "访问本地文件系统",
      "enabled": true,
      
      // 传输配置（按 type 聚合，不分散）
      "stdio": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"],
        "env": { "API_KEY": "xxx" }
      },
      "sse": {
        "url": "",
        "headers": {},
        "authType": "none",               // "none" | "bearer" | "api-key"
        "apiKey": ""
      },
      "http": {
        "url": "",
        "headers": {},
        "authType": "none",
        "apiKey": ""
      },
      
      // 高级配置
      "timeout": 30,
      "autoStart": true,
      "apps": ["claude", "codex"],        // 关联的 AI 应用
      
      // 元数据
      "createdAt": "2026-07-29T10:00:00Z",
      "updatedAt": "2026-07-29T10:00:00Z"
    }
  }
}
```

### 同步到各应用的格式转换

**Claude (`~/.claude.json`)**：
```json
{
  "mcpServers": {
    "Filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"],
      "env": { "API_KEY": "xxx" }
    }
  }
}
```

**Codex (`~/.codex/config.toml`)**：
```toml
[mcp_servers.filesystem]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
```

**OpenClaw (`~/.openclaw/openclaw.json`)**：
```json
{
  "mcpServers": {
    "Filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"],
      "env": { "API_KEY": "xxx" }
    }
  }
}
```

### 存储优势

1. **数据集中**：一份数据管理所有配置，避免分散
2. **自动同步**：保存时自动写入各应用配置文件
3. **按类型聚合**：`stdio`/`sse`/`http` 配置分开存储，结构清晰
4. **关联应用**：`apps` 字段控制同步到哪些应用
5. **易于备份**：一个文件包含所有 MCP 配置

---

## 七、Composable 设计

```javascript
// composables/useMcp.js
export function useMcp() {
  return {
    // 数据
    servers,           // MCP Server 列表
    
    // CRUD
    loadServers,
    saveServer,
    deleteServer,
    toggleServer,      // 启用/禁用
    
    // 配置同步
    syncToApps,        // 同步到关联的 AI 应用
    
    // 测试
    testConnection,
  }
}
```

---

## 八、配置文件写入

保存时根据 `apps` 字段写入对应配置：

| 应用 | 配置文件路径 | 字段 |
|------|-------------|------|
| Claude Desktop | `~/.claude/claude_desktop_config.json` | `mcpServers` |
| Claude Code | `~/.claude.json` | `mcpServers` |
| Codex | `~/.codex/config.toml` | `[mcp_servers]` |
| OpenClaw | `~/.openclaw/openclaw.json` | `mcpServers` |

### 配置格式示例（Claude）

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/username/Desktop"],
      "env": {
        "API_KEY": "your-key"
      }
    }
  }
}
```

---

## 九、验收标准

- [ ] 页面布局简洁清晰（header + 筛选 + 列表）
- [ ] 列表展示、筛选、添加/编辑/删除
- [ ] 表单支持 stdio / sse / streamable-http 三种类型
- [ ] 保存后正确写入关联应用的配置文件
- [ ] 启用/禁用状态切换
- [ ] 配置预览功能

---

## 十、文件结构

```
src/
├── views/
│   └── McpPage.vue              # MCP 管理页面
├── components/
│   ├── McpCard.vue              # MCP Server 卡片
│   └── McpForm.vue              # 添加/编辑表单
└── composables/
    └── useMcp.js                # MCP 状态管理
```

---

## 十一、路由配置

```javascript
// router/index.js
{
  path: '/mcp',
  name: 'McpPage',
  component: () => import('../views/McpPage.vue')
}
```

---

## 十二、TabBar 入口

在 TabBar 的导航按钮区域新增 MCP 管理入口：

```vue
<button class="tab tab--nav" title="MCP管理" @click="router.push('/mcp')">
  <n-icon :size="15"><cube-outline /></n-icon>
</button>
```
