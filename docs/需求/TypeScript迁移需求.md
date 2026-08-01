# TypeScript 迁移需求文档

## 1. 背景与目标

### 1.1 背景

CCToggle 项目当前为纯 JavaScript 代码库，无任何 TypeScript 基础设施。随着项目功能增长（供应商管理、代理路由、Skill 管理、用量统计、会话管理、提示词管理、MCP 管理等），缺乏类型系统导致：

- 重构时缺乏编译期安全保障，容易引入运行时错误
- `window.utoolsCctoggle` 桥接层无类型定义，前端调用 preload API 全靠记忆
- IDE 代码补全和提示能力受限，开发效率有提升空间
- 新人上手成本高，接口契约不明确

### 1.2 目标

采用**渐进式迁移**策略，将项目从纯 JavaScript 迁移至 TypeScript，优先覆盖前端核心逻辑，后端 preload 层通过类型声明文件获得类型覆盖。

### 1.3 非目标

- 不改变项目功能和业务逻辑
- 不改变运行时行为
- 不强制一次性全量迁移

---

## 2. 现状分析

### 2.1 项目规模

| 区域 | 文件数 | 代码行数 | 模块系统 |
|------|--------|----------|----------|
| src/（Vue 前端） | 57 | ~9,500 | ES Modules |
| public/preload/（Node.js 后端） | 13 | ~5,400 | CommonJS |
| **合计** | **70** | **~14,900** | — |

### 2.2 src/ 文件分布

| 目录 | 文件数 | 代码行数 | 说明 |
|------|--------|----------|------|
| components/ | 18 .vue | 3,969 | 可复用 UI 组件 |
| views/ | 10 .vue + 1 子目录 | 2,668 | 页面级组件 |
| composables/ | 10 .js | 1,512 | 业务逻辑（useSession、useProviders 等） |
| data/ | 7 .js | 743 | 静态预设数据 |
| themes/ | 5 .js | 471 | 主题定义 |
| utils/ | 2 .js | 29 | 工具函数 |
| router/ | 1 .js | 28 | 路由配置 |
| main.js / setup.js / App.vue | 3 | ~95 | 入口文件 |

### 2.3 public/preload/ 文件分布

| 文件 | 代码行数 | 说明 |
|------|----------|------|
| sessions.js | 833 | 会话扫描与解析 |
| proxy-daemon.js | 643 | 代理守护进程管理 |
| skills.js | 582 | Skill 管理 |
| config-rw.js | 504 | 配置文件读写 |
| mcp.js | 490 | MCP 服务器 CRUD |
| proxy.js | 466 | 代理生命周期 |
| proxy-converter.js | 454 | API 格式转换 |
| prompts.js | 455 | 提示词管理 |
| utils.js | 219 | 路径工具函数 |
| stats.js | 176 | 用量统计扫描 |
| services.js | 168 | 入口：组装 window.utoolsCctoggle |
| cleanup.js | 135 | 数据迁移与清理 |
| provider-db.js | 265 | 供应商 CRUD 与切换 |

### 2.4 现有 TypeScript 基础设施

| 项目 | 状态 |
|------|------|
| tsconfig.json | ❌ 不存在 |
| typescript 依赖 | ❌ 未安装 |
| vue-tsc 依赖 | ❌ 未安装 |
| .d.ts 类型声明文件 | ❌ 无 |
| auto-imports.d.ts | ❌ 未生成 |
| utools-api-types | ✅ 已有（v7.5.1） |

### 2.5 依赖 TS 支持情况

| 依赖 | 版本 | TS 支持 |
|------|------|---------|
| vue | ^3.5.0 | ✅ 内置 |
| vue-router | ^4.6.4 | ✅ 内置 |
| naive-ui | ^2.44.1 | ✅ 内置 |
| chart.js | ^4.5.1 | ✅ 内置 |
| vue-chartjs | ^5.3.4 | ✅ 内置 |
| marked | ^18.0.7 | ✅ 内置 |
| @vicons/ionicons5 | ^0.13.0 | ⚠️ 可能需要声明 |
| vite | ^6.0.0 | ✅ 原生支持 |
| @vitejs/plugin-vue | ^5.2.0 | ✅ 原生支持 |

---

## 3. 迁移方案

### 3.1 总体策略

采用**六阶段渐进式迁移**，每阶段独立可验收，前一阶段不影响后续阶段的推进。

