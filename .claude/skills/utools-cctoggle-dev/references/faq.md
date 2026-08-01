# 常见问题

## Q: 为什么使用 `window.utoolsCctoggle` 而不是标准 API？

A: uTools 插件的 preload 脚本运行在 Node.js 环境，而前端运行在浏览器环境。通过 `window` 对象暴露 API 是两者通信的桥梁。

## Q: `toPlain()` 函数的作用？

A: 将 Vue 响应式代理对象转换为普通对象，避免 uTools IPC 通信时出现 "An object could not be cloned" 错误。

## Q: 如何调试 preload 脚本？

A: 在 uTools 开发者工具中，preload 脚本的 `console.log` 输出会显示在开发者工具的控制台中。preload 由 13 个模块组成（`services.js` 入口 + 12 个功能模块），修改任一模块后需重启 uTools 才能生效。

详见 → `backend.md` 的「前后端通信机制」章节

## Q: 用量统计的数据从哪来？为什么不是代理采集的？

A: **统计数据源是两个 CLI 的本地会话日志，与代理无关**（`scanUsageLogs` in `stats.js`）：

- Claude Code：`~/.claude/projects/**/*.jsonl`，取 `type:"assistant"` 行的 `message.usage`（单次增量）+ `message.model`
- Codex：`~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`，取 `token_count` 事件的 **`last_token_usage`（增量）**，
  model 从 `turn_context.payload.model` 归因。**禁止用 `total_token_usage`（累计值，会翻倍）**。

详见 → `backend.md` 的「stats.js - 用量统计」章节

## Q: 为什么「关掉 uTools 面板后用 CLI，统计一直为空」？（架构陷阱）

A: 这是旧「代理采集」方案的根因，也是 uTools 多窗口架构的通用陷阱：

- 代理跑在 `createBrowserWindow` 起的**独立隐藏 daemon 窗口**里，通过 `utools.sendToParent(channel, data)` 上报。
- `sendToParent` 落地为**主窗口**的 `parent-message` 事件——**只有主 UI 窗口存活并注册了监听器时才有接收方**。
- 用户「开代理 → 关面板 → 用 CLI」时主窗口已销毁，daemon 照常转发（代理能用），但每个 `proxy-usage`
  事件无人接收、被直接丢弃 → 统计永远为空。

**教训**：任何需要「面板关闭后仍持续」的数据持久化，都不能依赖主窗口的 IPC 监听器。要么在 daemon 内直接写
`utools.db`（daemon 也能访问），要么改用不依赖运行时的数据源（如本次改成扫本地日志）。`proxy-stat` 只在
面板打开时才需要，所以这个坑平时看不出来。

## Q: Codex 代理协议错配排查

A: 这类是 Codex 代理透传/转换的协议错配，排查顺序（详见 `architecture.md` 的 Codex 协议模型）：

1. **`missing tools.function`**：上游是 Responses 端点，却被当成 Chat Completions 转换了。
   检查供应商「上游协议」应选 **Responses 兼容**（`apiFormat=openai_responses`），而非 Chat Completions。
   判断依据是供应商文档声明的协议，不能靠域名猜（火山 `/api/plan/v3`=Responses、`/api/coding/v3`=Chat）。
2. **404 `.../v3/v1/responses`**：上游 baseUrl 自带路径段时，代理注入的伪前缀 `/v1` 未剥离。
   已在 `proxy-daemon.js` forward 处理（仅带路径段时剥 `/v1`）。
3. **400 `reasoning not supported`**：上游不支持 `reasoning` 参数。已由 forward 的自适应重试处理
   （剥离 reasoning 重试一次）。官方支持 reasoning 的端点不触发，功能不退化。
4. **改配置后仍报错**：代理进程内存里的成员是启动时快照，改 provider 后必须**重启代理接管**
   才会重新下发 cfg（`switchProvider` 不会热更新正在运行的代理）。
5. **调试手段**：在 `proxy-daemon.js` forward 里临时 `appendFileSync` 落盘转发决策与上游响应体，
   定位后务必删除临时诊断代码。

## Q: 如何添加新的主题？

A: 主题系统位于 `src/themes/`，添加新主题的步骤：

1. **创建主题文件**：在 `src/themes/` 下创建 `newTheme.js`
```javascript
// themes/newTheme.js
export const newTheme = {
  name: 'newTheme',
  label: '新主题名称',
  overrides: {
    common: {
      primaryColor: '#颜色值',
      // ... 更多颜色配置
    },
    Button: {
      // ... 组件级覆盖（可选）
    },
  },
}
```

