---
name: utools-cctoggle-dev
description: 开发指南 - uTools CCToggle 插件的架构、构建流程和开发规范
---

# uTools CCToggle 开发指南

## 项目概述

CCToggle 是一个 uTools 插件，用于一键切换多个 AI CLI 工具（Claude、Codex、Gemini、OpenClaw 等）的 API 配置。

- **前端**: Vue 3 + Naive UI + Vue Router
- **后端**: Node.js preload 脚本（uTools 预加载环境）
- **构建**: Vite（前端）+ TypeScript 编译器（preload）
- **运行环境**: uTools 桌面端（Electron 预加载上下文）

## 目录结构

```
src/
├── preload/              # 后端模块（uTools preload 环境）
│   ├── preload.ts        # 主入口：UtoolsPreload 类
│   ├── provider-db.ts    # ProviderStore - 供应商 CRUD
│   ├── proxy.ts          # ProxyManager - 路由组、代理启停
│   ├── proxy-daemon.ts   # 代理守护进程（独立窗口运行）
│   ├── proxy-converter.ts# 协议转换（独立窗口运行）
│   ├── mcp.ts            # McpManager - MCP 服务器管理
│   ├── sessions.ts       # SessionManager - 会话扫描
│   ├── prompts.ts        # PromptManager - 提示词管理
│   ├── skills.ts         # SkillManager - 技能部署
│   ├── stats.ts          # StatsCollector - 用量统计
│   ├── cleanup.ts        # DataMigration - 数据迁移
│   ├── test-connection.ts# ConnectionTester - 连接测试
│   ├── config-rw.ts      # 配置文件读写（函数式）
│   └── utils.ts          # 工具函数（函数式）
├── components/           # Vue 组件
├── composables/          # Vue 组合式函数
├── views/                # 页面视图
├── types/                # TypeScript 类型定义
│   ├── utools-cctoggle.d.ts  # API 接口类型
│   └── env.d.ts              # 全局类型声明
└── utils/                # 前端工具
    └── browser-adapter.ts # 浏览器开发适配器

scripts/
├── build-preload.cjs     # preload 构建脚本
└── dev-api-server.cjs    # 浏览器模式 API 服务器
```

## 构建流程

```bash
# 开发模式（uTools）
pnpm dev:all          # 同时启动 Vite + preload 监听

# 开发模式（浏览器）
pnpm dev:browser      # 启动 Vite + preload + API 服务器

# 生产构建
pnpm build            # preload 编译 + Vue 构建

# 单独构建 preload
pnpm tsc:preload      # TypeScript 编译 + 复制静态资源
```

构建管线：
1. `scripts/build-preload.cjs` 清理 `public/preload/`
2. `tsc -p tsconfig.preload.json` 编译 `src/preload/*.ts` → `public/preload/*.js`
3. 复制 `package.json`、`proxy-daemon.html` 到 `public/preload/`
4. `vite build` 构建前端到 `dist/`

## 架构要点

### Preload 类结构

| 类名 | 文件 | 职责 |
|------|------|------|
| `UtoolsPreload` | preload.ts | 主入口，初始化和 API 暴露 |
| `ProviderStore` | provider-db.ts | 供应商 CRUD、切换、导入导出 |
| `ProxyManager` | proxy.ts | 路由组管理、代理启停、接管/还原 |
| `McpManager` | mcp.ts | MCP 服务器配置管理 |
| `SessionManager` | sessions.ts | 会话扫描和详情加载 |
| `PromptManager` | prompts.ts | 提示词 CRUD、备份恢复 |
| `SkillManager` | skills.ts | 技能安装、部署、搜索 |
| `StatsCollector` | stats.ts | 用量统计扫描 |
| `DataMigration` | cleanup.ts | 数据迁移和清理 |
| `ConnectionTester` | test-connection.ts | API 连接测试 |

保持函数式的模块：
- `config-rw.ts` - 配置文件读写（各 Agent 配置格式不同，函数式更清晰）
- `utils.ts` - 工具函数和路径常量
- `proxy-daemon.ts` - 独立窗口运行，不走主入口
- `proxy-converter.ts` - 独立窗口运行，不走主入口

### API 暴露

`preload.ts` 通过 `window.utoolsCctoggle` 暴露所有 API。前端通过 `src/types/utools-cctoggle.d.ts` 中的 `UtoolsCctoggle` 接口获取类型提示。

### 浏览器开发模式

```
Vue 组件 → window.utoolsCctoggle (browser-adapter mock)
         → fetch('/api/...') → Vite proxy → dev-api-server.cjs
         → require('public/preload/模块') → 真实文件系统
```

`import.meta.env.DEV` 确保浏览器适配器代码不会进入生产构建。

## uTools 插件配置

`public/plugin.json`:
- `"preload": "preload/preload.js"` - preload 入口
- `"main": "index.html"` - 前端入口

uTools 预加载环境提供：
- `utools` 全局对象（db、dbStorage、dbCryptoStorage、getPath、createBrowserWindow 等）
- Node.js API（fs、path、os 等）
- Electron API（ipcRenderer 等，仅 proxy-daemon 使用）

## 开发规范

- Preload 模块使用类 + 静态方法（除 P2 工具模块）
- TypeScript 类型注解，移除 `@ts-nocheck`
- `config-rw.ts` 和 `utils.ts` 使用 ES `export` 语法
- proxy-daemon.ts 和 proxy-converter.ts 在独立 BrowserWindow 中运行，保持函数式
- 提示/弹窗统一用 useMessage()/useDialog()，composable 不弹提示只返回结果（详见 references/frontend.md）
- API 接口保持不变，前端无需修改

## ⚠️ API 同步规则（重要）

**新增或修改 preload API 方法时，必须同步更新以下 3 个文件：**

| 文件 | 作用 | 不更新的后果 |
|------|------|-------------|
| `src/preload/preload.ts` | 暴露 API 到 `window.utoolsCctoggle` | uTools 环境下前端调不到 |
| `src/types/utools-cctoggle.d.ts` | TypeScript 类型定义 | 前端没有类型提示 |
| `src/utils/browser-adapter.ts` | 浏览器模式 mock | 浏览器开发模式下返回 undefined |

**需要真实数据的 API** 还需更新：
| 文件 | 作用 |
|------|------|
| `scripts/dev-api-server.cjs` | 浏览器模式 API 服务器 |

**操作清单：**
```
1. 在 preload 模块中添加/修改 static 方法
2. 在 preload.ts 的 exposeApi() 中注册到 window.utoolsCctoggle
3. 在 utools-cctoggle.d.ts 的 UtoolsCctoggle 接口中添加类型声明
4. 在 browser-adapter.ts 的 createBrowserApi() 中添加 mock 实现
5. 如需真实数据，在 dev-api-server.cjs 中添加 HTTP 路由处理
```

**删除 API 方法时**，同样需要从以上所有文件中移除对应代码。
