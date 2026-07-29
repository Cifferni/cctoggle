// uTools ccToggle - utils.js
// 工具函数与路径常量

const fs = require("fs");
const path = require("path");
const os = require("os");

function getHomeDir() {
  const home = utools.getPath("home");
  if (home && home.trim()) return home;
  return os.homedir();
}

function getCodexAuthPath() {
  return path.join(getHomeDir(), ".codex", "auth.json");
}

function getCodexConfigPath() {
  return path.join(getHomeDir(), ".codex", "config.toml");
}

function getClaudeSettingsPath() {
  return path.join(getHomeDir(), ".claude", "settings.json");
}

function getGeminiEnvPath() {
  return path.join(getHomeDir(), ".gemini", ".env");
}

function getOpenClawConfigPath() {
  return path.join(getHomeDir(), ".openclaw", "openclaw.json");
}

// 纯路径展开（~ → homeDir）
function expandHome(p) {
  if (!p) return p;
  if (p === "~") return getHomeDir();
  if (p.indexOf("~/") === 0 || p.indexOf("~\\") === 0) return path.join(getHomeDir(), p.slice(2));
  return p;
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// Codex model_catalog_json requires base_instructions on each model (or parsing fails).
// Hardcoded minimal instructions, always written on switch/proxy; no external file dependency.
const CODEX_BASE_INSTRUCTIONS = [
  "You are Codex, a coding agent that collaborates with the user in a shared workspace until the task is genuinely handled.",
  "",
  "Working style:",
  "- Read the relevant code before changing it. Prefer the repo's existing patterns, frameworks, and helpers over inventing new abstractions.",
  "- Keep edits tightly scoped to the request. Do not revert or refactor unrelated changes the user made.",
  "- Use apply_patch for file edits; do not write files via shell tricks. Use rg / rg --files for search.",
  "- Default to ASCII unless the file already uses other characters.",
  "- If the user asks a question or wants a plan, answer it; otherwise implement the change and try to work through blockers yourself.",
  "- If you could not run or verify something (e.g. tests), say so.",
  "",
  "Communication:",
  "- Be concise and direct. Use short paragraphs; add lists or headers only when they help.",
  "- Reference real files as clickable markdown links with absolute paths, e.g. [file.js](/abs/path/file.js:12).",
  "- Wrap commands, paths, and code identifiers in backticks; put multi-line code in fenced blocks.",
  "- The user does not see command output, so summarize important results.",
  "- Do not use emojis or em dashes unless asked.",
].join("\n");

function getCodexInstructions() {
  return { base_instructions: CODEX_BASE_INSTRUCTIONS, instructions_variables: {} };
}

function copyDirSync(src, dest) {
  ensureDir(dest);
  fs.readdirSync(src, { withFileTypes: true }).forEach(function(entry) {
    var s = path.join(src, entry.name), d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirSync(s, d);
    else fs.copyFileSync(s, d);
  });
}

module.exports = {
  fs: fs,
  path: path,
  os: os,
  getHomeDir: getHomeDir,
  getCodexAuthPath: getCodexAuthPath,
  getCodexConfigPath: getCodexConfigPath,
  getClaudeSettingsPath: getClaudeSettingsPath,
  getGeminiEnvPath: getGeminiEnvPath,
  getOpenClawConfigPath: getOpenClawConfigPath,
  expandHome: expandHome,
  ensureDir: ensureDir,
  generateId: generateId,
  CODEX_BASE_INSTRUCTIONS: CODEX_BASE_INSTRUCTIONS,
  getCodexInstructions: getCodexInstructions,
  copyDirSync: copyDirSync,
};
