// uTools ccToggle - sessions.js
// 会话管理：读取各 AI 应用的本地会话数据

var utils = require("./utils");
var fs = utils.fs;
var path = utils.path;
var getHomeDir = utils.getHomeDir;

var SESSION_APPS = ["claude", "codex", "openclaw", "claude-desktop"];

// --- Claude Code ---
// 会话目录: ~/.claude/projects/
// 每个项目下有若干 *.jsonl 文件，每个文件对应一个会话
// JSONL 中 type:"summary" 行含 title，type:"assistant"/"human" 为消息
async function _scanClaudeSessions(home) {
  var projectsDir = path.join(home, ".claude", "projects");
  var sessions = [];
  var entries;
  try { entries = await fs.promises.readdir(projectsDir, { withFileTypes: true }); } catch (e) { return sessions; }

  for (var i = 0; i < entries.length; i++) {
    var ent = entries[i];
    if (!ent.isDirectory()) continue;
    var projectPath = path.join(projectsDir, ent.name);
    var files;
    try { files = await fs.promises.readdir(projectPath); } catch (e) { continue; }

    for (var j = 0; j < files.length; j++) {
      var fname = files[j];
      if (!/\.jsonl$/i.test(fname)) continue;
      var filePath = path.join(projectPath, fname);
      var session = await _parseClaudeSessionFile(filePath, ent.name);
      if (session) sessions.push(session);
    }
  }
  return sessions;
}

async function _parseClaudeSessionFile(filePath, projectName) {
  var text;
  try { text = await fs.promises.readFile(filePath, "utf8"); } catch (e) { return null; }
  var lines = text.split(/\r?\n/);
  var sessionId = path.basename(filePath, ".jsonl");
  var title = "";
  var messageCount = 0;
  var firstTs = "";
  var lastTs = "";
  var tokenUsage = 0;
  var lastModel = "";
  var projectPath = "";

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line) continue;
    var d;
    try { d = JSON.parse(line); } catch (e) { continue; }
    if (!d || typeof d !== "object") continue;

    if (d.type === "summary" && d.summary) {
      title = d.summary;
    }
    // 从 cwd 字段提取项目路径
    if (!projectPath && d.cwd) {
      projectPath = d.cwd;
    }
    // Claude Code: type="user" | type="assistant"; legacy: type="human"
    if (d.type === "assistant" || d.type === "human" || d.type === "user") {
      messageCount++;
      if (d.timestamp) {
        if (!firstTs) firstTs = d.timestamp;
        lastTs = d.timestamp;
      }
      // 用首条用户消息内容作为标题
      if (!title && d.type === "user" && d.message && d.message.content) {
        var c = typeof d.message.content === "string" ? d.message.content : "";
        if (c.length > 60) c = c.substring(0, 60) + "...";
        if (c) title = c;
      }
      if (d.type === "assistant" && d.message && d.message.usage) {
        var u = d.message.usage;
        tokenUsage += (Number(u.input_tokens) || 0) + (Number(u.output_tokens) || 0);
        if (d.message.model && d.message.model !== "<synthetic>") lastModel = d.message.model;
      }
    }
  }

  if (!title) {
    title = sessionId.substring(0, 12) + "...";
  }

  // 如果没有从消息中提取到项目路径，尝试从目录名解码
  if (!projectPath) {
    projectPath = projectName.replace(/-/g, "/");
  }

  return {
    id: "claude_" + sessionId,
    app: "claude",
    sessionId: sessionId,
    title: title,
    projectPath: projectPath,
    messageCount: messageCount,
    tokenUsage: tokenUsage,
    model: lastModel,
    createdAt: firstTs || "",
    updatedAt: lastTs || "",
    filePath: filePath,
  };
}

// --- Codex ---
// 会话目录: ~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl
async function _scanCodexSessions(home) {
  var sessionsDir = path.join(home, ".codex", "sessions");
  var sessions = [];
  var jsonlFiles = await _listJsonlRecursive(sessionsDir);

  for (var i = 0; i < jsonlFiles.length; i++) {
    var session = await _parseCodexSessionFile(jsonlFiles[i]);
    if (session) sessions.push(session);
  }
  return sessions;
}

