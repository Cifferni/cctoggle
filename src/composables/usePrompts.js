import { ref, computed } from "vue";

// Access window.utoolsCctoggle API with fallback stubs
const _ccs = () => window.utoolsCctoggle || {
  listPrompts: () => [],
  getPrompt: () => null,
  savePrompt: () => ({ success: false }),
  deletePrompt: () => ({ success: false }),
  duplicatePrompt: () => ({ success: false }),
  exportPrompts: () => "",
  importPrompts: () => ({ success: false }),
  readOriginalPrompt: () => "",
  readAllOriginalPrompts: () => ({}),
  backupOriginalPrompts: () => ({ success: false }),
  getBackups: () => ({}),
  restoreOriginalPrompt: () => ({ success: false }),
  restoreAllOriginalPrompts: () => ({}),
  applyPromptToAgent: () => ({ success: false }),
  togglePromptAgent: () => ({ success: false }),
};

const ALL_AGENTS = ["codex", "claude", "gemini", "openclaw"];
const AGENT_LABELS = {
  codex: "Codex",
  claude: "Claude",
  gemini: "Gemini",
  openclaw: "OpenClaw",
};

const prompts = ref([]);
const activePrompt = ref(null);
const loading = ref(false);
const activeAgentTab = ref("all");
const backups = ref({});
const originalPrompts = ref({});

// Load prompts from storage
function loadPrompts() {
  loading.value = true;
  try {
    prompts.value = _ccs().listPrompts() || [];
  } catch (e) {
    console.error("Failed to load prompts:", e);
    prompts.value = [];
  } finally {
    loading.value = false;
  }
}

// Get filtered prompts by agent
const filteredPrompts = computed(() => {
  if (activeAgentTab.value === "all") return prompts.value;
  return prompts.value.filter(p => p.agents?.includes(activeAgentTab.value));
});

