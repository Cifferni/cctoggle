# 调试手册

## 调试环境

### 1. uTools 内调试（推荐）

uTools 插件运行在 Electron 环境中，调试方式：

```
1. 启动开发构建：pnpm dev:all
2. 打开 uTools，输入 cctoggle 进入插件
3. 按 Ctrl+Shift+I 打开 DevTools（渲染进程）
4. Console 面板查看日志，Sources 面板打断点
```

**Preload 日志**：preload 脚本的 `console.log` 输出在 uTools 主窗口的 DevTools 中（不是插件窗口的）。

打开主窗口 DevTools：
```
uTools → 右上角菜单 → 开发者工具
```

### 2. 浏览器调试

```
1. 启动：pnpm dev:browser
2. 浏览器打开 http://localhost:5173
3. 正常使用 Chrome DevTools
```

浏览器模式下：
- Network 面板可看到 `/api/...` 请求
- 数据来自 `scripts/dev-api-server.cjs` + `.dev-db.json`
- 不需要 uTools 环境

### 3. Preload 单独调试

```bash
# 编译 preload
pnpm tsc:preload

# 查看编译产物
ls public/preload/

# 在 Node.js 中测试单个模块
node -e "
  global.utools = {
    db: { allDocs: () => [], get: () => null, put: () => {}, remove: () => {} },
    dbStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    dbCryptoStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    getPath: () => require('os').homedir(),
  };
  const { ProviderStore } = require('./public/preload/provider-db');
  console.log(ProviderStore.listProviders('claude'));
"
```

## 常见问题排查

### 插件无反应 / 白屏

**原因**：preload 脚本加载失败

**排查步骤**：
```
1. 打开 uTools 主窗口 DevTools
2. Console 中搜索 [Preload] 或 Error
3. 检查 public/preload/preload.js 是否存在
4. 检查 public/plugin.json 的 preload 路径是否正确
```

**常见错误**：
```
Error: Cannot find module './xxx'
→ 检查 public/preload/ 下是否有对应 .js 文件

utools is not defined
→ 代码在 uTools 环境外运行了，检查运行环境

window.utoolsCctoggle is undefined
→ preload.ts 未正确执行，检查主窗口 Console 日志
```

### 数据不显示 / 列表为空

**排查步骤**：
```
1. 打开插件窗口 DevTools（Ctrl+Shift+I）
2. Console 中执行：
   window.utoolsCctoggle.listProviders('claude')
   window.utoolsCctoggle.scanSessions('claude')
3. 检查返回值是否正常
```

**常见原因**：
- 配置文件路径错误 → 检查 `getConfigPaths()` 返回值
- 数据库为空 → 首次使用，需要先添加供应商
- 权限问题 → 检查文件系统权限

### 代理不工作

**排查步骤**：
```
1. 检查代理状态：
   window.utoolsCctoggle.getProxyStatus('claude')

2. 检查路由组：
   window.utoolsCctoggle.listRouteGroups('claude')

3. 查看主窗口 Console 中的 proxy-daemon 日志

4. 检查端口是否被占用：
   netstat -ano | findstr :8788
```

**常见原因**：
- 路由组成员为空 → 需要先添加供应商
- 端口被占用 → 修改端口或关闭占用进程
- 代理窗口崩溃 → 检查 proxy-daemon.ts 日志

### 切换供应商不生效

**排查步骤**：
```
1. 检查供应商数据：
   window.utoolsCctoggle.getProvider('claude', 'xxx')

2. 检查配置文件是否被正确写入：
   - Claude: ~/.claude/settings.json
   - Codex: ~/.codex/config.toml
   - Gemini: ~/.gemini/.env

3. 检查是否有外部工具在覆盖配置文件
```

**常见原因**：
- 配置文件被其他工具锁定
- API Key 为空
- 配置文件格式错误

### 会话扫描慢

**排查**：
```
1. 检查会话目录大小：
   du -sh ~/.claude/projects/
   du -sh ~/.codex/sessions/

2. 检查缓存是否生效（30秒 TTL）
3. 减少 limit 参数值
```

**优化**：
- 会话扫描使用 head/tail 优化，只读 4KB
- 结果缓存 30 秒
- 按 mtime 倒序，最新会话优先

## 日志系统

### Preload 日志

