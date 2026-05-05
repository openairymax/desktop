import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench, Plus, Trash2, Search, Play, CheckCircle2,
  Loader2, RefreshCw, Code2, Database, Globe, FileText,
  Settings, Zap, Eye, X, Copy, Terminal
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'registered' | 'active' | 'error' | 'disabled';
  parameters?: Record<string, unknown>;
  createdAt: string;
}

const CATEGORIES = ['general', 'web', 'file', 'code', 'data', 'system'];

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  general: { label: '通用工具', icon: <Wrench size={14} />, color: '#6366f1' },
  web: { label: '网络工具', icon: <Globe size={14} />, color: '#3b82f6' },
  file: { label: '文件操作', icon: <FileText size={14} />, color: '#10b981' },
  code: { label: '代码工具', icon: <Code2 size={14} />, color: '#f59e0b' },
  data: { label: '数据处理', icon: <Database size={14} />, color: '#ef4444' },
  system: { label: '系统工具', icon: <Terminal size={14} />, color: '#8b5cf6' },
};

const SAMPLE_TOOLS: Tool[] = [
  { id: 'tool-001', name: 'web_search', description: '在互联网上搜索信息，返回相关结果列表', category: 'web', status: 'active', parameters: { query: '', max_results: 10 }, createdAt: new Date().toISOString() },
  { id: 'tool-002', name: 'code_execute', description: '执行代码片段并返回结果输出', category: 'code', status: 'active', parameters: { language: 'python', code: '' }, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'tool-003', name: 'file_read', description: '读取文件内容并返回文本', category: 'file', status: 'active', parameters: { path: '' }, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'tool-004', name: 'data_query', description: '查询结构化数据并返回结果集', category: 'data', status: 'registered', parameters: { query: '' }, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'tool-005', name: 'system_info', description: '获取系统运行状态和资源使用情况', category: 'system', status: 'active', parameters: {}, createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 'tool-006', name: 'text_analyze', description: '分析文本内容并提取关键信息', category: 'general', status: 'active', parameters: { text: '' }, createdAt: new Date(Date.now() - 259200000).toISOString() },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  active: { color: 'var(--success-color)', bg: 'var(--success-light)', label: '活跃' },
  registered: { color: 'var(--info-color)', bg: 'var(--info-light)', label: '已注册' },
  disabled: { color: 'var(--text-muted)', bg: 'var(--bg-tertiary)', label: '已禁用' },
  error: { color: 'var(--error-color)', bg: 'var(--error-light)', label: '异常' },
};