async function _parseCodexSessionFile(filePath) {
  var text;
  try { text = await fs.promises.readFile(filePath, "utf8"); } catch (e) { return null; }
  var lines = text.split(/\r?\n/);
  var sessionId = path.basename(filePath, ".jsonl");
  var title = "";
  var messageCount = 0;
  var firstTs = "";
  var lastTs = "";
  var tokenUsage = 0;
  var lastModel = "";
  var projectPath = "";

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line) continue;
    var d;
    try { d = JSON.parse(line); } catch (e) { continue; }
    if (!d || typeof d !== "object") continue;

    // session_meta: 提取项目路径和模型
    if (d.type === "session_meta" && d.payload) {
      if (d.payload.cwd) projectPath = d.payload.cwd;
      if (d.payload.model_provider) lastModel = d.payload.model_provider;
    }

    // event_msg: 用户消息 / 助手消息 / token 统计
    if (d.type === "event_msg" && d.payload) {
      if (d.payload.type === "user_message" && d.payload.message) {
        messageCount++;
        if (!title) {
          var t = d.payload.message;
          if (t.length > 60) t = t.substring(0, 60) + "...";
          title = t;
        }
      } else if (d.payload.type === "agent_message" && d.payload.message) {
        messageCount++;
      } else if (d.payload.type === "token_count" && d.payload.info && d.payload.info.last_token_usage) {
        var u = d.payload.info.last_token_usage;
        tokenUsage += (Number(u.input_tokens) || 0) + (Number(u.output_tokens) || 0);
      }
    }

    // response_item 中的 model 信息
    if (d.type === "response_item" && d.payload && d.payload.model) {
      lastModel = d.payload.model;
    }

    if (d.timestamp) {
      if (!firstTs) firstTs = d.timestamp;
      lastTs = d.timestamp;
    }
  }

  if (!title) title = sessionId.substring(0, 12) + "...";

  return {
    id: "codex_" + sessionId,
    app: "codex",
    sessionId: sessionId,
    title: title,
    projectPath: projectPath,
    messageCount: messageCount,
    tokenUsage: tokenUsage,
    model: lastModel,
    createdAt: firstTs || "",
    updatedAt: lastTs || "",
    filePath: filePath,
  };
}

// --- OpenClaw ---
// 会话目录: ~/.openclaw/sessions/*.json
async function _scanOpenClawSessions(home) {
  var sessionsDir = path.join(home, ".openclaw", "sessions");
  var sessions = [];
  var files;
  try { files = await fs.promises.readdir(sessionsDir); } catch (e) { return sessions; }

  for (var i = 0; i < files.length; i++) {
    var fname = files[i];
    if (!/\.json$/i.test(fname)) continue;
    var filePath = path.join(sessionsDir, fname);
    var session = await _parseOpenClawSessionFile(filePath);
    if (session) sessions.push(session);
  }
  return sessions;
}

async function _parseOpenClawSessionFile(filePath) {
  var text;
  try { text = await fs.promises.readFile(filePath, "utf8"); } catch (e) { return null; }
  var data;
  try { data = JSON.parse(text); } catch (e) { return null; }
  if (!data || typeof data !== "object") return null;

  var sessionId = path.basename(filePath, ".json");
  var messages = data.messages || data.conversations || [];
  var title = data.title || data.name || "";
  var tokenUsage = data.tokenUsage || data.totalTokens || 0;

  if (!title && messages.length > 0) {
    var firstMsg = messages[0];
    title = (firstMsg.content || firstMsg.text || "").substring(0, 60);
    if (title.length >= 60) title += "...";
  }
  if (!title) title = sessionId.substring(0, 12) + "...";

  return {
    id: "openclaw_" + sessionId,
    app: "openclaw",
    sessionId: sessionId,
    title: title,
    projectPath: data.projectPath || data.project || "",
    messageCount: messages.length,
    tokenUsage: tokenUsage,
    model: data.model || "",
    createdAt: data.createdAt || data.created_at || "",
    updatedAt: data.updatedAt || data.updated_at || "",
    filePath: filePath,
  };
}

// --- Claude Desktop ---
// 会话目录: ~/.claude-desktop/projects/ (与 Claude Code 类似结构)
async function _scanClaudeDesktopSessions(home) {
  var projectsDir = path.join(home, ".claude-desktop", "projects");
  var sessions = [];
  var entries;
  try { entries = await fs.promises.readdir(projectsDir, { withFileTypes: true }); } catch (e) {
    // fallback: 尝试 %APPDATA% 路径
    var appData;
    try { appData = process.env.APPDATA || ""; } catch (e2) { appData = ""; }
    if (appData) {
      try {
        var altDir = path.join(appData, "Claude", "projects");
        entries = await fs.promises.readdir(altDir, { withFileTypes: true });
        projectsDir = altDir;
      } catch (e3) { return sessions; }
    } else {
      return sessions;
    }
  }

  for (var i = 0; i < entries.length; i++) {
    var ent = entries[i];
    if (!ent.isDirectory()) continue;
    var projectPath = path.join(projectsDir, ent.name);
    var files;
    try { files = await fs.promises.readdir(projectPath); } catch (e) { continue; }

    for (var j = 0; j < files.length; j++) {
      var fname = files[j];
      if (!/\.jsonl$/i.test(fname)) continue;
      var filePath = path.join(projectPath, fname);
      var session = await _parseClaudeDesktopSessionFile(filePath, ent.name);
      if (session) sessions.push(session);
    }
  }
  return sessions;
}

