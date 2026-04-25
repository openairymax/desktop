import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Plus, Search, X, Loader2, RefreshCw, AlertCircle,
  Clock, CheckCircle2, Ban, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessions } from '../hooks/useAgentOS';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  active: { color: 'var(--success-color)', bg: 'var(--success-light)', label: '活跃' },
  closed: { color: 'var(--text-muted)', bg: 'var(--bg-tertiary)', label: '已关闭' },
  expired: { color: 'var(--warning-color)', bg: 'var(--warning-light)', label: '已过期' },
};

const SessionManagement: React.FC = () => {
  const { sessions, loading, error: sessionsError, fetchSessions, createSession, closeSession, cleanExpiredSessions, getSessionCount, getActiveSessionCount } = useSessions();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { fetchSessions(); }, []);

  const filteredSessions = sessions.filter((s: any) => {
    const userId = s.userId || '';
    const id = s.id || '';
    const matchesSearch = !searchQuery ||
      userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: sessions.length,
    active: sessions.filter((s: any) => s.status === 'active').length,
    closed: sessions.filter((s: any) => s.status === 'closed').length,
    expired: sessions.filter((s: any) => s.status === 'expired').length,
  };

  const handleCreate = async () => {
    if (!newUserId.trim()) return;
    setActionLoading('create');
    try {
      await createSession(newUserId.trim());
      setNewUserId('');
      setShowCreateModal(false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleClose = async (sessionId: string) => {
    setActionLoading(`close-${sessionId}`);
    try { await closeSession(sessionId); } finally { setActionLoading(null); }
  };

  const handleCleanExpired = async () => {
    setActionLoading('clean');
    try { await cleanExpiredSessions(); } finally { setActionLoading(null); }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          }}>
            <MessageSquare size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              会话管理
            </h1>
            <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)' }}>AgentOS 会话全生命周期管理</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => fetchSessions()} style={{
            padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', fontSize: 'var(--font-size-md)',
            transition: 'all var(--transition-fast)',
          }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 刷新
          </button>
          <button onClick={handleCleanExpired} disabled={actionLoading === 'clean'} style={{
            padding: '8px 12px', border: '1px solid var(--warning-color)', borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--warning-light)', color: 'var(--warning-color)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', fontSize: 'var(--font-size-md)',
            transition: 'all var(--transition-fast)', opacity: actionLoading === 'clean' ? 0.5 : 1,
          }}>
            <Ban size={14} /> 清理过期
          </button>
          <button onClick={() => setShowCreateModal(true)} style={{
            padding: '8px 16px', border: 'none', borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)', color: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', fontSize: 'var(--font-size-md)',
            transition: 'all var(--transition-fast)',
          }}>
            <Plus size={16} /> 创建会话
          </button>
        </div>
      </div>

      {sessionsError && (
        <div style={{
          padding: '12px 16px', marginBottom: '16px', backgroundColor: 'var(--error-light)',
          border: '1px solid var(--error-color)', borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error-color)',
        }}>
          <AlertCircle size={16} />
          <span style={{ fontSize: 'var(--font-size-sm)' }}>{sessionsError}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => fetchSessions()}>重试</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: '会话总数', value: stats.total, icon: <MessageSquare size={18} />, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
          { label: '活跃会话', value: stats.active, icon: <CheckCircle2 size={18} />, color: 'var(--success-color)', bg: 'var(--success-light)' },
          { label: '已关闭', value: stats.closed, icon: <Ban size={18} />, color: 'var(--text-muted)', bg: 'var(--bg-tertiary)' },
          { label: '已过期', value: stats.expired, icon: <Clock size={18} />, color: 'var(--warning-color)', bg: 'var(--warning-light)' },
        ].map(s => (
          <div key={s.label} style={{
            backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px',
            boxShadow: 'var(--shadow-sm)', transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{
              width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
              backgroundColor: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {s.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>{s.label}</p>
              <p style={{ margin: '2px 0 0 0', fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索会话..." style={{
            width: '100%', padding: '10px 14px 10px 36px', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)',
            fontSize: 'var(--font-size-md)', fontFamily: 'inherit', outline: 'none', transition: 'all var(--transition-fast)',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#06b6d4'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(6,182,212,0.2)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
          {['all', 'active', 'closed', 'expired'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: 'none',
              backgroundColor: statusFilter === s ? 'var(--bg-card)' : 'transparent',
              color: statusFilter === s ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 'var(--font-size-sm)', fontWeight: statusFilter === s ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all var(--transition-fast)',
            }}>
              {STATUS_CONFIG[s]?.label || '全部'}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
          <Loader2 size={32} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {!loading && filteredSessions.length === 0 && (
        <div style={{
          backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)', padding: '48px', textAlign: 'center',
        }}>
          <MessageSquare size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>暂无会话</p>
          <button onClick={() => setShowCreateModal(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
            background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)', color: 'white', border: 'none',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--font-size-md)',
            transition: 'all var(--transition-fast)',
          }}>
            <Plus size={16} /> 创建第一个会话
          </button>
        </div>
      )}

      {!loading && filteredSessions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <AnimatePresence>
            {filteredSessions.map((session: any, index: number) => {
              const statusCfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.active;
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.03 }}
                  style={{
                    backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)', padding: '16px 20px', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: '16px', boxShadow: 'var(--shadow-sm)',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: 'var(--radius-md)',
                      background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0,
                    }}>
                      <MessageSquare size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                        {session.userId || '未知用户'}
                      </h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        #{session.id}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-xs)',
                      padding: '4px 10px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--font-weight-medium)',
                      color: statusCfg.color, backgroundColor: statusCfg.bg,
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: session.status === 'active' ? 'var(--success-color)' : statusCfg.color, display: 'inline-block' }} />
                      {statusCfg.label}
                    </span>
                    {session.createdAt && (
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                    )}
                    {session.status === 'active' && (
                      <button onClick={() => handleClose(session.id)} disabled={actionLoading === `close-${session.id}`} style={{
                        padding: '6px 10px', border: '1px solid var(--warning-color)', borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--warning-light)', color: 'var(--warning-color)', cursor: 'pointer',
                        fontSize: 'var(--font-size-xs)', fontFamily: 'inherit', transition: 'all var(--transition-fast)',
                        display: 'flex', alignItems: 'center', gap: '4px', opacity: actionLoading === `close-${session.id}` ? 0.5 : 1,
                      }}>
                        {actionLoading === `close-${session.id}` ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Ban size={12} />}
                        关闭
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: '24px', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', maxWidth: '440px', width: '100%', padding: '24px' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>创建会话</h2>
                <button onClick={() => setShowCreateModal(false)} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-secondary)', marginBottom: '6px' }}>用户ID</label>
                  <input type="text" value={newUserId} onChange={e => setNewUserId(e.target.value)} placeholder="输入用户标识..." style={{
                    width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 'var(--font-size-md)', fontFamily: 'inherit', outline: 'none', transition: 'all var(--transition-fast)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#06b6d4'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(6,182,212,0.2)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={() => setShowCreateModal(false)} style={{ padding: '8px 16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--font-size-md)' }}>取消</button>
                <button onClick={handleCreate} disabled={!newUserId.trim() || actionLoading === 'create'} style={{
                  padding: '8px 16px', background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)', color: 'white', border: 'none',
                  borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--font-size-md)',
                  display: 'flex', alignItems: 'center', gap: '6px', opacity: (!newUserId.trim() || actionLoading === 'create') ? 0.5 : 1,
                }}>
                  {actionLoading === 'create' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                  创建
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SessionManagement;
