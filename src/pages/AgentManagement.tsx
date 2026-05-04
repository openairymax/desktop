import React, { useState, useEffect } from 'react';
import {
  Bot, Plus, Play, Square, Search, Trash2, Eye,
  AlertCircle, Clock, X, Zap, RefreshCw, Loader2, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgents } from '../hooks/useAgentOS';

interface Agent {
  id: string;
  name: string;
  status: 'running' | 'idle' | 'stopped' | 'error';
  description?: string;
  model?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; dot: string }> = {
  running: { color: 'var(--success-color)', bg: 'var(--success-light)', label: '运行中', dot: 'bg-green-500' },
  idle: { color: 'var(--warning-color)', bg: 'var(--warning-light)', label: '空闲', dot: 'bg-yellow-500' },
  stopped: { color: 'var(--text-muted)', bg: 'var(--bg-tertiary)', label: '已停止', dot: 'bg-gray-400' },
  error: { color: 'var(--error-color)', bg: 'var(--error-light)', label: '错误', dot: 'bg-red-500' },
};

const AgentManagement: React.FC = () => {
  const { agents: apiAgents, loading: apiLoading, fetchAgents, spawnAgent, terminateAgent, invokeAgent } = useAgents();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showInvokeModal, setShowInvokeModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newModel, setNewModel] = useState('gpt-4o');
  const [invokeInput, setInvokeInput] = useState('');

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (apiAgents && apiAgents.length > 0) {
      const mapped: Agent[] = apiAgents.map((a: any) => ({
        id: a.id || a.agent_id || '',
        name: a.name || a.agent_id || 'Unknown',
        status: a.status === 'active' ? 'running' : a.status === 'idle' ? 'idle' : a.status === 'stopped' ? 'stopped' : 'error',
        description: a.description || a.spec || undefined,
        model: a.model || undefined,
        createdAt: a.created_at || a.createdAt || new Date().toISOString(),
        metadata: a.metadata || a.capabilities || undefined,
      }));
      setAgents(mapped);
    }
    setLoading(apiLoading);
  }, [apiAgents, apiLoading]);

  const saveAgents = (updated: Agent[]) => {
    setAgents(updated);
    localStorage.setItem('agentos-agents', JSON.stringify(updated));
  };

  const filteredAgents = agents.filter(a => {
    const name = a.name || '';
    const matchesSearch = !searchQuery || name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: agents.length,
    running: agents.filter(a => a.status === 'running').length,
    idle: agents.filter(a => a.status === 'idle').length,
    stopped: agents.filter(a => a.status === 'stopped' || a.status === 'error').length,
  };

  const handleSpawn = async () => {
    if (!newName.trim()) return;
    setActionLoading('spawn');
    try {
      await spawnAgent(newName.trim(), { description: newDescription, model: newModel });
      await fetchAgents();
    } catch (e) {
      console.error('Failed to spawn agent:', e);
    }
    setNewName('');
    setNewDescription('');
    setNewModel('gpt-4o');
    setShowCreateModal(false);
    setActionLoading(null);
  };

  const handleTerminate = async (agentId: string) => {
    setActionLoading(`terminate-${agentId}`);
    try {
      await terminateAgent(agentId);
      await fetchAgents();
    } catch (e) {
      console.error('Failed to terminate agent:', e);
    }
    setActionLoading(null);
  };

  const handleStart = async (agentId: string) => {
    setActionLoading(`start-${agentId}`);
    try {
      await invokeAgent(agentId, { action: 'start' });
      await fetchAgents();
    } catch (e) {
      console.error('Failed to start agent:', e);
    }
    setActionLoading(null);
  };

  const handleDelete = async (agentId: string) => {
    setActionLoading(`delete-${agentId}`);
    try {
      await terminateAgent(agentId);
      await fetchAgents();
    } catch (e) {
      console.error('Failed to delete agent:', e);
    }
    setActionLoading(null);
  };

  const handleOpenInvoke = (agent: Agent) => {
    setSelectedAgent(agent);
    setInvokeInput('');
    setShowInvokeModal(true);
  };

  const handleInvoke = async () => {
    if (!selectedAgent || !invokeInput.trim()) return;
    setActionLoading('invoke');
    try {
      await invokeAgent(selectedAgent.id, { input: invokeInput.trim() });
      await fetchAgents();
    } catch (e) {
      console.error('Failed to invoke agent:', e);
    }
    setInvokeInput('');
    setShowInvokeModal(false);
    setActionLoading(null);
  };

  const viewDetail = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowDetail(true);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          }}>
            <Bot size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>智能体管理</h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>管理 AI 智能体生命周期和配置</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => { setLoading(true); setTimeout(() => { setLoading(false); }, 300); }} style={{
            padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px',
            backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', fontSize: '13px',
          }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 刷新
          </button>
          <button onClick={() => setShowCreateModal(true)} style={{
            padding: '8px 16px', border: 'none', borderRadius: '8px',
            background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', color: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', fontSize: '13px',
          }}>
            <Plus size={16} /> 创建智能体
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: '智能体总数', value: stats.total, icon: <Bot size={18} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
          { label: '运行中', value: stats.running, icon: <Zap size={18} />, color: 'var(--success-color)', bg: 'var(--success-light)' },
          { label: '空闲', value: stats.idle, icon: <Clock size={18} />, color: 'var(--warning-color)', bg: 'var(--warning-light)' },
          { label: '已停止', value: stats.stopped, icon: <Square size={18} />, color: 'var(--text-muted)', bg: 'var(--bg-tertiary)' },
        ].map(s => (
          <div key={s.label} style={{
            backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
            borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px',
          }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{s.label}</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索智能体..." style={{
            width: '100%', padding: '10px 14px 10px 36px', border: '1px solid var(--border-color)',
            borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)',
            fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
          }} />
        </div>
        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', padding: '4px' }}>
          {['all', 'running', 'idle', 'stopped', 'error'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '6px 12px', borderRadius: '6px', border: 'none',
              backgroundColor: statusFilter === s ? 'white' : 'transparent',
              color: statusFilter === s ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '12px', fontWeight: statusFilter === s ? '500' : '400',
              cursor: 'pointer', fontFamily: 'inherit',
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
          backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
          borderRadius: '12px', padding: '48px', textAlign: 'center',
        }}>
          <Bot size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>暂无智能体</p>
          <button onClick={() => setShowCreateModal(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
            background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', color: 'white', border: 'none',
            borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px',
          }}>
            <Plus size={16} /> 创建第一个智能体
          </button>
        </div>
      )}

      {!loading && filteredAgents.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          <AnimatePresence>
            {filteredAgents.map((agent, index) => {
              const statusCfg = STATUS_CONFIG[agent.status] || STATUS_CONFIG.idle;
              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  style={{
                    backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
                    borderRadius: '12px', padding: '20px',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: 'white',
                      }}>
                        <Bot size={20} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{agent.name}</h3>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px',
                          padding: '2px 8px', borderRadius: '12px', fontWeight: '500',
                          color: statusCfg.color, backgroundColor: statusCfg.bg,
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: agent.status === 'running' ? 'var(--success-color)' : statusCfg.color, display: 'inline-block' }} />
                          {statusCfg.label}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => viewDetail(agent)} style={{
                      width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: 'none', borderRadius: '6px', backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-muted)', cursor: 'pointer',
                    }}>
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  {agent.description && (
                    <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{agent.description}</p>
                  )}

                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{agent.id?.slice(0, 8)}</span>
                    {agent.model && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>· {agent.model}</span>}
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {agent.status === 'running' ? (
                      <button onClick={() => handleTerminate(agent.id)} disabled={actionLoading === `terminate-${agent.id}`} style={{
                        flex: 1, padding: '8px 12px', border: '1px solid var(--error-color)', borderRadius: '8px',
                        backgroundColor: 'var(--error-light)', color: 'var(--error-color)', cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                        opacity: actionLoading === `terminate-${agent.id}` ? 0.5 : 1,
                      }}>
                        {actionLoading === `terminate-${agent.id}` ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Square size={14} />}停止
                      </button>
                    ) : (
                      <button onClick={() => handleStart(agent.id)} disabled={actionLoading === `start-${agent.id}`} style={{
                        flex: 1, padding: '8px 12px', border: 'none', borderRadius: '8px',
                        background: 'linear-gradient(135deg, var(--success-color), #4ade80)', color: 'white',
                        cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                        opacity: actionLoading === `start-${agent.id}` ? 0.5 : 1,
                      }}>
                        {actionLoading === `start-${agent.id}` ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={14} />}启动
                      </button>
                    )}
                    <button onClick={() => handleOpenInvoke(agent)} style={{
                      flex: 1, padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px',
                      backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    }}>
                      <Zap size={14} /> 调用
                    </button>
                    <button onClick={() => handleDelete(agent.id)} disabled={actionLoading === `delete-${agent.id}`} style={{
                      width: '34px', border: '1px solid var(--border-color)', borderRadius: '8px',
                      backgroundColor: 'var(--bg-tertiary)', color: 'var(--error-color)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: actionLoading === `delete-${agent.id}` ? 0.5 : 1,
                    }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
            />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1001,
                backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.3)', maxWidth: '480px', width: '90%', padding: '24px',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>创建智能体</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>名称</label>
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="输入智能体名称..." style={{
                    width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '8px',
                    backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                  }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>描述</label>
                  <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} rows={3} placeholder="描述智能体的功能..." style={{
                    width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '8px',
                    backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                  }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>模型</label>
                  <select value={newModel} onChange={e => setNewModel(e.target.value)} style={{
                    width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '8px',
                    backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                  }}>
                    <option value="gpt-4o">gpt-4o (OpenAI)</option>
                    <option value="claude-sonnet-4">claude-sonnet-4 (Anthropic)</option>
                    <option value="deepseek-chat">deepseek-chat (DeepSeek)</option>
                    <option value="llama3">llama3 (Ollama)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={() => setShowCreateModal(false)} style={{ padding: '8px 16px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>取消</button>
                <button onClick={handleSpawn} disabled={!newName.trim() || actionLoading === 'spawn'} style={{
                  padding: '8px 16px', background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', color: 'white', border: 'none',
                  borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
                  opacity: (!newName.trim() || actionLoading === 'spawn') ? 0.5 : 1,
                }}>
                  {actionLoading === 'spawn' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}创建
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Invoke Modal */}
      <AnimatePresence>
        {showInvokeModal && selectedAgent && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowInvokeModal(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
            />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1001,
                backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.3)', maxWidth: '520px', width: '90%', padding: '24px',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>调用智能体</h2>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>{selectedAgent.name}</p>
              <textarea value={invokeInput} onChange={e => setInvokeInput(e.target.value)} rows={4} placeholder="输入要发送给智能体的指令..." style={{
                width: '100%', padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: '8px',
                backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'inherit', outline: 'none', resize: 'vertical', marginBottom: '16px', boxSizing: 'border-box',
              }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={() => setShowInvokeModal(false)} style={{ padding: '8px 16px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>取消</button>
                <button onClick={handleInvoke} disabled={!invokeInput.trim() || actionLoading === 'invoke'} style={{
                  padding: '8px 16px', background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', color: 'white', border: 'none',
                  borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
                  opacity: (!invokeInput.trim() || actionLoading === 'invoke') ? 0.5 : 1,
                }}>
                  {actionLoading === 'invoke' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={16} />}发送
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetail && selectedAgent && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDetail(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
            />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1001,
                backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.3)', maxWidth: '480px', width: '90%', padding: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '600', color: 'var(--text-primary)' }}>智能体详情</h2>
                <button onClick={() => setShowDetail(false)} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)', borderRadius: '8px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'ID', value: selectedAgent.id, mono: true },
                  { label: '名称', value: selectedAgent.name },
                  { label: '模型', value: selectedAgent.model || '—' },
                  { label: '创建时间', value: new Date(selectedAgent.createdAt).toLocaleString() },
                ].map(item => (
                  <div key={item.label} style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: 'var(--text-muted)' }}>{item.label}</p>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', fontFamily: item.mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>{item.value}</p>
                  </div>
                ))}
                <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: 'var(--text-muted)' }}>状态</p>
                  <p style={{ margin: 0, fontSize: '13px', color: STATUS_CONFIG[selectedAgent.status]?.color, fontWeight: '500' }}>
                    {STATUS_CONFIG[selectedAgent.status]?.label || selectedAgent.status}
                  </p>
                </div>
                {selectedAgent.description && (
                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: 'var(--text-muted)' }}>描述</p>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{selectedAgent.description}</p>
                  </div>
                )}
                {selectedAgent.metadata && Object.keys(selectedAgent.metadata).length > 0 && (
                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'var(--text-muted)' }}>元数据</p>
                    <pre style={{ margin: 0, fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-secondary)', maxHeight: '120px', overflow: 'auto' }}>
                      {JSON.stringify(selectedAgent.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentManagement;