async function _parseClaudeDesktopSessionFile(filePath, projectName) {
  // 结构与 Claude Code 类似
  var session = await _parseClaudeSessionFile(filePath, projectName);
  if (!session) return null;
  session.id = "claude-desktop_" + session.sessionId;
  session.app = "claude-desktop";
  return session;
}

// --- 工具函数 ---

async function _listJsonlRecursive(dir) {
  var out = [];
  var entries;
  try { entries = await fs.promises.readdir(dir, { withFileTypes: true }); } catch (e) { return out; }
  for (var i = 0; i < entries.length; i++) {
    var ent = entries[i];
    var full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      var sub = await _listJsonlRecursive(full);
      out = out.concat(sub);
    } else if (ent.isFile() && /\.jsonl?$/i.test(ent.name)) {
      out.push(full);
    }
  }
  return out;
}

// --- 加载会话详情（含消息历史）---
// filePath 由 scanSessions 已经拿到，直接读，不重复搜索

async function loadSessionDetail(filePath) {
  if (!filePath) return null;

  var text;
  try { text = await fs.promises.readFile(filePath, "utf8"); } catch (e) { return null; }
  var lines = text.split(/\r?\n/);
  var messages = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line) continue;
    var d;
    try { d = JSON.parse(line); } catch (e) { continue; }
    if (!d || typeof d !== "object") continue;

    if (app === "codex") {
      // Codex: event_msg 中的 user_message / agent_message
      if (d.type === "event_msg" && d.payload) {
        if (d.payload.type === "user_message" && d.payload.message) {
          messages.push({ role: "user", content: d.payload.message, timestamp: d.timestamp || "" });
        } else if (d.payload.type === "agent_message" && d.payload.message) {
          messages.push({ role: "assistant", content: d.payload.message, timestamp: d.timestamp || "" });
        }
      }
    } else {
      // claude / claude-desktop / openclaw
      if (d.type === "human" || d.type === "user") {
        var content = "";
        if (d.message && d.message.content) {
          content = typeof d.message.content === "string" ? d.message.content : JSON.stringify(d.message.content);
        } else if (d.content) {
          content = typeof d.content === "string" ? d.content : JSON.stringify(d.content);
        }
        if (content) messages.push({ role: "user", content: content, timestamp: d.timestamp || "" });
      } else if (d.type === "assistant") {
        var aContent = "";
        if (d.message && d.message.content) {
          aContent = typeof d.message.content === "string" ? d.message.content : JSON.stringify(d.message.content);
        } else if (d.content) {
          aContent = typeof d.content === "string" ? d.content : JSON.stringify(d.content);
        }
        if (aContent) messages.push({ role: "assistant", content: aContent, timestamp: d.timestamp || "" });
      }
    }
  }

  return messages;
}

async function _findSessionFile(dir, filename) {
  var entries;
  try { entries = await fs.promises.readdir(dir, { withFileTypes: true }); } catch (e) { return null; }
  for (var i = 0; i < entries.length; i++) {
    var ent = entries[i];
    var full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      var found = await _findSessionFile(full, filename);
      if (found) return found;
    } else if (ent.name === filename) {
      return full;
    }
  }
  return null;
}

// --- 删除会话 ---

function deleteSession(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { success: true };
    }
    return { success: false, error: "file not found" };
  } catch (e) {
    return { success: false, error: String(e && e.message ? e.message : e) };
  }
}

// --- 主入口：扫描所有会话 ---

async function scanSessions() {
  try {
    var home = getHomeDir();
    var all = [];

    var results = await Promise.all([
      _scanClaudeSessions(home),
      _scanCodexSessions(home),
      _scanOpenClawSessions(home),
      _scanClaudeDesktopSessions(home),
    ]);

    for (var i = 0; i < results.length; i++) {
      all = all.concat(results[i]);
    }

    // 按 updatedAt 降序排序
    all.sort(function (a, b) {
      return (b.updatedAt || "").localeCompare(a.updatedAt || "");
    });

    return { sessions: all };
  } catch (e) {
    return { sessions: [], error: String(e && e.message ? e.message : e) };
  }
}

module.exports = {
  scanSessions: scanSessions,
  loadSessionDetail: loadSessionDetail,
  deleteSession: deleteSession,
};