const ToolManager: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [executeParams, setExecuteParams] = useState('');

  useEffect(() => {
    const loadTools = async () => {
      try {
        const result = await invoke<Tool[]>('list_tools');
        if (Array.isArray(result) && result.length > 0) {
          setTools(result);
        } else {
          const stored = localStorage.getItem('agentos-tools');
          if (stored) { setTools(JSON.parse(stored)); }
          else { setTools(SAMPLE_TOOLS); localStorage.setItem('agentos-tools', JSON.stringify(SAMPLE_TOOLS)); }
        }
      } catch (error) {
        console.warn('Backend tools unavailable, using local storage:', error);
        const stored = localStorage.getItem('agentos-tools');
        if (stored) { setTools(JSON.parse(stored)); }
        else { setTools(SAMPLE_TOOLS); localStorage.setItem('agentos-tools', JSON.stringify(SAMPLE_TOOLS)); }
      } finally {
        setLoading(false);
      }
    };
    loadTools();
  }, []);

  const saveTools = (updated: Tool[]) => {
    setTools(updated);
    localStorage.setItem('agentos-tools', JSON.stringify(updated));
  };

  const filtered = tools.filter(t =>
    (!searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (categoryFilter === 'all' || t.category === categoryFilter)
  );

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setActionLoading('add');
    const tool: Tool = {
      id: `tool-${Date.now()}`,
      name: newName.trim(),
      description: newDescription.trim() || '自定义工具',
      category: newCategory,
      status: 'registered',
      createdAt: new Date().toISOString(),
    };
    saveTools([...tools, tool]);
    setNewName(''); setNewDescription(''); setNewCategory('general');
    setShowAddModal(false); setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    setActionLoading(`del-${id}`);
    saveTools(tools.filter(t => t.id !== id));
    setActionLoading(null);
  };

  const handleToggleStatus = async (id: string) => {
    setActionLoading(`toggle-${id}`);
    saveTools(tools.map(t => t.id !== id ? t : {
      ...t,
      status: (t.status === 'active' ? 'disabled' : t.status === 'disabled' ? 'registered' : 'active') as Tool['status'],
    }));
    setActionLoading(null);
  };

  const handleExecute = async () => {
    if (!selectedTool) return;
    setActionLoading('exec');
    try {
      const result = await invoke<any>('call_tool', {
        name: selectedTool.name,
        arguments: executeParams || '{}',
      });
      console.log('Tool execution result:', result);
      saveTools(tools.map(t => t.id === selectedTool.id ? { ...t, status: 'active' as const } : t));
      setExecuteParams('');
      setShowExecuteModal(false);
      setActionLoading(null);
    } catch (error) {
      console.error('Tool execution failed:', error);
      alert(`工具执行失败: ${error instanceof Error ? error.message : String(error)}`);
      setActionLoading(null);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Wrench size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>工具与技能</h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>注册、管理和调用智能体工具</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={async () => { setLoading(true); try { const result = await invoke<Tool[]>('list_tools'); if (Array.isArray(result) && result.length > 0) setTools(result); } catch(e) { console.warn('Failed to refresh tools:', e); } setLoading(false); }} style={{
            padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px',
            backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer',
            fontSize: '13px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px',
          }}><RefreshCw size={14} /> 刷新</button>
          <button onClick={() => setShowAddModal(true)} style={{
            padding: '8px 16px', border: 'none', borderRadius: '8px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', cursor: 'pointer',
            fontSize: '13px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px',
          }}><Plus size={16} /> 注册工具</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: '总工具数', value: tools.length, icon: <Wrench size={16} />, bg: 'rgba(99,102,241,0.1)', color: '#6366f1' },
          { label: '活跃', value: tools.filter(t => t.status === 'active').length, icon: <Zap size={16} />, bg: 'var(--success-light)', color: 'var(--success-color)' },
          { label: '已注册', value: tools.filter(t => t.status === 'registered').length, icon: <CheckCircle2 size={16} />, bg: 'var(--info-light)', color: 'var(--info-color)' },
          { label: '已禁用', value: tools.filter(t => t.status === 'disabled').length, icon: <X size={16} />, bg: 'var(--bg-tertiary)', color: 'var(--text-muted)' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
            <div><p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{s.label}</p><p style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{s.value}</p></div>
          </div>
        ))}
      </div>

      {/* Category Filter + Search */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => setCategoryFilter('all')} style={{
          padding: '6px 14px', borderRadius: '20px', border: `1px solid ${categoryFilter === 'all' ? 'var(--primary-color)' : 'var(--border-color)'}`,
          background: categoryFilter === 'all' ? 'var(--primary-light)' : 'transparent', color: categoryFilter === 'all' ? 'var(--primary-color)' : 'var(--text-secondary)',
          fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
        }}>全部 ({tools.length})</button>
        {(Object.entries(CATEGORY_LABELS) as [string, typeof CATEGORY_LABELS.general][]).map(([key, cfg]) => {
          const count = tools.filter(t => t.category === key).length;
          return (<button key={key} onClick={() => setCategoryFilter(key)} style={{
            padding: '6px 14px', borderRadius: '20px', border: `1px solid ${categoryFilter === key ? cfg.color : 'var(--border-color)'}`,
            background: categoryFilter === key ? `${cfg.color}15` : 'transparent', color: categoryFilter === key ? cfg.color : 'var(--text-secondary)',
            fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px',
          }}>{cfg.icon}{cfg.label} ({count})</button>);
        })}
      </div>
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索工具名称或描述..."
          style={{ width: '100%', paddingLeft: '34px', paddingRight: '14px', padding: '9px 14px 9px 34px', border: '1px solid var(--border-color)',
            borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Loading */}
      {loading && (<div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Loader2 size={28} /></div>)}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
          <Wrench size={40} style={{ color: 'var(--text-muted)', opacity: 0.5, margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>暂无工具数据</p>
        </div>
      )}

      {/* Tool Grid */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
          <AnimatePresence>
            {filtered.map((tool, index) => {
              const catCfg = CATEGORY_LABELS[tool.category] || CATEGORY_LABELS.general;
              const stCfg = STATUS_CONFIG[tool.status];
              return (
                <motion.div key={tool.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px' }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: catCfg.color + '15', color: catCfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {catCfg.icon}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', fontFamily: 'monospace' }}>{tool.name}</h3>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{catCfg.label}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: '500', color: stCfg.color, backgroundColor: stCfg.bg }}>{stCfg.label}</span>
                  </div>
                  <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tool.description}</p>
                  {tool.parameters && Object.keys(tool.parameters).length > 0 && (
                    <div style={{ marginBottom: '14px', padding: '8px 10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px' }}>
                      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>参数定义</p>
                      <pre style={{ margin: 0, fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-secondary)', overflow: 'auto' }}>{JSON.stringify(tool.parameters)}</pre>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => { setSelectedTool(tool); setShowExecuteModal(true); }}
                      disabled={tool.status === 'disabled'}
                      style={{ flex: 1, padding: '7px 10px', border: 'none', borderRadius: '6px', background: tool.status === 'active' ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : 'var(--bg-tertiary)',
                        color: tool.status === 'active' ? 'white' : 'var(--text-muted)', cursor: tool.status === 'disabled' ? 'not-allowed' : 'pointer',
                        fontSize: '12px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      }}><Play size={12} /> 执行</button>
                    <button onClick={() => handleToggleStatus(tool.id)} disabled={actionLoading === `toggle-${tool.id}`}
                      style={{ flex: 1, padding: '7px 10px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'transparent',
                        color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit',
                      }}>{actionLoading === `toggle-${tool.id}` ? <Loader2 size={12} /> : tool.status === 'active' ? <Eye size={12} /> : <CheckCircle2 size={12} />}{tool.status === 'active' ? ' 禁用' : ' 启用'}</button>
                    <button onClick={() => handleDelete(tool.id)} disabled={actionLoading === `del-${tool.id}`}
                      style={{ width: '32px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >{actionLoading === `del-${tool.id}` ? <Loader2 size={11} /> : <Trash2 size={13} />}</button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1001,
                backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.3)', maxWidth: '480px', width: '90vw', padding: '24px',
              }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>注册新工具</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>工具名称 *</label>
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="例如：web_search"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '8px',
                      backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>描述</label>
                  <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} rows={2} placeholder="描述工具的功能..."
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '8px',
                      backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>分类</label>
                  <select value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{
                    width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '8px',
                    backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'inherit', cursor: 'pointer',
                  }}>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button onClick={() => setShowAddModal(false)} style={{ padding: '8px 16px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>取消</button>
                <button onClick={handleAdd} disabled={!newName.trim()} style={{
                  padding: '8px 16px', border: 'none', borderRadius: '8px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white',
                  cursor: !newName.trim() ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px',
                }}>{actionLoading === 'add' ? <Loader2 size={14} /> : <Plus size={14} />}注册</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Execute Modal */}
      <AnimatePresence>
        {showExecuteModal && selectedTool && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowExecuteModal(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1001,
                backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.3)', maxWidth: '520px', width: '90vw', padding: '24px',
              }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>执行工具</h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-muted)' }}><code style={{ fontFamily: 'monospace', color: 'var(--primary-color)' }}>{selectedTool.name}</code> — {selectedTool.description}</p>
              {selectedTool.parameters && Object.keys(selectedTool.parameters).length > 0 && (
                <div style={{ marginBottom: '14px', padding: '10px 14px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--text-muted)' }}>预期参数：</p>
                  <pre style={{ margin: 0, fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{JSON.stringify(selectedTool.parameters, null, 2)}</pre>
                </div>
              )}
              <textarea value={executeParams} onChange={e => setExecuteParams(e.target.value)} rows={4}
                placeholder='输入 JSON 格式的参数，例如：{"query": "AI Agent"}'
                style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: '8px',
                  backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: "'JetBrains Mono', monospace",
                  outline: 'none', resize: 'vertical', marginBottom: '16px', boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button onClick={() => setShowExecuteModal(false)} style={{ padding: '8px 16px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>取消</button>
                <button onClick={handleExecute} disabled={actionLoading === 'exec'} style={{
                  padding: '8px 16px', border: 'none', borderRadius: '8px', background: 'linear-gradient(135deg, #06b6d4, #0891b2)', color: 'white',
                  cursor: actionLoading === 'exec' ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px',
                }}>{actionLoading === 'exec' ? <Loader2 size={14} /> : <Play size={14} />}执行</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ToolManager;
