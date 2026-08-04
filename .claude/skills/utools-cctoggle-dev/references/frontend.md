# 前端参考

## 技术栈

- Vue 3（Composition API）
- Naive UI（组件库）
- Vue Router（路由）
- Chart.js + vue-chartjs（统计图表）
- Vite（构建工具）

## 目录结构

```
src/
├── main.ts              # 入口：创建 Vue app，注入 browser mock
├── App.vue              # 根组件
├── router/index.ts      # 路由配置
├── setup.ts             # uTools 动态命令注册
├── types/
│   ├── utools-cctoggle.d.ts  # 完整 API 接口定义
│   └── env.d.ts              # window.utoolsCctoggle 类型声明
├── composables/         # 组合式函数（业务逻辑）
│   ├── shared.ts        # 常量和工具函数
│   ├── useProviders.ts  # 供应商管理
│   ├── useRoutes.ts     # 路由组管理
│   ├── useSession.ts    # 会话管理
│   ├── usePrompts.ts    # 提示词管理
│   ├── useSkills.ts     # 技能管理
│   ├── useMcp.ts        # MCP 管理
│   ├── useStats.ts      # 统计数据
│   └── ...
├── components/          # 组件
│   ├── provider/        # 供应商相关
│   ├── session/         # 会话相关
│   ├── prompt/          # 提示词相关
│   ├── skills/          # 技能相关
│   ├── mcp/             # MCP 相关
│   ├── routes/          # 路由组相关
│   └── common/          # 通用组件
├── views/               # 页面
└── data/                # 静态数据（预设配置等）
```

## API 调用方式

前端通过 `window.utoolsCctoggle` 调用后端：

```ts
// composables/useProviders.ts
const api = window.utoolsCctoggle!

// 同步调用
const providers = api.listProviders('claude')

// 异步调用
const result = await api.scanSessions('claude', { offset: 0, limit: 20 })
```

类型提示来自 `src/types/utools-cctoggle.d.ts` 中的 `UtoolsCctoggle` 接口。

## 浏览器开发模式

`src/main.ts` 中检测环境：

```ts
if (import.meta.env.DEV) {
  if (!isUtoolsEnv()) {
    (window as any).utoolsCctoggle = createBrowserApi()
  }
}
```

`import.meta.env.DEV` 是 Vite 编译时常量，生产构建时整个 if 块被移除。

## uTools 集成

`src/setup.ts` 注册 uTools 动态命令：
- 用户输入 `cctoggle` 或 `cc` 时打开插件
- `utools.onPluginEnter` / `utools.onPluginOut` 处理生命周期

`src/utils/openUrl.ts` 处理外部链接打开（uTools 环境 vs 浏览器）。
