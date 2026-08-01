# 数据系统

## 主题系统

### 主题列表
| 主题名称 | 文件 | 描述 |
|---------|------|------|
| amber | `themes/amber.js` | 琥珀色（默认） |
| midnight | `themes/midnight.js` | 午夜蓝 |
| deepnight | `themes/deepnight.js` | 深空黑 |

### 主题结构
```javascript
// themes/index.js
export const themes = [amberTheme, midnightTheme, deepnightTheme]
export const defaultThemeName = 'amber'
export function getThemeByName(name) { /* 按名称查找主题 */ }
```

### 主题配置
- 使用 Naive UI 的 `themeOverrides` 机制
- `buildOverrides.js` - 构建主题覆盖配置
- CSS 变量用于自定义样式

### 主题切换（useTheme.js）
```javascript
// composables/useTheme.js
const currentThemeName = ref(localStorage.getItem('cctoggle-theme') || defaultThemeName)
const isDark = ref(savedDark !== null ? savedDark === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches)

export function useTheme() {
  const currentTheme = computed(() => getThemeByName(currentThemeName.value))
  const themeColors = computed(() => isDark.value ? currentTheme.value.colors.dark : currentTheme.value.colors.light)
  const theme = computed(() => (isDark.value ? darkTheme : lightTheme))
  const themeOverrides = computed(() => buildOverrides(currentTheme.value, isDark.value))

  function setTheme(name) { /* 切换主题 */ }
  function toggleDark() { /* 切换深色模式 */ }

  return { theme, themeOverrides, isDark, currentThemeName, themes, setTheme, toggleDark }
}
```

### CSS 变量
主题切换时自动同步到 CSS 自定义属性：
```css
--bg, --bg-card, --bg-hover, --border
--text, --text-secondary, --text-muted
--primary, --primary-hover, --primary-pressed, --primary-suppl, --primary-light
--danger, --danger-light, --success, --success-light
```

### 深色模式
- 支持手动切换和系统跟随
- localStorage 持久化（`cctoggle-dark` 键）
- 监听系统主题变化自动更新

### 主题配置结构
```javascript
// themes/amber.js
export const amberTheme = {
  name: 'amber',
  label: '琥珀色',
  colors: {
    light: {
      bg: '#fffbeb',
      bgCard: '#ffffff',
      bgHover: '#fef3c7',
      border: '#fde68a',
      text: '#1c1917',
      textSecondary: '#44403c',
      textMuted: '#a8a29e',
      primary: '#d97706',
      primaryHover: '#b45309',
      primaryPressed: '#92400e',
      primarySuppl: '#fbbf24',
      primaryLight: '#fef3c7',
      danger: '#dc2626',
      dangerLight: '#fee2e2',
      success: '#16a34a',
      successLight: '#dcfce7',
    },
    dark: {
      bg: '#1c1917',
      bgCard: '#292524',
      bgHover: '#44403c',
      border: '#57534e',
      text: '#fafaf9',
      textSecondary: '#d6d3d1',
      textMuted: '#a8a29e',
      primary: '#f59e0b',
      primaryHover: '#d97706',
      primaryPressed: '#b45309',
      primarySuppl: '#fbbf24',
      primaryLight: '#451a03',
      danger: '#ef4444',
      dangerLight: '#450a0a',
      success: '#22c55e',
      successLight: '#052e16',
    },
  },
  overrides: {
    common: {
      primaryColor: '#d97706',
      // ... 更多配置
    },
  },
}
```

---

## 预设系统

### 预设数据结构
```javascript
// data/presets.js - 聚合器
PRESETS = {
  codex: [...],           // Codex 预设
  claude: [...],          // Claude 预设
  "claude-desktop": [...], // Claude Desktop 预设
  openclaw: [...],        // OpenClaw 预设
  gemini: [...]           // Gemini 预设
}
```

### 预设合并逻辑
- `mergeCodex()` - 合并 Codex 预设（生成 config TOML）
- `mergeSimple()` - 合并其他 Agent 预设
- 从 `providers.js` 读取供应商元数据（baseUrl、icon 等）

### Codex 配置生成
```javascript
// data/presets.js - generateCodexConfig()
function generateCodexConfig(p) {
  const lines = [
    `model_provider = "custom"`,
    `model = "${p.model || ""}"`,
  ];
  if (p.reviewModel) lines.push(`review_model = "${p.reviewModel}"`);
  if (!p.noReasoningEffort) {
    lines.push(`model_reasoning_effort = "${p.reasoningEffort || "high"}"`);
  }
  lines.push(`disable_response_storage = true`);
  // ... 更多配置项
  lines.push("");
  lines.push("[model_providers.custom]");
  lines.push(`name = "${p.configName || p.provider}"`);
  lines.push(`base_url = "${p.baseUrl || ""}"`);
  lines.push(`wire_api = "${p.wireApi || "responses"}"`);
  lines.push(`requires_openai_auth = true`);
  return lines.join("\n");
}
```

