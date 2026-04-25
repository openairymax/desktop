import React, { useState, useEffect } from 'react';
import {
  Bot, Plus, Play, Square, Search, Trash2, Eye,
  AlertCircle, Clock, X, Zap, RefreshCw, Loader2, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgents } from '../hooks/useAgentOS';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; dot: string }> = {
  running: { color: 'var(--success-color)', bg: 'var(--success-light)', label: '运行中', dot: 'bg-green-500' },
  idle: { color: 'var(--warning-color)', bg: 'var(--warning-light)', label: '空闲', dot: 'bg-yellow-500' },
  stopped: { color: 'var(--text-muted)', bg: 'var(--bg-tertiary)', label: '已停止', dot: 'bg-gray-400' },
  error: { color: 'var(--error-color)', bg: 'var(--error-light)', label: '错误', dot: 'bg-red-500' },
};

const AgentManagement: React.FC = () => {
  const { agents, loading, error: agentsError, fetchAgents, spawnAgent, terminateAgent, invokeAgent } = useAgents();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showInvokeModal, setShowInvokeModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [invokeInput, setInvokeInput] = useState('');

  useEffect(() => { fetchAgents(); }, []);

  const filteredAgents = agents.filter((a: any) => {
    const name = a.name || '';
    const matchesSearch = !searchQuery || name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: agents.length,
    running: agents.filter((a: any) => a.status === 'running').length,
    idle: agents.filter((a: any) => a.status === 'idle').length,
    stopped: agents.filter((a: any) => a.status === 'stopped' || a.status === 'error').length,
  };

  const handleSpawn = async () => {
    if (!newName.trim()) return;
    setActionLoading('spawn');
    try {
      await spawnAgent(newName.trim(), newDescription ? { description: newDescription } : undefined);
      setNewName('');
      setNewDescription('');
      setShowCreateModal(false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTerminate = async (agentId: string) => {
    setActionLoading(`terminate-${agentId}`);
    try { await terminateAgent(agentId); } finally { setActionLoading(null); }
  };

  const handleOpenInvoke = (agent: any) => {
    setSelectedAgent(agent);
    setInvokeInput('');
    setShowInvokeModal(true);
  };

  const handleInvoke = async () => {
    if (!selectedAgent || !invokeInput.trim()) return;
    setActionLoading('invoke');
    try {
      await invokeAgent(selectedAgent.id, invokeInput.trim());
      setInvokeInput('');
      setShowInvokeModal(false);
    } finally {
      setActionLoading(null);
    }
  };

  const viewDetail = (agent: any) => {
    setSelectedAgent(agent);
    setShowDetail(true);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          }}>
            <Bot size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              智能体管理
            </h1>
            <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)' }}>AgentOS 智能体生命周期管理</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => fetchAgents()} style={{
            padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', fontSize: 'var(--font-size-md)',
            transition: 'all var(--transition-fast)',
          }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 刷新
          </button>
          <button onClick={() => setShowCreateModal(true)} style={{
            padding: '8px 16px', border: 'none', borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', color: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', fontSize: 'var(--font-size-md)',
            transition: 'all var(--transition-fast)',
          }}>
            <Plus size={16} /> 创建智能体
          </button>
        </div>
      </div>

      {agentsError && (
        <div style={{
          padding: '12px 16px', marginBottom: '16px', backgroundColor: 'var(--error-light)',
          border: '1px solid var(--error-color)', borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error-color)',
        }}>
          <AlertCircle size={16} />
          <span style={{ fontSize: 'var(--font-size-sm)' }}>{agentsError}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => fetchAgents()}>重试</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: '智能体总数', value: stats.total, icon: <Bot size={18} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
          { label: '运行中', value: stats.running, icon: <Zap size={18} />, color: 'var(--success-color)', bg: 'var(--success-light)' },
          { label: '空闲', value: stats.idle, icon: <Clock size={18} />, color: 'var(--warning-color)', bg: 'var(--warning-light)' },
          { label: '已停止', value: stats.stopped, icon: <Square size={18} />, color: 'var(--text-muted)', bg: 'var(--bg-tertiary)' },
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
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索智能体..." style={{
            width: '100%', padding: '10px 14px 10px 36px', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)',
            fontSize: 'var(--font-size-md)', fontFamily: 'inherit', outline: 'none', transition: 'all var(--transition-fast)',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary-color)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-light)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
          {['all', 'running', 'idle', 'stopped', 'error'].map(s => (
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

      {!loading && filteredAgents.length === 0 && (
        <div style={{
          backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)', padding: '48px', textAlign: 'center',
        }}>
          <Bot size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>暂无智能体</p>
          <button onClick={() => setShowCreateModal(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
            background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', color: 'white', border: 'none',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--font-size-md)',
            transition: 'all var(--transition-fast)',
          }}>
            <Plus size={16} /> 创建第一个智能体
          </button>
        </div>
      )}

      {!loading && filteredAgents.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          <AnimatePresence>
            {filteredAgents.map((agent: any, index: number) => {
              const statusCfg = STATUS_CONFIG[agent.status] || STATUS_CONFIG.idle;
              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.04 }}
                  style={{
                    backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: 'var(--radius-md)',
                        background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: 'white',
                      }}>
                        <Bot size={20} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                          {agent.name}
                        </h3>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-xs)',
                          padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--font-weight-medium)',
                          color: statusCfg.color, backgroundColor: statusCfg.bg,
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: agent.status === 'running' ? 'var(--success-color)' : statusCfg.color, display: 'inline-block' }} />
                          {statusCfg.label}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => viewDetail(agent)} style={{
                      width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: 'none', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-muted)', cursor: 'pointer', transition: 'all var(--transition-fast)',
                    }}>
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  {agent.description && (
                    <p style={{ margin: '0 0 12px 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {agent.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      #{agent.id?.slice(0, 8)}
                    </span>
                    {agent.createdAt && (
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        · {new Date(agent.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {agent.status === 'running' ? (
                      <button onClick={() => handleTerminate(agent.id)} disabled={actionLoading === `terminate-${agent.id}`} style={{
                        flex: 1, padding: '8px 12px', border: '1px solid var(--error-color)', borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--error-light)', color: 'var(--error-color)', cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: 'var(--font-size-sm)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '4px', transition: 'all var(--transition-fast)',
                        opacity: actionLoading === `terminate-${agent.id}` ? 0.5 : 1,
                      }}>
                        {actionLoading === `terminate-${agent.id}` ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Square size={14} />}
                        停止
                      </button>
                    ) : (
                      <button onClick={() => {}} style={{
                        flex: 1, padding: '8px 12px', border: 'none', borderRadius: 'var(--radius-md)',
                        background: 'linear-gradient(135deg, var(--success-color), #4ade80)', color: 'white',
                        cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--font-size-sm)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                        transition: 'all var(--transition-fast)',
                      }}>
                        <Play size={14} /> 启动
                      </button>
                    )}
                    <button onClick={() => handleOpenInvoke(agent)} style={{
                      flex: 1, padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: 'var(--font-size-sm)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: '4px', transition: 'all var(--transition-fast)',
                    }}>
                      <Zap size={14} /> 调用
                    </button>
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
              style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', maxWidth: '480px', width: '100%', padding: '24px' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>创建智能体</h2>
                <button onClick={() => setShowCreateModal(false)} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-secondary)', marginBottom: '6px' }}>名称</label>
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="输入智能体名称..." style={{
                    width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 'var(--font-size-md)', fontFamily: 'inherit', outline: 'none', transition: 'all var(--transition-fast)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.2)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-secondary)', marginBottom: '6px' }}>描述</label>
                  <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} rows={3} placeholder="描述智能体的功能..." style={{
                    width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 'var(--font-size-md)', fontFamily: 'inherit', outline: 'none', resize: 'vertical', transition: 'all var(--transition-fast)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.2)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={() => setShowCreateModal(false)} style={{ padding: '8px 16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--font-size-md)' }}>取消</button>
                <button onClick={handleSpawn} disabled={!newName.trim() || actionLoading === 'spawn'} style={{
                  padding: '8px 16px', background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', color: 'white', border: 'none',
                  borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--font-size-md)',
                  display: 'flex', alignItems: 'center', gap: '6px', opacity: (!newName.trim() || actionLoading === 'spawn') ? 0.5 : 1,
                }}>
                  {actionLoading === 'spawn' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                  创建
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInvokeModal && selectedAgent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: '24px', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowInvokeModal(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', maxWidth: '520px', width: '100%', padding: '24px' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>调用智能体</h2>
                  <p style={{ margin: '2px 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>{selectedAgent.name}</p>
                </div>
                <button onClick={() => setShowInvokeModal(false)} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <textarea value={invokeInput} onChange={e => setInvokeInput(e.target.value)} rows={4} placeholder="输入要发送给智能体的指令..." style={{
                width: '100%', padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 'var(--font-size-md)', fontFamily: 'inherit', outline: 'none', resize: 'vertical', marginBottom: '16px', transition: 'all var(--transition-fast)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.2)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={() => setShowInvokeModal(false)} style={{ padding: '8px 16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--font-size-md)' }}>取消</button>
                <button onClick={handleInvoke} disabled={!invokeInput.trim() || actionLoading === 'invoke'} style={{
                  padding: '8px 16px', background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', color: 'white', border: 'none',
                  borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--font-size-md)',
                  display: 'flex', alignItems: 'center', gap: '6px', opacity: (!invokeInput.trim() || actionLoading === 'invoke') ? 0.5 : 1,
                }}>
                  {actionLoading === 'invoke' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={16} />}
                  发送
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDetail && selectedAgent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: '24px', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowDetail(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', maxWidth: '480px', width: '100%', padding: '24px' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>智能体详情</h2>
                <button onClick={() => setShowDetail(false)} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>ID</p>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{selectedAgent.id}</p>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>名称</p>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>{selectedAgent.name}</p>
                </div>
                {selectedAgent.description && (
                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>描述</p>
                    <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{selectedAgent.description}</p>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>状态</p>
                    <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: STATUS_CONFIG[selectedAgent.status]?.color, fontWeight: 'var(--font-weight-medium)' }}>
                      {STATUS_CONFIG[selectedAgent.status]?.label || selectedAgent.status}
                    </p>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>创建时间</p>
                    <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                      {selectedAgent.createdAt ? new Date(selectedAgent.createdAt).toLocaleString() : '—'}
                    </p>
                  </div>
                </div>
                {selectedAgent.metadata && Object.keys(selectedAgent.metadata).length > 0 && (
                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>元数据</p>
                    <pre style={{ margin: 0, fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', maxHeight: '120px', overflow: 'auto' }}>
                      {JSON.stringify(selectedAgent.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentManagement;
