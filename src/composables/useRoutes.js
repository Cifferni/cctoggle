import { ref, reactive } from "vue";

const _ccs = () => window.skillNest || {
  listRouteGroups: () => [],
  saveRouteGroup: () => "",
  deleteRouteGroup: () => false,
  startProxy: () => ({ success: false }),
  stopProxy: () => ({ success: false }),
  getProxyStatus: () => ({ running: false }),
  onProxyEvent: () => {},
  toggleProxyQuick: () => ({ success: false }),
  takeoverApp: () => ({ success: false }),
  restoreApp: () => ({ success: false }),
  getProxyPort: () => 8788,
  setProxyPort: () => ({ success: false }),
  runtime: { _active: null },
};

// 全局 runtime 状态（跨组件共享）
function _emptyRt() {
  return {
    running: false, port: 0, members: [], logs: [],
    startedAt: 0, activeConn: 0, reqTotal: 0, reqSuccess: 0, reqFail: 0,
    lastMemberId: null,
  };
}
const runtime = reactive({
  codex: _emptyRt(),
  claude: _emptyRt(),
  gemini: _emptyRt(),
});

let _wired = false;
function _wireEvents() {
  if (_wired) return; _wired = true;
  try {
    _ccs().onProxyEvent(function (channel, data) {
      // 简单：广播到所有 appType 的 logs；由 port 精确定位 members
      if (channel === "proxy-log" && data) {
        // 只写活跃 app（从 _active 取）
        var active = Object.keys(runtime).find(function (a) { return runtime[a].running; }) || "codex";
        runtime[active].logs.push(data);
        if (runtime[active].logs.length > 200) runtime[active].logs.splice(0, runtime[active].logs.length - 200);
      }
      if (channel === "proxy-stat" && data) {
        Object.keys(runtime).forEach(function (app) {
          if (app === "_active") return;
          if (runtime[app].port && runtime[app].port === data.port) {
            const rt = runtime[app];
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
    });
  } catch (e) {}
}

function refreshStatus(appType) {
  const s = _ccs().getProxyStatus(appType) || {};
  const rt = runtime[appType];
  rt.running = !!s.running;
  rt.port = s.port || 0;
  rt.members = s.members || [];
  rt.logs = s.logs || rt.logs;
  rt.startedAt = s.startedAt || 0;
  rt.activeConn = s.activeConn || 0;
  rt.reqTotal = s.reqTotal || 0;
  rt.reqSuccess = s.reqSuccess || 0;
  rt.reqFail = s.reqFail || 0;
  rt.lastMemberId = s.lastMemberId || null;
}

function listGroups(appType) { return _ccs().listRouteGroups(appType) || []; }
function saveGroup(g) { return _ccs().saveRouteGroup(g); }
function deleteGroup(appType, id) { return _ccs().deleteRouteGroup(appType, id); }

function startProxy(appType, groupId) {
  _wireEvents();
  const r = _ccs().startProxy(appType, groupId);
  refreshStatus(appType);
  return r;
}
function stopProxy(appType) {
  const r = _ccs().stopProxy(appType);
  refreshStatus(appType);
  return r;
}
function refreshAll() {
  ["codex", "claude", "gemini"].forEach(function (a) { refreshStatus(a); });
}
function toggleQuick(appType) {
  _wireEvents();
  const r = _ccs().toggleProxyQuick(appType);
  refreshAll();
  setTimeout(refreshAll, 300);
  return r;
}
function takeover(appType, port) { return _ccs().takeoverApp(appType, port); }
function restore(appType) { return _ccs().restoreApp(appType); }

function getProxyPort(appType) {
  try { return _ccs().getProxyPort(appType) || 8788; } catch (e) { return 8788; }
}
function setProxyPort(appType, port) {
  return _ccs().setProxyPort(appType, port) || { success: false };
}

export function useRoutes() {
  return {
    runtime,
    listGroups, saveGroup, deleteGroup,
    startProxy, stopProxy, toggleQuick,
    takeover, restore, refreshStatus,
    getProxyPort, setProxyPort,
  };
}