```
阶段 1 → 阶段 2 → 阶段 3 → 阶段 4 → 阶段 5 → 阶段 6（可选）
基础设施    桥接层     composables  组件层    data/     后端 preload
                    前端核心逻辑   UI 层    themes
```

### 3.2 阶段 1：基础设施搭建

**目标**：项目可以编译和运行 TypeScript 代码，但不强制所有文件迁移。

**工作内容**：

1. 安装依赖
   - `typescript`
   - `vue-tsc`
   - `@vue/tsconfig`

2. 创建 `tsconfig.json`
   - 配置 `strict: true`
   - 配置路径别名（`@/` → `src/`）
   - 配置 `include` / `exclude`

3. 创建 `tsconfig.node.json`
   - 用于 vite.config 等 Node 端配置文件

4. 将 `vite.config.js` → `vite.config.ts`

5. 配置 `unplugin-auto-import` 生成 `auto-imports.d.ts`

6. 配置 `unplugin-vue-components` 生成 `components.d.ts`

7. 更新 `.gitignore` 添加类型声明生成文件

**验收标准**：
- `pnpm dev` 正常启动
- `pnpm build` 正常构建
- 新建 `.ts` 文件可正常编译运行
- 现有 `.js` 文件不受影响

**预估工作量**：半天

---

### 3.3 阶段 2：桥接层类型定义

**目标**：为 `window.utoolsCctoggle` 编写完整的 TypeScript 类型声明，使整个前端获得 preload API 的类型提示。

**工作内容**：

1. 创建 `src/types/utools-cctoggle.d.ts`
   - 定义 `Provider` 接口
   - 定义 `Skill` 接口
   - 定义 `McpServer` 接口
   - 定义 `Session` / `SessionMessage` 接口
   - 定义 `Prompt` 接口
   - 定义 `StatsRecord` 接口
   - 定义 `ProxyRoute` / `RouteGroup` 接口
   - 定义 `UtoolsCctoggle` 接口（覆盖 `window.utoolsCctoggle` 的完整 API）

2. 创建 `src/types/env.d.ts`
   - 声明 `*.vue` 模块
   - 声明 `utools` 全局变量类型（复用 `utools-api-types`）
   - 声明 `window.utoolsCctoggle` 扩展

3. 更新 `src/composables/shared.js`
   - 为 `getSkillNest()` 添加返回值类型注解

**验收标准**：
- 在任意 composable 或组件中调用 `getSkillNest()` 方法时，IDE 提供完整的参数和返回值提示
- `window.utoolsCctoggle` 的所有方法均有类型定义

**预估工作量**：1 天

---

### 3.4 阶段 3：前端 composables 迁移

**目标**：将 10 个 composable 文件从 `.js` 迁移至 `.ts`。

**待迁移文件**：

| 文件 | 代码行数 | 复杂度 |
|------|----------|--------|
| useSession.js | 343 | 高 |
| useProviders.js | ~200 | 中 |
| useSkills.js | ~200 | 中 |
| useStats.js | ~150 | 中 |
| useMcp.js | ~100 | 低 |
| usePrompts.js | ~100 | 低 |
| useThemes.js | ~100 | 低 |
| useConfirm.js | ~30 | 低 |
| useToast.js | ~30 | 低 |
| shared.js | 85 | 中（核心桥接） |

**工作内容**：

1. 逐文件重命名为 `.ts`
2. 添加函数参数类型和返回值类型
3. 为 reactive state 定义接口
4. 将 `var` 声明改为 `const` / `let`
5. 移除不必要的 `require()` 调用，统一为 `import`

**验收标准**：
- 所有 composable 文件为 `.ts` 后缀
- `vue-tsc --noEmit` 无类型错误
- 功能行为不变

**预估工作量**：2-3 天

---

### 3.5 阶段 4：前端组件层迁移

**目标**：为 29 个 `.vue` 文件添加 TypeScript 支持。

**待迁移文件**：

| 目录 | 文件数 | 说明 |
|------|--------|------|
| components/ | 18 | 可复用组件 |
| views/ | 10+ | 页面组件 |

**工作内容**：

1. 将 `<script setup>` 改为 `<script setup lang="ts">`
2. 为 `defineProps` 添加类型定义（使用泛型语法）
3. 为 `defineEmits` 添加类型定义
4. 为模板中使用的变量添加类型注解
5. 为事件处理函数添加参数类型

**验收标准**：
- 所有 `.vue` 文件使用 `<script setup lang="ts">`
- `vue-tsc --noEmit` 无类型错误
- UI 行为不变