2. **注册主题**：在 `src/themes/index.js` 中导入并添加
```javascript
import { newTheme } from './newTheme.js'
export const themes = [amberTheme, midnightTheme, deepnightTheme, newTheme]
```

3. **主题配置说明**：
   - `name` - 主题唯一标识（用于 localStorage 存储）
   - `label` - 显示名称（用于 UI 选择）
   - `overrides` - Naive UI 主题覆盖配置
   - 参考 Naive UI 主题文档：https://www.naiveui.com/os-theme/docs/theme

详见 → `data-system.md` 的「主题系统」章节

## Q: 如何添加新的预设供应商？

A: 预设系统位于 `src/data/`，添加新供应商的步骤：

1. **添加供应商元数据**：在 `src/data/providers.js` 中添加
```javascript
// data/providers.js
export const PROVIDERS = {
  // ... 现有供应商
  new_provider: {
    name: "新供应商",
    baseUrl: "https://api.newprovider.com/v1",
    icon: "provider-icon.svg",
    iconColor: "#颜色值",
    category: "custom",  // openai / anthropic / custom
    websiteUrl: "https://newprovider.com",
    apiKeyUrl: "https://newprovider.com/api-keys",
  },
};
```

2. **添加 Agent 预设**：在对应的 `presets-{agent}.js` 中添加
```javascript
// data/presets-codex.js
export default [
  // ... 现有预设
  {
    provider: "new_provider",
    model: "new-model-name",
    wireApi: "responses",  // 或 "chat"
    apiFormat: "",  // 或 "openai_chat" / "anthropic"
  },
];
```

详见 → `data-system.md` 的「预设系统」和「供应商元数据系统」章节

## Q: 如何添加新的提示词模板？

A: 提示词模板位于 `src/data/prompt-templates.js`，添加新模板的步骤：

1. **添加模板数据**：
```javascript
// data/prompt-templates.js
export const promptTemplates = [
  // ... 现有模板
  {
    id: "template_new_template",
    name: "新模板名称",
    description: "模板描述",
    content: `模板内容，支持 {{variable}} 变量占位符`,
    agents: ["codex", "claude", "gemini", "openclaw"],
    variables: ["variable1", "variable2"],
    tags: ["标签1", "标签2"],
    isTemplate: true,
  },
];
```

2. **添加变量描述**（如果使用新变量）：
```javascript
// data/prompt-templates.js
export const variableDescriptions = {
  // ... 现有变量
  variable1: {
    name: "变量显示名称",
    description: "变量描述",
    example: "示例值",
  },
};
```

详见 → `data-system.md` 的「提示词模板系统」章节

## Q: Skill 同步模式有什么区别？

A: Skill 同步模式决定了 Skill 如何部署到 Agent 目录：

### 复制同步（copy）
- **原理**：将 Skill 文件复制到目标 Agent 目录
- **优点**：
  - 跨平台通用（Windows/macOS/Linux）
  - 无需特殊权限
  - 各 Agent 目录独立，互不影响
- **缺点**：
  - 占用额外磁盘空间
  - 修改 Skill 后需要重新同步
- **适用场景**：
  - 跨盘部署（如 C 盘 Skill 部署到 D 盘 Agent）
  - 需要独立副本的场景

### 软链接（symlink）
- **原理**：创建符号链接指向原始 Skill 文件
- **优点**：
  - 不占用额外磁盘空间
  - 修改 Skill 后所有 Agent 自动生效
  - 节省同步时间
- **缺点**：
  - Windows 需要管理员权限（使用 junction 替代）
  - 跨盘链接可能失败
  - 删除原文件会导致链接失效
- **适用场景**：
  - 同盘部署
  - 频繁修改 Skill 的开发场景

### 配置方法
1. **UI 设置**：设置页面 → 同步设置（SyncSettings）
2. **存储位置**：`utools.dbStorage` 的 `ccswitch_sync_mode` 键
3. **可选值**：`"copy"` 或 `"symlink"`（默认 `"symlink"`）

### 自动降级
当软链接失败时（如跨盘），系统会自动降级为复制模式，并在 UI 提示用户。

## Q: 后端模块如何与前端通信？

A: uTools 插件的前后端通信机制：

详见 → `backend.md` 的「前后端通信机制」章节

## Q: 如何调试后端代码？

A: 后端调试方法：

详见 → `backend.md` 的「前后端通信机制」章节

## Q: 如何添加新的后端模块？

A: 添加新模块的步骤：

详见 → `backend.md` 的「前后端通信机制」章节

## Q: 后端数据存储有哪些方式？

A: uTools 提供三种存储 API：

详见 → `backend.md` 的「数据存储方式」章节
