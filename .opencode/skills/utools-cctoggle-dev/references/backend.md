# 后端模块参考

## Preload 运行环境

Preload 脚本运行在 uTools 的 Electron 预加载上下文中，拥有：
- 完整的 Node.js API（fs、path、os、https 等）
- `utools` 全局对象
- `window` 对象（与渲染进程共享）

编译配置：`tsconfig.preload.json`（CommonJS 输出到 `public/preload/`）

## 模块详解

### ProviderStore（provider-db.ts）

供应商数据存储在 `utools.db`（PouchDB）中：
- 文档 key 格式：`cctoggle_provider_{appType}_{providerId}`
- API Key 存储在 `utools.dbCryptoStorage`（加密存储）
- `isCurrent` 字段标记当前激活的供应商

关键方法：
- `switchProvider(appType, providerId)` - 切换供应商，调用 config-rw 写入配置文件
- `markCurrent(appType, providerId)` - 标记当前供应商（更新所有文档的 isCurrent 字段）
- `reapplyCurrent()` - 进入插件时重新应用已激活的供应商

### ProxyManager（proxy.ts）

路由组管理 + 代理启停：
- 路由组存储在 `utools.db`，key 格式：`cctoggle_route_{appType}_{id}`
- 代理通过 `utools.createBrowserWindow` 启动隐藏窗口运行 `proxy-daemon.ts`
- `proxyRuntime` 内存对象跟踪运行状态
- 同一时间全局只允许一个代理运行（`proxyRuntime._active`）

接管/还原机制：
1. `takeoverApp()` 备份当前供应商，写入代理配置
2. `restoreApp()` 从备份恢复原供应商

### SessionManager（sessions.ts）

会话扫描优化：
- 大文件只读头尾各 4KB（`_readHeadAndTail`），避免全量加载
- 扫描结果缓存 30 秒（`_scanCache`）
- 支持 Claude、Codex、OpenClaw、Claude Desktop 四种格式

### McpManager（mcp.ts）

MCP 配置管理策略：
- **配置文件为源**：真实的 MCP 配置写入各 Agent 的配置文件
- **db 仅存映射**：`utools.db` 中只存储 app 关联关系和 disabled 列表
- 支持 stdio、SSE、streamable-http 三种传输类型

### DataMigration（cleanup.ts）

版本化迁移：
- `MIGRATION_VERSION` 常量控制当前版本
- `ccswitch_migration_version` 存储已执行的版本
- 启动时自动执行未完成的迁移

## 依赖关系

```
preload.ts (入口)
  ├── ProviderStore ← utils, configRw
  ├── ProxyManager ← utils, configRw, ProviderStore
  ├── McpManager ← utils, DataMigration
  ├── SessionManager ← utils
  ├── PromptManager ← utils, configRw
  ├── SkillManager ← utils
  ├── StatsCollector ← utils
  ├── DataMigration (独立)
  ├── ConnectionTester (独立)
  └── configRw ← utils

proxy-daemon.ts (独立窗口) ← proxy-converter.ts
```

循环依赖处理：
- `provider-db.ts` 中删除供应商时懒加载 `proxy.ts`（`require("./proxy")`）
- `config-rw.ts` 中 Claude Desktop 切换时懒加载 `proxy.ts`
