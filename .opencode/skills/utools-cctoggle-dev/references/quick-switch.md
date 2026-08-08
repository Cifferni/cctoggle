# 快速切换（Quick Switch）

> uTools 搜索框内直接切换到某个 Agent（Codex / Claude / Claude Desktop / OpenClaw / Gemini），无需先打开主界面再点顶栏 tab。

## 交互

- 输入 `cc {Agent显示名}`（如 `cc Codex`、`cc Claude Desktop`）命中动态命令，回车后打开插件主界面并切到该 Agent 页签，弹出系统通知，**不退出插件**。
- 前缀可配置（默认 `cc`），存 `utools.dbStorage` key `cctoggle_quick_switch`。

## 命令注册

每个 Agent 注册一条 uTools 动态命令：

| 字段 | 值 |
|------|----|
| code | `ccs_switch_{appType}`，如 `ccs_switch_claude-desktop` |
| explain | `打开 CCToggle 并切换到 {Agent显示名}` |
| cmds | `['{prefix} {Agent显示名}']` |
| icon | `logo.png`（复用插件 logo） |

> 前缀 `ccs_switch_` 刻意避开旧 `switch_`（历史供应商直切命令）清理逻辑，二者互不干扰。

## 执行流程

```
onPluginEnter(code=ccs_switch_{appType})
  → parseCode() 校验 appType ∈ APP_TYPES
  → useProviders().setActiveTab(appType)   // 切 tab + 加载该 Agent 供应商列表
  → utools.showNotification(已切换到 ...)
  → 不调用 utools.outPlugin()，停留在主界面
```

`setActiveTab` 的既有副作用：会先 `stopCurrentProxy()` 停掉当前代理（与顶栏 tab 切换行为一致）。

## 特征同步

- 主命令进入插件时调用 `reconcile()`：先清所有 `ccs_switch_*` 再按全部 Agent 重注册（幂等）。
- 设置页开关/前缀变更时：`saveQuickSwitchConfig()` 立即重建或全量清理。
- Agent 集合固定（5 个），与供应商增删、profile 切换无关，无需联动。

## 相关文件

| 文件 | 职责 |
|------|------|
| `src/composables/useQuickSwitch.ts` | 核心 composable：reconcile / registerFor / unregisterFor / buildCmds / executeSwitch + 配置读写 |
| `src/setup.ts` | `onPluginEnter` 识别 `ccs_switch_` 前缀执行切入；主命令进入时 reconcile |
| `src/views/settings/ClaudeSettings.vue` | 设置页「通用配置」的「快速切换」分组（开关 + 前缀） |
| `docs/需求/quick-switch-entry.md` | 需求文档（已按 agent 切换版重写） |

## 注意事项

- 只依赖现有前端 `setActiveTab` / `loadProviders`，**无 preload API 变更**（不改 preload.ts / d.ts / browser-adapter / dev-api-server）。
- 命令注册/清理直接用 uTools 原生 `utools.setFeature` / `removeFeature`，不走 preload。
- 浏览器模式：`utools` 不存在，`isUtoolsEnv()` 为 false，reconcile / registerFor 全部跳过，页面不受影响。
- 动态命令是全局注册，插件退出后保留（供下次搜索直切），不可随插件卸载清理。
- 本功能曾误按「切换供应商」实现（`ccs_switch_{appType}_{providerId}`），后按用户澄清改为「切换 Agent」；实现时务必确认切换对象维度（Agent 顶栏 tab vs Agent 下供应商）。
