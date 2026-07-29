// MCP Server 状态管理

import { ref } from "vue";
import { getSkillNest, toPlain } from "./shared.js";

const mcpServers = ref([]);

function loadServers() {
  mcpServers.value = getSkillNest().listMcpServers();
}

function saveServer(data) {
  getSkillNest().saveMcpServer(toPlain(data));
  loadServers();
}

function deleteServer(id) {
  getSkillNest().deleteMcpServer(id);
  loadServers();
}

function toggleServer(id) {
  getSkillNest().toggleMcpServer(id);
  loadServers();
}

function getServer(id) {
  return getSkillNest().getMcpServer(id);
}

function syncFromConfigFiles() {
  getSkillNest().syncFromConfigFiles();
  loadServers();
}

export function useMcp() {
  return {
    mcpServers,
    loadServers,
    saveServer,
    deleteServer,
    toggleServer,
    getServer,
    syncFromConfigFiles,
  };
}
