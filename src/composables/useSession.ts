// composables/useSession.ts
import { ref, computed, nextTick } from 'vue'
import { appMessage } from './useAppMessage'
import { getSkillNest, APP_ICONS } from './shared'
import type { SessionMeta, SessionMessage, ScanSessionsResult } from '../types/utools-cctoggle'

interface SessionApp {
  key: string
  label: string
}

interface SortOption {
  value: string
  label: string
}

interface AppStat {
  app: string
  label: string
  icon: string | null
  count: number
}

const SESSION_APPS: SessionApp[] = [
  { key: 'claude', label: 'Claude' },
  { key: 'claude-desktop', label: 'Desktop' },
  { key: 'codex', label: 'Codex' },
  { key: 'openclaw', label: 'OpenClaw' },
]

const SORT_OPTIONS: SortOption[] = [
  { value: 'all', label: '全部' },
  { value: 'today', label: '今日活跃' },
  { value: 'time-desc', label: '时间倒序' },
  { value: 'time-asc', label: '时间正序' },
  { value: 'name-asc', label: '名称 A-Z' },
  { value: 'name-desc', label: '名称 Z-A' },
]

const PAGE_SIZE = 20

export function useSession() {
  // 组件级状态
  const sessions = ref<SessionMeta[]>([])
  const offset = ref(0)
  const total = ref(0)
  const loading = ref(false)
  const loadingMore = ref(false)
  const switching = ref(false)
  const activeApp = ref('claude')
  const searchQuery = ref('')
  const sortBy = ref('all')
  const detailSession = ref<SessionMeta | null>(null)
  const detailMessages = ref<SessionMessage[]>([])
  const detailLoading = ref(false)
  const showDetail = ref(false)

  const appStats = ref<AppStat[]>(
    SESSION_APPS.map(a => ({
      app: a.key,
      label: a.label,
      icon: APP_ICONS[a.key] || null,
      count: 0,
    }))
  )

  // 计算属性
  const hasMore = computed(() => sessions.value.length < total.value)
  const showSkeleton = computed(() => loading.value && sessions.value.length === 0)

  // 加载第一页
  async function loadPage(): Promise<void> {
    const myApp = activeApp.value
    sessions.value = []
    offset.value = 0
    total.value = 0
    loading.value = true
    try {
      const result = await getSkillNest().scanSessions(myApp, {
        offset: 0,
        limit: PAGE_SIZE,
        search: searchQuery.value,
        sort: sortBy.value,
      })
      if (activeApp.value !== myApp) return
      sessions.value = result.sessions || []
      total.value = result.total || 0
    } catch (e) {
      if (activeApp.value !== myApp) return
      console.error('Failed to load sessions:', e)
      sessions.value = []
      total.value = 0
    } finally {
      if (activeApp.value === myApp) loading.value = false
    }
  }

  // 加载下一页
  async function loadMore(): Promise<void> {
    if (loadingMore.value || !hasMore.value) return
    const myApp = activeApp.value
    loadingMore.value = true
    try {
      const nextOffset = offset.value + PAGE_SIZE
      const result = await getSkillNest().scanSessions(myApp, {
        offset: nextOffset,
        limit: PAGE_SIZE,
        search: searchQuery.value,
        sort: sortBy.value,
      })
      if (activeApp.value !== myApp) return
      sessions.value = [...sessions.value, ...(result.sessions || [])]
      offset.value = nextOffset
    } catch (e) {
      if (activeApp.value !== myApp) return
      console.error('Failed to load more sessions:', e)
    } finally {
      loadingMore.value = false
    }
  }

  // 切换 Tab
  async function switchApp(app: string): Promise<void> {
    if (switching.value) return
    switching.value = true
    activeApp.value = app
    searchQuery.value = ''
    sessions.value = []
    total.value = 0
    await nextTick()
    try {
      await loadPage()
    } finally {
      switching.value = false
    }
  }

  async function onSearch(query: string): Promise<void> {
    searchQuery.value = query
    await loadPage()
  }

  async function onSortChange(sort: string): Promise<void> {
    sortBy.value = sort
    await loadPage()
  }

  // 加载统计
  async function loadStats(): Promise<void> {
    try {
      const results = await Promise.all(
        SESSION_APPS.map(app => getSkillNest().scanSessions(app.key, { offset: 0, limit: 0 }))
      )
      appStats.value = SESSION_APPS.map((app, i) => ({
        app: app.key,
        label: app.label,
        icon: APP_ICONS[app.key] || null,
        count: results[i]?.total || 0,
      }))
    } catch (e) {
      console.error('Failed to load stats:', e)
    }
  }

  async function loadDetail(session: SessionMeta): Promise<void> {
    detailLoading.value = true
    showDetail.value = true
    detailSession.value = session
    detailMessages.value = []
    try {
      const msgs = await getSkillNest().loadSessionDetail(session.filePath)
      detailMessages.value = msgs || []
    } catch (e) {
      console.error('Failed to load session detail:', e)
      detailMessages.value = []
    } finally {
      detailLoading.value = false
    }
  }

  function closeDetail(): void {
    showDetail.value = false
    detailSession.value = null
    detailMessages.value = []
  }

  function deleteSession(session: SessionMeta) {
    const result = getSkillNest().deleteSession(session.filePath)
    if (result.success) {
      sessions.value = sessions.value.filter(s => s.id !== session.id)
      total.value = Math.max(0, total.value - 1)
      appMessage.success('会话已删除')
    } else {
      appMessage.error('删除失败：' + (result.error || '未知错误'))
    }
    return result
  }

  async function clearSessions(app?: string): Promise<void> {
    const target = app || activeApp.value
    const toDelete = sessions.value.filter(s => s.app === target)
    if (toDelete.length === 0) {
      appMessage.info('没有可清空的会话')
      return
    }
    const filePaths = toDelete.map(s => s.filePath)
    const result = getSkillNest().clearAllSessions(filePaths)
    await loadPage()
    if (result.success) {
      appMessage.success('已清空 ' + result.count + ' 个会话')
    } else {
      appMessage.error('清空失败')
    }
  }

  function exportSession(session: SessionMeta, format: string): void {
    let data: string
    let ext: string
    if (format === 'markdown') {
      data = _toMarkdown(session, detailMessages.value)
      ext = '.md'
    } else {
      data = JSON.stringify({
        exportedAt: new Date().toISOString(),
        app: session.app,
        session: Object.assign({}, session, { messages: detailMessages.value }),
      }, null, 2)
      ext = '.json'
    }

    try {
      const savePath = utools.showSaveDialog({
        defaultPath: (session.title || 'session').replace(/[<>:"/\\|?*]/g, '_') + ext,
        filters: [{ name: format === 'markdown' ? 'Markdown' : 'JSON', extensions: [ext.replace('.', '')] }],
      })
      if (savePath) {
        require('fs').writeFileSync(savePath, data, 'utf8')
        appMessage.success('导出成功')
      }
    } catch (e) {
      try {
        utools.copyText(data)
        appMessage.success('已复制到剪贴板')
      } catch (e2) {
        appMessage.error('导出失败')
      }
    }
  }

  function exportAllSessions(format: string): void {
    const allData = sessions.value.map(s => Object.assign({}, s, { filePath: undefined }))
    const data = JSON.stringify({
      exportedAt: new Date().toISOString(),
      sessions: allData,
    }, null, 2)

    try {
      const savePath = utools.showSaveDialog({
        defaultPath: 'sessions-export.json',
        filters: [{ name: 'JSON', extensions: ['json'] }],
      })
      if (savePath) {
        require('fs').writeFileSync(savePath, data, 'utf8')
        appMessage.success('导出成功')
      }
    } catch (e) {
      try {
        utools.copyText(data)
        appMessage.success('已复制到剪贴板')
      } catch (e2) {
        appMessage.error('导出失败')
      }
    }
  }

  function cleanup(): void {
    try { getSkillNest().clearSessionCache() } catch (e) { /* ignore */ }
  }

  function _toMarkdown(session: SessionMeta, messages: SessionMessage[]): string {
    const lines: string[] = []
    lines.push(`# ${session.title}`)
    lines.push('')
    lines.push(`**应用**: ${session.app}`)
    if (session.projectPath) lines.push(`**项目**: ${session.projectPath}`)
    if (session.createdAt) lines.push(`**创建时间**: ${session.createdAt}`)
    if (session.updatedAt) lines.push(`**更新时间**: ${session.updatedAt}`)
    lines.push(`**消息数**: ${session.messageCount}`)
    if (session.tokenUsage) lines.push(`**Token 用量**: ${session.tokenUsage.toLocaleString()}`)
    lines.push('')
    lines.push('---')
    lines.push('')
    lines.push('## 对话记录')
    lines.push('')

    for (const msg of messages || []) {
      lines.push(`### ${msg.role === 'user' ? 'User' : 'Assistant'}`)
      lines.push(msg.content)
      lines.push('')
    }

    return lines.join('\n')
  }

  return {
    sessions, total, appStats, loading, loadingMore, switching,
    hasMore, showSkeleton,
    activeApp, searchQuery, sortBy, SESSION_APPS, SORT_OPTIONS,
    showDetail, detailSession, detailMessages, detailLoading,
    loadPage, loadMore, switchApp, onSearch, onSortChange,
    loadStats, loadDetail, closeDetail, deleteSession, clearSessions,
    exportSession, exportAllSessions, cleanup,
  }
}
