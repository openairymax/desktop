import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, Plus, Trash2, Clock, Users, Activity,
  Search, Archive, Eye, X, RefreshCw, AlertCircle
} from 'lucide-react'
import { useSessions, useAgentOS, useAgents } from '../hooks/useAgentOS'
import type { Session } from '../services/agentos.service'
import { SessionStatus } from '../services/agentos.service'
import { useTranslation } from 'react-i18next'

interface DisplaySession {
  id: string
  name: string
  agent: string
  status: 'active' | 'completed' | 'archived' | 'error'
  messages: number
  tokens: number
  createdAt: string
  updatedAt: string
  description: string
}

function toDisplaySession(s: Session, t: (...args: any[]) => string): DisplaySession {
  return {
    id: s.id,
    name: (s.context?.name as string) || (s.metadata?.name as string) || t('sessionExtended.defaultSessionName', { id: s.id.slice(0, 8) }),
    agent: (s.context?.agent as string) || (s.metadata?.agent as string) || s.userId || t('sessionExtended.defaultAgent'),
    status: s.status === SessionStatus.ACTIVE ? 'active' :
            s.status === SessionStatus.EXPIRED ? 'archived' :
            s.status === SessionStatus.INACTIVE ? 'completed' : 'error',
    messages: (s.context?.messages as number) || (s.metadata?.messages as number) || 0,
    tokens: (s.context?.tokens as number) || (s.metadata?.tokens as number) || 0,
    createdAt: s.createdAt || '',
    updatedAt: s.lastActivity || '',
    description: (s.context?.description as string) || (s.metadata?.description as string) || '',
  }
}

const DEFAULT_AGENTS = [
  { id: 'auto', name: 'Auto Select' },
]

