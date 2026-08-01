var utils = require("./utils");
var fs = utils.fs;
var path = utils.path;
var getHomeDir = utils.getHomeDir;
var CLEARED_KEY = "cctoggle_stat_clearedAt";
function _statDayKey(d) {
    var y = d.getFullYear();
    var m = ("0" + (d.getMonth() + 1)).slice(-2);
    var day = ("0" + d.getDate()).slice(-2);
    return y + "-" + m + "-" + day;
}
function _emptyBucket() {
    return { requests: 0, input: 0, output: 0, cacheRead: 0, cacheCreate: 0, total: 0 };
}
function _dayFromTs(ts) {
    if (!ts)
        return "";
    try {
        return _statDayKey(new Date(ts));
    }
    catch (e) {
        return "";
    }
}
var ALL_APP_TYPES = ["codex", "claude", "claude-desktop", "openclaw", "gemini"];
function _getClearedAt() {
    var doc = utools.db.get(CLEARED_KEY) || {};
    var result = {};
    for (var i = 0; i < ALL_APP_TYPES.length; i++) {
        var t = ALL_APP_TYPES[i];
        result[t] = Number(doc[t]) || 0;
    }
    return result;
}
async function _listJsonl(dir, out) {
    out = out || [];
    var entries;
    try {
        entries = await fs.promises.readdir(dir, { withFileTypes: true });
    }
    catch (e) {
        return out;
    }
    for (var i = 0; i < entries.length; i++) {
        var ent = entries[i];
        var full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
            await _listJsonl(full, out);
        }
        else if (ent.isFile() && /\.jsonl$/i.test(ent.name)) {
            out.push(full);
        }
    }
    return out;
}
async function _parseLogFile(file, appType, clearedMs, acc) {
    var text;
    try {
        text = await fs.promises.readFile(file, "utf8");
    }
    catch (e) {
        return;
    }
    var lines = text.split(/\r?\n/);
    var codexModel = "";
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
        b.requests += 1;
        b.input += input;
        b.output += output;
        b.cacheRead += cacheRead;
        b.cacheCreate += cacheCreate;
        b.total += input + output + cacheRead + cacheCreate;
        d.requests += 1;
        d.input += input;
        d.output += output;
        d.cacheRead += cacheRead;
        d.cacheCreate += cacheCreate;
        d.total += input + output + cacheRead + cacheCreate;
    }
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (!line)
            continue;
        var d;
        try {
            d = JSON.parse(line);
        }
        catch (e) {
            continue;
        }
        if (!d || typeof d !== "object")
            continue;
        if (appType === "claude") {
            if (d.type !== "assistant" || !d.message)
                continue;
            var mu = d.message.usage;
            if (!mu)
                continue;
            if (clearedMs && d.timestamp && new Date(d.timestamp).getTime() <= clearedMs)
                continue;
            var day = _dayFromTs(d.timestamp);
            if (!day)
                continue;
            var cIn = Number(mu.input_tokens) || 0;
            var cOut = Number(mu.output_tokens) || 0;
            var cRead = Number(mu.cache_read_input_tokens) || 0;
            var cCreate = Number(mu.cache_creation_input_tokens) || 0;
            if (!cIn && !cOut && !cRead && !cCreate)
                continue;
            addUsage(day, d.message.model || "unknown", cIn, cOut, cRead, cCreate);
        }
        else {
            if (d.type === "turn_context" && d.payload && d.payload.model) {
                codexModel = d.payload.model;
                continue;
            }
            if (d.type !== "event_msg" || !d.payload || d.payload.type !== "token_count")
                continue;
            var info = d.payload.info;
            var last = info && info.last_token_usage;
            if (!last)
                continue;
            if (clearedMs && d.timestamp && new Date(d.timestamp).getTime() <= clearedMs)
                continue;
            var day2 = _dayFromTs(d.timestamp);
            if (!day2)
                continue;
            var totalIn = Number(last.input_tokens) || 0;
            var cachedIn = Number(last.cached_input_tokens) || 0;
            var freshIn = Math.max(0, totalIn - cachedIn);
            var out = Number(last.output_tokens) || 0;
            var cacheCreate = Number(last.cache_write_input_tokens) || 0;
            if (!totalIn && !out && !cacheCreate)
                continue;
            addUsage(day2, codexModel || "unknown", freshIn, out, cachedIn, cacheCreate);
        }
    }
}
async function scanUsageLogs() {
    try {
        var home = getHomeDir();
        var cleared = _getClearedAt();
        var sessionPaths = {};
        try {
            sessionPaths = utools.dbStorage.getItem("ccswitch_session_paths") || {};
        }
        catch (e) {
            sessionPaths = {};
        }
        var roots = [
            { dir: utils.getAgentSessionPath("claude") || path.join(home, ".claude", "projects"), appType: "claude" },
            { dir: utils.getAgentSessionPath("codex") || path.join(home, ".codex", "sessions"), appType: "codex" },
        ];
        var acc = {};
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
    }
    catch (e) {
        return { daily: [], error: String(e && e.message ? e.message : e) };
    }
}
function clearStats(appType) {
    var doc = utools.db.get(CLEARED_KEY) || { _id: CLEARED_KEY };
    var now = Date.now();
    if (!appType || appType === "all") {
        for (var i = 0; i < ALL_APP_TYPES.length; i++)
            doc[ALL_APP_TYPES[i]] = now;
    }
    else
        doc[appType] = now;
    try {
        utools.db.put(doc);
        return { success: true };
    }
    catch (e) {
        return { success: false, error: String(e && e.message ? e.message : e) };
    }
}
module.exports = {
    scanUsageLogs: scanUsageLogs,
    clearStats: clearStats,
};