**预估工作量**：2-3 天

---

### 3.6 阶段 5：静态数据与主题迁移

**目标**：将 `data/` 和 `themes/` 目录的 JS 文件迁移至 TS。

**待迁移文件**：

| 目录 | 文件数 | 代码行数 |
|------|--------|----------|
| data/ | 7 | 743 |
| themes/ | 5 | 471 |

**工作内容**：

1. 为供应商预设数据定义 `ProviderPreset` 接口
2. 为主题定义 `Theme` 接口
3. 为数据导出添加 `as const` 断言或类型注解
4. 将文件重命名为 `.ts`

**验收标准**：
- 所有数据文件有明确的类型导出
- IDE 可正确推断数据结构

**预估工作量**：1 天

---

### 3.7 阶段 6：后端 preload 迁移（可选）

**目标**：将 `public/preload/` 下的 13 个 CommonJS 文件迁移至 TypeScript。

**风险与约束**：

- preload 文件运行在 uTools 的 Node.js 环境中，不经 Vite 编译
- 需要引入额外的构建步骤（esbuild 或 rollup）
- 编译产物需要验证与 uTools preload 机制的兼容性
- 工作量大，收益相对有限（运行时类型检查在 Node 端价值较低）

**可选方案**：

| 方案 | 说明 | 工作量 |
|------|------|--------|
| A. 源码迁移 | 引入构建工具，将 .ts 编译为 .js 再由 uTools 加载 | 3-5 天 |
| B. 仅类型声明 | 为 preload 模块编写 .d.ts 文件，不改源码 | 1 天 |
| C. 不迁移 | 保持现状，依赖阶段 2 的桥接层类型覆盖 | 0 |

**建议**：采用方案 B 或 C，通过阶段 2 的 `UtoolsCctoggle` 接口已覆盖 preload API 的类型，性价比最高。

**预估工作量**：0-5 天（取决于方案选择）

---

## 4. 需新增依赖

| 包名 | 类型 | 用途 |
|------|------|------|
| typescript | devDep | TypeScript 编译器 |
| vue-tsc | devDep | Vue SFC 类型检查 |
| @vue/tsconfig | devDep | 推荐的基础 tsconfig 配置 |

---

## 5. 风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 迁移过程中引入回归 bug | 功能异常 | 每阶段迁移后进行功能自测 |
| uTools preload 环境与 TS 编译产物不兼容 | 后端不可用 | 阶段 6 优先选择方案 B（仅类型声明） |
| 部分文件混用 var/const，类型推断困难 | 类型错误多 | 迁移时一并重构变量声明 |
| @vicons/ionicons5 缺少类型定义 | IDE 报错 | 编写 shim 声明文件 |
| 迁移周期长，与功能开发冲突 | 进度延迟 | 渐进式迁移，每个阶段独立可发布 |

---

## 6. 里程碑与排期

| 阶段 | 内容 | 预估工时 | 前置依赖 |
|------|------|----------|----------|
| 阶段 1 | 基础设施搭建 | 0.5 天 | 无 |
| 阶段 2 | 桥接层类型定义 | 1 天 | 阶段 1 |
| 阶段 3 | composables 迁移 | 2-3 天 | 阶段 2 |
| 阶段 4 | 组件层迁移 | 2-3 天 | 阶段 3 |
| 阶段 5 | 静态数据/主题迁移 | 1 天 | 阶段 2 |
| 阶段 6 | 后端 preload（可选） | 0-5 天 | 阶段 1 |
| **合计** | | **6.5-13.5 天** | |

阶段 5 与阶段 3/4 可并行推进。

---

## 7. 验收标准

### 7.1 全局验收

- [ ] `pnpm dev` 正常启动，功能无异常
- [ ] `pnpm build` 正常构建，产物体积无显著增长
- [ ] `vue-tsc --noEmit` 无类型错误
- [ ] IDE 对所有 API 调用提供完整的类型提示

### 7.2 每阶段验收

- [ ] 阶段 1：可新建 `.ts` 文件并正常编译
- [ ] 阶段 2：`getSkillNest()` 返回值有完整类型提示
- [ ] 阶段 3：所有 composable 为 `.ts`，无类型错误
- [ ] 阶段 4：所有 `.vue` 使用 `<script setup lang="ts">`，无类型错误
- [ ] 阶段 5：数据文件有明确类型导出
- [ ] 阶段 6（如执行）：preload 编译产物正常工作
