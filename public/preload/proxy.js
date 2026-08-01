var utils = require("./utils");
var configRw = require("./config-rw");
var providerDb = require("./provider-db");
var generateId = utils.generateId;
var getHomeDir = utils.getHomeDir;
var ROUTE_PREFIX = "cctoggle_route_";
var BACKUP_KEY = "cctoggle_route_backup";
var daemonWins = {};
var proxyRuntime = {};
function _routeKey(appType, id) { return ROUTE_PREFIX + appType + "_" + id; }
function _genProxyToken() {
    return "utct-" + generateId() + generateId() + Math.random().toString(36).slice(2, 10);
}
function _ensureRouteToken(appType, group) {
    if (group.authToken)
        return group.authToken;
    group.authToken = _genProxyToken();
    group.appType = group.appType || appType;
    saveRouteGroup(group);
    return group.authToken;
}
function listRouteGroups(appType) {
    try {
        const docs = utools.db.allDocs(ROUTE_PREFIX + appType + "_") || [];
        return docs.map(function (d) {
            return Object.assign({}, d, { id: d._id.replace(ROUTE_PREFIX + appType + "_", "") });
        });
    }
    catch (e) {
        return [];
    }
}
function getRouteGroup(appType, id) {
    try {
        const doc = utools.db.get(_routeKey(appType, id));
        if (!doc)
            return null;
        return Object.assign({}, doc, { id: id });
    }
    catch (e) {
        return null;
    }
}
function saveRouteGroup(group) {
    const appType = group.appType;
    const id = group.id || generateId();
    const key = _routeKey(appType, id);
    const existing = utools.db.get(key);
    const doc = {
        _id: key,
        _rev: existing ? existing._rev : undefined,
        name: group.name || "未命名路由组",
        listenPort: group.listenPort || 8788,
        strategy: group.strategy || "failover",
        members: (group.members || []).map(function (m) {
            return { providerId: m.providerId, weight: m.weight || 1, priority: m.priority || 1 };
        }),
        health: Object.assign({ intervalMs: 30000, timeoutMs: 5000, path: "/models" }, group.health || {}),
        breaker: Object.assign({ failThreshold: 3, cooldownMs: 60000, halfOpenProbe: 1 }, group.breaker || {}),
        timeoutMs: group.timeoutMs || 30000,
        authToken: group.authToken || (existing && existing.authToken) || "",
        updatedAt: new Date().toISOString(),
        createdAt: existing ? existing.createdAt : new Date().toISOString(),
    };
    utools.db.put(doc);
    return id;
}
function deleteRouteGroup(appType, id) {
    try {
        stopProxy(appType);
        utools.db.remove(_routeKey(appType, id));
        return true;
    }
    catch (e) {
        return false;
    }
}
function _resolveMembers(appType, group) {
    return (group.members || []).map(function (m) {
        const p = providerDb.getProvider(appType, m.providerId);
        if (!p)
            return null;
        var desktopModelMap = null;
        if (appType === "claude-desktop") {
            var env = (p.settingsConfig && p.settingsConfig.env) || {};
            desktopModelMap = {
                "claude-sonnet-5": env.ANTHROPIC_DEFAULT_SONNET_MODEL || p.model || "",
                "claude-opus-4-8": env.ANTHROPIC_DEFAULT_OPUS_MODEL || p.model || "",
                "claude-haiku-4-5": env.ANTHROPIC_DEFAULT_HAIKU_MODEL || p.model || "",
                "claude-fable-5": env.ANTHROPIC_DEFAULT_FABLE_MODEL || env.ANTHROPIC_DEFAULT_OPUS_MODEL || p.model || "",
            };
        }
        return {
            providerId: p.id,
            name: p.name,
            baseUrl: p.baseUrl || "",
            apiKey: p.apiKey || "",
            priority: m.priority || 1,
            weight: m.weight || 1,
            appType: appType,
            apiFormat: p.apiFormat || "",
            model: p.model || "",
            maxOutputTokens: p.maxTokens || "",
            customUserAgent: p.customUserAgent || "",
            headersOverride: p.headersOverride || "",
            bodyOverride: p.bodyOverride || "",
            authField: p.authField || "ANTHROPIC_AUTH_TOKEN",
            impersonateClaudeCode: p.impersonateClaudeCode || false,
            desktopModelMap: desktopModelMap,
        };
    }).filter(Boolean);
}
function startProxy(appType, groupId) {
    const group = getRouteGroup(appType, groupId);
    if (!group)
        return { success: false, error: "group not found" };
    const members = _resolveMembers(appType, group);
    if (members.length === 0)
        return { success: false, error: "no members" };
    const token = _ensureRouteToken(appType, group);
    try {
        const win = utools.createBrowserWindow("preload/proxy-daemon.html", { show: false, webPreferences: { preload: "preload/proxy-daemon.js" } }, function () {
            try {
                win.webContents.send("cfg", { group: group, members: members, authToken: token });
            }
            catch (e) { }
        });
        daemonWins[appType] = win;
        proxyRuntime[appType] = {
            running: true, port: group.listenPort, groupId: groupId,
            members: members.map(function (m) {
                return { id: m.providerId, name: m.name, state: "closed", fails: 0, openUntil: 0, latency: 0, up: true };
            }),
            logs: [],
        };
        return { success: true };
    }
    catch (e) {
        return { success: false, error: e.message };
    }
}
function stopProxy(appType) {
    const win = daemonWins[appType];
    if (win) {
        try {
            win.webContents.send("stop");
        }
        catch (e) { }
        try {
            win.destroy();
        }
        catch (e) { }
        delete daemonWins[appType];
    }
    if (proxyRuntime[appType])
        proxyRuntime[appType].running = false;
    if (proxyRuntime._active === appType)
        delete proxyRuntime._active;
    try {
        const _ctl = "cctoggle_proxy_ctl_" + appType;
        const prevCtl = utools.db.get(_ctl);
        utools.db.put({ _id: _ctl, _rev: prevCtl ? prevCtl._rev : undefined, stop: true, ts: Date.now() });
    }
    catch (e) { }
    try {
        const _id = "cctoggle_proxy_live_" + appType;
        const prev = utools.db.get(_id);
        if (prev)
            utools.db.put(Object.assign({}, prev, { running: false, updatedAt: Date.now() }));
    }
    catch (e) { }
    return { success: true };
}
function reconcileProxies() {
    const apps = ["codex", "claude", "gemini", "openclaw"];
    apps.forEach(function (appType) {
        let live = null;
        try {
            live = utools.db.get("cctoggle_proxy_live_" + appType);
        }
        catch (e) { }
        if (!live)
            return;
        const fresh = live.running && (Date.now() - (live.updatedAt || 0) < 5000);
        const hasHandle = !!daemonWins[appType];
        if (fresh && !hasHandle) {
            proxyRuntime[appType] = {
                running: true, port: live.port || 0, groupId: live.groupId || null,
                members: [], logs: (proxyRuntime[appType] && proxyRuntime[appType].logs) || [],
                adopted: true,
            };
            proxyRuntime._active = appType;
        }
        else if (!fresh && live.running) {
            try {
                utools.db.remove(live);
            }
            catch (e) { }
            if (proxyRuntime[appType])
                proxyRuntime[appType].running = false;
        }
    });
}
function _fallbackMembers(appType, groupId) {
    if (!groupId)
        return [];
    try {
        const g = getRouteGroup(appType, groupId);
        if (!g)
            return [];
        return _resolveMembers(appType, g).map(function (m) {
            return { id: m.providerId, name: m.name, state: "unknown", fails: 0, openUntil: 0, latency: 0, up: true };
        });
    }
    catch (e) {
        return [];
    }
}
function getProxyStatus(appType) {
    const rt = proxyRuntime[appType] || {};
    let live = null;
    try {
        live = utools.db.get("cctoggle_proxy_live_" + appType);
    }
    catch (e) { }
    const liveFresh = live && live.running && (Date.now() - (live.updatedAt || 0) < 5000);
    if (liveFresh) {
        return {
            running: true,
            port: live.port || rt.port || 0,
            groupId: live.groupId || rt.groupId,
            startedAt: live.startedAt || 0,
            activeConn: live.activeConn || 0,
            reqTotal: live.reqTotal || 0,
            reqSuccess: live.reqSuccess || 0,
            reqFail: live.reqFail || 0,
            lastMemberId: live.lastMemberId || null,
            members: (live.members && live.members.length) ? live.members : _fallbackMembers(appType, live.groupId || rt.groupId),
            logs: (rt.logs || []).slice(-200),
        };
    }
    if (!proxyRuntime[appType])
        return { running: false };
    let members = rt.members || [];
    if (rt.running && members.length === 0 && rt.groupId) {
        members = _fallbackMembers(appType, rt.groupId);
    }
    return {
        running: !!rt.running,
        port: rt.port,
        groupId: rt.groupId,
        startedAt: rt.startedAt || 0,
        activeConn: rt.activeConn || 0,
        reqTotal: rt.reqTotal || 0,
        reqSuccess: rt.reqSuccess || 0,
        reqFail: rt.reqFail || 0,
        lastMemberId: rt.lastMemberId || null,
        members: members,
        logs: (rt.logs || []).slice(-200),
    };
}
function onProxyEvent(cb) {
    if (typeof cb !== "function")
        return;
    try {
        const { ipcRenderer } = require("electron");
        ipcRenderer.removeAllListeners("parent-message");
        ipcRenderer.on("parent-message", function (_event, ...args) {
            const [channel, data] = args;
            try {
                if (channel === "proxy-stat" && data) {
                    Object.keys(proxyRuntime).forEach(function (app) {
                        const rt = proxyRuntime[app];
                        if (rt && rt.port === data.port) {
                            rt.running = !!data.running;
                            rt.members = data.members || [];
                            rt.startedAt = data.startedAt || 0;
                            rt.activeConn = data.activeConn || 0;
                            rt.reqTotal = data.reqTotal || 0;
                            rt.reqSuccess = data.reqSuccess || 0;
                            rt.reqFail = data.reqFail || 0;
                            rt.lastMemberId = data.lastMemberId || null;
                        }
                    });
                }
                else if (channel === "proxy-log" && data) {
                    Object.keys(proxyRuntime).forEach(function (app) {
                        const rt = proxyRuntime[app];
                        if (!rt.logs)
                            rt.logs = [];
                        rt.logs.push(data);
                        if (rt.logs.length > 500)
                            rt.logs.splice(0, rt.logs.length - 500);
                    });
                }
                else if (channel === "proxy-usage" && data) {
                }
            }
            catch (e) { }
            try {
                cb(channel, data);
            }
            catch (e) { }
        });
    }
    catch (e) { }
}
function _backupCurrent(appType) {
    const cur = providerDb.getCurrentProviderId(appType);
    const doc = utools.db.get(BACKUP_KEY) || { _id: BACKUP_KEY };
    doc[appType] = { previousProviderId: cur, at: new Date().toISOString() };
    utools.db.put(doc);
}
function _readBackup(appType) {
    const doc = utools.db.get(BACKUP_KEY);
    return doc && doc[appType] ? doc[appType] : null;
}
function takeoverApp(appType, listenPort) {
    try {
        _backupCurrent(appType);
        const baseUrl = "http://127.0.0.1:" + (listenPort || 8788);
        let proxyToken = "sk-utoolscctoggle-proxy";
        try {
            const rt0 = proxyRuntime[appType];
            const g0 = rt0 && rt0.groupId ? getRouteGroup(appType, rt0.groupId) : ensureDefaultGroup(appType);
            if (g0)
                proxyToken = _ensureRouteToken(appType, g0);
        }
        catch (e) { }
        let proxyModel = "";
        const proxyCatalog = [];
        const proxyCatalogSeen = {};
        try {
            const rt = proxyRuntime[appType];
            const g = rt && rt.groupId ? getRouteGroup(appType, rt.groupId) : ensureDefaultGroup(appType);
            (g && g.members ? g.members : []).forEach(function (mem) {
                const prov = providerDb.getProvider(appType, mem.providerId);
                if (!prov)
                    return;
                if (!proxyModel && prov.model)
                    proxyModel = prov.model;
                (Array.isArray(prov.modelCatalog) ? prov.modelCatalog : []).forEach(function (m) {
                    const slug = m.slug || m.model || "";
                    if (!slug || proxyCatalogSeen[slug])
                        return;
                    proxyCatalogSeen[slug] = true;
                    proxyCatalog.push(m);
                });
                if (prov.model && !proxyCatalogSeen[prov.model] && (!prov.modelCatalog || prov.modelCatalog.length === 0)) {
                    proxyCatalogSeen[prov.model] = true;
                    proxyCatalog.push({ model: prov.model, displayName: prov.name || prov.model });
                }
            });
        }
        catch (e) { }
        const fake = {
            id: "__proxy__",
            appType: appType,
            name: "utoolscctoggle-proxy",
            baseUrl: appType === "codex" ? baseUrl + "/v1" : baseUrl,
            apiKey: proxyToken,
            model: proxyModel || "gpt-4o",
            modelCatalog: proxyCatalog,
            configType: appType === "claude" ? "anthropic" : (appType === "gemini" ? "gemini" : (appType === "openclaw" ? "openclaw" : "openai")),
            extraConfig: "",
        };
        if (appType === "codex")
            configRw.switchProviderCodex(fake);
        else if (appType === "claude")
            configRw.switchProviderClaude(fake);
        else if (appType === "claude-desktop")
            configRw.switchProviderClaudeDesktop(fake);
        else if (appType === "openclaw")
            configRw.switchProviderOpenclaw(fake);
        else if (appType === "gemini")
            configRw.switchProviderGemini(fake);
        return { success: true, baseUrl: baseUrl };
    }
    catch (e) {
        return { success: false, error: e.message };
    }
}
function restoreApp(appType) {
    const bk = _readBackup(appType);
    if (!bk || !bk.previousProviderId)
        return { success: false, error: "no backup" };
    const r = providerDb.switchProvider(appType, bk.previousProviderId);
    return r;
}
var DEFAULT_PROXY_PORT = 8788;
var PORT_KEY = "cctoggle_route_port";
function getProxyPort(appType) {
    try {
        const doc = utools.db.get(PORT_KEY);
        const p = doc && doc[appType];
        return Number(p) || DEFAULT_PROXY_PORT;
    }
    catch (e) {
        return DEFAULT_PROXY_PORT;
    }
}
function setProxyPort(appType, port) {
    const p = Number(port);
    if (!p || p < 1024 || p > 65535)
        return { success: false, error: "port must be 1024-65535" };
    if (proxyRuntime._active === appType) {
        return { success: false, error: "proxy is running" };
    }
    const doc = utools.db.get(PORT_KEY) || { _id: PORT_KEY };
    doc[appType] = p;
    const groups = listRouteGroups(appType);
    if (groups[0]) {
        const g = getRouteGroup(appType, groups[0].id);
        if (g) {
            g.listenPort = p;
            saveRouteGroup(g);
        }
    }
    return { success: true, port: p };
}
function ensureDefaultGroup(appType) {
    const groups = listRouteGroups(appType);
    const all = providerDb.listProviders(appType);
    if (groups.length) {
        const g = groups[0];
        g.appType = appType;
        if (!all.length) {
            deleteRouteGroup(appType, g.id);
            return null;
        }
        const wantPort = getProxyPort(appType);
        if (g.listenPort !== wantPort) {
            g.listenPort = wantPort;
        }
        const allIds = {};
        all.forEach(function (p) { allIds[p.id] = true; });
        g.members = (g.members || []).filter(function (m) { return allIds[m.providerId]; });
        const have = {};
        g.members.forEach(function (m) { have[m.providerId] = true; });
        all.forEach(function (p) {
            if (!have[p.id]) {
                g.members.push({ providerId: p.id, priority: (g.members.length + 1), weight: 1 });
            }
        });
        saveRouteGroup(g);
        return getRouteGroup(appType, g.id);
    }
    if (!all.length)
        return null;
    const id = saveRouteGroup({
        appType: appType,
        name: "默认路由（自动）",
        strategy: "failover",
        members: all.map(function (p, i) { return { providerId: p.id, priority: i + 1, weight: 1 }; }),
        health: { intervalMs: 30000, timeoutMs: 5000, path: appType === "claude" ? "/v1/models" : "/models" },
        breaker: { failThreshold: 3, cooldownMs: 60000 },
        timeoutMs: 30000,
    });
    return getRouteGroup(appType, id);
}
function toggleProxyQuick(appType) {
    if (proxyRuntime._active === appType) {
        stopProxy(appType);
        restoreApp(appType);
        return { success: true, running: false };
    }
    if (proxyRuntime._active) {
        stopProxy(proxyRuntime._active);
        restoreApp(proxyRuntime._active);
    }
    const g = ensureDefaultGroup(appType);
    if (!g)
        return { success: false, error: "no providers" };
    const s = startProxy(appType, g.id);
    if (!s.success)
        return s;
    const port = g.listenPort || getProxyPort(appType);
    takeoverApp(appType, port);
    proxyRuntime._active = appType;
    return { success: true, running: true, port: port, groupId: g.id };
}
module.exports = {
    proxyRuntime: proxyRuntime,
    daemonWins: daemonWins,
    listRouteGroups: listRouteGroups,
    getRouteGroup: getRouteGroup,
    saveRouteGroup: saveRouteGroup,
    deleteRouteGroup: deleteRouteGroup,
    startProxy: startProxy,
    stopProxy: stopProxy,
    reconcileProxies: reconcileProxies,
    getProxyStatus: getProxyStatus,
    onProxyEvent: onProxyEvent,
    takeoverApp: takeoverApp,
    restoreApp: restoreApp,
    getProxyPort: getProxyPort,
    setProxyPort: setProxyPort,
    ensureDefaultGroup: ensureDefaultGroup,
    toggleProxyQuick: toggleProxyQuick,
};
