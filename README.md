<p align="center">
  <img src="public/logo.png" width="100" height="100" alt="CCToggle Logo">
</p>

<h1 align="center">CCToggle</h1>

<p align="center">
  <strong>AI CLI 供应商一键切换工具</strong>
</p>

<p align="center">
  为 Codex、Claude、Gemini、OpenClaw 等主流 AI CLI 工具管理多套 API 配置，点击即可切换 baseUrl、模型、密钥等参数，无需手动改配置文件。
</p>

---

## ✨ 功能特性

- 🔄 **一键切换** - 快速切换不同 AI 服务供应商的配置
- 🌐 **内置代理** - 自带代理服务器，支持请求转发和负载均衡
- 📊 **用量统计** - 统计各供应商的 API 调用量、Token 消耗等
- 🛣️ **路由管理** - 支持配置路由组，灵活管理多个供应商
- 📦 **技能管理** - 搜索和安装社区技能
- 🎯 **预设配置** - 内置主流供应商预设，开箱即用

## 🚀 支持的 AI 工具

| 工具 | 说明 |
|------|------|
| **Codex** | OpenAI Codex CLI |
| **Claude** | Anthropic Claude Code |
| **Gemini** | Google Gemini CLI |
| **OpenClaw** | OpenClaw CLI |

## 📦 支持的供应商

### 官方供应商

- OpenAI Official
- Claude Official (Anthropic)
- Google Official
- Azure OpenAI

### 国内供应商

- DeepSeek
- Kimi / Kimi For Coding
- 通义千问 (Qwen Coder)
- 豆包 (DouBaoSeed)
- MiniMax
- 智谱 (StepFun)
- 小米 MiMo
- 百度千帆
- 阿里百炼

### 聚合平台

- OpenRouter
- SiliconFlow
- AiHubMix
- Novita AI
- NVIDIA
- ModelScope
- 更多...


## 📸 截图

<p align="center">
  <em>coming soon...</em>
</p>

## 🛠️ 安装使用

### 前置要求

- [uTools](https://u.tools/) - 跨平台效率工具

### 安装插件

1. 打开 uTools
2. 搜索 `cctoggle` 或 `供应商切换`
3. 安装插件

### 开发环境

```bash
# 克隆项目
git clone https://github.com/your-username/utools-cctoggle.git
cd utools-cctoggle

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

## 📖 使用说明

### 基本使用

1. 呼出 uTools 输入框
2. 输入 `cc` 或 `cctoggle` 唤起插件
3. 选择要使用的 AI 工具（Codex/Claude/Gemini/OpenClaw）
4. 点击供应商卡片即可切换配置

### 代理模式

插件内置代理服务器，可以：

- 统一管理 API 密钥
- 自动负载均衡
- 记录请求日志
- 统计用量数据

### 路由配置

支持配置路由组，实现：

- 多供应商轮询
- 故障自动切换
- 自定义路由规则

## 🏗️ 项目结构

```
utools-cctoggle/
├── public/
│   ├── logo.png           # 插件图标
│   ├── plugin.json        # uTools 插件配置
│   └── preload/
│       ├── services.js    # 核心服务（代理、路由等）
│       └── proxy-daemon.js # 代理守护进程
├── src/
│   ├── components/        # Vue 组件
│   ├── composables/       # 组合式函数
│   ├── data/              # 数据（供应商、预设等）
│   ├── views/             # 页面视图
│   ├── router/            # 路由配置
│   ├── App.vue            # 根组件
│   ├── main.js            # 入口文件
│   └── setup.js           # 初始化逻辑
├── package.json
├── vite.config.js
└── README.md
```

## 🤝 贡献指南

欢迎贡献代码、提交 Issue 或 PR！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的改动 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

### 添加新供应商

1. 在 `src/data/providers.js` 中添加供应商元数据
2. 在对应的 `src/data/presets-*.js` 中添加预设配置
3. 测试配置是否正确

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。

## 🙏 致谢

- [uTools](https://u.tools/) - 优秀的跨平台效率工具
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- 所有贡献者和供应商合作伙伴

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/your-username">dfy</a>
</p>
