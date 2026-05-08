import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Search,
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
  Play,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useSkills } from '../hooks/useAgentOS';
import type { Skill } from '../services/agentos.service';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  active: { color: 'var(--success-color)', bg: 'var(--success-light)', label: '活跃' },
  loaded: { color: 'var(--info-color)', bg: 'var(--info-light)', label: '已加载' },
  inactive: { color: 'var(--text-muted)', bg: 'var(--bg-tertiary)', label: '未激活' },
};

const SkillRegistry: React.FC = () => {
  const { t } = useTranslation();
  const {
    skills,
    loading,
    error: skillsError,
    fetchSkills,
    registerSkill,
    loadSkill,
    executeSkill,
    unloadSkill,
    deleteSkill,
  } = useSkills();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [execParams, setExecParams] = useState('{}');

  useEffect(() => {
    let cancelled = false;
    if (!cancelled) fetchSkills();
    return () => { cancelled = true; };
  }, [fetchSkills]);

  const filteredSkills = skills.filter((s: Skill) => {
    const name = s.name || '';
    const desc = s.description || '';
    const matchesSearch =
      !searchQuery ||
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: skills.length,
    active: skills.filter((s: Skill) => s.status === 'active').length,
    inactive: skills.filter((s: Skill) => s.status === 'inactive').length,
  };

  const handleRegister = async () => {
    if (!newName.trim()) return;
    setActionLoading('register');
    try {
      await registerSkill(newName.trim(), newDescription);
      setNewName('');
      setNewDescription('');
      setShowCreateModal(false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExecute = async () => {
    if (!selectedSkill) return;
    setActionLoading('execute');
    try {
      let params: Record<string, unknown> | undefined = undefined;
      if (execParams.trim() && execParams !== '{}') {
        params = JSON.parse(execParams);
      }
      await executeSkill(selectedSkill.id, params);
      setShowExecuteModal(false);
    } catch (e) {
      console.error('Invalid JSON:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLoad = async (skillId: string) => {
    setActionLoading(`load-${skillId}`);
    try {
      await loadSkill(skillId);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnload = async (skillId: string) => {
    setActionLoading(`unload-${skillId}`);
    try {
      await unloadSkill(skillId);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (skillId: string) => {
    setActionLoading(`delete-${skillId}`);
    try {
      await deleteSkill(skillId);
    } finally {
      setActionLoading(null);
    }
  };

  const openExecute = (skill: Skill) => {
    setSelectedSkill(skill);
    setExecParams('{}');
    setShowExecuteModal(true);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #f59e0b, #f97316)',
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
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              技能注册中心
            </h1>
            <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)' }}>
              AgentOS 技能管理、注册与执行
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => fetchSkills()}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'inherit',
              fontSize: 'var(--font-size-md)',
              transition: 'all var(--transition-fast)',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {t('toolManager.refresh')}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #f59e0b, #f97316)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'inherit',
              fontSize: 'var(--font-size-md)',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Plus size={16} />
            {t('skills.registerSkill')}
          </button>
        </div>
      </div>

      {skillsError && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            backgroundColor: 'var(--error-light)',
            border: '1px solid var(--error-color)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--error-color)',
          }}
        >
          <AlertCircle size={16} />
          <span style={{ fontSize: 'var(--font-size-sm)' }}>{skillsError}</span>
          <button
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
            }}
            onClick={() => fetchSkills()}
          >
            {t('common.retry')}
          </button>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {[
          {
            label: '技能总数',
            value: stats.total,
            icon: <Wrench size={18} />,
            color: '#f59e0b',
            bg: 'rgba(245,158,11,0.1)',
          },
          {
            label: '已加载',
            value: stats.active,
            icon: <Play size={18} />,
            color: 'var(--success-color)',
            bg: 'var(--success-light)',
          },
          {
            label: '未激活',
            value: stats.inactive,
            icon: <ChevronDown size={18} />,
            color: 'var(--text-muted)',
            bg: 'var(--bg-tertiary)',
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
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
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                {s.label}
              </p>
              <p
                style={{
                  margin: '2px 0 0 0',
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-bold)',
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索技能..."
            style={{
              width: '100%',
              padding: '10px 14px 10px 36px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-size-md)',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'all var(--transition-fast)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#f59e0b';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.2)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            gap: '4px',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
          }}
        >
          {['all', 'active', 'loaded', 'inactive'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: statusFilter === s ? 'var(--bg-card)' : 'transparent',
                color: statusFilter === s ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: 'var(--font-size-sm)',
                fontWeight:
                  statusFilter === s ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all var(--transition-fast)',
              }}
            >
              {STATUS_CONFIG[s]?.label || '全部'}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div
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

      {!loading && filteredSkills.length === 0 && (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '48px',
            textAlign: 'center',
          }}
        >
          <Wrench
            size={48}
            style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', opacity: 0.5 }}
          />
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>暂无技能</p>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #f59e0b, #f97316)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 'var(--font-size-md)',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Plus size={16} /> 注册第一个技能
          </button>
        </div>
      )}

      {!loading && filteredSkills.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '16px',
          }}
        >
          <AnimatePresence>
            {filteredSkills.map((skill: Skill, index: number) => {
              const statusCfg = STATUS_CONFIG[skill.status] || STATUS_CONFIG.inactive;
              return (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.04 }}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
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
                          borderRadius: 'var(--radius-md)',
                          background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                        }}
                      >
                        <Wrench size={20} />
                      </div>
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: 'var(--font-size-lg)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {skill.name}
                        </h3>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: 'var(--font-size-xs)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            fontWeight: 'var(--font-weight-medium)',
                            color: statusCfg.color,
                            backgroundColor: statusCfg.bg,
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: statusCfg.color,
                              display: 'inline-block',
                            }}
                          />
                          {statusCfg.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {skill.description && (
                    <p
                      style={{
                        margin: '0 0 12px 0',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                      }}
                    >
                      {skill.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => openExecute(skill)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                        color: 'white',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 'var(--font-size-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <Play size={14} />
                      {t('toolManager.execute')}
                    </button>
                    {skill.status === 'active' ? (
                      <button
                        onClick={() => handleUnload(skill.id)}
                        disabled={actionLoading === `unload-${skill.id}`}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: '1px solid var(--warning-color)',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--warning-light)',
                          color: 'var(--warning-color)',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontSize: 'var(--font-size-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all var(--transition-fast)',
                          opacity: actionLoading === `unload-${skill.id}` ? 0.5 : 1,
                        }}
                      >
                        {actionLoading === `unload-${skill.id}` ? (
                          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                        {t('skills.unloadSkill')}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLoad(skill.id)}
                        disabled={actionLoading === `load-${skill.id}`}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: '1px solid var(--success-color)',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--success-light)',
                          color: 'var(--success-color)',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontSize: 'var(--font-size-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all var(--transition-fast)',
                          opacity: actionLoading === `load-${skill.id}` ? 0.5 : 1,
                        }}
                      >
                        {actionLoading === `load-${skill.id}` ? (
                          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <Play size={14} />
                        )}
                        {t('skills.loadSkill')}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(skill.id)}
                      disabled={actionLoading === `delete-${skill.id}`}
                      style={{
                        padding: '8px 10px',
                        border: '1px solid var(--error-color)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--error-light)',
                        color: 'var(--error-color)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all var(--transition-fast)',
                        opacity: actionLoading === `delete-${skill.id}` ? 0.5 : 1,
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

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: '24px',
              backdropFilter: 'blur(8px)',
            }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-lg)',
                maxWidth: '480px',
                width: '100%',
                padding: '24px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: 'var(--font-size-xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {t('skills.registerSkill')}
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
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
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--text-secondary)',
                      marginBottom: '6px',
                    }}
                  >
                    {t('common.name')}
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="输入技能名称..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--font-size-md)',
                      fontFamily: 'inherit',
                      outline: 'none',
                      transition: 'all var(--transition-fast)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#f59e0b';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.2)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--text-secondary)',
                      marginBottom: '6px',
                    }}
                  >
                    {t('toolManager.description')}
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={3}
                    placeholder="描述技能的功能..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--font-size-md)',
                      fontFamily: 'inherit',
                      outline: 'none',
                      resize: 'vertical',
                      transition: 'all var(--transition-fast)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#f59e0b';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.2)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 'var(--font-size-md)',
                  }}
                >
                  {t('toolManager.cancel')}
                </button>
                <button
                  onClick={handleRegister}
                  disabled={!newName.trim() || actionLoading === 'register'}
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 'var(--font-size-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: !newName.trim() || actionLoading === 'register' ? 0.5 : 1,
                  }}
                >
                  {actionLoading === 'register' ? (
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Plus size={16} />
                  )}
                  {t('toolManager.register')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExecuteModal && selectedSkill && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: '24px',
              backdropFilter: 'blur(8px)',
            }}
            onClick={() => setShowExecuteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-lg)',
                maxWidth: '520px',
                width: '100%',
                padding: '24px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 'var(--font-size-xl)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    执行技能
                  </h2>
                  <p
                    style={{
                      margin: '2px 0 0 0',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {selectedSkill.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowExecuteModal(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                  }}
                >
                  {t('protocols.demo.messageSending.parametersJson')}
                </label>
                <textarea
                  value={execParams}
                  onChange={(e) => setExecParams(e.target.value)}
                  rows={6}
                  placeholder='{"key": "value"}'
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                    resize: 'vertical',
                    marginBottom: '16px',
                    transition: 'all var(--transition-fast)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#f59e0b';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.2)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => setShowExecuteModal(false)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 'var(--font-size-md)',
                  }}
                >
                  {t('toolManager.cancel')}
                </button>
                <button
                  onClick={handleExecute}
                  disabled={actionLoading === 'execute'}
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 'var(--font-size-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: actionLoading === 'execute' ? 0.5 : 1,
                  }}
                >
                  {actionLoading === 'execute' ? (
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Play size={16} />
                  )}
                  {t('toolManager.execute')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SkillRegistry;
