import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bot,
  Plus,
  Play,
  Square,
  Search,
  Trash2,
  Clock,
  X,
  Zap,
  RefreshCw,
  Loader2,
  ChevronDown,
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
  running: {
    color: 'var(--success-color)',
    bg: 'var(--success-light)',
    label: '运行中',
    dot: 'bg-green-500',
  },
  idle: {
    color: 'var(--warning-color)',
    bg: 'var(--warning-light)',
    label: '空闲',
    dot: 'bg-yellow-500',
  },
  stopped: {
    color: 'var(--text-muted)',
    bg: 'var(--bg-tertiary)',
    label: '已停止',
    dot: 'bg-gray-400',
  },
  error: {
    color: 'var(--error-color)',
    bg: 'var(--error-light)',
    label: '错误',
    dot: 'bg-red-500',
  },
};

const AgentManagement: React.FC = () => {
  const { t } = useTranslation();
  const {
    agents: apiAgents,
    loading: apiLoading,
    fetchAgents,
    spawnAgent,
    terminateAgent,
    invokeAgent,
  } = useAgents();
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
    let cancelled = false;
    if (!cancelled) fetchAgents();
    return () => { cancelled = true; };
  }, [fetchAgents]);

  useEffect(() => {
    if (apiAgents && apiAgents.length > 0) {
      const mapped: Agent[] = apiAgents.map((a) => ({
        id: a.id,
        name: a.name || 'Unknown',
        status:
          a.status === 'active'
            ? 'running'
            : a.status === 'idle'
              ? 'idle'
              : a.status === 'stopped'
                ? 'stopped'
                : 'error',
        description: a.description || undefined,
        model: undefined,
        createdAt: a.createdAt || new Date().toISOString(),
        metadata: a.metadata || undefined,
      }));
      setAgents(mapped);
    }
    setLoading(apiLoading);
  }, [apiAgents, apiLoading]);

  const filteredAgents = agents.filter((a) => {
    const name = a.name || '';
    const matchesSearch = !searchQuery || name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: agents.length,
    running: agents.filter((a) => a.status === 'running').length,
    idle: agents.filter((a) => a.status === 'idle').length,
    stopped: agents.filter((a) => a.status === 'stopped' || a.status === 'error').length,
  };

  const handleSpawn = async () => {
    if (!newName.trim()) return;
    setActionLoading('spawn');
    try {
      await spawnAgent(newName.trim(), { description: newDescription, model: newModel });
      await fetchAgents();
    } catch (e) {
      // Intentionally empty: graceful degradation
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
      // Intentionally empty: graceful degradation
    }
    setActionLoading(null);
  };

  const handleStart = async (agentId: string) => {
    setActionLoading(`start-${agentId}`);
    try {
      await invokeAgent(agentId, 'start');
      await fetchAgents();
    } catch (e) {
      // Intentionally empty: graceful degradation
    }
    setActionLoading(null);
  };

  const handleDelete = async (agentId: string) => {
    setActionLoading(`delete-${agentId}`);
    try {
      await terminateAgent(agentId);
      await fetchAgents();
    } catch (e) {
      // Intentionally empty: graceful degradation
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
      await invokeAgent(selectedAgent.id, invokeInput.trim());
      await fetchAgents();
    } catch (e) {
      // Intentionally empty: graceful degradation
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
    <div style={{ maxWidth: '1280px', margin: '0 auto' }} role="region" aria-label="Agent 管理">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <Bot size={20} />
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: '700',
                color: 'var(--text-primary)',
              }}
            >
              {t('agents.title')}
            </h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              {t('agents.subtitle')}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={async () => {
              setLoading(true);
              await fetchAgents();
              setLoading(false);
            }}
            aria-label="刷新 Agent 列表"
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'inherit',
              fontSize: '13px',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {t('common.refresh')}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            aria-label="注册新 Agent"
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'inherit',
              fontSize: '13px',
            }}
          >
            <Plus size={16} /> {t('agents.registerAgent')}
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        {[
          {
            label: t('dashboard.activeAgents'),
            value: stats.total,
            icon: <Bot size={18} />,
            color: '#8b5cf6',
            bg: 'rgba(139,92,246,0.1)',
          },
          {
            label: t('agents.running'),
            value: stats.running,
            icon: <Zap size={18} />,
            color: 'var(--success-color)',
            bg: 'var(--success-light)',
          },
          {
            label: t('agents.idle'),
            value: stats.idle,
            icon: <Clock size={18} />,
            color: 'var(--warning-color)',
            bg: 'var(--warning-light)',
          },
          {
            label: t('agents.error'),
            value: stats.stopped,
            icon: <Square size={18} />,
            color: 'var(--text-muted)',
            bg: 'var(--bg-tertiary)',
          },
        ].map((s) => (
          <div
            key={s.label}
            role="status"
            aria-label={s.label}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: s.bg,
                color: s.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {s.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{s.label}</p>
              <p
                style={{
                  margin: '2px 0 0 0',
                  fontSize: '22px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                }}
              >
                {s.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            role="searchbox"
            aria-label="搜索 Agent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('agents.searchAgents')}
            style={{
              width: '100%',
              padding: '10px 14px 10px 36px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            gap: '4px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            padding: '4px',
          }}
        >
          {['all', 'running', 'idle', 'stopped', 'error'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              aria-label={STATUS_CONFIG[s]?.label || t('common.all')}
              aria-pressed={statusFilter === s}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: statusFilter === s ? 'white' : 'transparent',
                color: statusFilter === s ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: statusFilter === s ? '500' : '400',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {STATUS_CONFIG[s]?.label || t('common.all')}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div
          role="status"
          aria-live="polite"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px',
          }}
        >
          <Loader2
            size={32}
            style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }}
          />
        </div>
      )}

      {!loading && filteredAgents.length === 0 && (
        <div
          role="status"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '48px',
            textAlign: 'center',
          }}
        >
          <Bot
            size={48}
            style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', opacity: 0.5 }}
          />
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>{t('agents.noAgents')}</p>
          <button
            onClick={() => setShowCreateModal(true)}
            aria-label="注册新 Agent"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '13px',
            }}
          >
            <Plus size={16} /> {t('agents.registerAgent')}
          </button>
        </div>
      )}

      {!loading && filteredAgents.length > 0 && (
        <div
          role="list"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          <AnimatePresence>
            {filteredAgents.map((agent, index) => {
              const statusCfg = STATUS_CONFIG[agent.status] || STATUS_CONFIG.idle;
              return (
                <motion.div
                  key={agent.id}
                  role="listitem"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '20px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                        }}
                      >
                        <Bot size={20} />
                      </div>
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: '15px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {agent.name}
                        </h3>
                        <span
                          role="status"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: '500',
                            color: statusCfg.color,
                            backgroundColor: statusCfg.bg,
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor:
                                agent.status === 'running'
                                  ? 'var(--success-color)'
                                  : statusCfg.color,
                              display: 'inline-block',
                            }}
                          />
                          {statusCfg.label}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => viewDetail(agent)}
                      aria-label={`查看 ${agent.name} 详情`}
                      style={{
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  {agent.description && (
                    <p
                      style={{
                        margin: '0 0 12px 0',
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                      }}
                    >
                      {agent.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        fontFamily: 'monospace',
                      }}
                    >
                      #{agent.id?.slice(0, 8)}
                    </span>
                    {agent.model && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        · {agent.model}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {agent.status === 'running' ? (
                      <button
                        onClick={() => handleTerminate(agent.id)}
                        disabled={actionLoading === `terminate-${agent.id}`}
                        aria-label={`停止 ${agent.name}`}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: '1px solid var(--error-color)',
                          borderRadius: '8px',
                          backgroundColor: 'var(--error-light)',
                          color: 'var(--error-color)',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          opacity: actionLoading === `terminate-${agent.id}` ? 0.5 : 1,
                        }}
                      >
                        {actionLoading === `terminate-${agent.id}` ? (
                          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <Square size={14} />
                        )}
                        {t('common.stop')}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStart(agent.id)}
                        disabled={actionLoading === `start-${agent.id}`}
                        aria-label={`启动 ${agent.name}`}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: 'none',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, var(--success-color), #4ade80)',
                          color: 'white',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          opacity: actionLoading === `start-${agent.id}` ? 0.5 : 1,
                        }}
                      >
                        {actionLoading === `start-${agent.id}` ? (
                          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <Play size={14} />
                        )}
                        {t('common.start')}
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenInvoke(agent)}
                      aria-label={`调用 ${agent.name}`}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <Zap size={14} /> {t('common.invoke')}
                    </button>
                    <button
                      onClick={() => handleDelete(agent.id)}
                      disabled={actionLoading === `delete-${agent.id}`}
                      aria-label={`删除 ${agent.name}`}
                      style={{
                        width: '34px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--error-color)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: actionLoading === `delete-${agent.id}` ? 0.5 : 1,
                      }}
                    >
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                backgroundColor: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)',
              }}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              role="dialog"
              aria-modal="true"
              aria-label="注册 Agent"
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1001,
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                maxWidth: '480px',
                width: '90%',
                padding: '24px',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: '17px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '20px',
                }}
              >
                {t('agents.registerAgent')}
              </h2>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  marginBottom: '24px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: 'var(--text-secondary)',
                      marginBottom: '6px',
                    }}
                  >
                    {t('common.name')}
                  </label>
                  <input
                    type="text"
                    aria-label="Agent 名称"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={t('agents.agentNameHelp')}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: 'var(--text-secondary)',
                      marginBottom: '6px',
                    }}
                  >
                    {t('common.description')}
                  </label>
                  <textarea
                    aria-label="Agent 描述"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={3}
                    placeholder={t('agents.agentDetails')}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: 'var(--text-secondary)',
                      marginBottom: '6px',
                    }}
                  >
                    {t('common.model')}
                  </label>
                  <select
                    aria-label="Agent 模型"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="gpt-4o">gpt-4o (OpenAI)</option>
                    <option value="claude-sonnet-4">claude-sonnet-4 (Anthropic)</option>
                    <option value="deepseek-chat">deepseek-chat (DeepSeek)</option>
                    <option value="llama3">llama3 (Ollama)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => setShowCreateModal(false)}
                  aria-label="取消注册"
                  style={{
                    padding: '8px 16px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSpawn}
                  disabled={!newName.trim() || actionLoading === 'spawn'}
                  aria-label="确认创建 Agent"
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: !newName.trim() || actionLoading === 'spawn' ? 0.5 : 1,
                  }}
                >
                  {actionLoading === 'spawn' ? (
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Plus size={16} />
                  )}
                  创建
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInvokeModal(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                backgroundColor: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)',
              }}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              role="dialog"
              aria-modal="true"
              aria-label="调用智能体"
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1001,
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                maxWidth: '520px',
                width: '90%',
                padding: '24px',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: '17px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                }}
              >
                调用智能体
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  marginBottom: '16px',
                }}
              >
                {selectedAgent.name}
              </p>
              <textarea
                aria-label="调用指令输入"
                value={invokeInput}
                onChange={(e) => setInvokeInput(e.target.value)}
                rows={4}
                placeholder="输入要发送给智能体的指令..."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'vertical',
                  marginBottom: '16px',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => setShowInvokeModal(false)}
                  aria-label="取消调用"
                  style={{
                    padding: '8px 16px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleInvoke}
                  disabled={!invokeInput.trim() || actionLoading === 'invoke'}
                  aria-label="发送调用指令"
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: !invokeInput.trim() || actionLoading === 'invoke' ? 0.5 : 1,
                  }}
                >
                  {actionLoading === 'invoke' ? (
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Zap size={16} />
                  )}
                  发送
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetail(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                backgroundColor: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)',
              }}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              role="dialog"
              aria-modal="true"
              aria-label="智能体详情"
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1001,
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                maxWidth: '480px',
                width: '90%',
                padding: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: '17px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                  }}
                >
                  智能体详情
                </h2>
                <button
                  onClick={() => setShowDetail(false)}
                  aria-label="关闭详情"
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'ID', value: selectedAgent.id, mono: true },
                  { label: '名称', value: selectedAgent.name },
                  { label: '模型', value: selectedAgent.model || '—' },
                  { label: '创建时间', value: new Date(selectedAgent.createdAt).toLocaleString() },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--bg-tertiary)',
                      borderRadius: '8px',
                    }}
                  >
                    <p
                      style={{ margin: '0 0 4px 0', fontSize: '11px', color: 'var(--text-muted)' }}
                    >
                      {item.label}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                        fontFamily: item.mono ? 'monospace' : 'inherit',
                        wordBreak: 'break-all',
                      }}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                  }}
                >
                  <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                    状态
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '13px',
                      color: STATUS_CONFIG[selectedAgent.status]?.color,
                      fontWeight: '500',
                    }}
                  >
                    {STATUS_CONFIG[selectedAgent.status]?.label || selectedAgent.status}
                  </p>
                </div>
                {selectedAgent.description && (
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--bg-tertiary)',
                      borderRadius: '8px',
                    }}
                  >
                    <p
                      style={{ margin: '0 0 4px 0', fontSize: '11px', color: 'var(--text-muted)' }}
                    >
                      描述
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                      }}
                    >
                      {selectedAgent.description}
                    </p>
                  </div>
                )}
                {selectedAgent.metadata && Object.keys(selectedAgent.metadata).length > 0 && (
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--bg-tertiary)',
                      borderRadius: '8px',
                    }}
                  >
                    <p
                      style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'var(--text-muted)' }}
                    >
                      元数据
                    </p>
                    <pre
                      style={{
                        margin: 0,
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: 'var(--text-secondary)',
                        maxHeight: '120px',
                        overflow: 'auto',
                      }}
                    >
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