// Generate unique ID
function generateId() {
  return "prompt_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

// Save prompt (create or update)
function savePrompt(prompt) {
  loading.value = true;
  try {
    const now = new Date().toISOString();
    // 创建纯 JSON 对象，避免传递响应式对象
    const promptData = {
      id: prompt.id || generateId(),
      name: String(prompt.name || ""),
      description: String(prompt.description || ""),
      content: String(prompt.content || ""),
      agents: Array.isArray(prompt.agents) ? [...prompt.agents] : [],
      tags: Array.isArray(prompt.tags) ? [...prompt.tags] : [],
      isTemplate: !!prompt.isTemplate,
      templateId: prompt.templateId || null,
      createdAt: prompt.createdAt || now,
      updatedAt: now,
    };

    const result = _ccs().savePrompt(promptData);
    if (result?.success !== false) {
      loadPrompts();
      return { success: true, prompt: promptData };
    }
    return { success: false, error: result?.error || "Save failed" };
  } catch (e) {
    console.error("Failed to save prompt:", e);
    return { success: false, error: e.message };
  } finally {
    loading.value = false;
  }
}

// Delete prompt by ID
function deletePrompt(id) {
  loading.value = true;
  try {
    const result = _ccs().deletePrompt(id);
    if (result?.success !== false) {
      if (activePrompt.value?.id === id) {
        activePrompt.value = null;
      }
      loadPrompts();
      return { success: true };
    }
    return { success: false, error: result?.error || "Delete failed" };
  } catch (e) {
    console.error("Failed to delete prompt:", e);
    return { success: false, error: e.message };
  } finally {
    loading.value = false;
  }
}

// Duplicate prompt
function duplicatePrompt(id) {
  loading.value = true;
  try {
    const result = _ccs().duplicatePrompt(id);
    if (result?.success !== false) {
      loadPrompts();
      return { success: true, prompt: result?.prompt };
    }
    return { success: false, error: result?.error || "Duplicate failed" };
  } catch (e) {
    console.error("Failed to duplicate prompt:", e);
    return { success: false, error: e.message };
  } finally {
    loading.value = false;
  }
}

// Set active prompt
function setActivePrompt(prompt) {
  activePrompt.value = prompt ? { ...prompt } : null;
}

// Export prompts to JSON
function exportPrompts() {
  try {
    return JSON.stringify(prompts.value, null, 2);
  } catch (e) {
    console.error("Failed to export prompts:", e);
    return null;
  }
}

// Import prompts from JSON
function importPrompts(jsonString) {
  loading.value = true;
  try {
    const data = JSON.parse(jsonString);
    if (!Array.isArray(data)) {
      return { success: false, error: "Invalid format: expected array" };
    }

    let imported = 0;
    for (const prompt of data) {
      if (prompt.name && prompt.content) {
        const result = savePrompt(prompt);
        if (result.success) imported++;
      }
    }

    return { success: true, count: imported };
  } catch (e) {
    console.error("Failed to import prompts:", e);
    return { success: false, error: e.message };
  } finally {
    loading.value = false;
  }
}

// Create prompt from template
function createFromTemplate(template) {
  return savePrompt({
    name: template.name,
    content: template.content,
    description: template.description,
    agents: template.agents || [],
    variables: template.variables || [],
    tags: template.tags || [],
    isTemplate: false,
    templateId: template.id || null,
  });
}

// Load backups from storage
function loadBackups() {
  try {
    backups.value = _ccs().getBackups() || {};
  } catch (e) {
    console.error("Failed to load backups:", e);
    backups.value = {};
  }
}

// Backup current original prompts
function backupOriginalPrompts() {
  try {
    const result = _ccs().backupOriginalPrompts();
    if (result?.success !== false) {
      loadBackups();
      return { success: true };
    }
    return { success: false, error: result?.error || "Backup failed" };
  } catch (e) {
    console.error("Failed to backup prompts:", e);
    return { success: false, error: e.message || "Unknown error" };
  }
}

// Read all original prompts from Agent configs
function loadOriginalPrompts() {
  try {
    originalPrompts.value = _ccs().readAllOriginalPrompts() || {};
  } catch (e) {
    console.error("Failed to load original prompts:", e);
    originalPrompts.value = {};
  }
}

// Restore original prompt for specific agent
function restoreOriginalPrompt(agent) {
  loading.value = true;
  try {
    const result = _ccs().restoreOriginalPrompt(agent);
    if (result?.success !== false) {
      loadOriginalPrompts();
      return { success: true };
    }
    return { success: false, error: result?.error || "Restore failed" };
  } catch (e) {
    console.error("Failed to restore prompt:", e);
    return { success: false, error: e.message };
  } finally {
    loading.value = false;
  }
}

// Restore all original prompts
function restoreAllOriginalPrompts() {
  loading.value = true;
  try {
    const results = _ccs().restoreAllOriginalPrompts();
    loadOriginalPrompts();
    return { success: true, results };
  } catch (e) {
    console.error("Failed to restore all prompts:", e);
    return { success: false, error: e.message };
  } finally {
    loading.value = false;
  }
}

// Check if backup exists for agent
function hasBackup(agent) {
  return !!(backups.value[agent]?.content);
}

// Get backup content for agent
function getBackupContent(agent) {
  return backups.value[agent]?.content || "";
}

// Apply prompt to agent (write to config and update associations)
function applyPromptToAgent(promptId, agent) {
  loading.value = true;
  try {
    const result = _ccs().applyPromptToAgent(promptId, agent);
    if (result?.success !== false) {
      loadPrompts();
      return { success: true };
    }
    return { success: false, error: result?.error || "Apply failed" };
  } catch (e) {
    console.error("Failed to apply prompt:", e);
    return { success: false, error: e.message };
  } finally {
    loading.value = false;
  }
}

// Toggle prompt agent association (without writing to config)
function togglePromptAgent(promptId, agent) {
  try {
    const result = _ccs().togglePromptAgent(promptId, agent);
    if (result?.success !== false) {
      loadPrompts();
      return { success: true, associated: result?.associated };
    }
    return { success: false, error: result?.error || "Toggle failed" };
  } catch (e) {
    console.error("Failed to toggle agent:", e);
    return { success: false, error: e.message };
  }
}

export function usePrompts() {
  return {
    // Constants
    ALL_AGENTS,
    AGENT_LABELS,

    // State
    prompts,
    activePrompt,
    loading,
    activeAgentTab,
    filteredPrompts,
    backups,
    originalPrompts,

    // Methods
    loadPrompts,
    savePrompt,
    deletePrompt,
    duplicatePrompt,
    setActivePrompt,
    exportPrompts,
    importPrompts,
    createFromTemplate,
    loadBackups,
    backupOriginalPrompts,
    loadOriginalPrompts,
    restoreOriginalPrompt,
    restoreAllOriginalPrompts,
    hasBackup,
    getBackupContent,
    applyPromptToAgent,
    togglePromptAgent,
  };
}
