import React, { useState, useEffect } from 'react';
import {
  ListTodo, Plus, Search, Filter, Play, Pause, Trash2, RotateCcw,
  AlertCircle, CheckCircle2, Clock, Loader2, Eye, X, ChevronDown,
  BarChart3, Users, FileText, RefreshCw, Clock as ClockIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import sdk, { TaskInfo, AgentInfo } from '../services/agentos-sdk';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  pending: { color: 'var(--text-muted)', bg: 'var(--bg-tertiary)', icon: <Clock size={14} />, label: '待执行' },
  running: { color: 'var(--info-color)', bg: 'var(--info-light)', icon: <Loader2 size={14} />, label: '执行中' },
  completed: { color: 'var(--success-color)', bg: 'var(--success-light)', icon: <CheckCircle2 size={14} />, label: '已完成' },
  failed: { color: 'var(--error-color)', bg: 'var(--error-light)', icon: <AlertCircle size={14} />, label: '失败' },
  cancelled: { color: 'var(--warning-color)', bg: 'var(--warning-light)', icon: <Pause size={14} />, label: '已取消' },
};

const TASK_TYPES = [
  { value: 'research', label: '研究分析', icon: '🔍', color: 'var(--primary-color)' },
  { value: 'coding', label: '代码开发', icon: '💻', color: 'var(--info-color)' },
  { value: 'data', label: '数据处理', icon: '📊', color: 'var(--success-color)' },
  { value: 'automation', label: '自动化', icon: '⚙️', color: 'var(--warning-color)' },
  { value: 'general', label: '通用任务', icon: '📋', color: 'var(--text-muted)' },
];

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: '低', color: 'var(--text-muted)', bg: 'var(--bg-tertiary)' },
  medium: { label: '中', color: 'var(--info-color)', bg: 'var(--info-light)' },
  high: { label: '高', color: 'var(--warning-color)', bg: 'var(--warning-light)' },
  urgent: { label: '紧急', color: 'var(--error-color)', bg: 'var(--error-light)' },
};

