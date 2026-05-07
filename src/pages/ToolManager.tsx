import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench,
  Plus,
  Trash2,
  Search,
  Play,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Code2,
  Database,
  Globe,
  FileText,
  Settings,
  Zap,
  Eye,
  X,
  Copy,
  Terminal,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'registered' | 'active' | 'error' | 'disabled';
  parameters?: Record<string, unknown>;
  createdAt: string;
}

const _CATEGORIES = ['general', 'web', 'file', 'code', 'data', 'system'];

const CATEGORY_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  general: { icon: <Wrench size={14} />, color: '#6366f1' },
  web: { icon: <Globe size={14} />, color: '#3b82f6' },
  file: { icon: <FileText size={14} />, color: '#10b981' },
  code: { icon: <Code2 size={14} />, color: '#f59e0b' },
  data: { icon: <Database size={14} />, color: '#ef4444' },
  system: { icon: <Terminal size={14} />, color: '#8b5cf6' },
};

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  active: { color: 'var(--success-color)', bg: 'var(--success-light)' },
  registered: { color: 'var(--info-color)', bg: 'var(--info-light)' },
  disabled: { color: 'var(--text-muted)', bg: 'var(--bg-tertiary)' },
  error: { color: 'var(--error-color)', bg: 'var(--error-light)' },
};

