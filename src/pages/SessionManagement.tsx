import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, Plus, Trash2, Clock, Users, Activity,
  Search, Filter, Play, Archive, Eye, X
} from 'lucide-react'

interface Session {
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

const SESSIONS: Session[] = [
  { id: 's1', name: '项目架构讨论', agent: '主智能体', status: 'active', messages: 42, tokens: 12800, createdAt: '2024-01-20 09:00', updatedAt: '2024-01-20 14:30', description: '讨论微服务架构和协议设计' },
  { id: 's2', name: '代码审查会话', agent: '代码工程师', status: 'completed', messages: 28, tokens: 8400, createdAt: '2024-01-20 10:00', updatedAt: '2024-01-20 11:15', description: '审查 AgentOS 核心模块代码' },
  { id: 's3', name: '市场调研分析', agent: '研究助手', status: 'active', messages: 15, tokens: 5600, createdAt: '2024-01-20 11:00', updatedAt: '2024-01-20 14:20', description: 'AI Agent 市场竞品分析' },
  { id: 's4', name: '安全审计', agent: '安全专家', status: 'completed', messages: 67, tokens: 21500, createdAt: '2024-01-19 14:00', updatedAt: '2024-01-19 17:45', description: '全面安全漏洞扫描和修复建议' },
  { id: 's5', name: '文档生成', agent: '文档助手', status: 'archived', messages: 33, tokens: 9800, createdAt: '2024-01-18 09:30', updatedAt: '2024-01-18 15:00', description: '生成 API 文档和使用指南' },
]

const AGENTS = [
  { id: 'auto', name: '自动选择' },
  { id: 'main', name: '主智能体' },
  { id: 'researcher', name: '研究助手' },
  { id: 'coder', name: '代码工程师' },
  { id: 'security', name: '安全专家' },
  { id: 'pm', name: '产品经理' },
  { id: 'tester', name: '测试工程师' },
]

export default function SessionManagement() {
  const [sessions, setSessions] = useState<Session[]>(SESSIONS)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [newSession, setNewSession] = useState({ name: '', agent: 'auto', description: '' })

  useEffect(() => {
    const stored = localStorage.getItem('agentos-sessions')
    if (stored) {
      try { setSessions(JSON.parse(stored)) } catch {}
    } else {
      localStorage.setItem('agentos-sessions', JSON.stringify(SESSIONS))
    }
  }, [])

  const saveSessions = (updated: Session[]) => {
    setSessions(updated)
    localStorage.setItem('agentos-sessions', JSON.stringify(updated))
  }

  const filtered = sessions.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchFilter = filterStatus === 'all' || s.status === filterStatus
    return matchSearch && matchFilter
  })

  const handleCreate = () => {
    if (!newSession.name.trim()) return
    const session: Session = {
      id: `s-${Date.now()}`,
      name: newSession.name,
      agent: AGENTS.find(a => a.id === newSession.agent)?.name || '主智能体',
      status: 'active',
      messages: 0,
      tokens: 0,
      createdAt: new Date().toLocaleString('zh-CN'),
      updatedAt: new Date().toLocaleString('zh-CN'),
      description: newSession.description || '新会话',
    }
    saveSessions([session, ...sessions])
    setShowCreateModal(false)
    setNewSession({ name: '', agent: 'auto', description: '' })
  }

  const archiveSession = (id: string) => {
    saveSessions(sessions.map(s =>
      s.id === id ? { ...s, status: 'archived' as const } : s
    ))
  }

  const deleteSession = (id: string) => {
    if (confirm('确定要删除此会话吗？')) {
      saveSessions(sessions.filter(s => s.id !== id))
    }
  }

  const stats = {
    total: sessions.length,
    active: sessions.filter(s => s.status === 'active').length,
    completed: sessions.filter(s => s.status === 'completed').length,
    archived: sessions.filter(s => s.status === 'archived').length,
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div className="grid-4" style={{ flex: 1, maxWidth: '600px' }}>
          <StatCard label="总会话" value={stats.total} />
          <StatCard label="进行中" value={stats.active} color="var(--success)" />
          <StatCard label="已完成" value={stats.completed} color="var(--info)" />
          <StatCard label="已归档" value={stats.archived} color="var(--text-muted)" />
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} /> 新建会话
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="搜索会话..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>
        <select className="input" style={{ width: '140px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">全部状态</option>
          <option value="active">进行中</option>
          <option value="completed">已完成</option>
          <option value="archived">已归档</option>
          <option value="error">错误</option>
        </select>
      </div>

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

      {filtered.length === 0 && <EmptyState message="未找到会话" subMessage="尝试其他搜索条件或创建新会话" />}

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
                    {AGENTS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>描述</label>
                  <textarea className="input" rows={3} placeholder="描述会话目的..." value={newSession.description} onChange={e => setNewSession({ ...newSession, description: e.target.value })} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>取消</button>
                  <button className="btn btn-primary" onClick={handleCreate}>创建</button>
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
