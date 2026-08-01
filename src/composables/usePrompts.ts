import { ref, computed } from 'vue'
import { getSkillNest } from './shared'
import type { Prompt, BackupMap, PromptSaveResult } from '../types/utools-cctoggle'

const ALL_AGENTS = ['codex', 'claude', 'gemini', 'openclaw'] as const
const AGENT_LABELS: Record<string, string> = {
  codex: 'Codex',
  claude: 'Claude',
  gemini: 'Gemini',
  openclaw: 'OpenClaw',
}

const prompts = ref<Prompt[]>([])
const activePrompt = ref<Prompt | null>(null)
const loading = ref(false)
const activeAgentTab = ref('all')
const backups = ref<BackupMap>({})
const originalPrompts = ref<Record<string, string>>({})

function loadPrompts(): void {
  loading.value = true
  try {
    prompts.value = getSkillNest().listPrompts() || []
  } catch (e) {
    console.error('Failed to load prompts:', e)
    prompts.value = []
  } finally {
    loading.value = false
  }
}

const filteredPrompts = computed(() => {
  if (activeAgentTab.value === 'all') return prompts.value
  return prompts.value.filter(p => p.agents?.includes(activeAgentTab.value))
})

function generateId(): string {
  return 'prompt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

function savePrompt(prompt: Partial<Prompt>): PromptSaveResult {
  loading.value = true
  try {
    const now = new Date().toISOString()
    const promptData: Prompt = {
      id: prompt.id || generateId(),
      name: String(prompt.name || ''),
      description: String(prompt.description || ''),
      content: String(prompt.content || ''),
      agents: Array.isArray(prompt.agents) ? [...prompt.agents] : [],
      variables: Array.isArray(prompt.variables) ? [...prompt.variables] : [],
      tags: Array.isArray(prompt.tags) ? [...prompt.tags] : [],
      isTemplate: !!prompt.isTemplate,
      templateId: prompt.templateId || null,
      createdAt: prompt.createdAt || now,
      updatedAt: now,
    }

    const result = getSkillNest().savePrompt(promptData)
    if (result?.success !== false) {
      loadPrompts()
      return { success: true, prompt: promptData }
    }
    return { success: false, error: result?.error || 'Save failed' }
  } catch (e: any) {
    console.error('Failed to save prompt:', e)
    return { success: false, error: e.message }
  } finally {
    loading.value = false
  }
}

function deletePrompt(id: string) {
  loading.value = true
  try {
    const result = getSkillNest().deletePrompt(id)
    if (result?.success !== false) {
      if (activePrompt.value?.id === id) {
        activePrompt.value = null
      }
      loadPrompts()
      return { success: true }
    }
    return { success: false, error: result?.error || 'Delete failed' }
  } catch (e: any) {
    console.error('Failed to delete prompt:', e)
    return { success: false, error: e.message }
  } finally {
    loading.value = false
  }
}

function duplicatePrompt(id: string) {
  loading.value = true
  try {
    const result = getSkillNest().duplicatePrompt(id)
    if (result?.success !== false) {
      loadPrompts()
      return { success: true, prompt: result?.prompt }
    }
    return { success: false, error: result?.error || 'Duplicate failed' }
  } catch (e: any) {
    console.error('Failed to duplicate prompt:', e)
    return { success: false, error: e.message }
  } finally {
    loading.value = false
  }
}

function setActivePrompt(prompt: Prompt | null): void {
  activePrompt.value = prompt ? { ...prompt } : null
}

function exportPrompts(): string | null {
  try {
    return JSON.stringify(prompts.value, null, 2)
  } catch (e) {
    console.error('Failed to export prompts:', e)
    return null
  }
}

function importPrompts(jsonString: string) {
  loading.value = true
  try {
    const data = JSON.parse(jsonString)
    if (!Array.isArray(data)) {
      return { success: false, error: 'Invalid format: expected array' }
    }

    let imported = 0
    for (const prompt of data) {
      if (prompt.name && prompt.content) {
        const result = savePrompt(prompt)
        if (result.success) imported++
      }
    }

    return { success: true, count: imported }
  } catch (e: any) {
    console.error('Failed to import prompts:', e)
    return { success: false, error: e.message }
  } finally {
    loading.value = false
  }
}

function createFromTemplate(template: Partial<Prompt>): PromptSaveResult {
  return savePrompt({
    name: template.name,
    content: template.content,
    description: template.description,
    agents: template.agents || [],
    variables: template.variables || [],
    tags: template.tags || [],
    isTemplate: false,
    templateId: template.id || null,
  })
}

function loadBackups(): void {
  try {
    backups.value = getSkillNest().getBackups() || {}
  } catch (e) {
    console.error('Failed to load backups:', e)
    backups.value = {}
  }
}

function backupOriginalPrompts() {
  loading.value = true
  try {
    const result = getSkillNest().backupOriginalPrompts()
    if (result?.success !== false) {
      loadBackups()
      return { success: true }
    }
    return { success: false, error: result?.error || 'Backup failed' }
  } catch (e: any) {
    console.error('Failed to backup prompts:', e)
    return { success: false, error: e.message || 'Unknown error' }
  } finally {
    loading.value = false
  }
}

function backupSelectedPrompts(agentList: string[]) {
  loading.value = true
  try {
    const result = getSkillNest().backupSelectedPrompts(agentList)
    if (result?.success !== false) {
      loadBackups()
      return { success: true }
    }
    return { success: false, error: result?.error || 'Backup failed' }
  } catch (e: any) {
    console.error('Failed to backup prompts:', e)
    return { success: false, error: e.message || 'Unknown error' }
  } finally {
    loading.value = false
  }
}

function loadOriginalPrompts(): void {
  try {
    originalPrompts.value = getSkillNest().readAllOriginalPrompts() || {}
  } catch (e) {
    console.error('Failed to load original prompts:', e)
    originalPrompts.value = {}
  }
}

function restoreOriginalPrompt(agent: string) {
  loading.value = true
  try {
    const result = getSkillNest().restoreOriginalPrompt(agent)
    if (result?.success !== false) {
      loadOriginalPrompts()
      return { success: true }
    }
    return { success: false, error: result?.error || 'Restore failed' }
  } catch (e: any) {
    console.error('Failed to restore prompt:', e)
    return { success: false, error: e.message }
  } finally {
    loading.value = false
  }
}

function restoreAllOriginalPrompts() {
  loading.value = true
  try {
    const results = getSkillNest().restoreAllOriginalPrompts()
    loadOriginalPrompts()
    const agents = Object.keys(results || {})
    const succeeded = agents.filter(a => results[a]?.success)
    const failed = agents.filter(a => !results[a]?.success)
    if (succeeded.length === 0) {
      return { success: false, error: '所有 Agent 恢复失败', results }
    }
    return { success: true, results, succeeded, failed }
  } catch (e: any) {
    console.error('Failed to restore all prompts:', e)
    return { success: false, error: e.message }
  } finally {
    loading.value = false
  }
}

function hasBackup(agent: string): boolean {
  return !!(backups.value[agent]?.backedUpAt)
}

function getBackupContent(agent: string): string {
  return backups.value[agent]?.content || ''
}

function applyPromptToAgent(promptId: string, agent: string) {
  loading.value = true
  try {
    const result = getSkillNest().applyPromptToAgent(promptId, agent)
    if (result?.success !== false) {
      loadPrompts()
      return { success: true }
    }
    return { success: false, error: result?.error || 'Apply failed' }
  } catch (e: any) {
    console.error('Failed to apply prompt:', e)
    return { success: false, error: e.message }
  } finally {
    loading.value = false
  }
}

function togglePromptAgent(promptId: string, agent: string) {
  try {
    const result = getSkillNest().togglePromptAgent(promptId, agent)
    if (result?.success !== false) {
      loadPrompts()
      return { success: true, associated: result?.associated }
    }
    return { success: false, error: result?.error || 'Toggle failed' }
  } catch (e: any) {
    console.error('Failed to toggle agent:', e)
    return { success: false, error: e.message }
  }
}

export function usePrompts() {
  return {
    ALL_AGENTS, AGENT_LABELS,
    prompts, activePrompt, loading, activeAgentTab, filteredPrompts,
    backups, originalPrompts,
    loadPrompts, savePrompt, deletePrompt, duplicatePrompt,
    setActivePrompt, exportPrompts, importPrompts, createFromTemplate,
    loadBackups, backupOriginalPrompts, backupSelectedPrompts,
    loadOriginalPrompts, restoreOriginalPrompt, restoreAllOriginalPrompts,
    hasBackup, getBackupContent, applyPromptToAgent, togglePromptAgent,
  }
}
