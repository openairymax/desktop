import React, { useState, useEffect } from 'react';
import {
  ListTodo,
  Plus,
  Search,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Eye,
  X,
  ChevronDown,
  FileText,
  Hourglass,
  Ban,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useTasks } from '../hooks/useAgentOS';
import type { Task as AgentOSTask } from '../services/agentos.service';

const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; icon: React.ReactNode; label: string }
> = {
  pending: {
    color: 'var(--text-muted)',
    bg: 'var(--bg-tertiary)',
    icon: <Hourglass size={14} />,
    label: '待执行',
  },
  running: {
    color: 'var(--info-color)',
    bg: 'var(--info-light)',
    icon: <Loader2 size={14} />,
    label: '执行中',
  },
  completed: {
    color: 'var(--success-color)',
    bg: 'var(--success-light)',
    icon: <CheckCircle2 size={14} />,
    label: '已完成',
  },
  failed: {
    color: 'var(--error-color)',
    bg: 'var(--error-light)',
    icon: <AlertCircle size={14} />,
    label: '失败',
  },
  cancelled: {
    color: 'var(--warning-color)',
    bg: 'var(--warning-light)',
    icon: <Ban size={14} />,
    label: '已取消',
  },
};

function mapPriority(priorityNum: number): {
  key: string;
  label: string;
  color: string;
  bg: string;
} {
  if (priorityNum >= 76)
    return { key: 'urgent', label: '紧急', color: 'var(--error-color)', bg: 'var(--error-light)' };
  if (priorityNum >= 51)
    return { key: 'high', label: '高', color: 'var(--warning-color)', bg: 'var(--warning-light)' };
  if (priorityNum >= 26)
    return { key: 'medium', label: '中', color: 'var(--info-color)', bg: 'var(--info-light)' };
  return { key: 'low', label: '低', color: 'var(--text-muted)', bg: 'var(--bg-tertiary)' };
}

function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '...' : str;
}