### 预设字段说明
| 字段 | 说明 | 示例 |
|------|------|------|
| provider | 供应商 ID | `"deepseek"` |
| model | 默认模型 | `"deepseek-coder"` |
| wireApi | Codex 连接协议 | `"responses"` / `"chat"` |
| apiFormat | 代理转换格式 | `""` / `"openai_chat"` / `"anthropic"` |
| reasoningEffort | 推理强度 | `"low"` / `"medium"` / `"high"` |
| baseUrl | API 地址 | `"https://api.deepseek.com/v1"` |

---

## 提示词模板系统

### 模板数据
```javascript
// data/prompt-templates.js
promptTemplates = [
  {
    id: "template_general_assistant",
    name: "通用助手",
    description: "基础对话模板",
    content: "你是一个 helpful, harmless, and honest 的 AI 助手...",
    agents: ["codex", "claude", "gemini", "openclaw"],
    variables: [],           // 可用变量列表
    tags: ["通用", "基础"],
    isTemplate: true,
  },
  // ... 更多模板
]
```

### 变量系统
```javascript
// data/prompt-templates.js
variableDescriptions = {
  current_file: { name: "当前文件", description: "当前打开的文件路径", example: "..." },
  language: { name: "编程语言", description: "当前文件的编程语言", example: "javascript" },
  user_input: { name: "用户输入", description: "用户的原始输入内容", example: "..." },
  // ... 更多变量
}
```

### 内置模板
| 模板 ID | 名称 | 描述 | 支持的 Agent |
|---------|------|------|-------------|
| template_general_assistant | 通用助手 | 基础对话模板 | codex, claude, gemini, openclaw |
| template_code_expert | 代码专家 | 编程辅助模板 | codex, claude, gemini, openclaw |
| template_writing_assistant | 写作助手 | 文案创作模板 | claude, gemini, openclaw |
| template_translator | 翻译专家 | 多语言翻译模板 | claude, gemini, openclaw |
| template_data_analyst | 数据分析师 | 数据分析模板 | claude, gemini, openclaw |

---

## 供应商元数据系统

### 供应商元数据结构（providers.js）
```javascript
// src/data/providers.js
export const PROVIDERS = {
  "deepseek": {
    "name": "DeepSeek",
    "websiteUrl": "https://platform.deepseek.com",
    "apiKeyUrl": "https://platform.deepseek.com/api_keys",
    "category": "cn_official",
    "icon": "deepseek",
    "iconColor": "#1E88E5",
    "badge": ""
  },
  "openai_official": {
    "name": "OpenAI Official",
    "websiteUrl": "https://chatgpt.com/codex",
    "apiKeyUrl": "",
    "category": "official",
    "icon": "openai",
    "iconColor": "#00A67E",
    "badge": "official"
  },
  // ... 80+ 供应商
};
```

### 分类标签（category）
| 分类 | 说明 | 颜色 |
|------|------|------|
| official | 官方 | 蓝色 (#3b82f6) |
| cn_official | 国内官方 | 绿色 (#22c55e) |
| partner | 合作 | 黄色 (#f59e0b) |
| prime | Prime | 紫色 (#a855f7) |
| third_party | 第三方 | 默认 |
| custom | 自定义 | 默认 |
| aggregator | 聚合器 | 默认 |
| cloud_provider | 云服务商 | 默认 |

### 徽章（badge）
| 徽章 | 说明 |
|------|------|
| official | 官方认证 |
| partner | 合作伙伴 |
| prime | Prime 推荐 |
| "" | 无徽章 |

### 图标系统
- 图标文件位于 `src/assets/images/agents/`
- 支持 SVG 格式
- 图标颜色可通过 `iconColor` 自定义
- 预设图标：openai、anthropic、google、kimi、deepseek、glm、qwen、grok、packycode、custom

### 使用场景
- 供应商卡片显示名称、图标、分类标签
- 供应商表单预填网站链接、API Key 申请链接
- 预设选择器显示供应商信息
- 分类筛选和排序

---

## 数据库键命名规范

```
cctoggle_provider_{appType}_{providerId}  # 供应商
cctoggle_route_{appType}_{routeId}        # 路由组
cctoggle_stat_clearedAt                   # 统计清除时间戳
cctoggle_route_port                       # 端口配置
cctoggle_route_backup                     # 切换前备份
cctoggle_last_active_app                  # 上次活跃 Agent
ccswitch_skill_paths                      # Skill 存储路径
ccswitch_skill_repos                      # Skill 仓库
ccswitch_sync_mode                        # 同步模式
ccswitch_nest_registry                    # 部署注册表
ccswitch_project_targets                  # 项目目标
ccswitch_config_paths                     # Agent 配置路径
```
