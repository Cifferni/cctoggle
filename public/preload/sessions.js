var utils = require("./utils");
var fs = utils.fs;
var path = utils.path;
var getHomeDir = utils.getHomeDir;
var _scanCache = {
    data: null,
    timestamp: 0,
    TTL: 30000,
};
var _sessionCache = {};
function _clearScanCache() {
    _scanCache.data = null;
    _scanCache.timestamp = 0;
}
var CHUNK_SIZE = 4096;
async function _readHeadAndTail(filePath) {
    var fd;
    try {
        fd = await fs.promises.open(filePath, "r");
    }
    catch (e) {
        return { head: [], tail: [], size: 0 };
    }
    try {
        var size = (await fd.stat()).size;
        var headLen = Math.min(CHUNK_SIZE, size);
        var headBuf = Buffer.alloc(headLen);
        await fd.read(headBuf, 0, headLen, 0);
        var head = headBuf.toString("utf8").split(/\r?\n/);
        var tail = [];
        if (size > CHUNK_SIZE) {
            var tailPos = size - CHUNK_SIZE;
            var tailBuf = Buffer.alloc(CHUNK_SIZE);
            await fd.read(tailBuf, 0, CHUNK_SIZE, tailPos);
            tail = tailBuf.toString("utf8").split(/\r?\n/);
        }
        return { head: head, tail: tail, size: size };
    }
    catch (e) {
        return { head: [], tail: [], size: 0 };
    }
    finally {
        await fd.close();
    }
}
function _countMessageLines(lines) {
    var count = 0;
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (!line || line[0] !== "{")
            continue;
        try {
            var d = JSON.parse(line);
            if (d && (d.type === "assistant" || d.type === "human" || d.type === "user"
                || (d.type === "event_msg" && d.payload && (d.payload.type === "user_message" || d.payload.type === "agent_message"))
                || (d.type === "message" && d.message && (d.message.role === "user" || d.message.role === "assistant"))))
                count++;
        }
        catch (e) { }
    }
    return count;
}
function _estimateMessageCount(headLines, tailLines, size) {
    if (size <= CHUNK_SIZE * 2)
        return _countMessageLines(headLines);
    return _countMessageLines(headLines) + _countMessageLines(tailLines);
}
async function _parseClaudeMeta(filePath, projectName) {
    var r = await _readHeadAndTail(filePath);
    var headLines = r.head;
    var tailLines = r.tail;
    var sessionId = path.basename(filePath, ".jsonl");
    var title = "";
    var firstTs = "";
    var lastTs = "";
    var tokenUsage = 0;
    var lastModel = "";
    var projectPath = "";
    for (var i = 0; i < headLines.length; i++) {
        var line = headLines[i];
        if (!line || line[0] !== "{")
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
        if (d.type === "summary" && d.summary)
            title = d.summary;
        if (!projectPath && d.cwd)
            projectPath = d.cwd;
        if (d.type === "assistant" || d.type === "human" || d.type === "user") {
            if (d.timestamp) {
                if (!firstTs)
                    firstTs = d.timestamp;
                lastTs = d.timestamp;
            }
            if (!title && d.type === "user" && d.message && d.message.content) {
                var c = typeof d.message.content === "string" ? d.message.content : "";
                if (c.length > 60)
                    c = c.substring(0, 60) + "...";
                if (c)
                    title = c;
            }
            if (d.type === "assistant" && d.message && d.message.usage) {
                var u = d.message.usage;
                tokenUsage += (Number(u.input_tokens) || 0) + (Number(u.output_tokens) || 0);
                if (d.message.model && d.message.model !== "<synthetic>")
                    lastModel = d.message.model;
            }
        }
    }
    for (var j = 0; j < tailLines.length; j++) {
        var line2 = tailLines[j];
        if (!line2 || line2[0] !== "{")
            continue;
        var d2;
        try {
            d2 = JSON.parse(line2);
        }
        catch (e) {
            continue;
        }
        if (!d2 || typeof d2 !== "object")
            continue;
        if (d2.type === "assistant" || d2.type === "human" || d2.type === "user") {
            if (d2.timestamp)
                lastTs = d2.timestamp;
            if (d2.type === "assistant" && d2.message && d2.message.usage) {
                var u2 = d2.message.usage;
                tokenUsage += (Number(u2.input_tokens) || 0) + (Number(u2.output_tokens) || 0);
                if (d2.message.model && d2.message.model !== "<synthetic>")
                    lastModel = d2.message.model;
            }
        }
    }
    var messageCount = _estimateMessageCount(headLines, tailLines, r.size);
    if (!title)
        title = sessionId.substring(0, 12) + "...";
    if (!projectPath)
        projectPath = (projectName || "").replace(/-/g, "/");
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
async function _parseCodexMeta(filePath) {
    var r = await _readHeadAndTail(filePath);
    var headLines = r.head;
    var tailLines = r.tail;
    var sessionId = path.basename(filePath, ".jsonl");
    var title = "";
    var firstTs = "";
    var lastTs = "";
    var tokenUsage = 0;
    var lastModel = "";
    var projectPath = "";
    for (var i = 0; i < headLines.length; i++) {
        var line = headLines[i];
        if (!line || line[0] !== "{")
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
        if (d.type === "session_meta" && d.payload) {
            if (d.payload.cwd)
                projectPath = d.payload.cwd;
            if (d.payload.model_provider)
                lastModel = d.payload.model_provider;
        }
        if (d.type === "event_msg" && d.payload) {
            if (d.payload.type === "user_message" && d.payload.message) {
                if (!title) {
                    var t = d.payload.message;
                    if (t.length > 60)
                        t = t.substring(0, 60) + "...";
                    title = t;
                }
            }
            else if (d.payload.type === "token_count" && d.payload.info && d.payload.info.last_token_usage) {
                var u = d.payload.info.last_token_usage;
                tokenUsage += (Number(u.input_tokens) || 0) + (Number(u.output_tokens) || 0);
            }
        }
        if (d.type === "response_item" && d.payload && d.payload.model)
            lastModel = d.payload.model;
        if (d.timestamp) {
            if (!firstTs)
                firstTs = d.timestamp;
            lastTs = d.timestamp;
        }
    }
    for (var j = 0; j < tailLines.length; j++) {
        var line2 = tailLines[j];
        if (!line2 || line2[0] !== "{")
            continue;
        var d2;
        try {
            d2 = JSON.parse(line2);
        }
        catch (e) {
            continue;
        }
        if (!d2 || typeof d2 !== "object")
            continue;
        if (d2.type === "event_msg" && d2.payload) {
            if (d2.payload.type === "token_count" && d2.payload.info && d2.payload.info.last_token_usage) {
                var u2 = d2.payload.info.last_token_usage;
                tokenUsage += (Number(u2.input_tokens) || 0) + (Number(u2.output_tokens) || 0);
            }
        }
        if (d2.type === "response_item" && d2.payload && d2.payload.model)
            lastModel = d2.payload.model;
        if (d2.timestamp)
            lastTs = d2.timestamp;
    }
    var messageCount = _estimateMessageCount(headLines, tailLines, r.size);
    if (!title)
        title = sessionId.substring(0, 12) + "...";
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
async function _parseOpenClawMeta(filePath, agentId) {
    var r = await _readHeadAndTail(filePath);
    var headLines = r.head;
    var tailLines = r.tail;
    var sessionId = path.basename(filePath, ".jsonl");
    var title = "";
    var firstTs = "";
    var lastTs = "";
    var tokenUsage = 0;
    var lastModel = "";
    var projectPath = "";
    function parseOpenClawLines(lines) {
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (!line || line[0] !== "{")
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
            if (d.type === "session") {
                if (d.id)
                    sessionId = d.id;
                if (d.cwd)
                    projectPath = d.cwd;
                if (d.timestamp) {
                    if (!firstTs)
                        firstTs = d.timestamp;
                    lastTs = d.timestamp;
                }
            }
            if (d.type === "message" && d.message) {
                var role = d.message.role || "";
                if (role === "user" || role === "assistant") {
                    if (!title && role === "user") {
                        var c = "";
                        if (typeof d.message.content === "string")
                            c = d.message.content;
                        else if (Array.isArray(d.message.content)) {
                            for (var k = 0; k < d.message.content.length; k++) {
                                if (d.message.content[k].type === "text") {
                                    c = d.message.content[k].text;
                                    break;
                                }
                            }
                        }
                        if (c) {
                            title = c.substring(0, 60);
                            if (c.length > 60)
                                title += "...";
                        }
                    }
                    if (d.message.usage) {
                        var u = d.message.usage;
                        tokenUsage += (Number(u.input) || 0) + (Number(u.output) || 0) + (Number(u.totalTokens) || 0);
                    }
                    if (d.message.model)
                        lastModel = d.message.model;
                }
                if (d.timestamp) {
                    if (!firstTs)
                        firstTs = d.timestamp;
                    lastTs = d.timestamp;
                }
            }
            if (d.timestamp && d.type !== "session" && d.type !== "message") {
                if (!firstTs)
                    firstTs = d.timestamp;
                lastTs = d.timestamp;
            }
        }
    }
    parseOpenClawLines(headLines);
    parseOpenClawLines(tailLines);
    var messageCount = _estimateMessageCount(headLines, tailLines, r.size);
    if (!title)
        title = sessionId.substring(0, 12) + "...";
    if (!projectPath && agentId)
        projectPath = agentId;
    return {
        id: "openclaw_" + sessionId,
        app: "openclaw",
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
async function _collectFilesWithMtime(dirPath, recursive) {
    var results = [];
    var entries;
    try {
        entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    }
    catch (e) {
        return results;
    }
    for (var i = 0; i < entries.length; i++) {
        var ent = entries[i];
        var fullPath = path.join(dirPath, ent.name);
        if (ent.isDirectory() && recursive) {
            var sub = await _collectFilesWithMtime(fullPath, true);
            results = results.concat(sub);
        }
        else if (ent.isFile() && /\.jsonl$/i.test(ent.name)) {
            var st;
            try {
                st = await fs.promises.stat(fullPath);
            }
            catch (e) {
                continue;
            }
            results.push({ path: fullPath, mtime: st.mtimeMs });
        }
    }
    return results;
}
async function _scanClaudeSessions(home, opts) {
    opts = opts || {};
    var offset = opts.offset || 0;
    var limit = opts.limit != null ? opts.limit : 20;
    var projectsDir = utils.getAgentSessionPath("claude") || path.join(home, ".claude", "projects");
    var sessions = [];
    var entries;
    try {
        entries = await fs.promises.readdir(projectsDir, { withFileTypes: true });
    }
    catch (e) {
        return { sessions: sessions, totalFiles: 0 };
    }
    var allFiles = [];
    for (var i = 0; i < entries.length; i++) {
        var ent = entries[i];
        if (!ent.isDirectory())
            continue;
        var projectPath = path.join(projectsDir, ent.name);
        var files;
        try {
            files = await fs.promises.readdir(projectPath);
        }
        catch (e) {
            continue;
        }
        for (var j = 0; j < files.length; j++) {
            var fname = files[j];
            if (!/\.jsonl$/i.test(fname))
                continue;
            var filePath = path.join(projectPath, fname);
            var st;
            try {
                st = await fs.promises.stat(filePath);
            }
            catch (e) {
                continue;
            }
            allFiles.push({ path: filePath, mtime: st.mtimeMs, project: ent.name });
        }
    }
    allFiles.sort(function (a, b) { return b.mtime - a.mtime; });
    var skipped = 0;
    for (var k = 0; k < allFiles.length; k++) {
        var f = allFiles[k];
        var session = await _parseClaudeMeta(f.path, f.project);
        if (!session)
            continue;
        if (skipped < offset) {
            skipped++;
            continue;
        }
        sessions.push(session);
        if (sessions.length >= limit)
            break;
    }
    return { sessions: sessions, totalFiles: allFiles.length };
}
async function _scanClaudeDesktopSessions(home, opts) {
    opts = opts || {};
    var offset = opts.offset || 0;
    var limit = opts.limit != null ? opts.limit : 20;
    var projectsDir = utils.getAgentSessionPath("claude-desktop") || path.join(home, ".claude-desktop", "projects");
    var entries;
    try {
        entries = await fs.promises.readdir(projectsDir, { withFileTypes: true });
    }
    catch (e) {
        if (utils.getAgentSessionPath("claude-desktop")) {
            projectsDir = path.join(home, ".claude-desktop", "projects");
            try {
                entries = await fs.promises.readdir(projectsDir, { withFileTypes: true });
            }
            catch (e2) {
            }
        }
        if (!entries) {
            var appData;
            try {
                appData = process.env.APPDATA || "";
            }
            catch (e3) {
                appData = "";
            }
            if (appData) {
                try {
                    var altDir = path.join(appData, "Claude", "projects");
                    entries = await fs.promises.readdir(altDir, { withFileTypes: true });
                    projectsDir = altDir;
                }
                catch (e4) {
                    return { sessions: [], totalFiles: 0 };
                }
            }
            else {
                return { sessions: [], totalFiles: 0 };
            }
        }
    }
    var allFiles = [];
    for (var i = 0; i < entries.length; i++) {
        var ent = entries[i];
        if (!ent.isDirectory())
            continue;
        var projectPath = path.join(projectsDir, ent.name);
        var files;
        try {
            files = await fs.promises.readdir(projectPath);
        }
        catch (e) {
            continue;
        }
        for (var j = 0; j < files.length; j++) {
            var fname = files[j];
            if (!/\.jsonl$/i.test(fname))
                continue;
            var filePath = path.join(projectPath, fname);
            var st;
            try {
                st = await fs.promises.stat(filePath);
            }
            catch (e) {
                continue;
            }
            allFiles.push({ path: filePath, mtime: st.mtimeMs, project: ent.name });
        }
    }
    allFiles.sort(function (a, b) { return b.mtime - a.mtime; });
    var sessions = [];
    var skipped = 0;
    for (var k = 0; k < allFiles.length; k++) {
        var f = allFiles[k];
        var meta = await _parseClaudeMeta(f.path, f.project);
        if (!meta)
            continue;
        meta.id = "claude-desktop_" + meta.sessionId;
        meta.app = "claude-desktop";
        if (skipped < offset) {
            skipped++;
            continue;
        }
        sessions.push(meta);
        if (sessions.length >= limit)
            break;
    }
    return { sessions: sessions, totalFiles: allFiles.length };
}
async function _scanCodexSessions(home, opts) {
    opts = opts || {};
    var offset = opts.offset || 0;
    var limit = opts.limit != null ? opts.limit : 20;
    var sessionsDir = utils.getAgentSessionPath("codex") || path.join(home, ".codex", "sessions");
    var sessions = [];
    var totalFiles = 0;
    var scanned = 0;
    var years;
    try {
        years = await fs.promises.readdir(sessionsDir, { withFileTypes: true });
    }
    catch (e) {
        return { sessions: sessions, totalFiles: 0 };
    }
    var yearNames = years.filter(function (e) { return e.isDirectory(); }).map(function (e) { return e.name; }).sort().reverse();
    for (var yi = 0; yi < yearNames.length; yi++) {
        var yearDir = path.join(sessionsDir, yearNames[yi]);
        var months;
        try {
            months = await fs.promises.readdir(yearDir, { withFileTypes: true });
        }
        catch (e) {
            continue;
        }
        var monthNames = months.filter(function (e) { return e.isDirectory(); }).map(function (e) { return e.name; }).sort().reverse();
        for (var mi = 0; mi < monthNames.length; mi++) {
            var monthDir = path.join(yearDir, monthNames[mi]);
            var days;
            try {
                days = await fs.promises.readdir(monthDir, { withFileTypes: true });
            }
            catch (e) {
                continue;
            }
            var dayNames = days.filter(function (e) { return e.isDirectory(); }).map(function (e) { return e.name; }).sort().reverse();
            for (var di = 0; di < dayNames.length; di++) {
                var dayDir = path.join(monthDir, dayNames[di]);
                var files;
                try {
                    files = await fs.promises.readdir(dayDir);
                }
                catch (e) {
                    continue;
                }
                var jsonlFiles = files.filter(function (f) { return /\.jsonl$/i.test(f); }).sort().reverse();
                for (var fi = 0; fi < jsonlFiles.length; fi++) {
                    totalFiles++;
                    if (scanned < offset) {
                        scanned++;
                        continue;
                    }
                    if (sessions.length >= limit)
                        continue;
                    var session = await _parseCodexMeta(path.join(dayDir, jsonlFiles[fi]));
                    if (session)
                        sessions.push(session);
                    scanned++;
                }
            }
        }
    }
    return { sessions: sessions, totalFiles: totalFiles };
}
async function _scanOpenClawSessions(home, opts) {
    opts = opts || {};
    var offset = opts.offset || 0;
    var limit = opts.limit != null ? opts.limit : 20;
    var agentsDir = utils.getAgentSessionPath("openclaw") || path.join(home, ".openclaw", "agents");
    var sessions = [];
    var agentEntries;
    try {
        agentEntries = await fs.promises.readdir(agentsDir, { withFileTypes: true });
    }
    catch (e) {
        return { sessions: sessions, totalFiles: 0 };
    }
    var allFiles = [];
    for (var i = 0; i < agentEntries.length; i++) {
        var agentEnt = agentEntries[i];
        if (!agentEnt.isDirectory())
            continue;
        var sessDir = path.join(agentsDir, agentEnt.name, "sessions");
        var files;
        try {
            files = await fs.promises.readdir(sessDir);
        }
        catch (e) {
            continue;
        }
        for (var j = 0; j < files.length; j++) {
            var fname = files[j];
            if (!/\.jsonl$/i.test(fname))
                continue;
            var filePath = path.join(sessDir, fname);
            var st;
            try {
                st = await fs.promises.stat(filePath);
            }
            catch (e) {
                continue;
            }
            allFiles.push({ path: filePath, mtime: st.mtimeMs, agent: agentEnt.name });
        }
    }
    allFiles.sort(function (a, b) { return b.mtime - a.mtime; });
    var skipped = 0;
    for (var k = 0; k < allFiles.length; k++) {
        var f = allFiles[k];
        var session = await _parseOpenClawMeta(f.path, f.agent);
        if (!session)
            continue;
        if (skipped < offset) {
            skipped++;
            continue;
        }
        sessions.push(session);
        if (sessions.length >= limit)
            break;
    }
    return { sessions: sessions, totalFiles: allFiles.length };
}
function _detectApp(filePath) {
    if (filePath.indexOf(".codex") >= 0)
        return "codex";
    if (filePath.indexOf(".openclaw") >= 0 || filePath.indexOf("openclaw") >= 0)
        return "openclaw";
    if (filePath.indexOf("claude-desktop") >= 0)
        return "claude-desktop";
    return "claude";
}
function _extractContentBlocks(content) {
    if (!content)
        return [];
    if (typeof content === "string")
        return [{ type: "text", text: content }];
    if (Array.isArray(content)) {
        var blocks = [];
        for (var i = 0; i < content.length; i++) {
            var item = content[i];
            if (!item || typeof item !== "object")
                continue;
            if (item.type === "text" && item.text) {
                blocks.push({ type: "text", text: item.text });
            }
            else if (item.type === "thinking" && item.thinking) {
                blocks.push({ type: "thinking", text: item.thinking });
            }
            else if (item.type === "tool_use") {
                blocks.push({ type: "tool_use", name: item.name || "unknown", input: item.input || {} });
            }
            else if (item.type === "toolCall") {
                blocks.push({ type: "tool_use", name: item.name || "unknown", input: {} });
            }
            else if (item.type === "tool_result") {
                var resultText = _extractToolResultText(item);
                if (resultText)
                    blocks.push({ type: "tool_result", text: resultText, name: item.tool_use_id || "" });
            }
        }
        return blocks;
    }
    return [{ type: "text", text: JSON.stringify(content) }];
}
function _extractToolResultText(item) {
    if (!item)
        return "";
    var c = item.content;
    if (typeof c === "string")
        return c;
    if (Array.isArray(c)) {
        var parts = [];
        for (var i = 0; i < c.length; i++) {
            if (c[i] && c[i].type === "text" && c[i].text)
                parts.push(c[i].text);
        }
        return parts.join("\n");
    }
    return "";
}
function _extractContent(content) {
    var blocks = _extractContentBlocks(content);
    var parts = [];
    for (var i = 0; i < blocks.length; i++) {
        var b = blocks[i];
        if (b.type === "text")
            parts.push(b.text);
        else if (b.type === "thinking")
            parts.push(b.text);
        else if (b.type === "tool_use")
            parts.push("[工具调用: " + b.name + "]");
    }
    return parts.join("");
}
function _mergeMessages(messages) {
    if (messages.length <= 1)
        return messages;
    var merged = [messages[0]];
    for (var i = 1; i < messages.length; i++) {
        var prev = merged[merged.length - 1];
        var cur = messages[i];
        if (cur.role === prev.role) {
            prev.contentBlocks = prev.contentBlocks.concat(cur.contentBlocks);
            if (cur.timestamp)
                prev.timestamp = cur.timestamp;
        }
        else {
            merged.push(cur);
        }
    }
    return merged;
}
function _parseOpenClawMessages(lines) {
    var messages = [];
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (!line || line[0] !== "{")
            continue;
        var d;
        try {
            d = JSON.parse(line);
        }
        catch (e) {
            continue;
        }
        if (!d || d.type !== "message" || !d.message)
            continue;
        var role = d.message.role || "";
        if (role !== "user" && role !== "assistant")
            continue;
        var blocks = _extractContentBlocks(d.message.content);
        if (blocks.length > 0)
            messages.push({ role: role, contentBlocks: blocks, timestamp: d.timestamp || "" });
    }
    return messages;
}
function _parseCodexMessages(lines) {
    var messages = [];
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (!line || line[0] !== "{")
            continue;
        var d;
        try {
            d = JSON.parse(line);
        }
        catch (e) {
            continue;
        }
        if (!d || d.type !== "event_msg" || !d.payload)
            continue;
        if (d.payload.type === "user_message" && d.payload.message) {
            messages.push({ role: "user", contentBlocks: [{ type: "text", text: d.payload.message }], timestamp: d.timestamp || "" });
        }
        else if (d.payload.type === "agent_message" && d.payload.message) {
            messages.push({ role: "assistant", contentBlocks: [{ type: "text", text: d.payload.message }], timestamp: d.timestamp || "" });
        }
    }
    return messages;
}
function _parseClaudeMessages(lines) {
    var messages = [];
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (!line || line[0] !== "{")
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
        if (d.type === "human" || d.type === "user") {
            var raw = d.message ? d.message.content : d.content;
            var blocks = _extractContentBlocks(raw);
            if (blocks.length > 0)
                messages.push({ role: "user", contentBlocks: blocks, timestamp: d.timestamp || "" });
        }
        else if (d.type === "assistant") {
            var araw = d.message ? d.message.content : d.content;
            var ablocks = _extractContentBlocks(araw);
            if (ablocks.length > 0)
                messages.push({ role: "assistant", contentBlocks: ablocks, timestamp: d.timestamp || "" });
        }
    }
    return messages;
}
var _MESSAGE_PARSERS = {
    openclaw: _parseOpenClawMessages,
    codex: _parseCodexMessages,
    claude: _parseClaudeMessages,
    "claude-desktop": _parseClaudeMessages,
};
async function loadSessionDetail(filePath) {
    if (!filePath)
        return null;
    if (_sessionCache[filePath])
        return _sessionCache[filePath];
    var text;
    try {
        text = await fs.promises.readFile(filePath, "utf8");
    }
    catch (e) {
        return null;
    }
    var app = _detectApp(filePath);
    if (app === "claude") {
        var firstLine = text.split(/\r?\n/)[0] || "";
        if (firstLine.indexOf('"type":"session"') >= 0 && firstLine.indexOf('"version":3') >= 0)
            app = "openclaw";
    }
    var lines = text.split(/\r?\n/);
    var parser = _MESSAGE_PARSERS[app] || _parseClaudeMessages;
    var messages = _mergeMessages(parser(lines));
    _sessionCache[filePath] = messages;
    return messages;
}
function deleteSession(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            delete _sessionCache[filePath];
            _clearScanCache();
            return { success: true };
        }
        return { success: false, error: "file not found" };
    }
    catch (e) {
        return { success: false, error: String(e && e.message ? e.message : e) };
    }
}
function _sortSessions(sessions, sort) {
    var sorted = sessions.slice();
    switch (sort) {
        case "today":
            var today = new Date().toISOString().substring(0, 10);
            sorted = sorted.filter(function (s) { return (s.updatedAt || "").substring(0, 10) === today; });
            sorted.sort(function (a, b) { return (b.updatedAt || "").localeCompare(a.updatedAt || ""); });
            break;
        case "time-asc":
            sorted.sort(function (a, b) { return (a.updatedAt || "").localeCompare(b.updatedAt || ""); });
            break;
        case "name-asc":
            sorted.sort(function (a, b) { return (a.title || "").localeCompare(b.title || ""); });
            break;
        case "name-desc":
            sorted.sort(function (a, b) { return (b.title || "").localeCompare(a.title || ""); });
            break;
        case "time-desc":
        case "all":
        default:
            sorted.sort(function (a, b) { return (b.updatedAt || "").localeCompare(a.updatedAt || ""); });
            break;
    }
    return sorted;
}
var SCAN_MAP = {
    claude: _scanClaudeSessions,
    codex: _scanCodexSessions,
    openclaw: _scanOpenClawSessions,
    "claude-desktop": _scanClaudeDesktopSessions,
};
async function scanSessions(app, opts) {
    opts = opts || {};
    var offset = opts.offset || 0;
    var limit = opts.limit != null ? opts.limit : 20;
    var search = (opts.search || "").toLowerCase();
    var sort = opts.sort || "time-desc";
    try {
        var home = getHomeDir();
        var now = Date.now();
        var cacheKey = app || "all";
        var cached = _scanCache.data && _scanCache.data[cacheKey];
        var useCache = !search && cached && (now - _scanCache.timestamp < _scanCache.TTL);
        if (useCache) {
            var sorted = _sortSessions(cached.sessions, sort);
            var total = sorted.length;
            var page = sorted.slice(offset, offset + limit);
            return { sessions: page, total: total };
        }
        var all = [];
        if (app && SCAN_MAP[app]) {
            var r = await SCAN_MAP[app](home, { offset: 0, limit: Infinity });
            all = r.sessions;
        }
        else {
            var results = await Promise.all([
                _scanClaudeSessions(home, { offset: 0, limit: Infinity }),
                _scanCodexSessions(home, { offset: 0, limit: Infinity }),
                _scanOpenClawSessions(home, { offset: 0, limit: Infinity }),
                _scanClaudeDesktopSessions(home, { offset: 0, limit: Infinity }),
            ]);
            for (var i = 0; i < results.length; i++) {
                all = all.concat(results[i].sessions);
            }
        }
        if (!search && limit > 0) {
            if (!_scanCache.data)
                _scanCache.data = {};
            _scanCache.data[cacheKey] = { sessions: all };
            _scanCache.timestamp = now;
        }
        if (search) {
            all = all.filter(function (s) {
                return (s.title || "").toLowerCase().indexOf(search) >= 0
                    || (s.projectPath || "").toLowerCase().indexOf(search) >= 0
                    || (s.model || "").toLowerCase().indexOf(search) >= 0;
            });
        }
        all = _sortSessions(all, sort);
        var total2 = all.length;
        var page2 = all.slice(offset, offset + limit);
        return { sessions: page2, total: total2 };
    }
    catch (e) {
        return { sessions: [], total: 0, error: String(e && e.message ? e.message : e) };
    }
}
function clearAllSessions(filePaths) {
    if (!Array.isArray(filePaths))
        return { success: false, error: "invalid input" };
    var successCount = 0;
    var errors = [];
    for (var i = 0; i < filePaths.length; i++) {
        try {
            if (fs.existsSync(filePaths[i])) {
                fs.unlinkSync(filePaths[i]);
                delete _sessionCache[filePaths[i]];
                successCount++;
            }
        }
        catch (e) {
            errors.push(String(e && e.message ? e.message : e));
        }
    }
    _clearScanCache();
    return { success: successCount > 0, count: successCount, errors: errors };
}
function clearSessionCache() {
    _scanCache.data = null;
    _scanCache.timestamp = 0;
    _sessionCache = {};
}
module.exports = {
    scanSessions: scanSessions,
    loadSessionDetail: loadSessionDetail,
    deleteSession: deleteSession,
    clearAllSessions: clearAllSessions,
    clearSessionCache: clearSessionCache,
};
