import { reactive } from "vue";
import { getSkillNest } from "./shared.js";

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
  if (_wired) return;
  _wired = true;
  try {
    getSkillNest().onProxyEvent((channel, data) => {
      if (channel === "proxy-log" && data) {
        const active = Object.keys(runtime).find(a => runtime[a].running) || "codex";
        const logs = runtime[active].logs;
        logs.push(data);
        if (logs.length > 200) logs.splice(0, logs.length - 200);
      }
      if (channel === "proxy-stat" && data) {
        for (const app of Object.keys(runtime)) {
          if (runtime[app].port && runtime[app].port === data.port) {
            Object.assign(runtime[app], {
              running: !!data.running,
              members: data.members || [],
              startedAt: data.startedAt || 0,
              activeConn: data.activeConn || 0,
              reqTotal: data.reqTotal || 0,
              reqSuccess: data.reqSuccess || 0,
              reqFail: data.reqFail || 0,
              lastMemberId: data.lastMemberId || null,
            });
          }
        }
      }
    });
  } catch (e) {}
}

function refreshStatus(appType) {
  if (!appType || !runtime[appType]) return;
  _wireEvents(); // 确保面板打开即监听 daemon 事件（即使本会话未手动开关代理）
  const s = getSkillNest().getProxyStatus(appType) || {};
  const rt = runtime[appType];
  Object.assign(rt, {
    running: !!s.running,
    port: s.port || 0,
    members: s.members || [],
    logs: s.logs || rt.logs,
    startedAt: s.startedAt || 0,
    activeConn: s.activeConn || 0,
    reqTotal: s.reqTotal || 0,
    reqSuccess: s.reqSuccess || 0,
    reqFail: s.reqFail || 0,
    lastMemberId: s.lastMemberId || null,
  });
}

function listGroups(appType) { return getSkillNest().listRouteGroups(appType) || []; }
function saveGroup(g) { return getSkillNest().saveRouteGroup(g); }
function deleteGroup(appType, id) { return getSkillNest().deleteRouteGroup(appType, id); }

function startProxy(appType, groupId) {
  _wireEvents();
  const r = getSkillNest().startProxy(appType, groupId);
  refreshStatus(appType);
  return r;
}

function stopProxy(appType) {
  const r = getSkillNest().stopProxy(appType);
  refreshStatus(appType);
  return r;
}

function refreshAll() {
  ["codex", "claude", "gemini"].forEach(a => refreshStatus(a));
}

function toggleQuick(appType) {
  _wireEvents();
  const r = getSkillNest().toggleProxyQuick(appType);
  refreshAll();
  setTimeout(refreshAll, 300);
  return r;
}

function takeover(appType, port) { return getSkillNest().takeoverApp(appType, port); }
function restore(appType) { return getSkillNest().restoreApp(appType); }

function getProxyPort(appType) {
  try { return getSkillNest().getProxyPort(appType) || 8788; } catch (e) { return 8788; }
}

function setProxyPort(appType, port) {
  return getSkillNest().setProxyPort(appType, port) || { success: false };
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