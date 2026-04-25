import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Database, Search, Plus, Trash2, X, Clock,
  AlertCircle, Eye, BarChart3, RefreshCw, Loader2, Layers, Zap
} from 'lucide-react';
import { useMemory } from '../hooks/useAgentOS';
import type { Memory, MemoryLayer } from '../services/agentos.service';

const LAYER_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  L1: { color: 'var(--info-color)', bg: 'var(--info-light)', icon: <Clock size={14} />, label: 'L1 工作记忆' },
  L2: { color: 'var(--primary-color)', bg: 'var(--primary-light)', icon: <Database size={14} />, label: 'L2 语义记忆' },
  L3: { color: 'var(--warning-color)', bg: 'var(--warning-light)', icon: <Layers size={14} />, label: 'L3 程序记忆' },
  L4: { color: 'var(--success-color)', bg: 'var(--success-light)', icon: <Zap size={14} />, label: 'L4 核心记忆' },
};

const MemoryEvolution: React.FC = () => {
  const {
    memories, loading, error: memError, fetchMemories,
    writeMemory, searchMemory, deleteMemory,
    getMemoryCount, evolveMemory, getMemoryStats, clearMemories,
  } = useMemory();

  const [searchQuery, setSearchQuery] = useState('');
  const [layerFilter, setLayerFilter] = useState<string>('all');
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newLayer, setNewLayer] = useState<MemoryLayer>('L1' as MemoryLayer);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchMemories();
    getMemoryStats().then(s => setStats(s));
  }, []);

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      const result = await searchMemory(searchQuery, 50);
      return;
    }
    fetchMemories();
  };

  const handleStore = async () => {
    if (!newContent.trim()) return;
    setActionLoading('store');
    try {
      await writeMemory(newContent.trim(), newLayer);
      setNewContent('');
      setShowStoreModal(false);
      getMemoryStats().then(s => setStats(s));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(`delete-${id}`);
    try {
      await deleteMemory(id);
      getMemoryStats().then(s => setStats(s));
    } finally {
      setActionLoading(null);
    }
  };

  const handleEvolve = async () => {
    setActionLoading('evolve');
    try {
      await evolveMemory();
      await fetchMemories();
      getMemoryStats().then(s => setStats(s));
    } finally {
      setActionLoading(null);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('确定要清除所有记忆吗？此操作不可撤销。')) return;
    setActionLoading('clear');
    try {
      await clearMemories();
      getMemoryStats().then(s => setStats(s));
    } finally {
      setActionLoading(null);
    }
  };

  const filteredMemories = memories.filter(m => {
    const matchesLayer = layerFilter === 'all' || m.layer === layerFilter;
    return matchesLayer;
  });

  const layerCounts: Record<string, number> = {};
  memories.forEach(m => { layerCounts[m.layer] = (layerCounts[m.layer] || 0) + 1; });

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          }}>
            <Brain size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              记忆系统
            </h1>
            <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)' }}>AgentOS 四层记忆管理与进化追踪</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => fetchMemories()} style={{
            padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', fontSize: 'var(--font-size-md)',
            transition: 'all var(--transition-fast)',
          }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 刷新
          </button>
          <button onClick={handleEvolve} disabled={actionLoading === 'evolve'} style={{
            padding: '8px 12px', border: '1px solid var(--primary-color)', borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', fontSize: 'var(--font-size-md)',
            transition: 'all var(--transition-fast)', opacity: actionLoading === 'evolve' ? 0.5 : 1,
          }}>
            {actionLoading === 'evolve' ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={14} />}
            进化
          </button>
          <button onClick={handleClear} disabled={actionLoading === 'clear'} style={{
            padding: '8px 12px', border: '1px solid var(--error-color)', borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--error-light)', color: 'var(--error-color)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', fontSize: 'var(--font-size-md)',
            transition: 'all var(--transition-fast)', opacity: actionLoading === 'clear' ? 0.5 : 1,
          }}>
            <Trash2 size={14} /> 清除全部
          </button>
          <button onClick={() => setShowStoreModal(true)} style={{
            padding: '8px 16px', border: 'none', borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', fontSize: 'var(--font-size-md)',
            transition: 'all var(--transition-fast)',
          }}>
            <Plus size={16} /> 存储记忆
          </button>
        </div>
      </div>

      {memError && (
        <div style={{
          padding: '12px 16px', marginBottom: '16px', backgroundColor: 'var(--error-light)',
          border: '1px solid var(--error-color)', borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error-color)',
        }}>
          <AlertCircle size={16} />
          <span style={{ fontSize: 'var(--font-size-sm)' }}>{memError}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: '总记忆数', value: memories.length, icon: <Brain size={18} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
          { label: 'L1 工作记忆', value: layerCounts['L1'] || 0, icon: <Clock size={18} />, color: 'var(--info-color)', bg: 'var(--info-light)' },
          { label: 'L2 语义记忆', value: layerCounts['L2'] || 0, icon: <Database size={18} />, color: 'var(--primary-color)', bg: 'var(--primary-light)' },
          { label: 'L3/L4 深层', value: (layerCounts['L3'] || 0) + (layerCounts['L4'] || 0), icon: <Layers size={18} />, color: 'var(--success-color)', bg: 'var(--success-light)' },
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

      {Object.keys(stats).length > 0 && (
        <div style={{
          backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '24px',
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={16} style={{ color: '#8b5cf6' }} /> 记忆统计
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{key}</p>
                <p style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="搜索记忆内容..." style={{
            width: '100%', padding: '10px 14px 10px 36px', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)',
            fontSize: 'var(--font-size-md)', fontFamily: 'inherit', outline: 'none', transition: 'all var(--transition-fast)',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.2)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
          {['all', 'L1', 'L2', 'L3', 'L4'].map(layer => (
            <button key={layer} onClick={() => setLayerFilter(layer)} style={{
              padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: 'none',
              backgroundColor: layerFilter === layer ? 'var(--bg-card)' : 'transparent',
              color: layerFilter === layer ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 'var(--font-size-sm)', fontWeight: layerFilter === layer ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all var(--transition-fast)',
            }}>
              {layer === 'all' ? '全部' : LAYER_CONFIG[layer]?.label || layer}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
          <Loader2 size={32} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {!loading && filteredMemories.length === 0 && (
        <div style={{
          backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)', padding: '48px', textAlign: 'center',
        }}>
          <Brain size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>暂无记忆数据</p>
          <button onClick={() => setShowStoreModal(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white', border: 'none',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--font-size-md)',
            transition: 'all var(--transition-fast)',
          }}>
            <Plus size={16} /> 存储第一条记忆
          </button>
        </div>
      )}

      {!loading && filteredMemories.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <AnimatePresence>
            {filteredMemories.map((memory, index) => {
              const layerCfg = LAYER_CONFIG[memory.layer] || LAYER_CONFIG.L1;
              return (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.03 }}
                  style={{
                    backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)', padding: '16px 20px', display: 'flex', alignItems: 'flex-start',
                    gap: '14px', boxShadow: 'var(--shadow-sm)', transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                >
                  <div style={{
                    width: '38px', height: '38px', borderRadius: 'var(--radius-md)',
                    backgroundColor: layerCfg.bg, color: layerCfg.color, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {layerCfg.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-xs)',
                        padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--font-weight-medium)',
                        color: layerCfg.color, backgroundColor: layerCfg.bg,
                      }}>
                        {layerCfg.label}
                      </span>
                      {memory.score !== undefined && (
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                          相关度: {(memory.score * 100).toFixed(1)}%
                        </span>
                      )}
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        #{memory.id.slice(0, 8)}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, wordBreak: 'break-word' }}>
                      {memory.content}
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                      {new Date(memory.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(memory.id)}
                    disabled={actionLoading === `delete-${memory.id}`}
                    style={{
                      width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: 'none', borderRadius: 'var(--radius-sm)', backgroundColor: 'transparent',
                      color: 'var(--text-muted)', cursor: 'pointer', transition: 'all var(--transition-fast)', flexShrink: 0,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--error-color)'; e.currentTarget.style.backgroundColor = 'var(--error-light)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    {actionLoading === `delete-${memory.id}` ? (
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : <Trash2 size={14} />}
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showStoreModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: '24px', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowStoreModal(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', maxWidth: '500px', width: '100%', padding: '24px' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>存储记忆</h2>
                <button onClick={() => setShowStoreModal(false)} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-secondary)', marginBottom: '6px' }}>记忆层级</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {Object.entries(LAYER_CONFIG).map(([key, cfg]) => (
                      <button key={key} type="button" onClick={() => setNewLayer(key as MemoryLayer)} style={{
                        padding: '10px 14px', borderRadius: 'var(--radius-md)',
                        border: newLayer === key ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                        backgroundColor: newLayer === key ? cfg.bg : 'var(--bg-tertiary)',
                        color: newLayer === key ? cfg.color : 'var(--text-muted)', fontSize: 'var(--font-size-sm)',
                        fontWeight: newLayer === key ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all var(--transition-fast)',
                        display: 'flex', alignItems: 'center', gap: '6px',
                      }}>
                        {cfg.icon} {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-secondary)', marginBottom: '6px' }}>内容</label>
                  <textarea value={newContent} onChange={e => setNewContent(e.target.value)} rows={4} placeholder="输入要存储的记忆内容..." style={{
                    width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 'var(--font-size-md)', fontFamily: 'inherit', outline: 'none', resize: 'vertical', transition: 'all var(--transition-fast)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.2)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={() => setShowStoreModal(false)} style={{ padding: '8px 16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--font-size-md)' }}>取消</button>
                <button onClick={handleStore} disabled={!newContent.trim() || actionLoading === 'store'} style={{
                  padding: '8px 16px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white', border: 'none',
                  borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--font-size-md)',
                  display: 'flex', alignItems: 'center', gap: '6px', opacity: (!newContent.trim() || actionLoading === 'store') ? 0.5 : 1,
                }}>
                  {actionLoading === 'store' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                  存储
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MemoryEvolution;
