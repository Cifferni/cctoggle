# MCP 数据同步重构方案

## 目标

将 MCP 数据从"uTools.db 存完整定义 + 单向写配置文件"改为"配置文件为源 + db 只存映射和元数据"，实现双向感知。

## 当前问题

- uTools.db 存完整 MCP Server 定义（每条 ~1-2KB），单向同步到配置文件
- 用户在 agent 里删了 MCP → db 不知道，下次编辑会把删掉的又写回去
- db 记录只增不减，会无限累积

## 新架构

### 存储结构

**配置文件（数据源）**：MCP Server 的实际定义（command/args/url/headers/env）
- `~/.claude.json` → `mcpServers`
- `%APPDATA%/Claude/claude_desktop_config.json` → `mcpServers`
- `~/.codex/config.toml` → `[mcp_servers.xxx]`
- `~/.openclaw/openclaw.json` → `mcpServers`

**uTools.db（轻量元数据）**：两条文档

```
Doc 1: cctoggle_mcp_meta
{
  _id: "cctoggle_mcp_meta",
  servers: {
    "fetch":   { description: "...", timeout: 30, autoStart: true, enabled: true },
    "memory":  { description: "...", timeout: 60, autoStart: false, enabled: true },
  }
}

Doc 2: cctoggle_mcp_apps
{
  _id: "cctoggle_mcp_apps",
  claude: ["fetch", "memory"],
  "claude-desktop": ["fetch"],
  codex: ["fetch"],
  openclaw: ["memory"]
}
```

### 数据流

```
读取: 配置文件 ──解析──→ 合并 db 元数据 ──→ 前端列表
保存: 前端数据 ──→ 写配置文件 + 更新 db 映射和元数据
同步: 进入插件时 ──→ 读配置文件 vs db 做 diff ──→ 清理/提示导入
```

## 改动文件

### 1. `public/preload/mcp.js` — 完全重写

**导出接口保持不变**：`listMcpServers`, `getMcpServer`, `saveMcpServer`, `deleteMcpServer`, `toggleMcpServer`

新增内部模块拆分：

#### 1a. 配置文件读写函数

```
_readJsonMcpServers(filePath) → { name: entry, ... }
_writeJsonMcpServers(filePath, name, entry|null)
_readCodexMcpServers() → { name: {command,args,url,headers,env}, ... }
_writeCodexMcpServer(name, entry|null)
```

复用现有 `_updateJsonMcpServers` 和 TOML 解析逻辑。

#### 1b. 映射文档读写

```
_getMapping() → { claude: [...], codex: [...], ... }
_putMapping(mapping)
_getMeta() → { servers: { name: meta, ... } }
_putMeta(meta)
```

#### 1c. 核心函数改写

**`listMcpServers()`**：
1. 从各 app 配置文件读取实际 MCP Server 定义
2. 读取 db 映射，标记每个 server 关联了哪些 app
3. 读取 db 元数据，合并 description/timeout/autoStart/enabled
4. 返回统一格式的数组

**`saveMcpServer(data)`**：
1. 根据 `data.apps` 写入对应配置文件（复用 `_syncToApps` 逻辑）
2. 更新映射文档（添加/更新 name 到 apps 的映射）
3. 更新元数据文档（保存 description/timeout/autoStart/enabled）

**`deleteMcpServer(id)`**：
1. 从所有关联 app 配置文件中移除
2. 从映射文档中移除
3. 从元数据文档中移除

**`toggleMcpServer(id)`**：
1. 读取元数据，翻转 enabled
2. enabled=false → 从配置文件中移除（但保留在映射和元数据中）
3. enabled=true → 写回配置文件
4. 保存元数据

**新增 `syncFromConfigFiles()`**：
1. 读取各 app 配置文件中的 mcpServers
2. 对比映射文档：
   - 配置文件里有，映射里没有 → 标记为"可导入"
   - 映射里有，配置文件里没有 → 从映射里移除（除非 enabled=false）
3. 保存映射

### 2. `src/composables/useMcp.js` — 微调

- `loadServers()` 调用前先调用 `syncFromConfigFiles()`
- 其余不变（API 接口不变）

### 3. 前端组件 — 无需改动

`McpCard.vue`、`McpForm.vue`、`McpPage.vue` 的数据结构不变：
- `server.id` → 使用 name（因为不再有 uuid）
- `server.name/type/enabled/apps/stdio/sse/http/description/timeout/autoStart` → 不变
- `server.createdAt` → 可选，从元数据读取或省略

### 4. `public/preload/services.js` — 新增导出

```javascript
syncFromConfigFiles: mcpDb.syncFromConfigFiles,
```

### 5. `src/composables/shared.js` — 更新 fallback

在 `getSkillNest()` 的 fallback 对象中添加 `syncFromConfigFiles: () => {}`。

## 切换/迁移

旧数据（`cctoggle_mcp_*` 前缀的文档）需要一次性迁移：
- 在 `mcp.js` 中添加 `_migrateOldDocs()` 函数
- 检测是否存在旧前缀文档 → 读取 → 转换为新的映射+元数据格式 → 写入新文档 → 删除旧文档
- 首次调用 `listMcpServers()` 时自动执行

## 注意事项

- `id` 字段：旧版用 uuid，新版用 `name` 作为标识（因为配置文件里用 name 做 key）
- `getServer(id)` 改为 `getServer(name)` — 需要确认前端 `onEdit` 传的是 name
- `toggle` 的语义：enabled=false 不等于删除，保留在映射中但从配置文件移除
- `createdAt`：从元数据文档读取，首次同步时设置为当前时间
