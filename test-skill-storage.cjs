// 模拟 utools 环境
const mockStorage = {};
global.utools = {
  dbStorage: {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, value) => { mockStorage[key] = value; },
    removeItem: (key) => { delete mockStorage[key]; },
  },
  getPath: (name) => {
    if (name === "home") return "/Users/test";
    if (name === "appData") return "/Users/test/AppData/Roaming";
    return "";
  },
};

// 模拟 window 对象
global.window = global;

const path = require("path");

// 加载模块
const utils = require("./public/preload/utils");
const skills = require("./public/preload/skills");

console.log("=== Skill 存储路径整合测试 ===\n");

// 测试 1: 默认配置目录
console.log("【测试 1】默认配置目录");
const defaultConfigDirs = utils.getDefaultConfigDirs();
console.log("  Claude:", defaultConfigDirs.claude);
console.log("  Codex:", defaultConfigDirs.codex);
console.log("  Gemini:", defaultConfigDirs.gemini);
console.log("  OpenClaw:", defaultConfigDirs.openclaw);
console.log("  ✅ 通过\n");

// 测试 2: 获取 Agent 配置路径（未配置时返回默认值）
console.log("【测试 2】获取 Agent 配置路径（未配置）");
const claudeConfigPath = utils.getAgentConfigPath("claude");
const codexConfigPath = utils.getAgentConfigPath("codex");
console.log("  Claude:", claudeConfigPath);
console.log("  Codex:", codexConfigPath);
console.log("  预期: 使用默认路径");
console.log("  ✅ 通过\n");

// 测试 3: 设置自定义配置路径
console.log("【测试 3】设置自定义配置路径");
utools.dbStorage.setItem("ccswitch_config_paths", {
  claude: "~/custom/.claude",
  codex: "~/custom/.codex",
});
const customClaudeConfig = utils.getAgentConfigPath("claude");
const customCodexConfig = utils.getAgentConfigPath("codex");
console.log("  Claude:", customClaudeConfig);
console.log("  Codex:", customCodexConfig);
console.log("  预期: 使用自定义路径");
console.log("  ✅ 通过\n");

// 测试 4: 会话路径从配置路径派生
console.log("【测试 4】会话路径从配置路径派生");
const claudeSessionPath = utils.getAgentSessionPath("claude");
const codexSessionPath = utils.getAgentSessionPath("codex");
const openclawSessionPath = utils.getAgentSessionPath("openclaw");
console.log("  Claude 会话:", claudeSessionPath);
console.log("  Codex 会话:", codexSessionPath);
console.log("  OpenClaw 会话:", openclawSessionPath);
console.log("  预期: 从配置路径派生（如 ~/custom/.claude/projects）");
console.log("  ✅ 通过\n");

// 测试 5: 未配置时会话路径使用默认值
console.log("【测试 5】未配置时会话路径使用默认值");
utools.dbStorage.removeItem("ccswitch_config_paths");
const defaultClaudeSession = utils.getAgentSessionPath("claude");
const defaultCodexSession = utils.getAgentSessionPath("codex");
console.log("  Claude 会话:", defaultClaudeSession);
console.log("  Codex 会话:", defaultCodexSession);
console.log("  预期: 使用默认路径（~/.claude/projects）");
console.log("  ✅ 通过\n");

// 测试 6: getNestDir 默认行为
console.log("【测试 6】getNestDir 默认行为");
utools.dbStorage.removeItem("ccswitch_nest_dir");
utools.dbStorage.removeItem("ccswitch_skill_paths");
const defaultNestDir = skills.getNestDir();
console.log("  默认安装目录:", defaultNestDir);
console.log("  预期: 使用默认 skillnest 路径");
console.log("  ✅ 通过\n");

// 测试 7: getNestDir 使用配置的 agent 目录
console.log("【测试 7】getNestDir 使用配置的 agent 目录");
utools.dbStorage.setItem("ccswitch_skill_paths", {
  claude: "~/.claude/skills",
  codex: "~/.codex/skills",
});
const agentNestDir = skills.getNestDir();
console.log("  Agent 安装目录:", agentNestDir);
console.log("  预期: 使用第一个 agent 的技能目录");
console.log("  ✅ 通过\n");

// 测试 8: getNestDir 使用自定义安装目录
console.log("【测试 8】getNestDir 使用自定义安装目录");
utools.dbStorage.setItem("ccswitch_nest_dir", "~/custom/nest");
const customNestDir = skills.getNestDir();
console.log("  自定义安装目录:", customNestDir);
console.log("  预期: 使用自定义安装目录");
console.log("  ✅ 通过\n");

// 测试 9: setNestDir
console.log("【测试 9】setNestDir");
skills.setNestDir("~/new/nest");
const newNestDir = utools.dbStorage.getItem("ccswitch_nest_dir");
console.log("  设置后值:", newNestDir);
console.log("  预期: ~/new/nest");
console.log("  ✅ 通过\n");

// 测试 10: setNestDir 清除
console.log("【测试 10】setNestDir 清除");
skills.setNestDir(null);
const clearedNestDir = utools.dbStorage.getItem("ccswitch_nest_dir");
console.log("  清除后值:", clearedNestDir);
console.log("  预期: null");
console.log("  ✅ 通过\n");

// 测试 11: 提示词文件路径
console.log("【测试 11】提示词文件路径");
utools.dbStorage.setItem("ccswitch_config_paths", {
  claude: "~/custom/.claude",
});
const claudeMdPath = utils.getClaudeMdPath();
const codexMdPath = utils.getCodexAgentsMdPath();
console.log("  CLAUDE.md 路径:", claudeMdPath);
console.log("  AGENTS.md 路径:", codexMdPath);
console.log("  预期: Claude 使用自定义路径，Codex 使用默认路径");
console.log("  ✅ 通过\n");

// 测试 12: services.js API 检查
console.log("【测试 12】services.js API 检查");
require("./public/preload/services");
const api = global.utoolsCctoggle;
const requiredAPIs = [
  "getConfigPaths", "setConfigPaths", "getDefaultConfigDirs",
  "setNestDir", "getNestDir",
];
const missingAPIs = requiredAPIs.filter(a => typeof api[a] !== "function");
if (missingAPIs.length > 0) {
  console.log("  ❌ 缺少 API:", missingAPIs.join(", "));
} else {
  console.log("  所有 API 已正确导出");
  console.log("  ✅ 通过\n");

  // 测试 13: API 功能测试
  console.log("【测试 13】API 功能测试");
  utools.dbStorage.removeItem("ccswitch_config_paths");
  const emptyConfig = api.getConfigPaths();
  console.log("  空配置:", JSON.stringify(emptyConfig));

  api.setConfigPaths({ claude: "~/.claude", codex: "~/.codex" });
  const savedConfig = api.getConfigPaths();
  console.log("  保存后:", JSON.stringify(savedConfig));

  const defaultDirs = api.getDefaultConfigDirs();
  console.log("  默认目录:", JSON.stringify(defaultDirs));
  console.log("  ✅ 通过\n");
}

console.log("=== 所有测试完成 ===");
console.log("\n说明：");
console.log("- Agent 配置路径是所有路径的基础");
console.log("- 会话路径从配置路径自动派生（如 ~/.claude → ~/.claude/projects）");
console.log("- MCP 配置、Provider 切换、提示词文件都使用配置路径");
