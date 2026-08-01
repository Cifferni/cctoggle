const http = require("http");
const https = require("https");
const { URL } = require("url");
const { ipcRenderer } = require("electron");
let group = null;
let members = [];
let server = null;
let healthTimer = null;
let rrIdx = 0;
let startedAt = 0;
let activeConn = 0;
let reqTotal = 0;
let reqSuccess = 0;
let reqFail = 0;
let lastMemberId = null;
let authToken = "";
const MAX_REQUEST_BYTES = 50 * 1024 * 1024;
const USAGE_TAIL_BYTES = 256 * 1024;
function isAuthed(req) {
    if (!authToken)
        return true;
    var auth = req.headers["authorization"] || "";
    var bearer = auth.indexOf("Bearer ") === 0 ? auth.slice(7).trim() : "";
    var xkey = req.headers["x-api-key"] || "";
    var xkeyStr = Array.isArray(xkey) ? xkey[0] : xkey;
    return bearer === authToken || (xkeyStr && xkeyStr.trim() === authToken);
}
function log(level, msg, meta) {
    try {
        utools.sendToParent("proxy-log", {
            ts: Date.now(), level: level, msg: msg, meta: meta || null,
        });
    }
    catch (e) { }
}
function _liveDocId() {
    var app = (group && group.appType) || (members[0] && members[0].appType) || "";
    return app ? ("cctoggle_proxy_live_" + app) : "";
}
function persistLive(runningFlag) {
    try {
        if (typeof utools === "undefined" || !utools.db)
            return;
        var id = _liveDocId();
        if (!id)
            return;
        var prev = utools.db.get(id);
        utools.db.put({
            _id: id,
            _rev: prev ? prev._rev : undefined,
            appType: (group && group.appType) || (members[0] && members[0].appType) || "",
            running: !!runningFlag,
            port: group ? group.listenPort : 0,
            groupId: group ? group.id : null,
            startedAt: startedAt,
            activeConn: activeConn,
            reqTotal: reqTotal,
            reqSuccess: reqSuccess,
            reqFail: reqFail,
            lastMemberId: lastMemberId,
            members: members.map(function (m) {
                return { id: m.providerId, name: m.name, state: m.state, fails: m.fails, openUntil: m.openUntil, latency: m.latency, up: m.up };
            }),
            updatedAt: Date.now(),
        });
    }
    catch (e) { }
}
function stat() {
    try {
        utools.sendToParent("proxy-stat", {
            running: !!server,
            port: group ? group.listenPort : 0,
            startedAt: startedAt,
            activeConn: activeConn,
            reqTotal: reqTotal,
            reqSuccess: reqSuccess,
            reqFail: reqFail,
            lastMemberId: lastMemberId,
            members: members.map(function (m) {
                return { id: m.providerId, name: m.name, state: m.state, fails: m.fails, openUntil: m.openUntil, latency: m.latency, up: m.up };
            }),
        });
    }
    catch (e) { }
    persistLive(!!server);
}
function maskKey(k) {
    if (!k)
        return "";
    if (k.length <= 10)
        return "***";
    return k.slice(0, 6) + "***" + k.slice(-4);
}
function normalizeUsage(u) {
    if (!u || typeof u !== "object")
        return null;
    var promptDetails = u.prompt_tokens_details || u.input_tokens_details || {};
    var input = Number(u.input_tokens != null ? u.input_tokens : u.prompt_tokens) || 0;
    var output = Number(u.output_tokens != null ? u.output_tokens : u.completion_tokens) || 0;
    var cacheRead = Number(promptDetails.cached_tokens != null ? promptDetails.cached_tokens :
        (u.cache_read_input_tokens != null ? u.cache_read_input_tokens : 0)) || 0;
    var cacheCreate = Number(u.cache_creation_input_tokens != null ? u.cache_creation_input_tokens : 0) || 0;
    var total = Number(u.total_tokens) || (input + output);
    if (!input && !output && !total && !cacheRead && !cacheCreate)
        return null;
    return { input: input, output: output, cacheRead: cacheRead, cacheCreate: cacheCreate, total: total };
}
function reportUsage(member, usage) {
    var n = normalizeUsage(usage);
    if (!n)
        return;
    try {
        utools.sendToParent("proxy-usage", {
            ts: Date.now(),
            appType: member ? (member.appType || "") : "",
            providerId: member ? member.providerId : "",
            name: member ? member.name : "",
            model: (member && member.model) || "",
            input: n.input, output: n.output,
            cacheRead: n.cacheRead, cacheCreate: n.cacheCreate,
            total: n.total,
        });
    }
    catch (e) { }
}
function makeUsageScanner() {
    return { leftover: "", usage: null };
}
function scanSseForUsage(scanner, text) {
    scanner.leftover += text;
    var idx = scanner.leftover.lastIndexOf("\n");
    if (idx < 0)
        return;
    var complete = scanner.leftover.slice(0, idx + 1);
    scanner.leftover = scanner.leftover.slice(idx + 1);
    if (complete.indexOf("usage") < 0)
        return;
    complete.split(/\r?\n/).forEach(function (line) {
        var s = line.indexOf("data:");
        if (s !== 0)
            return;
        var payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]")
            return;
        try {
            var d = JSON.parse(payload);
            var u = d.usage || (d.response && d.response.usage) || (d.type === "message_delta" && d.usage) || null;
            if (u)
                scanner.usage = u;
        }
        catch (e) { }
    });
}
function noteSuccess(m) {
    m.fails = 0;
    if (m.state === "half-open" || m.state === "open") {
        m.state = "closed";
        m.openUntil = 0;
        log("info", "breaker closed", { id: m.providerId });
    }
}
function noteFailure(m) {
    m.fails = (m.fails || 0) + 1;
    const th = (group.breaker && group.breaker.failThreshold) || 3;
    if (m.state !== "open" && m.fails >= th) {
        const cd = (group.breaker && group.breaker.cooldownMs) || 60000;
        m.state = "open";
        m.openUntil = Date.now() + cd;
        log("warn", "breaker open", { id: m.providerId, cooldownMs: cd });
    }
}
function tickBreaker() {
    const now = Date.now();
    members.forEach(function (m) {
        if (m.state === "open" && now >= m.openUntil) {
            m.state = "half-open";
            m.fails = 0;
            log("info", "breaker half-open", { id: m.providerId });
        }
    });
}
function eligible() {
    tickBreaker();
    return members.filter(function (m) { return m.state !== "open"; });
}
function pickMember() {
    const list = eligible();
    if (list.length === 0)
        return null;
    const strategy = (group && group.strategy) || "failover";
    if (strategy === "round_robin") {
        const m = list[rrIdx % list.length];
        rrIdx++;
        return m;
    }
    if (strategy === "weighted") {
        const total = list.reduce(function (s, m) { return s + (m.weight || 1); }, 0);
        let r = Math.random() * total;
        for (let i = 0; i < list.length; i++) {
            r -= (list[i].weight || 1);
            if (r <= 0)
                return list[i];
        }
        return list[list.length - 1];
    }
    list.sort(function (a, b) { return (a.priority || 99) - (b.priority || 99); });
    return list[0];
}
let converter = null;
try {
    converter = require("./proxy-converter.js");
}
catch (e) {
    log("warn", "converter load failed", { err: String(e && e.message) });
}
function joinUrl(baseUrl, reqPath) {
    var b = baseUrl.replace(/\/+$/, "");
    var m = b.match(/^(https?:\/\/[^/]+)(\/.*)?$/i);
    if (!m)
        return new URL(reqPath, baseUrl);
    var origin = m[1];
    var basePath = (m[2] || "").replace(/\/+$/, "");
    var q = reqPath.indexOf("?");
    var pathOnly = q >= 0 ? reqPath.slice(0, q) : reqPath;
    var search = q >= 0 ? reqPath.slice(q) : "";
    var full = (basePath && pathOnly.indexOf(basePath) === 0) ? pathOnly : basePath + pathOnly;
    return new URL(origin + full + search);
}
function wantsConvert(member, reqPath) {
    if (!converter)
        return false;
    var af = member.apiFormat || "";
    if (af !== "openai_chat" && af !== "anthropic")
        return false;
    var p = reqPath.split("?")[0];
    return /\/responses\/?$/.test(p) || member.appType === "codex";
}
function forward(member, req, res, attemptsLeft, reqBody, reasoningStripped) {
    return new Promise(function (resolve) {
        lastMemberId = member.providerId;
        var reqPath = req.url;
        var doConvert = req.method === "POST" && wantsConvert(member, reqPath) && reqBody && reqBody.length;
        var outBody = reqBody;
        var upstream;
        try {
            if (member.desktopModelMap && req.method === "POST" && reqBody && reqBody.length) {
                try {
                    var bodyObj = JSON.parse(reqBody.toString("utf8"));
                    var mapped = member.desktopModelMap[bodyObj.model];
                    if (mapped && mapped !== bodyObj.model) {
                        bodyObj.model = mapped;
                        reqBody = Buffer.from(JSON.stringify(bodyObj), "utf8");
                        outBody = reqBody;
                    }
                }
                catch (e) { }
            }
            if (doConvert) {
                var parsed = JSON.parse(reqBody.toString("utf8"));
                var conv = converter.convertRequest(member, parsed, reqPath);
                if (member.bodyOverride) {
                    try {
                        var ov = JSON.parse(member.bodyOverride);
                        var cb = JSON.parse(conv.body);
                        Object.assign(cb, ov);
                        conv.body = JSON.stringify(cb);
                    }
                    catch (e) { }
                }
                outBody = Buffer.from(conv.body, "utf8");
                upstream = joinUrl(member.baseUrl, conv.path);
            }
            else {
                var passPath = reqPath;
                var hasBasePath = /^https?:\/\/[^/]+\/.+/.test(member.baseUrl || "");
                if (member.appType === "codex" && hasBasePath)
                    passPath = reqPath.replace(/^\/v1(\/|$)/, "/");
                upstream = joinUrl(member.baseUrl, passPath);
            }
        }
        catch (e) {
            log("error", "convert request failed", { err: String(e && e.message) });
            upstream = joinUrl(member.baseUrl, reqPath);
            outBody = reqBody;
            doConvert = false;
        }
        var client = upstream.protocol === "https:" ? https : http;
        var headers = Object.assign({}, req.headers);
        delete headers.host;
        delete headers["content-length"];
        delete headers["accept-encoding"];
        if (member.apiKey) {
            var af = member.apiFormat || "";
            if (af === "anthropic") {
                headers["x-api-key"] = member.apiKey;
                headers["anthropic-version"] = headers["anthropic-version"] || "2023-06-01";
            }
            else {
                headers["authorization"] = "Bearer " + member.apiKey;
                headers["x-api-key"] = member.apiKey;
            }
        }
        if (member.impersonateClaudeCode) {
            headers["user-agent"] = member.customUserAgent || "claude-cli/1.0.0 (external, cli)";
            headers["x-app"] = "cli";
            headers["anthropic-beta"] = headers["anthropic-beta"] || "claude-code-20250219,oauth-2025-04-20";
        }
        if (member.customUserAgent)
            headers["user-agent"] = member.customUserAgent;
        if (member.headersOverride) {
            try {
                var ho = JSON.parse(member.headersOverride);
                Object.keys(ho).forEach(function (k) { headers[k.toLowerCase()] = ho[k]; });
            }
            catch (e) { }
        }
        if (outBody) {
            headers["content-length"] = Buffer.byteLength(outBody);
            if (doConvert)
                headers["content-type"] = "application/json";
        }
        var t0 = Date.now();
        var reqOpt = {
            method: req.method,
            hostname: upstream.hostname,
            port: upstream.port || (upstream.protocol === "https:" ? 443 : 80),
            path: upstream.pathname + upstream.search,
            headers: headers,
            timeout: (group && group.timeoutMs) || 120000,
        };
        var upReq = client.request(reqOpt, function (upRes) {
            var latency = Date.now() - t0;
            var sc = upRes.statusCode || 0;
            if (sc === 400 && !doConvert && !reasoningStripped && req.method === "POST" && reqBody && reqBody.length) {
                var _eb = [];
                upRes.on("data", function (c) { _eb.push(c); });
                upRes.on("end", function () {
                    var errText = Buffer.concat(_eb).toString("utf8");
                    var canRetry = false;
                    var stripped = null;
                    if (/reasoning/i.test(errText)) {
                        try {
                            var pb = JSON.parse(reqBody.toString("utf8"));
                            if (pb && pb.reasoning !== undefined) {
                                delete pb.reasoning;
                                stripped = Buffer.from(JSON.stringify(pb), "utf8");
                                canRetry = true;
                            }
                        }
                        catch (e) { }
                    }
                    if (canRetry) {
                        log("info", "retry without reasoning", { id: member.providerId });
                        return forward(member, req, res, attemptsLeft, stripped, true).then(resolve);
                    }
                    if (!res.headersSent)
                        res.writeHead(sc, { "content-type": upRes.headers["content-type"] || "application/json" });
                    res.end(Buffer.concat(_eb));
                    resolve();
                });
                return;
            }
            if (sc >= 500) {
                noteFailure(member);
                reqFail++;
                log("warn", "upstream 5xx", { id: member.providerId, sc: sc, url: reqPath });
                upRes.resume();
                if (attemptsLeft > 0) {
                    var next = pickMember();
                    if (next && next.providerId !== member.providerId) {
                        return forward(next, req, res, attemptsLeft - 1, reqBody).then(resolve);
                    }
                }
                if (!res.headersSent)
                    res.writeHead(sc, { "content-type": "application/json" });
                return void res.end('{"error":"upstream 5xx"}');
            }
            noteSuccess(member);
            reqSuccess++;
            member.latency = latency;
            log("info", "forward ok", { id: member.providerId, sc: sc, ms: latency, url: reqPath, convert: doConvert });
            var ct = (upRes.headers["content-type"] || "").toLowerCase();
            var isSse = ct.indexOf("text/event-stream") >= 0;
            if (doConvert && isSse) {
                var outHeaders = { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache", "connection": "keep-alive" };
                res.writeHead(sc, outHeaders);
                try {
                    res.write("event: response.created\n");
                    res.write("data: " + JSON.stringify({ type: "response.created", response: { id: "resp_" + Date.now(), object: "response", status: "in_progress", model: member.model || "", output: [] } }) + "\n\n");
                }
                catch (e) { }
                var state = { text: "", toolCalls: {}, responseJson: {} };
                var leftover = "";
                upRes.setEncoding("utf8");
                upRes.on("data", function (chunk) {
                    leftover += chunk;
                    var idx = leftover.lastIndexOf("\n");
                    if (idx < 0)
                        return;
                    var complete = leftover.slice(0, idx + 1);
                    leftover = leftover.slice(idx + 1);
                    try {
                        var converted = converter.convertSse(member, complete, state);
                        if (converted)
                            res.write(converted.replace(/\n(event:)/g, "\n\n$1").replace(/\n$/, "\n\n"));
                    }
                    catch (e) {
                        log("error", "sse convert", { err: String(e && e.message) });
                    }
                });
                upRes.on("end", function () {
                    if (leftover.trim()) {
                        try {
                            var c2 = converter.convertSse(member, leftover + "\n", state);
                            if (c2)
                                res.write(c2);
                        }
                        catch (e) { }
                    }
                    try {
                        reportUsage(member, state.responseJson && state.responseJson.usage);
                    }
                    catch (e) { }
                    res.end();
                    resolve();
                });
                return;
            }
            if (doConvert) {
                var buf = [];
                upRes.on("data", function (c) { buf.push(c); });
                upRes.on("end", function () {
                    var raw = Buffer.concat(buf).toString("utf8");
                    var out = raw;
                    try {
                        out = converter.convertResponse(member, raw, false);
                    }
                    catch (e) { }
                    try {
                        var pj = JSON.parse(out);
                        reportUsage(member, pj && pj.usage);
                    }
                    catch (e) { }
                    res.writeHead(sc, { "content-type": "application/json" });
                    res.end(out);
                    resolve();
                });
                return;
            }
            res.writeHead(sc, upRes.headers);
            var ctPass = (upRes.headers["content-type"] || "").toLowerCase();
            var isSsePass = ctPass.indexOf("text/event-stream") >= 0;
            var isJsonPass = ctPass.indexOf("application/json") >= 0;
            if (isSsePass) {
                var scanner = makeUsageScanner();
                upRes.on("data", function (chunk) {
                    res.write(chunk);
                    try {
                        scanSseForUsage(scanner, chunk.toString("utf8"));
                    }
                    catch (e) { }
                });
                upRes.on("end", function () {
                    try {
                        scanSseForUsage(scanner, "\n");
                        reportUsage(member, scanner.usage);
                    }
                    catch (e) { }
                    res.end();
                    resolve();
                });
            }
            else if (isJsonPass) {
                var jbuf = [];
                var jbufBytes = 0;
                upRes.on("data", function (chunk) {
                    res.write(chunk);
                    jbuf.push(chunk);
                    jbufBytes += chunk.length;
                    while (jbufBytes > USAGE_TAIL_BYTES && jbuf.length > 1) {
                        jbufBytes -= jbuf[0].length;
                        jbuf.shift();
                    }
                });
                upRes.on("end", function () {
                    try {
                        var pj = JSON.parse(Buffer.concat(jbuf).toString("utf8"));
                        reportUsage(member, pj && pj.usage);
                    }
                    catch (e) { }
                    res.end();
                    resolve();
                });
            }
            else {
                upRes.pipe(res).on("finish", resolve);
            }
        });
        upReq.on("error", function (err) {
            noteFailure(member);
            reqFail++;
            log("error", "upstream error", { id: member.providerId, err: String(err && err.message || err) });
            if (attemptsLeft > 0) {
                var next = pickMember();
                if (next && next.providerId !== member.providerId) {
                    return forward(next, req, res, attemptsLeft - 1, reqBody).then(resolve);
                }
            }
            if (!res.headersSent) {
                res.writeHead(502);
                res.end("upstream error");
            }
            resolve();
        });
        upReq.on("timeout", function () { upReq.destroy(new Error("timeout")); });
        if (outBody && outBody.length)
            upReq.end(outBody);
        else
            upReq.end();
    });
}
function startServer() {
    return new Promise(function (resolve, reject) {
        if (server) {
            try {
                server.close();
            }
            catch (e) { }
            server = null;
        }
        const port = (group && group.listenPort) || 8788;
        server = http.createServer(function (req, res) {
            reqTotal++;
            activeConn++;
            res.on("close", function () { activeConn = Math.max(0, activeConn - 1); });
            if (!isAuthed(req)) {
                reqFail++;
                log("warn", "unauthorized request rejected", { url: req.url });
                res.writeHead(401, { "content-type": "application/json" });
                return res.end('{"error":"unauthorized: invalid proxy token"}');
            }
            const m = pickMember();
            if (!m) {
                reqFail++;
                res.writeHead(503);
                return res.end("no available upstream");
            }
            const maxAttempts = Math.max(1, members.length);
            var chunks = [];
            var received = 0;
            var aborted = false;
            req.on("data", function (c) {
                if (aborted)
                    return;
                received += c.length;
                if (received > MAX_REQUEST_BYTES) {
                    aborted = true;
                    reqFail++;
                    chunks = [];
                    log("warn", "request body too large", { url: req.url, bytes: received });
                    if (!res.headersSent)
                        res.writeHead(413, { "content-type": "application/json" });
                    res.end('{"error":"request entity too large"}');
                    req.destroy();
                    return;
                }
                chunks.push(c);
            });
            req.on("end", function () {
                if (aborted)
                    return;
                var body = chunks.length ? Buffer.concat(chunks) : null;
                forward(m, req, res, maxAttempts - 1, body);
            });
        });
        server.on("error", function (err) {
            log("error", "server error", { err: String(err.message || err) });
            reject(err);
        });
        server.listen(port, "127.0.0.1", function () {
            startedAt = Date.now();
            activeConn = 0;
            reqTotal = 0;
            reqSuccess = 0;
            reqFail = 0;
            lastMemberId = null;
            log("info", "proxy listening", { port: port });
            stat();
            resolve();
        });
    });
}
function pingOnce(m) {
    return new Promise(function (resolve) {
        let u;
        try {
            u = new URL((group.health && group.health.path) || "/", m.baseUrl);
        }
        catch (e) {
            m.up = false;
            return resolve();
        }
        const client = u.protocol === "https:" ? https : http;
        const t0 = Date.now();
        const req = client.request({
            method: "GET",
            hostname: u.hostname, port: u.port || (u.protocol === "https:" ? 443 : 80),
            path: u.pathname + u.search,
            timeout: (group.health && group.health.timeoutMs) || 5000,
            headers: m.apiKey ? { authorization: "Bearer " + m.apiKey, "x-api-key": m.apiKey } : {},
        }, function (r) {
            m.latency = Date.now() - t0;
            m.up = (r.statusCode || 0) < 500;
            r.resume();
            resolve();
        });
        req.on("error", function () { m.up = false; resolve(); });
        req.on("timeout", function () { m.up = false; req.destroy(); resolve(); });
        req.end();
    });
}
function startHealth() {
    if (healthTimer)
        clearInterval(healthTimer);
    const interval = (group.health && group.health.intervalMs) || 30000;
    const run = function () {
        Promise.all(members.map(pingOnce)).then(function () { stat(); });
    };
    run();
    healthTimer = setInterval(run, interval);
}
ipcRenderer.on("cfg", function (_e, payload) {
    group = payload.group;
    authToken = (payload.authToken || (group && group.authToken) || "") + "";
    members = (payload.members || []).map(function (m) {
        return {
            providerId: m.providerId, name: m.name,
            baseUrl: m.baseUrl, apiKey: m.apiKey,
            priority: m.priority || 1, weight: m.weight || 1,
            appType: m.appType || "", apiFormat: m.apiFormat || "", model: m.model || "",
            maxOutputTokens: m.maxOutputTokens || "", customUserAgent: m.customUserAgent || "",
            headersOverride: m.headersOverride || "", bodyOverride: m.bodyOverride || "",
            authField: m.authField || "",
            desktopModelMap: m.desktopModelMap || null,
            state: "closed", fails: 0, openUntil: 0, latency: 0, up: true,
        };
    });
    log("info", "cfg received", { group: group.name, members: members.map(function (m) { return { id: m.providerId, key: maskKey(m.apiKey) }; }) });
    startServer().then(startHealth).catch(function () { });
});
ipcRenderer.on("stop", function () {
    try {
        if (server)
            server.close();
        server = null;
    }
    catch (e) { }
    if (healthTimer) {
        clearInterval(healthTimer);
        healthTimer = null;
    }
    startedAt = 0;
    log("info", "stopped");
    stat();
});
var _bootTs = Date.now();
function _ctlDocId() {
    var app = (group && group.appType) || (members[0] && members[0].appType) || "";
    return app ? ("cctoggle_proxy_ctl_" + app) : "";
}
function selfStop(reason) {
    try {
        if (server)
            server.close();
        server = null;
    }
    catch (e) { }
    if (healthTimer) {
        clearInterval(healthTimer);
        healthTimer = null;
    }
    startedAt = 0;
    log("info", "self-stopped", { reason: reason || "" });
    persistLive(false);
    try {
        window.close();
    }
    catch (e) { }
}
setInterval(function () {
    try {
        if (typeof utools === "undefined" || !utools.db)
            return;
        var id = _ctlDocId();
        if (!id)
            return;
        var ctl = utools.db.get(id);
        if (ctl && ctl.stop && (ctl.ts || 0) > _bootTs) {
            selfStop("ctl");
            try {
                utools.db.remove(ctl);
            }
            catch (e) { }
        }
    }
    catch (e) { }
}, 1500);
setInterval(function () { if (server)
    stat(); }, 1000);
ipcRenderer.on("stat", function () { stat(); });