const TaskManagement: React.FC = () => {
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskInfo | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const [newTask, setNewTask] = useState({
    agentId: '',
    description: '',
    type: 'general',
    priority: 'medium',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [taskList, agentList] = await Promise.all([
        sdk.listTasks(),
        sdk.listAgents(),
      ]);
      setTasks(taskList);
      setAgents(agentList);
    } catch (e) {
      console.error('Failed to load tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmitTask = async () => {
    if (!newTask.agentId || !newTask.description) return;
    setActionLoading('submit');
    try {
      await sdk.submitTask(newTask.agentId, newTask.description, newTask.priority);
      setNewTask({ agentId: '', description: '', type: 'general', priority: 'medium' });
      setShowCreateModal(false);
      await loadData();
    } catch (e) {
      console.error('Failed to submit task:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTaskAction = async (action: string, taskId: string) => {
    setActionLoading(`${action}-${taskId}`);
    try {
      if (action === 'start') await sdk.submitTask((tasks.find(t => t.id === taskId)?.agentId) || '', tasks.find(t => t.id === taskId)?.name || '');
      else if (action === 'cancel') await sdk.cancelTask(taskId);
      else if (action === 'restart') await sdk.restartTask(taskId);
      else if (action === 'delete') await sdk.deleteTask(taskId);
      await loadData();
    } catch (e) {
      console.error(`Task ${action} failed:`, e);
    } finally {
      setActionLoading(null);
    }
  };

  const viewTaskDetail = async (task: TaskInfo) => {
    setSelectedTask(task);
    setShowDetailModal(true);
    try {
      const detail = await sdk.getTaskStatus(task.id);
      setSelectedTask(detail);
    } catch (e) {
      console.error('Failed to get task detail:', e);
    }
  };

  const toggleExpand = (taskId: string) => {
    const next = new Set(expandedTasks);
    if (next.has(taskId)) next.delete(taskId);
    else next.add(taskId);
    setExpandedTasks(next);
  };

  const filteredTasks = tasks.filter(task => {
    const matchSearch = !searchTerm ||
      task.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchType = typeFilter === 'all' || task.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const stats = {
    total: tasks.length,
    running: tasks.filter(t => t.status === 'running').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
  };

  const getAgentName = (agentId?: string) => {
    return agents.find(a => a.id === agentId)?.name || agentId || '未分配';
  };

  const getTaskType = (type?: string) => {
    return TASK_TYPES.find(t => t.value === type) || TASK_TYPES[4];
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--success-color), #4ade80)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}>
            <ListTodo size={20} />
          </div>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}>
              任务管理
            </h1>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: 'var(--font-size-md)',
              color: 'var(--text-muted)',
            }}>
              任务提交、状态追踪、结果分析与生命周期管理
            </p>
          </div>
        </div>
        <button
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
            fontWeight: 'var(--font-weight-medium)',
            transition: 'all var(--transition-fast)',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
          }}
          onClick={() => setShowCreateModal(true)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.3)';
          }}
        >
          <Plus size={16} />
          新建任务
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {[
          { label: '总任务', value: stats.total, icon: <BarChart3 size={20} />, color: 'var(--info-color)' },
          { label: '执行中', value: stats.running, icon: <Play size={20} />, color: 'var(--success-color)' },
          { label: '已完成', value: stats.completed, icon: <CheckCircle2 size={20} />, color: 'var(--primary-color)' },
          { label: '失败', value: stats.failed, icon: <AlertCircle size={20} />, color: 'var(--error-color)' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            style={{
              padding: '20px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: `${stat.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: stat.color,
              marginBottom: '12px',
            }}>
              {stat.icon}
            </div>
            <p style={{
              margin: 0,
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: '4px',
            }}>
              {stat.value}
            </p>
            <p style={{
              margin: 0,
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-muted)',
              fontWeight: 'var(--font-weight-medium)',
            }}>
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }} />
            <input
              type="text"
              style={{
                width: '100%',
                padding: '10px 14px 10px 40px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-size-md)',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'all var(--transition-fast)',
              }}
              placeholder="搜索任务名称或ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
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
        </div>
        <div style={{ minWidth: '140px' }}>
          <select
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
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary-color)';
              e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-light)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <option value="all">全部状态</option>
            <option value="pending">待执行</option>
            <option value="running">执行中</option>
            <option value="completed">已完成</option>
            <option value="failed">失败</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
        <div style={{ minWidth: '140px' }}>
          <select
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
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary-color)';
              e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-light)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <option value="all">全部类型</option>
            {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
          </select>
        </div>
        <button
          style={{
            padding: '10px 16px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 'var(--font-size-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all var(--transition-fast)',
          }}
          onClick={loadData}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--border-color)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <RefreshCw size={16} />
          刷新
        </button>
      </div>

      {/* Task List */}
      {loading ? (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '48px',
          textAlign: 'center',
        }}>
          <Loader2 size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)' }}>加载任务列表...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '48px',
          textAlign: 'center',
        }}>
          <FileText size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>暂无任务</p>
          <button
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
            <Plus size={16} />
            创建第一个任务
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <AnimatePresence>
            {filteredTasks.map(task => {
              const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
              const typeCfg = getTaskType(task.type);
              const isExpanded = expandedTasks.has(task.id);

              return (
                <motion.div
                  key={task.id}
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
                    <div style={{ fontSize: '24px', flexShrink: 0 }}>{typeCfg.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <h3 style={{
                          margin: 0,
                          fontSize: 'var(--font-size-lg)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--text-primary)',
                          flex: 1,
                          minWidth: 0,
                        }}>
                          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.name || '未命名任务'}
                          </span>
                        </h3>
                        <span style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--text-muted)',
                          fontFamily: 'var(--font-mono)',
                        }}>
                          #{task.id.slice(0, 8)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--text-secondary)',
                        }}>
                          分配给: <span style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>{getAgentName(task.agentId)}</span>
                        </span>
                        <span style={{
                          fontSize: 'var(--font-size-xs)',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: typeCfg.color,
                          backgroundColor: `${typeCfg.color}15`,
                        }}>
                          {typeCfg.label}
                        </span>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: 'var(--font-size-xs)',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: statusCfg.color,
                          backgroundColor: statusCfg.bg,
                        }}>
                          {statusCfg.icon}
                          {statusCfg.label}
                        </span>
                        {task.priority && (
                          <span style={{
                            fontSize: 'var(--font-size-xs)',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontWeight: 'var(--font-weight-medium)',
                            color: PRIORITY_CONFIG[task.priority]?.color,
                            backgroundColor: PRIORITY_CONFIG[task.priority]?.bg,
                          }}>
                            {PRIORITY_CONFIG[task.priority]?.label}优先级
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                          <ClockIcon size={12} />
                          <span>创建于: {new Date(task.createdAt).toLocaleString()}</span>
                        </div>
                        {task.updatedAt && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                            <ClockIcon size={12} />
                            <span>更新于: {new Date(task.updatedAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>进度</span>
                          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>{task.progress}%</span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          backgroundColor: 'var(--bg-tertiary)',
                          borderRadius: 'var(--radius-full)',
                          overflow: 'hidden',
                        }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${task.progress}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            style={{
                              height: '100%',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: task.status === 'failed' ? 'var(--error-color)' :
                                task.status === 'completed' ? 'var(--success-color)' : 'var(--primary-color)',
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <button
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
                        onClick={() => viewTaskDetail(task)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--border-color)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                      >
                        <Eye size={16} />
                      </button>
                      <button
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
                        onClick={() => toggleExpand(task.id)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--border-color)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                          e.currentTarget.style.color = 'var(--text-secondary)';
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
                        <button
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
                          onClick={() => handleTaskAction('cancel', task.id)}
                          disabled={actionLoading === `cancel-${task.id}`}
                          onMouseEnter={(e) => {
                            if (!actionLoading) {
                              e.currentTarget.style.backgroundColor = 'var(--warning-light)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!actionLoading) {
                              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                            }
                          }}
                        >
                          {actionLoading === `cancel-${task.id}` ? (
                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <Pause size={16} />
                          )}
                        </button>
                      )}
                      {(task.status === 'failed' || task.status === 'cancelled') && (
                        <button
                          style={{
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--primary-color)',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)',
                            opacity: actionLoading === `restart-${task.id}` ? 0.5 : 1,
                          }}
                          onClick={() => handleTaskAction('restart', task.id)}
                          disabled={actionLoading === `restart-${task.id}`}
                          onMouseEnter={(e) => {
                            if (!actionLoading) {
                              e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!actionLoading) {
                              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                            }
                          }}
                        >
                          {actionLoading === `restart-${task.id}` ? (
                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <RotateCcw size={16} />
                          )}
                        </button>
                      )}
                      <button
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
                        onClick={() => handleTaskAction('delete', task.id)}
                        disabled={actionLoading === `delete-${task.id}`}
                        onMouseEnter={(e) => {
                          if (!actionLoading) {
                            e.currentTarget.style.backgroundColor = 'var(--error-light)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!actionLoading) {
                            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                          }
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

                  {/* Expanded Detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{
                          marginTop: '16px',
                          paddingTop: '16px',
                          borderTop: '1px solid var(--border-subtle)',
                        }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{
                              backgroundColor: 'var(--bg-tertiary)',
                              borderRadius: 'var(--radius-md)',
                              padding: '16px',
                            }}>
                              <h4 style={{
                                margin: '0 0 12px 0',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: 'var(--font-weight-medium)',
                                color: 'var(--text-primary)',
                              }}>
                                任务信息
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {[
                                  { label: '任务ID', value: task.id },
                                  { label: 'Agent', value: getAgentName(task.agentId) },
                                  { label: '类型', value: typeCfg.label },
                                  { label: '状态', value: statusCfg.label },
                                  { label: '优先级', value: task.priority ? PRIORITY_CONFIG[task.priority]?.label : '未设置' },
                                ].map((item, index) => (
                                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>{item.label}</span>
                                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', fontFamily: item.label === '任务ID' ? 'var(--font-mono)' : 'inherit' }}>{item.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div style={{
                              backgroundColor: 'var(--bg-tertiary)',
                              borderRadius: 'var(--radius-md)',
                              padding: '16px',
                            }}>
                              <h4 style={{
                                margin: '0 0 12px 0',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: 'var(--font-weight-medium)',
                                color: 'var(--text-primary)',
                              }}>
                                执行结果
                              </h4>
                              {task.result ? (
                                <pre style={{
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
                                }}>
                                  {JSON.stringify(task.result, null, 2)}
                                </pre>
                              ) : task.error ? (
                                <div style={{
                                  padding: '12px',
                                  backgroundColor: 'var(--error-light)',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid var(--error-color)',
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                    <AlertCircle size={16} style={{ color: 'var(--error-color)', flexShrink: 0, marginTop: '2px' }} />
                                    <p style={{
                                      margin: 0,
                                      fontSize: 'var(--font-size-sm)',
                                      color: 'var(--error-color)',
                                      lineHeight: 1.5,
                                    }}>
                                      {task.error}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', margin: 0 }}>暂无结果</p>
                              )}
                            </div>
                          </div>
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

      {/* Create Task Modal */}
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
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{
                  margin: 0,
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                }}>
                  创建新任务
                </h2>
                <button
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
                  onClick={() => setShowCreateModal(false)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--border-color)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                  }}>
                    选择 Agent
                  </label>
                  <select
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
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                    value={newTask.agentId}
                    onChange={e => setNewTask({ ...newTask, agentId: e.target.value })}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary-color)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-light)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <option value="">请选择执行任务的 Agent</option>
                    {agents.filter(a => a.status === 'running' || a.status === 'idle').map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.type || 'unknown'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                  }}>
                    任务描述
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
                    value={newTask.description}
                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--text-secondary)',
                      marginBottom: '6px',
                    }}>
                      任务类型
                    </label>
                    <select
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
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                      value={newTask.type}
                      onChange={e => setNewTask({ ...newTask, type: e.target.value })}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary-color)';
                        e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-light)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--text-secondary)',
                      marginBottom: '6px',
                    }}>
                      优先级
                    </label>
                    <select
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
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                      value={newTask.priority}
                      onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary-color)';
                        e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-light)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}优先级</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
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
                  onClick={() => setShowCreateModal(false)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--border-color)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  取消
                </button>
                <button
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
                    opacity: (!newTask.agentId || !newTask.description || actionLoading === 'submit') ? 0.5 : 1,
                  }}
                  onClick={handleSubmitTask}
                  disabled={!newTask.agentId || !newTask.description || actionLoading === 'submit'}
                  onMouseEnter={(e) => {
                    if (!(!newTask.agentId || !newTask.description || actionLoading === 'submit')) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!(!newTask.agentId || !newTask.description || actionLoading === 'submit')) {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {actionLoading === 'submit' ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      提交中...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      提交任务
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Detail Modal */}
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
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h2 style={{
                    margin: 0,
                    fontSize: 'var(--font-size-xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--text-primary)',
                    marginBottom: '4px',
                  }}>
                    {selectedTask.name || '未命名任务'}
                  </h2>
                  <p style={{
                    margin: 0,
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    #{selectedTask.id}
                  </p>
                </div>
                <button
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
                  onClick={() => setShowDetailModal(false)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--border-color)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                }}>
                  <p style={{
                    margin: '0 0 8px 0',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-muted)',
                  }}>
                    状态
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: STATUS_CONFIG[selectedTask.status]?.color,
                  }}>
                    {STATUS_CONFIG[selectedTask.status]?.icon}
                    {STATUS_CONFIG[selectedTask.status]?.label}
                  </div>
                </div>
                <div style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                }}>
                  <p style={{
                    margin: '0 0 8px 0',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-muted)',
                  }}>
                    进度
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--text-primary)',
                  }}>
                    {selectedTask.progress}%
                  </p>
                </div>
                <div style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                }}>
                  <p style={{
                    margin: '0 0 8px 0',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-muted)',
                  }}>
                    分配Agent
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--text-primary)',
                  }}>
                    {getAgentName(selectedTask.agentId)}
                  </p>
                </div>
                <div style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                }}>
                  <p style={{
                    margin: '0 0 8px 0',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-muted)',
                  }}>
                    任务类型
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--text-primary)',
                  }}>
                    {getTaskType(selectedTask.type).label}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--text-primary)',
                }}>
                  时间信息
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ fontSize: 'var(--font-size-sm)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>创建时间: </span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      {new Date(selectedTask.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>更新时间: </span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      {selectedTask.updatedAt ? new Date(selectedTask.updatedAt).toLocaleString() : '未更新'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--text-primary)',
                }}>
                  执行结果
                </h3>
                {selectedTask.result ? (
                  <pre style={{
                    margin: 0,
                    padding: '16px',
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)',
                    maxHeight: '300px',
                    overflow: 'auto',
                    lineHeight: 1.5,
                  }}>
                    {JSON.stringify(selectedTask.result, null, 2)}
                  </pre>
                ) : selectedTask.error ? (
                  <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--error-light)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--error-color)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <AlertCircle size={18} style={{ color: 'var(--error-color)', flexShrink: 0, marginTop: '2px' }} />
                      <p style={{
                        margin: 0,
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--error-color)',
                        lineHeight: 1.5,
                      }}>
                        {selectedTask.error}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', margin: 0 }}>暂无执行结果</p>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                {selectedTask.status === 'running' && (
                  <button
                    style={{
                      padding: '8px 16px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--warning-color)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: 'var(--font-size-md)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all var(--transition-fast)',
                    }}
                    onClick={() => { handleTaskAction('cancel', selectedTask.id); setShowDetailModal(false); }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--warning-light)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }}
                  >
                    <Pause size={16} />
                    取消任务
                  </button>
                )}
                {(selectedTask.status === 'failed' || selectedTask.status === 'cancelled') && (
                  <button
                    style={{
                      padding: '8px 16px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--primary-color)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: 'var(--font-size-md)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all var(--transition-fast)',
                    }}
                    onClick={() => { handleTaskAction('restart', selectedTask.id); setShowDetailModal(false); }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }}
                  >
                    <RotateCcw size={16} />
                    重启任务
                  </button>
                )}
                <button
                  style={{
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
                  onClick={() => setShowDetailModal(false)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskManagement;