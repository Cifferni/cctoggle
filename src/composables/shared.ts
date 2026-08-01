// Shared constants and utilities across composables

import type { UtoolsCctoggle, AppType } from '../types/utools-cctoggle'

export const APP_TYPES: AppType[] = ['codex', 'claude', 'claude-desktop', 'openclaw', 'gemini']

export const APP_OPTIONS = [
  { value: 'claude' as const, label: 'Claude' },
  { value: 'claude-desktop' as const, label: 'Claude Desktop' },
  { value: 'codex' as const, label: 'Codex' },
  { value: 'openclaw' as const, label: 'OpenClaw' },
]

export const APP_LABELS: Record<string, string> = {
  codex: 'Codex',
  claude: 'Claude',
  'claude-desktop': 'Desktop',
  openclaw: 'OpenClaw',
  gemini: 'Gemini',
  all: '全部',
}

import codexIcon from '../assets/images/agents/codex.svg'
import claudeIcon from '../assets/images/agents/claude.svg'
import claudeDesktopIcon from '../assets/images/agents/claude-desktop.svg'
import openclawIcon from '../assets/images/agents/openclaw.svg'
import geminiIcon from '../assets/images/agents/gemini.svg'

export const APP_ICONS: Record<string, string> = {
  codex: codexIcon,
  claude: claudeIcon,
  'claude-desktop': claudeDesktopIcon,
  openclaw: openclawIcon,
  gemini: geminiIcon,
}

/** 安全访问 window.utoolsCctoggle API，返回类型为 UtoolsCctoggle */
export function getSkillNest(): UtoolsCctoggle {
  return window.utoolsCctoggle!
}

/** 检查 preload API 是否可用 */
export function hasSkillNest(): boolean {
  return !!window.utoolsCctoggle
}

/**
 * 递归将 Vue 响应式/ref 代理对象转为纯对象
 * 避免 uTools IPC "An object could not be cloned" 错误
 */
export function toPlain<T>(v: T): T {
  if (v == null) return v
  if (Array.isArray(v)) return v.map(toPlain) as T
  if (typeof v === 'object') {
    const o: Record<string, unknown> = {}
    for (const k of Object.keys(v as object)) o[k] = toPlain((v as Record<string, unknown>)[k])
    return o as T
  }
  return v
}
