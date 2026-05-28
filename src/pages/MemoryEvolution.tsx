import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Database,
  Search,
  Plus,
  Trash2,
  Clock,
  RefreshCw,
  Loader2,
  Layers,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMemory } from '../hooks/useAgentOS';
import { MemoryLayer as ServiceMemoryLayer } from '../services/agentos.service';

type MemoryLayer = 'L1' | 'L2' | 'L3' | 'L4';

interface Memory {
  id: string;
  content: string;
  layer: MemoryLayer;
  createdAt: string;
  score?: number;
}

const LAYER_CONFIG: Record<
  MemoryLayer,
  { color: string; bg: string; icon: React.ReactNode; label: string; desc: string }
> = {
  L1: {
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.1)',
    icon: <Clock size={14} />,
    label: '工作记忆',
    desc: '短期临时信息，快速衰减',
  },
  L2: {
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.1)',
    icon: <Database size={14} />,
    label: '语义记忆',
    desc: '结构化知识，长期保存',
  },
  L3: {
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    icon: <Layers size={14} />,
    label: '程序记忆',
    desc: '操作流程与模式',
  },
  L4: {
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    icon: <Zap size={14} />,
    label: '核心记忆',
    desc: '核心身份与价值观',
  },
};

const MemoryEvolution: React.FC = () => {
  const { t } = useTranslation();
  const {
    memories: apiMemories,
    loading: apiLoading,
    fetchMemories,
    writeMemory,
    deleteMemory,
    evolveMemory,
    clearMemories,
  } = useMemory();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [layerFilter, setLayerFilter] = useState<string>('all');
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newLayer, setNewLayer] = useState<MemoryLayer>('L2');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!cancelled) fetchMemories();
    return () => { cancelled = true; };
  }, [fetchMemories]);

  useEffect(() => {
    if (apiMemories && apiMemories.length > 0) {
      const mapped: Memory[] = apiMemories.map((m) => ({
        id: m.id,
        content: m.content,
        layer: m.layer,
        createdAt: m.createdAt,
        score: m.score,
      }));
      setMemories(mapped);
    }
    setLoading(apiLoading);
  }, [apiMemories, apiLoading]);

  const handleStore = async () => {
    if (!newContent.trim()) return;
    setActionLoading('store');
    try {
      await writeMemory(newContent.trim(), newLayer as ServiceMemoryLayer);
      await fetchMemories();
    } catch (e) {
      // Intentionally empty: graceful degradation
    }
    setNewContent('');
    setShowStoreModal(false);
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    setActionLoading(`delete-${id}`);
    try {
      await deleteMemory(id);
      await fetchMemories();
    } catch (e) {
      // Intentionally empty: graceful degradation
    }
    setActionLoading(null);
  };

  const handleEvolve = async () => {
    setActionLoading('evolve');
    try {
      await evolveMemory();
      await fetchMemories();
    } catch (e) {
      // Intentionally empty: graceful degradation
    }
    setActionLoading(null);
  };

  const handleClear = async () => {
    if (!window.confirm('确定要清除所有记忆吗？此操作不可撤销。')) return;
    try {
      await clearMemories();
      await fetchMemories();
    } catch (e) {
      // Intentionally empty: graceful degradation
    }
  };

  const filtered = memories
    .filter((m) => layerFilter === 'all' || m.layer === layerFilter)
    .filter((m) => !searchQuery || m.content.toLowerCase().includes(searchQuery.toLowerCase()));

  const counts: Record<string, number> = {};
  memories.forEach((m) => {
    counts[m.layer] = (counts[m.layer] || 0) + 1;
  });

  return (
    <div role="region" aria-label="记忆演化" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <Brain size={20} />
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
              {t('memoryEvolution.title')}
            </h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              四层记忆管理与进化追踪
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            aria-label="刷新记忆"
            onClick={() => fetchMemories()}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <RefreshCw size={14} />
            {t('toolManager.refresh')}
          </button>
          <button
            aria-label="进化记忆"
            onClick={handleEvolve}
            disabled={actionLoading === 'evolve'}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--primary-color)',
              borderRadius: '8px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary-color)',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: actionLoading === 'evolve' ? 0.5 : 1,
            }}
          >
            {actionLoading === 'evolve' ? (
              <Loader2 size={14} className="spin" />
            ) : (
              <Zap size={14} />
            )}{' '}
            进化
          </button>
          <button
            aria-label="清除所有记忆"
            onClick={handleClear}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--error-color)',
              borderRadius: '8px',
              backgroundColor: 'var(--error-light)',
              color: 'var(--error-color)',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Trash2 size={14} />
            {t('terminal.clear')}
          </button>
          <button
            aria-label="存储记忆"
            onClick={() => setShowStoreModal(true)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Plus size={16} /> 存储
          </button>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        {(Object.entries(LAYER_CONFIG) as [MemoryLayer, typeof LAYER_CONFIG.L1][]).map(
          ([key, cfg]) => (
            <div
              key={key}
              role="status"
              aria-label={`${cfg.label} ${counts[key] || 0} 条`}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: cfg.bg,
                  color: cfg.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {cfg.icon}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                  {cfg.label}
                </p>
                <p
                  style={{
                    margin: '2px 0 0 0',
                    fontSize: '20px',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                  }}
                >
                  {counts[key] || 0}
                </p>
              </div>
            </div>
          ),
        )}
      </div>

      {/* Layer descriptions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '10px',
          marginBottom: '20px',
        }}
      >
        {(Object.entries(LAYER_CONFIG) as [MemoryLayer, typeof LAYER_CONFIG.L1][]).map(
          ([key, cfg]) => (
            <div
              key={key}
              role="button"
              aria-pressed={layerFilter === key}
              aria-label={`筛选${cfg.label}`}
              tabIndex={0}
              style={{
                padding: '10px 14px',
                backgroundColor: 'var(--bg-secondary)',
                border: `1px solid ${layerFilter === key ? cfg.color : 'var(--border-subtle)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
              onClick={() => setLayerFilter(layerFilter === key ? 'all' : key)}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}
              >
                <span style={{ color: cfg.color }}>{cfg.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: cfg.color }}>
                  {cfg.label}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  {counts[key] || 0} 条
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{cfg.desc}</p>
            </div>
          ),
        )}
      </div>

      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search
            size={15}
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
            aria-label="搜索记忆"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索记忆内容..."
            style={{
              width: '100%',
              paddingLeft: '34px',
              paddingRight: '14px',
              padding: '9px 14px 9px 34px',
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
        <select
          aria-label="筛选层级"
          value={layerFilter}
          onChange={(e) => setLayerFilter(e.target.value)}
          style={{
            padding: '9px 14px',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          <option value="all">全部层级</option>
          <option value="L1">L1 工作记忆</option>
          <option value="L2">L2 语义记忆</option>
          <option value="L3">L3 程序记忆</option>
          <option value="L4">L4 核心记忆</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div role="status" aria-live="polite" style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <Loader2 size={28} />
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div
          role="status"
          style={{
            textAlign: 'center',
            padding: '48px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px dashed var(--border-color)',
          }}
        >
          <Brain
            size={40}
            style={{ color: 'var(--text-muted)', opacity: 0.5, margin: '0 auto 12px' }}
          />
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>暂无记忆数据</p>
          <button
            aria-label="存储第一条记忆"
            onClick={() => setShowStoreModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'inherit',
            }}
          >
            <Plus size={14} /> 存储第一条记忆
          </button>
        </div>
      )}

      {/* Memory List */}
      {!loading && filtered.length > 0 && (
        <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <AnimatePresence>
            {filtered.map((memory, index) => {
              const cfg = LAYER_CONFIG[memory.layer];
              return (
                <motion.div
                  key={memory.id}
                  role="listitem"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: cfg.bg,
                      color: cfg.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {cfg.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontWeight: '600',
                          color: cfg.color,
                          backgroundColor: cfg.bg,
                        }}
                      >
                        {cfg.label}
                      </span>
                      {memory.score !== undefined && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          相关度 {(memory.score * 100).toFixed(0)}%
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          fontFamily: 'monospace',
                        }}
                      >
                        #{memory.id.slice(0, 8)}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                        wordBreak: 'break-word',
                      }}
                    >
                      {memory.content}
                    </p>
                    <p
                      style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}
                    >
                      {new Date(memory.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    aria-label="删除记忆"
                    onClick={() => handleDelete(memory.id)}
                    disabled={actionLoading === `delete-${memory.id}`}
                    style={{
                      width: '26px',
                      height: '26px',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      flexShrink: 0,
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error-color)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    {actionLoading === `delete-${memory.id}` ? (
                      <Loader2 size={12} />
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Store Modal */}
      <AnimatePresence>
        {showStoreModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStoreModal(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                backgroundColor: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)',
              }}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="存储记忆"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
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
                width: '90vw',
                padding: '24px',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '17px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '16px',
                }}
              >
                {t('memoryEvolution.storeMemory')}
              </h3>
              <div
                role="radiogroup"
                aria-label="选择记忆层级"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                {(Object.entries(LAYER_CONFIG) as [MemoryLayer, typeof LAYER_CONFIG.L1][]).map(
                  ([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={newLayer === key}
                      aria-label={cfg.label}
                      onClick={() => setNewLayer(key)}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: `1px solid ${newLayer === key ? cfg.color : 'var(--border-color)'}`,
                        backgroundColor: newLayer === key ? cfg.bg : 'var(--bg-primary)',
                        color: newLayer === key ? cfg.color : 'var(--text-secondary)',
                        fontSize: '13px',
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {cfg.icon}
                      {cfg.label}
                    </button>
                  ),
                )}
              </div>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={3}
                placeholder="输入要存储的记忆内容..."
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
                  marginBottom: '16px',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  aria-label="取消"
                  onClick={() => setShowStoreModal(false)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                  }}
                >
                  {t('toolManager.cancel')}
                </button>
                <button
                  aria-label="确认存储"
                  onClick={handleStore}
                  disabled={!newContent.trim()}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                    color: 'white',
                    cursor: !newContent.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {actionLoading === 'store' ? <Loader2 size={14} /> : <Plus size={14} />}存储
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MemoryEvolution;
