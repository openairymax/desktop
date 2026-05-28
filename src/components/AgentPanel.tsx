import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Plus,
  Trash2,
  Play,
  Square,
  RefreshCw,
  Search,
  Activity,
  Terminal,
  Eye,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAgents } from '../hooks/useAgentOS';
import type { AgentInfo } from '../services/agentos.service';

const STATUS_COLORS: Record<string, string> = {
  running: 'var(--success-color)',
  idle: 'var(--info-color)',
  stopped: 'var(--text-muted)',
  error: 'var(--error-color)',
  unknown: 'var(--text-muted)',
};

const STATUS_LABELS: Record<string, string> = {
  running: '运行中',
  idle: '空闲',
  stopped: '已停止',
  error: '错误',
  unknown: '未知',
};

export default function AgentPanel() {
  const {
    agents,
    loading,
    error,
    fetchAgents,
    spawnAgent,
    terminateAgent,
    invokeAgent,
  } = useAgents();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showSpawnModal, setShowSpawnModal] = useState(false);
  const [showInvokeModal, setShowInvokeModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [spawnName, setSpawnName] = useState('');
  const [spawnType, setSpawnType] = useState('default');
  const [invokeInput, setInvokeInput] = useState('');
  const [invokeResult, setInvokeResult] = useState<string | null>(null);
  const invokeResultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        await fetchAgents();
      } catch (err: unknown) {
        if (!cancelled) {
          setRenderError(err instanceof Error ? err.message : String(err));
        }
      }
    };
    init();
    return () => {
      cancelled = true;
      if (invokeResultTimerRef.current) {
        clearTimeout(invokeResultTimerRef.current);
        invokeResultTimerRef.current = null;
      }
    };
  }, [fetchAgents]);

  const filtered = agents.filter((a) => {
    const matchSearch =
      !searchQuery ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSpawn = useCallback(async () => {
    if (!spawnName.trim()) return;
    setActionLoading('spawn');
    try {
      await spawnAgent(spawnName.trim(), { type: spawnType });
      setShowSpawnModal(false);
      setSpawnName('');
      setSpawnType('default');
    } catch (err: unknown) {
      setRenderError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(null);
    }
  }, [spawnName, spawnType, spawnAgent]);

  const handleTerminate = useCallback(
    async (id: string) => {
      if (!confirm('确认终止此智能体？')) return;
      setActionLoading(`terminate-${id}`);
      try {
        await terminateAgent(id);
      } catch (err: unknown) {
        setRenderError(err instanceof Error ? err.message : String(err));
      } finally {
        setActionLoading(null);
      }
    },
    [terminateAgent],
  );

  const handleInvoke = useCallback(async () => {
    if (!selectedAgent || !invokeInput.trim()) return;
    setActionLoading('invoke');
    setInvokeResult(null);
    try {
      const result = await invokeAgent(selectedAgent.id, invokeInput.trim());
      setInvokeResult(result);
      if (invokeResultTimerRef.current) clearTimeout(invokeResultTimerRef.current);
      invokeResultTimerRef.current = setTimeout(() => setInvokeResult(null), 8000);
    } catch (err: unknown) {
      setRenderError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(null);
    }
  }, [selectedAgent, invokeInput, invokeAgent]);

  const stats = {
    total: agents.length,
    running: agents.filter((a) => a.status === 'running').length,
    idle: agents.filter((a) => a.status === 'idle').length,
    stopped: agents.filter((a) => a.status === 'stopped').length,
  };

  return (
    <div role="region" aria-label="Agent 面板">
      {renderError && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            marginBottom: '12px',
            background: 'var(--bg-error)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: 'var(--error-color)',
          }}
        >
          <AlertCircle size={14} />
          {renderError}
          <button
            onClick={() => setRenderError(null)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--error-color)',
            }}
            aria-label="关闭错误提示"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
          <StatBadge
            label="全部"
            value={stats.total}
            icon={<Bot size={14} />}
            color="var(--text-primary)"
          />
          <StatBadge
            label="运行中"
            value={stats.running}
            icon={<Activity size={14} />}
            color="var(--success-color)"
          />
          <StatBadge label="空闲" value={stats.idle} color="var(--info-color)" />
          <StatBadge
            label="已停止"
            value={stats.stopped}
            color="var(--text-muted)"
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => fetchAgents()}
            disabled={loading}
            aria-label="刷新 Agent 列表"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowSpawnModal(true)}
            aria-label="注册新 Agent"
          >
            <Plus size={16} /> 注册
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            marginBottom: '12px',
            background: 'var(--bg-error)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: 'var(--error-color)',
          }}
        >
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
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
            className="input"
            placeholder="搜索 Agent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '38px' }}
            role="searchbox"
            aria-label="搜索 Agent"
          />
        </div>
        <select
          className="input"
          style={{ width: '130px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="按状态过滤"
        >
          <option value="all">全部状态</option>
          <option value="running">运行中</option>
          <option value="idle">空闲</option>
          <option value="stopped">已停止</option>
          <option value="error">错误</option>
        </select>
      </div>

      {loading && agents.length === 0 ? (
        <div
          role="status"
          aria-live="polite"
          style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}
        >
          <RefreshCw
            size={32}
            className="spin"
            style={{ marginBottom: '12px', opacity: 0.4 }}
          />
          <div style={{ fontSize: '14px' }}>加载 Agent 数据...</div>
        </div>
      ) : (
        <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <AnimatePresence>
            {filtered.map((agent, i) => (
              <motion.div
                key={agent.id}
                className="card"
                role="listitem"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background:
                      agent.status === 'running'
                        ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                        : agent.status === 'idle'
                          ? 'linear-gradient(135deg, var(--info-color), var(--accent-secondary))'
                          : 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Bot
                    size={20}
                    style={{
                      color:
                        agent.status === 'running' || agent.status === 'idle'
                          ? 'white'
                          : 'var(--text-muted)',
                    }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <h3
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
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
                        borderRadius: '10px',
                        background: `${STATUS_COLORS[agent.status] || STATUS_COLORS.unknown}20`,
                        color: STATUS_COLORS[agent.status] || STATUS_COLORS.unknown,
                        fontWeight: 600,
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: STATUS_COLORS[agent.status] || STATUS_COLORS.unknown,
                        }}
                      />
                      {STATUS_LABELS[agent.status] || agent.status}
                    </span>
                  </div>
                  {agent.description && (
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {agent.description}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      setSelectedAgent(agent);
                      setShowDetailModal(true);
                    }}
                    aria-label={`查看 ${agent.name} 详情`}
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      setSelectedAgent(agent);
                      setInvokeInput('');
                      setInvokeResult(null);
                      setShowInvokeModal(true);
                    }}
                    disabled={agent.status !== 'running' && agent.status !== 'idle'}
                    aria-label={`调用 ${agent.name}`}
                  >
                    <Terminal size={13} />
                  </button>
                  {agent.status === 'running' || agent.status === 'idle' ? (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleTerminate(agent.id)}
                      disabled={actionLoading === `terminate-${agent.id}`}
                      aria-label={`终止 ${agent.name}`}
                    >
                      {actionLoading === `terminate-${agent.id}` ? (
                        <Loader2 size={13} className="spin" />
                      ) : (
                        <Square size={13} />
                      )}
                    </button>
                  ) : (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleTerminate(agent.id)}
                      aria-label={`删除 ${agent.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div
          role="status"
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--text-muted)',
          }}
        >
          <Bot size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
          <div style={{ fontSize: '14px' }}>未找到 Agent</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>
            尝试其他搜索条件或注册新 Agent
          </div>
        </div>
      )}

      <AnimatePresence>
        {showSpawnModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowSpawnModal(false)}
          >
            <motion.div
              className="modal-content"
              role="dialog"
              aria-modal="true"
              aria-label="注册新 Agent"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="modal-header">
                <h2 className="modal-title">注册新 Agent</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowSpawnModal(false)}
                  aria-label="关闭"
                >
                  <X size={18} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      marginBottom: '6px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Agent 名称
                  </label>
                  <input
                    className="input"
                    placeholder="输入 Agent 名称..."
                    value={spawnName}
                    onChange={(e) => setSpawnName(e.target.value)}
                    autoFocus
                    aria-label="Agent 名称"
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      marginBottom: '6px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Agent 类型
                  </label>
                  <select
                    className="input"
                    value={spawnType}
                    onChange={(e) => setSpawnType(e.target.value)}
                    aria-label="Agent 类型"
                  >
                    <option value="default">默认</option>
                    <option value="chat">对话型</option>
                    <option value="tool">工具型</option>
                    <option value="analysis">分析型</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowSpawnModal(false)}
                  >
                    取消
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSpawn}
                    disabled={!spawnName.trim() || actionLoading === 'spawn'}
                  >
                    {actionLoading === 'spawn' ? (
                      <Loader2 size={16} className="spin" />
                    ) : (
                      '注册'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInvokeModal && selectedAgent && (
          <div
            className="modal-overlay"
            onClick={() => setShowInvokeModal(false)}
          >
            <motion.div
              className="modal-content"
              role="dialog"
              aria-modal="true"
              aria-label={`调用 ${selectedAgent.name}`}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="modal-header">
                <h2 className="modal-title">调用 {selectedAgent.name}</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowInvokeModal(false)}
                  aria-label="关闭"
                >
                  <X size={18} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      marginBottom: '6px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    输入指令
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="输入要发送给 Agent 的指令..."
                    value={invokeInput}
                    onChange={(e) => setInvokeInput(e.target.value)}
                    autoFocus
                    aria-label="输入指令"
                  />
                </div>
                {invokeResult && (
                  <div
                    role="status"
                    aria-live="polite"
                    style={{
                      padding: '12px 14px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {invokeResult}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowInvokeModal(false)}
                  >
                    取消
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleInvoke}
                    disabled={!invokeInput.trim() || actionLoading === 'invoke'}
                  >
                    {actionLoading === 'invoke' ? (
                      <Loader2 size={16} className="spin" />
                    ) : (
                      <>
                        <Play size={14} style={{ marginRight: '4px' }} />
                        执行
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDetailModal && selectedAgent && (
          <div
            className="modal-overlay"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              className="modal-content"
              role="dialog"
              aria-modal="true"
              aria-label={`${selectedAgent.name} 详情`}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="modal-header">
                <h2 className="modal-title">{selectedAgent.name}</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowDetailModal(false)}
                  aria-label="关闭"
                >
                  <X size={18} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', width: '80px', flexShrink: 0 }}>
                    ID
                  </span>
                  <span style={{ color: 'var(--text-primary)' }}>{selectedAgent.id}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', width: '80px', flexShrink: 0 }}>
                    状态
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: STATUS_COLORS[selectedAgent.status] || STATUS_COLORS.unknown,
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: STATUS_COLORS[selectedAgent.status] || STATUS_COLORS.unknown,
                      }}
                    />
                    {STATUS_LABELS[selectedAgent.status] || selectedAgent.status}
                  </span>
                </div>
                {selectedAgent.description && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', width: '80px', flexShrink: 0 }}>
                      描述
                    </span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      {selectedAgent.description}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', width: '80px', flexShrink: 0 }}>
                    创建时间
                  </span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {selectedAgent.createdAt || '-'}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatBadge({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  color?: string;
}) {
  return (
    <div
      role="status"
      aria-label={`${label}: ${value}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      {icon && (
        <span style={{ color: color || 'var(--text-muted)', display: 'flex' }}>{icon}</span>
      )}
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{label}</span>
      <span
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: color || 'var(--text-primary)',
        }}
      >
        {value}
      </span>
    </div>
  );
}