const TaskManagement: React.FC = () => {
  const { t } = useTranslation();
  const {
    tasks,
    loading,
    error: tasksError,
    fetchTasks,
    submitTask,
    getTask,
    cancelTask,
    deleteTask,
    waitForTask,
  } = useTasks();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<AgentOSTask | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState(50);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!cancelled) fetchTasks();
    return () => { cancelled = true; };
  }, [fetchTasks]);

  const loadTasks = () => {
    fetchTasks();
  };

  const handleSubmitTask = async () => {
    if (!newDescription.trim()) return;
    setActionLoading('submit');
    try {
      await submitTask(newDescription.trim(), { priority: newPriority });
      setNewDescription('');
      setNewPriority(50);
      setShowCreateModal(false);
    } catch (e) {
      // Intentionally empty: graceful degradation
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelTask = async (taskId: string) => {
    setActionLoading(`cancel-${taskId}`);
    try {
      await cancelTask(taskId);
    } catch (e) {
      // Intentionally empty: graceful degradation
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setActionLoading(`delete-${taskId}`);
    try {
      await deleteTask(taskId);
    } catch (e) {
      // Intentionally empty: graceful degradation
    } finally {
      setActionLoading(null);
    }
  };

  const handleWaitTask = async (taskId: string) => {
    setActionLoading(`wait-${taskId}`);
    try {
      await waitForTask(taskId, 60000);
    } catch (e) {
      // Intentionally empty: graceful degradation
    } finally {
      setActionLoading(null);
    }
  };

  const viewTaskDetail = async (task: AgentOSTask) => {
    setSelectedTask(task);
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const detail = await getTask(task.id);
      setSelectedTask(detail);
    } catch (e) {
      // Intentionally empty: graceful degradation
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleExpand = (taskId: string) => {
    const next = new Set(expandedTasks);
    if (next.has(taskId)) next.delete(taskId);
    else next.add(taskId);
    setExpandedTasks(next);
  };

  const filteredTasks = tasks.filter((task) => {
    const desc = task.description || '';
    const matchSearch =
      !searchTerm ||
      desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: tasks.length,
    running: tasks.filter((t) => t.status === 'running').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    failed: tasks.filter((t) => t.status === 'failed').length,
  };

  return (
    <div role="region" aria-label="任务管理" style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
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
              background: 'linear-gradient(135deg, var(--success-color), #4ade80)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <ListTodo size={20} />
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
              {t('tasks.title')}
            </h1>
            <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)' }}>
              AgentRT 任务全生命周期管理
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            aria-label="刷新任务列表"
            onClick={loadTasks}
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
            aria-label="创建新任务"
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--success-color), #4ade80)',
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
            {t('tasks.submitTask')}
          </button>
        </div>
      </div>

      {tasksError && (
        <div
          role="alert"
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
          <span style={{ fontSize: 'var(--font-size-sm)' }}>{tasksError}</span>
          <button
            aria-label="重试加载"
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: '4px',
            }}
            onClick={loadTasks}
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
            label: '总任务',
            value: stats.total,
            icon: <ListTodo size={18} />,
            color: 'var(--primary-color)',
            bg: 'var(--primary-light)',
          },
          {
            label: '执行中',
            value: stats.running,
            icon: <Loader2 size={18} />,
            color: 'var(--info-color)',
            bg: 'var(--info-light)',
          },
          {
            label: '已完成',
            value: stats.completed,
            icon: <CheckCircle2 size={18} />,
            color: 'var(--success-color)',
            bg: 'var(--success-light)',
          },
          {
            label: '失败',
            value: stats.failed,
            icon: <AlertCircle size={18} />,
            color: 'var(--error-color)',
            bg: 'var(--error-light)',
          },
        ].map((s) => (
          <div
            key={s.label}
            role="status"
            aria-label={`${s.label}: ${s.value}`}
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

      <div role="group" aria-label="筛选条件" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
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
            role="searchbox"
            aria-label="搜索任务"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索任务..."
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
              e.currentTarget.style.borderColor = 'var(--primary-color)';
              e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-light)';
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
          {['all', 'pending', 'running', 'completed', 'failed', 'cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              aria-label={STATUS_CONFIG[s]?.label ? `筛选${STATUS_CONFIG[s]?.label}任务` : '显示全部任务'}
              aria-pressed={statusFilter === s}
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

      {!loading && filteredTasks.length === 0 && (
        <div
          role="status"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '48px',
            textAlign: 'center',
          }}
        >
          <FileText
            size={48}
            style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', opacity: 0.5 }}
          />
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>暂无任务</p>
          <button
            aria-label="提交第一个任务"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'linear-gradient(135deg, var(--primary-color), var(--info-color))',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 'var(--font-size-md)',
              transition: 'all var(--transition-fast)',
            }}
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} /> 提交第一个任务
          </button>
        </div>
      )}

      {!loading && filteredTasks.length > 0 && (
        <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <AnimatePresence>
            {filteredTasks.map((task) => {
              const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
              const prio = mapPriority(task.priority || 0);
              const isExpanded = expandedTasks.has(task.id);

              return (
                <motion.div
                  key={task.id}
                  role="listitem"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
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
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap',
                          marginBottom: '8px',
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                            fontSize: 'var(--font-size-lg)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--text-primary)',
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <span
                            style={{
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {task.description || '未命名任务'}
                          </span>
                        </h3>
                        <span
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--text-muted)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          #{task.id.slice(0, 8)}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '12px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          role="status"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: 'var(--font-size-xs)',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontWeight: 'var(--font-weight-medium)',
                            color: statusCfg.color,
                            backgroundColor: statusCfg.bg,
                          }}
                        >
                          {statusCfg.icon} {statusCfg.label}
                        </span>
                        <span
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontWeight: 'var(--font-weight-medium)',
                            color: prio.color,
                            backgroundColor: prio.bg,
                          }}
                        >
                          {prio.label}
                          {t('tasks.priorityLevel')}
                        </span>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          <Clock size={12} /> {new Date(task.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div style={{ marginBottom: '8px' }}>
                        <div
                          style={{
                            width: '100%',
                            height: '4px',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-full)',
                            overflow: 'hidden',
                          }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width:
                                task.status === 'completed'
                                  ? '100%'
                                  : task.status === 'failed'
                                    ? '100%'
                                    : task.status === 'cancelled'
                                      ? '60%'
                                      : task.status === 'running'
                                        ? '40%'
                                        : '10%',
                            }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            style={{
                              height: '100%',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor:
                                task.status === 'failed'
                                  ? 'var(--error-color)'
                                  : task.status === 'completed'
                                    ? 'var(--success-color)'
                                    : task.status === 'running'
                                      ? 'var(--info-color)'
                                      : 'var(--text-muted)',
                            }}
                          />
                        </div>
                      </div>

                      {task.output && (
                        <div
                          style={{
                            marginTop: '8px',
                            padding: '10px 14px',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--text-secondary)',
                            fontFamily: 'var(--font-mono)',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            maxHeight: '64px',
                            overflow: 'hidden',
                            lineHeight: 1.5,
                          }}
                        >
                          {truncate(task.output, 200)}
                        </div>
                      )}

                      {task.error && (
                        <div
                          style={{
                            marginTop: '8px',
                            padding: '10px 14px',
                            backgroundColor: 'var(--error-light)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--error-color)',
                            lineHeight: 1.5,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>{truncate(task.error, 200)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        flexShrink: 0,
                      }}
                    >
                      <button
                        aria-label={`查看任务${task.id.slice(0, 8)}详情`}
                        onClick={() => viewTaskDetail(task)}
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
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        aria-label={isExpanded ? '收起任务详情' : '展开任务详情'}
                        onClick={() => toggleExpand(task.id)}
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
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown size={16} />
                        </motion.div>
                      </button>
                      {task.status === 'running' && (
                        <>
                          <button
                            aria-label={`取消任务${task.id.slice(0, 8)}`}
                            onClick={() => handleCancelTask(task.id)}
                            disabled={actionLoading === `cancel-${task.id}`}
                            style={{
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--bg-tertiary)',
                              color: 'var(--warning-color)',
                              cursor: 'pointer',
                              transition: 'all var(--transition-fast)',
                              opacity: actionLoading === `cancel-${task.id}` ? 0.5 : 1,
                            }}
                          >
                            {actionLoading === `cancel-${task.id}` ? (
                              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <Ban size={16} />
                            )}
                          </button>
                          <button
                            aria-label={`等待任务${task.id.slice(0, 8)}完成`}
                            onClick={() => handleWaitTask(task.id)}
                            disabled={actionLoading === `wait-${task.id}`}
                            style={{
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--bg-tertiary)',
                              color: 'var(--info-color)',
                              cursor: 'pointer',
                              transition: 'all var(--transition-fast)',
                              opacity: actionLoading === `wait-${task.id}` ? 0.5 : 1,
                            }}
                          >
                            {actionLoading === `wait-${task.id}` ? (
                              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <Clock size={16} />
                            )}
                          </button>
                        </>
                      )}
                      <button
                        aria-label={`删除任务${task.id.slice(0, 8)}`}
                        onClick={() => handleDeleteTask(task.id)}
                        disabled={actionLoading === `delete-${task.id}`}
                        style={{
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--error-color)',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                          opacity: actionLoading === `delete-${task.id}` ? 0.5 : 1,
                        }}
                      >
                        {actionLoading === `delete-${task.id}` ? (
                          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div
                          style={{
                            marginTop: '16px',
                            paddingTop: '16px',
                            borderTop: '1px solid var(--border-subtle)',
                          }}
                        >
                          <div
                            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}
                          >
                            <div
                              style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                padding: '16px',
                              }}
                            >
                              <h4
                                style={{
                                  margin: '0 0 12px 0',
                                  fontSize: 'var(--font-size-sm)',
                                  fontWeight: 'var(--font-weight-medium)',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                任务信息
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {[
                                  { label: '任务ID', value: task.id },
                                  { label: '状态', value: statusCfg.label },
                                  {
                                    label: '优先级',
                                    value: `${prio.label} (${task.priority || 0})`,
                                  },
                                  {
                                    label: '创建时间',
                                    value: new Date(task.createdAt).toLocaleString(),
                                  },
                                  {
                                    label: '更新时间',
                                    value: task.updatedAt
                                      ? new Date(task.updatedAt).toLocaleString()
                                      : '未更新',
                                  },
                                ].map((item, index) => (
                                  <div
                                    key={index}
                                    style={{ display: 'flex', justifyContent: 'space-between' }}
                                  >
                                    <span
                                      style={{
                                        fontSize: 'var(--font-size-sm)',
                                        color: 'var(--text-muted)',
                                      }}
                                    >
                                      {item.label}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: 'var(--font-size-sm)',
                                        color: 'var(--text-primary)',
                                        fontFamily:
                                          item.label === '任务ID' ? 'var(--font-mono)' : 'inherit',
                                      }}
                                    >
                                      {item.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div
                              style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                padding: '16px',
                              }}
                            >
                              <h4
                                style={{
                                  margin: '0 0 12px 0',
                                  fontSize: 'var(--font-size-sm)',
                                  fontWeight: 'var(--font-weight-medium)',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                执行输出
                              </h4>
                              {task.output ? (
                                <pre
                                  style={{
                                    margin: 0,
                                    padding: '12px',
                                    backgroundColor: 'var(--bg-primary)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: 'var(--font-size-xs)',
                                    fontFamily: 'var(--font-mono)',
                                    color: 'var(--text-primary)',
                                    maxHeight: '160px',
                                    overflow: 'auto',
                                    lineHeight: 1.5,
                                  }}
                                >
                                  {task.output}
                                </pre>
                              ) : task.error ? (
                                <div
                                  style={{
                                    padding: '12px',
                                    backgroundColor: 'var(--error-light)',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--error-color)',
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      gap: '8px',
                                    }}
                                  >
                                    <AlertCircle
                                      size={16}
                                      style={{
                                        color: 'var(--error-color)',
                                        flexShrink: 0,
                                        marginTop: '2px',
                                      }}
                                    />
                                    <p
                                      style={{
                                        margin: 0,
                                        fontSize: 'var(--font-size-sm)',
                                        color: 'var(--error-color)',
                                        lineHeight: 1.5,
                                      }}
                                    >
                                      {task.error}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <p
                                  style={{
                                    fontSize: 'var(--font-size-sm)',
                                    color: 'var(--text-muted)',
                                    margin: 0,
                                  }}
                                >
                                  暂无输出
                                </p>
                              )}
                            </div>
                          </div>
                          {task.metadata && Object.keys(task.metadata).length > 0 && (
                            <div
                              style={{
                                marginTop: '16px',
                                backgroundColor: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                padding: '16px',
                              }}
                            >
                              <h4
                                style={{
                                  margin: '0 0 8px 0',
                                  fontSize: 'var(--font-size-sm)',
                                  fontWeight: 'var(--font-weight-medium)',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                元数据
                              </h4>
                              <pre
                                style={{
                                  margin: 0,
                                  padding: '12px',
                                  backgroundColor: 'var(--bg-primary)',
                                  borderRadius: 'var(--radius-sm)',
                                  fontSize: 'var(--font-size-xs)',
                                  fontFamily: 'var(--font-mono)',
                                  color: 'var(--text-primary)',
                                  maxHeight: '120px',
                                  overflow: 'auto',
                                  lineHeight: 1.5,
                                }}
                              >
                                {JSON.stringify(task.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              padding: '24px',
              backdropFilter: 'blur(8px)',
            }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="创建新任务"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-lg)',
                maxWidth: '500px',
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
                  {t('tasks.submitNewTask')}
                </h2>
                <button
                  aria-label="关闭创建任务对话框"
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
                    transition: 'all var(--transition-fast)',
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
                    {t('tasks.taskDescription')}
                  </label>
                  <textarea
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      padding: '12px 14px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--font-size-md)',
                      fontFamily: 'inherit',
                      outline: 'none',
                      resize: 'vertical',
                      transition: 'all var(--transition-fast)',
                      lineHeight: 1.5,
                    }}
                    placeholder="详细描述任务目标和需求..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary-color)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-light)';
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
                    {t('tasks.priorityLevel')}
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      {
                        value: 25,
                        label: '低',
                        color: 'var(--text-muted)',
                        bg: 'var(--bg-tertiary)',
                      },
                      {
                        value: 50,
                        label: '中',
                        color: 'var(--info-color)',
                        bg: 'var(--info-light)',
                      },
                      {
                        value: 75,
                        label: '高',
                        color: 'var(--warning-color)',
                        bg: 'var(--warning-light)',
                      },
                      {
                        value: 100,
                        label: '紧急',
                        color: 'var(--error-color)',
                        bg: 'var(--error-light)',
                      },
                    ].map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        aria-label={`优先级: ${p.label}`}
                        aria-pressed={newPriority === p.value}
                        onClick={() => setNewPriority(p.value)}
                        style={{
                          flex: 1,
                          padding: '8px 14px',
                          borderRadius: 'var(--radius-md)',
                          border:
                            newPriority === p.value
                              ? '2px solid var(--primary-color)'
                              : '1px solid var(--border-color)',
                          backgroundColor: newPriority === p.value ? p.bg : 'var(--bg-tertiary)',
                          color: newPriority === p.value ? p.color : 'var(--text-muted)',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight:
                            newPriority === p.value
                              ? 'var(--font-weight-semibold)'
                              : 'var(--font-weight-normal)',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  aria-label="取消创建"
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
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {t('toolManager.cancel')}
                </button>
                <button
                  aria-label="提交任务"
                  onClick={handleSubmitTask}
                  disabled={!newDescription.trim() || actionLoading === 'submit'}
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, var(--primary-color), var(--info-color))',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 'var(--font-size-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all var(--transition-fast)',
                    opacity: !newDescription.trim() || actionLoading === 'submit' ? 0.5 : 1,
                  }}
                >
                  {actionLoading === 'submit' ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      {t('tasks.submitting')}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      {t('tasks.submitTask')}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDetailModal && selectedTask && (
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
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              padding: '24px',
              backdropFilter: 'blur(8px)',
            }}
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="任务详情"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-lg)',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '80vh',
                overflow: 'auto',
                padding: '24px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '24px',
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 'var(--font-size-xl)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'var(--text-primary)',
                      marginBottom: '4px',
                    }}
                  >
                    {selectedTask.description || '未命名任务'}
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    #{selectedTask.id}
                  </p>
                </div>
                <button
                  aria-label="关闭任务详情"
                  onClick={() => setShowDetailModal(false)}
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
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {detailLoading ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '32px',
                  }}
                >
                  <Loader2
                    size={24}
                    style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }}
                  />
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '16px',
                      marginBottom: '24px',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                      }}
                    >
                      <p
                        style={{
                          margin: '0 0 8px 0',
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {t('skills.status')}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: STATUS_CONFIG[selectedTask.status]?.color,
                        }}
                      >
                        {STATUS_CONFIG[selectedTask.status]?.icon}
                        {STATUS_CONFIG[selectedTask.status]?.label}
                      </div>
                    </div>
                    <div
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                      }}
                    >
                      <p
                        style={{
                          margin: '0 0 8px 0',
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {t('tasks.priorityLevel')}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 'var(--font-size-md)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {mapPriority(selectedTask.priority || 0).label} (
                        {selectedTask.priority || 0})
                      </p>
                    </div>
                    <div
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                      }}
                    >
                      <p
                        style={{
                          margin: '0 0 8px 0',
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {t('sessions.createdAt')}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {new Date(selectedTask.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                      }}
                    >
                      <p
                        style={{
                          margin: '0 0 8px 0',
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {t('sessions.updatedAt')}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {selectedTask.updatedAt
                          ? new Date(selectedTask.updatedAt).toLocaleString()
                          : '未更新'}
                      </p>
                    </div>
                  </div>

                  {selectedTask.output && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4
                        style={{
                          margin: '0 0 8px 0',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        执行输出
                      </h4>
                      <pre
                        style={{
                          margin: 0,
                          padding: '14px',
                          backgroundColor: 'var(--bg-primary)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: 'var(--font-size-xs)',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-primary)',
                          maxHeight: '200px',
                          overflow: 'auto',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {selectedTask.output}
                      </pre>
                    </div>
                  )}

                  {selectedTask.error && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4
                        style={{
                          margin: '0 0 8px 0',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--error-color)',
                        }}
                      >
                        错误信息
                      </h4>
                      <div
                        style={{
                          padding: '14px',
                          backgroundColor: 'var(--error-light)',
                          border: '1px solid var(--error-color)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <AlertCircle
                            size={16}
                            style={{ color: 'var(--error-color)', flexShrink: 0, marginTop: '2px' }}
                          />
                          <pre
                            style={{
                              margin: 0,
                              fontSize: 'var(--font-size-xs)',
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--error-color)',
                              lineHeight: 1.6,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              background: 'none',
                              padding: 0,
                              border: 'none',
                            }}
                          >
                            {selectedTask.error}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTask.metadata && Object.keys(selectedTask.metadata).length > 0 && (
                    <div>
                      <h4
                        style={{
                          margin: '0 0 8px 0',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        元数据
                      </h4>
                      <pre
                        style={{
                          margin: 0,
                          padding: '14px',
                          backgroundColor: 'var(--bg-primary)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: 'var(--font-size-xs)',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-primary)',
                          maxHeight: '180px',
                          overflow: 'auto',
                          lineHeight: 1.6,
                        }}
                      >
                        {JSON.stringify(selectedTask.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskManagement;