const ToolManager: React.FC = () => {
  const { t } = useTranslation();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [_showDetail, _setShowDetail] = useState(false);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [executeParams, setExecuteParams] = useState('');

  const categoryLabels: Record<string, string> = {
    general: t('toolManager.categories.general'),
    web: t('toolManager.categories.web'),
    file: t('toolManager.categories.file'),
    code: t('toolManager.categories.code'),
    data: t('toolManager.categories.data'),
    system: t('toolManager.categories.system'),
  };

  const statusLabels: Record<string, string> = {
    active: t('toolManager.statuses.active'),
    registered: t('toolManager.statuses.registered'),
    disabled: t('toolManager.statuses.disabled'),
    error: t('toolManager.statuses.error'),
  };

  useEffect(() => {
    const loadTools = async () => {
      try {
        const result = await invoke<Tool[]>('list_tools');
        if (Array.isArray(result) && result.length > 0) {
          setTools(result);
        } else {
          const stored = localStorage.getItem('agentos-tools');
          if (stored) {
            setTools(JSON.parse(stored));
          }
        }
      } catch (error) {
        console.warn('Backend tools unavailable, using local storage:', error);
        const stored = localStorage.getItem('agentos-tools');
        if (stored) {
          setTools(JSON.parse(stored));
        }
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

  const filtered = tools.filter(
    (t) =>
      (!searchQuery ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (categoryFilter === 'all' || t.category === categoryFilter),
  );

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setActionLoading('add');
    const tool: Tool = {
      id: `tool-${Date.now()}`,
      name: newName.trim(),
      description: newDescription.trim() || t('toolManager.customTool'),
      category: newCategory,
      status: 'registered',
      createdAt: new Date().toISOString(),
    };
    saveTools([...tools, tool]);
    setNewName('');
    setNewDescription('');
    setNewCategory('general');
    setShowAddModal(false);
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    setActionLoading(`del-${id}`);
    saveTools(tools.filter((t) => t.id !== id));
    setActionLoading(null);
  };

  const handleToggleStatus = async (id: string) => {
    setActionLoading(`toggle-${id}`);
    saveTools(
      tools.map((t) =>
        t.id !== id
          ? t
          : {
              ...t,
              status: (t.status === 'active'
                ? 'disabled'
                : t.status === 'disabled'
                  ? 'registered'
                  : 'active') as Tool['status'],
            },
      ),
    );
    setActionLoading(null);
  };

  const handleExecute = async () => {
    if (!selectedTool) return;
    setActionLoading('exec');
    try {
      await invoke<any>('call_tool', {
        name: selectedTool.name,
        arguments: executeParams || '{}',
      });
      saveTools(
        tools.map((t) => (t.id === selectedTool.id ? { ...t, status: 'active' as const } : t)),
      );
      setExecuteParams('');
      setShowExecuteModal(false);
      setActionLoading(null);
    } catch (error) {
      console.error('Tool execution failed:', error);
      alert(
        `${t('toolManager.executionFailed')} ${error instanceof Error ? error.message : String(error)}`,
      );
      setActionLoading(null);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
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
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <Wrench size={20} />
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
              {t('toolManager.title')}
            </h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              {t('toolManager.subtitle')}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={async () => {
              setLoading(true);
              try {
                const result = await invoke<Tool[]>('list_tools');
                if (Array.isArray(result) && result.length > 0) setTools(result);
              } catch (e) {
                console.warn('Failed to refresh tools:', e);
              }
              setLoading(false);
            }}
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
            <RefreshCw size={14} /> {t('toolManager.refresh')}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Plus size={16} /> {t('toolManager.registerTool')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {[
          {
            label: t('toolManager.statTotal'),
            value: tools.length,
            icon: <Wrench size={16} />,
            bg: 'rgba(99,102,241,0.1)',
            color: '#6366f1',
          },
          {
            label: t('toolManager.statActive'),
            value: tools.filter((t) => t.status === 'active').length,
            icon: <Zap size={16} />,
            bg: 'var(--success-light)',
            color: 'var(--success-color)',
          },
          {
            label: t('toolManager.statRegistered'),
            value: tools.filter((t) => t.status === 'registered').length,
            icon: <CheckCircle2 size={16} />,
            bg: 'var(--info-light)',
            color: 'var(--info-color)',
          },
          {
            label: t('toolManager.statDisabled'),
            value: tools.filter((t) => t.status === 'disabled').length,
            icon: <X size={16} />,
            bg: 'var(--bg-tertiary)',
            color: 'var(--text-muted)',
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: s.bg,
                color: s.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {s.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{s.label}</p>
              <p
                style={{
                  margin: '2px 0 0 0',
                  fontSize: '20px',
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

      {/* Category Filter + Search */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setCategoryFilter('all')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: `1px solid ${categoryFilter === 'all' ? 'var(--primary-color)' : 'var(--border-color)'}`,
            background: categoryFilter === 'all' ? 'var(--primary-light)' : 'transparent',
            color: categoryFilter === 'all' ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {t('toolManager.all')} ({tools.length})
        </button>
        {(Object.entries(CATEGORY_ICONS) as [string, typeof CATEGORY_ICONS.general][]).map(
          ([key, cfg]) => {
            const count = tools.filter((t) => t.category === key).length;
            return (
              <button
                key={key}
                onClick={() => setCategoryFilter(key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: `1px solid ${categoryFilter === key ? cfg.color : 'var(--border-color)'}`,
                  background: categoryFilter === key ? `${cfg.color}15` : 'transparent',
                  color: categoryFilter === key ? cfg.color : 'var(--text-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {cfg.icon}
                {categoryLabels[key]} ({count})
              </button>
            );
          },
        )}
      </div>
      <div style={{ position: 'relative', marginBottom: '16px' }}>
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
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('toolManager.searchPlaceholder')}
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

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <Loader2 size={28} />
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '48px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px dashed var(--border-color)',
          }}
        >
          <Wrench
            size={40}
            style={{ color: 'var(--text-muted)', opacity: 0.5, margin: '0 auto 12px' }}
          />
          <p style={{ color: 'var(--text-muted)' }}>{t('toolManager.noTools')}</p>
        </div>
      )}

      {/* Tool Grid */}
      {!loading && filtered.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '14px',
          }}
        >
          <AnimatePresence>
            {filtered.map((tool, index) => {
              const catCfg = CATEGORY_ICONS[tool.category] || CATEGORY_ICONS.general;
              const stCfg = STATUS_COLORS[tool.status];
              return (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '18px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = 'var(--shadow-sm)')}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: catCfg.color + '15',
                          color: catCfg.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {catCfg.icon}
                      </div>
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: '14px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {tool.name}
                        </h3>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {categoryLabels[tool.category]}
                        </span>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: '500',
                        color: stCfg.color,
                        backgroundColor: stCfg.bg,
                      }}
                    >
                      {statusLabels[tool.status]}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: '0 0 14px 0',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    {tool.description}
                  </p>
                  {tool.parameters && Object.keys(tool.parameters).length > 0 && (
                    <div
                      style={{
                        marginBottom: '14px',
                        padding: '8px 10px',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: '6px',
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          marginBottom: '4px',
                        }}
                      >
                        {t('toolManager.parameters')}
                      </p>
                      <pre
                        style={{
                          margin: 0,
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          color: 'var(--text-secondary)',
                          overflow: 'auto',
                        }}
                      >
                        {JSON.stringify(tool.parameters)}
                      </pre>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => {
                        setSelectedTool(tool);
                        setShowExecuteModal(true);
                      }}
                      disabled={tool.status === 'disabled'}
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        border: 'none',
                        borderRadius: '6px',
                        background:
                          tool.status === 'active'
                            ? 'linear-gradient(135deg, #06b6d4, #0891b2)'
                            : 'var(--bg-tertiary)',
                        color: tool.status === 'active' ? 'white' : 'var(--text-muted)',
                        cursor: tool.status === 'disabled' ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <Play size={12} /> {t('toolManager.execute')}
                    </button>
                    <button
                      onClick={() => handleToggleStatus(tool.id)}
                      disabled={actionLoading === `toggle-${tool.id}`}
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontFamily: 'inherit',
                      }}
                    >
                      {actionLoading === `toggle-${tool.id}` ? (
                        <Loader2 size={12} />
                      ) : tool.status === 'active' ? (
                        <Eye size={12} />
                      ) : (
                        <CheckCircle2 size={12} />
                      )}
                      {tool.status === 'active'
                        ? ` ${t('toolManager.disable')}`
                        : ` ${t('toolManager.enable')}`}
                    </button>
                    <button
                      onClick={() => handleDelete(tool.id)}
                      disabled={actionLoading === `del-${tool.id}`}
                      style={{
                        width: '32px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {actionLoading === `del-${tool.id}` ? (
                        <Loader2 size={11} />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
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
                {t('toolManager.addToolTitle')}
              </h3>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  marginBottom: '20px',
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
                    {t('toolManager.toolName')} *
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={t('toolManager.namePlaceholder')}
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
                    {t('toolManager.description')}
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={2}
                    placeholder={t('toolManager.descPlaceholder')}
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
                    {t('toolManager.category')}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    {Object.entries(CATEGORY_ICONS).map(([k, _v]) => (
                      <option key={k} value={k}>
                        {categoryLabels[k]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                  }}
                >
                  {t('toolManager.cancel')}
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newName.trim()}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: 'white',
                    cursor: !newName.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {actionLoading === 'add' ? <Loader2 size={14} /> : <Plus size={14} />}
                  {t('toolManager.register')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Execute Modal */}
      <AnimatePresence>
        {showExecuteModal && selectedTool && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExecuteModal(false)}
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
                  marginBottom: '4px',
                }}
              >
                {t('toolManager.executeTitle')}
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                <code style={{ fontFamily: 'monospace', color: 'var(--primary-color)' }}>
                  {selectedTool.name}
                </code>{' '}
                — {selectedTool.description}
              </p>
              {selectedTool.parameters && Object.keys(selectedTool.parameters).length > 0 && (
                <div
                  style={{
                    marginBottom: '14px',
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                  }}
                >
                  <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {t('toolManager.expectedParams')}：
                  </p>
                  <pre
                    style={{
                      margin: 0,
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {JSON.stringify(selectedTool.parameters, null, 2)}
                  </pre>
                </div>
              )}
              <textarea
                value={executeParams}
                onChange={(e) => setExecuteParams(e.target.value)}
                rows={4}
                placeholder={t('toolManager.paramsPlaceholder')}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontFamily: "'JetBrains Mono', monospace",
                  outline: 'none',
                  resize: 'vertical',
                  marginBottom: '16px',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  onClick={() => setShowExecuteModal(false)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                  }}
                >
                  {t('toolManager.cancel')}
                </button>
                <button
                  onClick={handleExecute}
                  disabled={actionLoading === 'exec'}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                    color: 'white',
                    cursor: actionLoading === 'exec' ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {actionLoading === 'exec' ? <Loader2 size={14} /> : <Play size={14} />}
                  {t('toolManager.execute')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ToolManager;