```ts
// 在 preload 模块中使用
import { createLogger } from './utils';
const log = createLogger('ModuleName');
log.info('操作成功');
log.error('操作失败', error);
```

日志文件位置：`~/.cctoggle/log/`

### 前端日志

```ts
// 在 Vue 组件中使用
console.log('[ComponentName]', data)
console.error('[ComponentName]', error)
```

### 代理日志

代理日志通过 IPC 事件传递：
```
proxy-daemon.ts → sendToParent('proxy-log', data)
  → proxy.ts onProxyEvent() → proxyRuntime.logs[]
    → 前端 getProxyStatus().logs
```

## 数据检查

### 查看数据库

```ts
// 在插件 DevTools Console 中执行

// 查看所有供应商
utools.db.allDocs('cctoggle_provider_')

// 查看路由组
utools.db.allDocs('cctoggle_route_')

// 查看 MCP 映射
utools.db.get('cctoggle_mcp_apps')

// 查看提示词
utools.db.get('cctoggle_prompts')

// 查看迁移版本
utools.dbStorage.getItem('ccswitch_migration_version')

// 查看配置路径
utools.dbStorage.getItem('ccswitch_config_paths')
```

### 查看配置文件

```bash
# Claude
cat ~/.claude/settings.json

# Codex
cat ~/.codex/config.toml

# Gemini
cat ~/.gemini/.env

# OpenClaw
cat ~/.openclaw/openclaw.json

# Claude Desktop (Windows)
cat "$APPDATA/Claude/claude_desktop_config.json"
```

## 浏览器模式调试

### Network 面板

浏览器模式下，所有 API 调用都会经过 Vite proxy：

```
Request URL: http://localhost:5173/api/providers?appType=claude
→ 转发到 → http://localhost:3456/providers?appType=claude
```

### dev-api-server 日志

```bash
# 查看 API 服务器日志
# 终端中运行 pnpm dev:browser 时会输出请求日志
```

### .dev-db.json

浏览器模式的模拟数据库：

```bash
# 查看数据
cat .dev-db.json | jq .

# 清空数据重新开始
echo '{}' > .dev-db.json
```

## 性能分析

### Preload 性能

```ts
// 在 preload 模块中计时
const start = Date.now();
// ... 执行操作
console.log(`耗时: ${Date.now() - start}ms`);
```

### 前端性能

使用 Chrome DevTools Performance 面板：
```
1. 打开 DevTools → Performance
2. 点击 Record
3. 执行操作
4. 停止 Record，分析火焰图
```

### 大文件会话扫描

```ts
// 检查会话文件大小
const stats = fs.statSync(filePath);
console.log(`文件大小: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

// 只读头部元数据，不加载全部内容
const head = Buffer.alloc(4096);
const fd = await fs.promises.open(filePath, 'r');
await fd.read(head, 0, 4096, 0);
await fd.close();
```

## 重置环境

### 清空所有数据

```ts
// 在插件 DevTools Console 中执行

// 清空供应商数据
utools.db.allDocs('cctoggle_provider_').forEach(doc => utools.db.remove(doc));

// 清空路由组
utools.db.allDocs('cctoggle_route_').forEach(doc => utools.db.remove(doc));

// 重置迁移版本
utools.dbStorage.setItem('ccswitch_migration_version', 0);

// 清空配置路径
utools.dbStorage.removeItem('ccswitch_config_paths');
```

### 重置浏览器模式数据

```bash
rm .dev-db.json
```

## 报错信息速查

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `Cannot find module` | 编译产物缺失 | 运行 `pnpm tsc:preload` |
| `utools is not defined` | 非 uTools 环境 | 使用浏览器模式或 uTools 运行 |
| `provider not found` | 供应商 ID 不存在 | 检查数据库中的供应商数据 |
| `group not found` | 路由组 ID 不存在 | 检查路由组数据 |
| `no providers` | 路由组无成员 | 先添加供应商 |
| `proxy is running` | 代理运行中不允许操作 | 先停止代理 |
| `port must be 1024-65535` | 端口无效 | 使用有效端口号 |
| `missing API key` | API Key 为空 | 填写 API Key |
| `missing ANTHROPIC_BASE_URL` | 缺少 Base URL | 填写 Base URL |
| `unsafe path outside target root` | 路径穿越攻击 | 检查路径参数 |
