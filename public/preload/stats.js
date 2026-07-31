// uTools ccToggle - stats.js
// 用量统计（无缓存：每次直接扫描本地 CLI 会话日志）

var utils = require("./utils");
var fs = utils.fs;
var path = utils.path;
var getHomeDir = utils.getHomeDir;

// 不在 db 存聚合数据。仅存一个「清除时间戳」文档用于隐藏历史。
// Claude Code: ~/.claude/projects/**/*.jsonl（assistant 行带 message.usage + model）
// Codex:       ~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl（token_count 的 last_token_usage 增量）
var CLEARED_KEY = "cctoggle_stat_clearedAt";

function _statDayKey(d) {
// 本地日期 YYYY-MM-DD
  var y = d.getFullYear();
  var m = ("0" + (d.getMonth() + 1)).slice(-2);
  var day = ("0" + d.getDate()).slice(-2);
  return y + "-" + m + "-" + day;
}

function _emptyBucket() {
  return { requests: 0, input: 0, output: 0, cacheRead: 0, cacheCreate: 0, total: 0 };
}

function _dayFromTs(ts) {
  if (!ts) return "";
  try { return _statDayKey(new Date(ts)); } catch (e) { return ""; }
}

// 所有已知 appType（与前端 shared.js APP_TYPES 保持同步）
var ALL_APP_TYPES = ["codex", "claude", "claude-desktop", "openclaw", "gemini"];

// 读取各 agent 的清除时间戳（毫秒）；无则为 0
function _getClearedAt() {
  var doc = utools.db.get(CLEARED_KEY) || {};
  var result = {};
  for (var i = 0; i < ALL_APP_TYPES.length; i++) {
    var t = ALL_APP_TYPES[i];
    result[t] = Number(doc[t]) || 0;
  }
  return result;
}

// 递归列出目录下所有 .jsonl 文件（绝对路径，异步以让出主线程）
async function _listJsonl(dir, out) {
  out = out || [];
  var entries;
  try { entries = await fs.promises.readdir(dir, { withFileTypes: true }); } catch (e) { return out; }
  for (var i = 0; i < entries.length; i++) {
    var ent = entries[i];
    var full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      await _listJsonl(full, out);
    } else if (ent.isFile() && /\.jsonl$/i.test(ent.name)) {
      out.push(full);
    }
  }
  return out;
}