export default function SessionManagement() {
  const { t } = useTranslation()
  const { sessions: apiSessions, loading, error, fetchSessions, createSession, closeSession } = useSessions()
  const { connection } = useAgentOS()
  const { agents, fetchAgents } = useAgents()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<DisplaySession | null>(null)
  const [newSession, setNewSession] = useState({ name: '', agent: 'auto', description: '' })

  useEffect(() => {
    if (connection.status === 'connected') {
      fetchSessions()
      fetchAgents()
    }
  }, [connection.status, fetchSessions])

  const displaySessions: DisplaySession[] = apiSessions.map(s => toDisplaySession(s, t as any))

  const filtered = displaySessions.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchFilter = filterStatus === 'all' || s.status === filterStatus
    return matchSearch && matchFilter
  })

  const handleCreate = useCallback(async () => {
    if (!newSession.name.trim()) return
    try {
      await createSession(newSession.agent === 'auto' ? 'default' : newSession.agent)
    } catch (e) { console.warn('Failed to create session:', e) }
    setShowCreateModal(false)
    setNewSession({ name: '', agent: 'auto', description: '' })
  }, [newSession, createSession])

  const archiveSession = useCallback(async (id: string) => {
    try {
      await closeSession(id)
    } catch (e) { console.warn('Failed to archive session:', e) }
  }, [closeSession])

  const deleteSession = useCallback(async (id: string) => {
    if (confirm(t('sessionExtended.deleteConfirm'))) {
      try {
        await closeSession(id)
      } catch (e) { console.warn('Failed to delete session:', e) }
    }
  }, [closeSession])

  const stats = {
    total: displaySessions.length,
    active: displaySessions.filter(s => s.status === 'active').length,
    completed: displaySessions.filter(s => s.status === 'completed').length,
    archived: displaySessions.filter(s => s.status === 'archived').length,
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div className="grid-4" style={{ flex: 1, maxWidth: '600px' }}>
          <StatCard label={t('sessionExtended.totalSessions')} value={stats.total} />
          <StatCard label={t('sessionExtended.inProgress')} value={stats.active} color="var(--success)" />
          <StatCard label={t('sessionExtended.completedSessions')} value={stats.completed} color="var(--info)" />
          <StatCard label={t('sessionExtended.archivedSessions')} value={stats.archived} color="var(--text-muted)" />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => fetchSessions()} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> {t('sessionExtended.newSession')}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', marginBottom: '12px', background: 'var(--bg-error)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--error)' }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder={t('sessionExtended.searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>
        <select className="input" style={{ width: '140px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">{t('sessionExtended.allStatuses')}</option>
          <option value="active">{t('sessionExtended.statusActive')}</option>
          <option value="completed">{t('sessionExtended.statusCompleted')}</option>
          <option value="archived">已归档</option>
          <option value="error">错误</option>
        </select>
      </div>

      {loading && displaySessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} className="spin" style={{ marginBottom: '12px', opacity: 0.4 }} />
          <div style={{ fontSize: '14px' }}>加载会话数据...</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <AnimatePresence>
            {filtered.map((session, i) => (
              <motion.div
                key={session.id}
                className="card"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '16px 18px' }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: session.status === 'active' ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'var(--bg-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <MessageCircle size={18} style={{ color: session.status === 'active' ? 'white' : 'var(--text-muted)' }} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700 }}>{session.name}</h3>
                    <span className={`badge ${
                      session.status === 'active' ? 'badge-success' :
                      session.status === 'completed' ? 'badge-info' :
                      session.status === 'archived' ? 'badge-default' : 'badge-error'
                    }`} style={{ fontSize: '11px' }}>
                      {session.status === 'active' ? '进行中' : session.status === 'completed' ? '已完成' : session.status === 'archived' ? '已归档' : '错误'}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{session.description}</p>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span><Users size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />{session.agent}</span>
                    <span><MessageCircle size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />{session.messages} 条消息</span>
                    <span><Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />{session.updatedAt}</span>
                    <span><Activity size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />{(session.tokens / 1000).toFixed(1)}K tokens</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => setSelectedSession(session)}>
                    <Eye size={13} />
                  </button>
                  {session.status === 'active' && (
                    <button className="btn btn-sm btn-secondary" onClick={() => archiveSession(session.id)}>
                      <Archive size={13} />
                    </button>
                  )}
                  <button className="btn btn-sm btn-danger" onClick={() => deleteSession(session.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {filtered.length === 0 && !loading && <EmptyState message="未找到会话" subMessage={connection.status === 'connected' ? '尝试其他搜索条件或创建新会话' : '请先连接到 AgentOS 后端'} />}

      <AnimatePresence>
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <motion.div className="modal-content" onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="modal-header">
                <h2 className="modal-title">新建会话</h2>
                <button className="modal-close" onClick={() => setShowCreateModal(false)}><X size={18} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>会话名称</label>
                  <input className="input" placeholder="输入会话名称..." value={newSession.name} onChange={e => setNewSession({ ...newSession, name: e.target.value })} autoFocus />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>分配智能体</label>
                  <select className="input" value={newSession.agent} onChange={e => setNewSession({ ...newSession, agent: e.target.value })}>
                    {[...DEFAULT_AGENTS, ...agents.map(a => ({ id: a.agent_id || a.id, name: a.name || a.agent_id || a.id }))].map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>描述</label>
                  <textarea className="input" rows={3} placeholder="描述会话目的..." value={newSession.description} onChange={e => setNewSession({ ...newSession, description: e.target.value })} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>取消</button>
                  <button className="btn btn-primary" onClick={handleCreate} disabled={connection.status !== 'connected'}>创建</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedSession && (
          <div className="modal-overlay" onClick={() => setSelectedSession(null)}>
            <motion.div className="modal-content" onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="modal-header">
                <h2 className="modal-title">{selectedSession.name} - 详情</h2>
                <button className="modal-close" onClick={() => setSelectedSession(null)}><X size={18} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                <DetailRow label="ID" value={selectedSession.id} />
                <DetailRow label="智能体" value={selectedSession.agent} />
                <DetailRow label="状态" value={selectedSession.status === 'active' ? '进行中' : selectedSession.status === 'completed' ? '已完成' : selectedSession.status === 'archived' ? '已归档' : '错误'} />
                <DetailRow label="描述" value={selectedSession.description} />
                <DetailRow label="消息数" value={`${selectedSession.messages} 条`} />
                <DetailRow label="Token 用量" value={`${selectedSession.tokens.toLocaleString()} (${(selectedSession.tokens / 1000).toFixed(1)}K)`} />
                <DetailRow label="创建时间" value={selectedSession.createdAt} />
                <DetailRow label="更新时间" value={selectedSession.updatedAt} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 800, color: color || 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function EmptyState({ message, subMessage }: { message: string; subMessage: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
      <MessageCircle size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
      <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>{message}</div>
      <div style={{ fontSize: '14px' }}>{subMessage}</div>
    </div>
  )
}