// 解析单个日志文件，把用量累加进 acc（按 "<appType>_<day>" → { appType, day, ...6字段, models }）
// clearedMs：早于此时间戳的条目跳过（清除点之前的历史被隐藏）
async function _parseLogFile(file, appType, clearedMs, acc) {
  var text;
  try { text = await fs.promises.readFile(file, "utf8"); } catch (e) { return; }
  var lines = text.split(/\r?\n/);
  var codexModel = ""; // Codex: 随 turn_context 更新，归因后续 token_count

  function bucketFor(day, model) {
    var dayKey = appType + "_" + day;
    var d = acc[dayKey] || (acc[dayKey] = { appType: appType, day: day,
      requests: 0, input: 0, output: 0, cacheRead: 0, cacheCreate: 0, total: 0, models: {} });
    var m = model || "unknown";
    return d.models[m] || (d.models[m] = _emptyBucket());
  }
  function addUsage(day, model, input, output, cacheRead, cacheCreate) {
    var b = bucketFor(day, model);
    var d = acc[appType + "_" + day];
    b.requests += 1; b.input += input; b.output += output;
    b.cacheRead += cacheRead; b.cacheCreate += cacheCreate; b.total += input + output + cacheRead + cacheCreate;
    d.requests += 1; d.input += input; d.output += output;
    d.cacheRead += cacheRead; d.cacheCreate += cacheCreate; d.total += input + output + cacheRead + cacheCreate;
  }

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line) continue;
    var d;
    try { d = JSON.parse(line); } catch (e) { continue; }
    if (!d || typeof d !== "object") continue;

    if (appType === "claude") {
      // assistant 消息：message.usage 为单次增量
      if (d.type !== "assistant" || !d.message) continue;
      var mu = d.message.usage;
      if (!mu) continue;
      if (clearedMs && d.timestamp && new Date(d.timestamp).getTime() <= clearedMs) continue;
      var day = _dayFromTs(d.timestamp);
      if (!day) continue;
      var cIn = Number(mu.input_tokens) || 0;
      var cOut = Number(mu.output_tokens) || 0;
      var cRead = Number(mu.cache_read_input_tokens) || 0;
      var cCreate = Number(mu.cache_creation_input_tokens) || 0;
      if (!cIn && !cOut && !cRead && !cCreate) continue;
      addUsage(day, d.message.model || "unknown", cIn, cOut, cRead, cCreate);
    } else {
      // codex
      if (d.type === "turn_context" && d.payload && d.payload.model) {
        codexModel = d.payload.model;
        continue;
      }
      if (d.type !== "event_msg" || !d.payload || d.payload.type !== "token_count") continue;
      var info = d.payload.info;
      var last = info && info.last_token_usage; // 增量，禁用 total_token_usage（累计值）
      if (!last) continue;
      if (clearedMs && d.timestamp && new Date(d.timestamp).getTime() <= clearedMs) continue;
      var day2 = _dayFromTs(d.timestamp);
      if (!day2) continue;
      var totalIn = Number(last.input_tokens) || 0;
      var cachedIn = Number(last.cached_input_tokens) || 0;
      var freshIn = Math.max(0, totalIn - cachedIn); // input_tokens 含缓存命中，拆出新增输入
      var out = Number(last.output_tokens) || 0;
      var cacheCreate = Number(last.cache_write_input_tokens) || 0;
      if (!totalIn && !out && !cacheCreate) continue;
      addUsage(day2, codexModel || "unknown", freshIn, out, cachedIn, cacheCreate);
    }
  }
}

// 扫描本地日志并返回全部原始按天记录（不写 db）。前端在内存中按 appType/天数过滤。
// 返回 { daily: [{ appType, day, ...6字段, models }], error? }
// 异步以让出渲染进程主线程，扫描期间 UI 不卡死
async function scanUsageLogs() {
  try {
    var home = getHomeDir();
    var cleared = _getClearedAt();
    var sessionPaths = {};
    try {
      sessionPaths = utools.dbStorage.getItem("ccswitch_session_paths") || {};
    } catch (e) { sessionPaths = {}; }

    var roots = [
      { dir: utils.getAgentSessionPath("claude") || path.join(home, ".claude", "projects"), appType: "claude" },
      { dir: utils.getAgentSessionPath("codex") || path.join(home, ".codex", "sessions"), appType: "codex" },
    ];
    var acc = {}; // "<appType>_<day>" → 记录
    for (var r = 0; r < roots.length; r++) {
      var root = roots[r];
      var clearedMs = cleared[root.appType] || 0;
      var list = await _listJsonl(root.dir);
      for (var i = 0; i < list.length; i++) {
        await _parseLogFile(list[i], root.appType, clearedMs, acc);
      }
    }
    var daily = Object.keys(acc).map(function (k) { return acc[k]; });
    return { daily: daily };
  } catch (e) {
    return { daily: [], error: String(e && e.message ? e.message : e) };
  }
}

// 清除统计：记录当前时间戳，扫描时早于此的条目被隐藏（appType="all" 则清全部）
function clearStats(appType) {
  var doc = utools.db.get(CLEARED_KEY) || { _id: CLEARED_KEY };
  var now = Date.now();
  if (!appType || appType === "all") { for (var i = 0; i < ALL_APP_TYPES.length; i++) doc[ALL_APP_TYPES[i]] = now; }
  else doc[appType] = now;
  try { utools.db.put(doc); return { success: true }; }
  catch (e) { return { success: false, error: String(e && e.message ? e.message : e) }; }
}

module.exports = {
  scanUsageLogs: scanUsageLogs,
  clearStats: clearStats,
};
