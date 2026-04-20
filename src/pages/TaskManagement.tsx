import React, { useState, useEffect } from 'react';
import {
  ListTodo, Plus, Search, Filter, Play, Pause, Trash2, RotateCcw,
  AlertCircle, CheckCircle2, Clock, Loader2, Eye, X, ChevronDown,
  BarChart3, Users, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import sdk, { TaskInfo, AgentInfo } from '../services/agentos-sdk';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  pending: { color: '#6b7280', bg: '#6b728015', icon: <Clock size={14} />, label: '待执行' },
  running: { color: '#3b82f6', bg: '#3b82f615', icon: <Loader2 size={14} />, label: '执行中' },
  completed: { color: '#22c55e', bg: '#22c55e15', icon: <CheckCircle2 size={14} />, label: '已完成' },
  failed: { color: '#ef4444', bg: '#ef444415', icon: <AlertCircle size={14} />, label: '失败' },
  cancelled: { color: '#f59e0b', bg: '#f59e0b15', icon: <Pause size={14} />, label: '已取消' },
};

const TASK_TYPES = [
  { value: 'research', label: '研究分析', icon: '🔍', color: '#8b5cf6' },
  { value: 'coding', label: '代码开发', icon: '💻', color: '#3b82f6' },
  { value: 'data', label: '数据处理', icon: '📊', color: '#06b6d4' },
  { value: 'automation', label: '自动化', icon: '⚙️', color: '#f59e0b' },
  { value: 'general', label: '通用任务', icon: '📋', color: '#6b7280' },
];

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: '低', color: '#6b7280', bg: '#6b728015' },
  medium: { label: '中', color: '#3b82f6', bg: '#3b82f615' },
  high: { label: '高', color: '#f59e0b', bg: '#f59e0b15' },
  urgent: { label: '紧急', color: '#ef4444', bg: '#ef444415' },
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
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="icon-badge bg-gradient-to-br from-green-500 to-emerald-600">
            <ListTodo size={20} color="white" />
          </div>
          <div>
            <h1 className="page-title">任务管理</h1>
            <p className="page-subtitle">任务提交、状态追踪、结果分析与生命周期管理</p>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} /> 新建任务
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon bg-blue-500/10"><BarChart3 size={20} className="text-blue-500" /></div>
          <div><p className="stat-value">{stats.total}</p><p className="stat-label">总任务</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-green-500/10"><Play size={20} className="text-green-500" /></div>
          <div><p className="stat-value">{stats.running}</p><p className="stat-label">执行中</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-purple-500/10"><CheckCircle2 size={20} className="text-purple-500" /></div>
          <div><p className="stat-value">{stats.completed}</p><p className="stat-label">已完成</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-red-500/10"><AlertCircle size={20} className="text-red-500" /></div>
          <div><p className="stat-value">{stats.failed}</p><p className="stat-label">失败</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-3">
          <div className="form-group flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="form-input pl-10"
                placeholder="搜索任务名称或ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group min-w-[140px]">
            <select
              className="form-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">全部状态</option>
              <option value="pending">待执行</option>
              <option value="running">执行中</option>
              <option value="completed">已完成</option>
              <option value="failed">失败</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
          <div className="form-group min-w-[140px]">
            <select
              className="form-select"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="all">全部类型</option>
              {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="card text-center py-12">
          <Loader2 size={32} className="animate-spin mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">加载任务列表...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="card text-center py-12">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">暂无任务</p>
          <button className="btn btn-primary mt-4" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> 创建第一个任务
          </button>
        </div>
      ) : (
        <div className="space-y-3">
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
                  className="card card-elevated"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">{typeCfg.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {task.name || '未命名任务'}
                        </h3>
                        <span className="text-xs text-gray-500 font-mono">#{task.id.slice(0, 8)}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          分配给: <span className="font-medium">{getAgentName(task.agentId)}</span>
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ color: typeCfg.color, background: `${typeCfg.color}15` }}>
                          {typeCfg.label}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium`}
                          style={{ color: statusCfg.color, background: statusCfg.bg }}>
                          {statusCfg.icon} {statusCfg.label}
                        </span>
                        {task.priority && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ color: PRIORITY_CONFIG[task.priority]?.color, background: PRIORITY_CONFIG[task.priority]?.bg }}>
                            {PRIORITY_CONFIG[task.priority]?.label}优先级
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span>创建于: {new Date(task.createdAt).toLocaleString()}</span>
                        {task.updatedAt && <span>更新于: {new Date(task.updatedAt).toLocaleString()}</span>}
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">进度</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">{task.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full transition-all duration-300"
                            style={{
                              width: `${task.progress}%`,
                              background: task.status === 'failed' ? '#ef4444' :
                                task.status === 'completed' ? '#22c55e' : '#3b82f6'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        className="icon-btn"
                        onClick={() => viewTaskDetail(task)}
                        title="查看详情"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => toggleExpand(task.id)}
                        title={isExpanded ? '收起' : '展开'}
                      >
                        <ChevronDown size={16} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      {task.status === 'running' && (
                        <button
                          className="icon-btn text-amber-500"
                          onClick={() => handleTaskAction('cancel', task.id)}
                          disabled={actionLoading === `cancel-${task.id}`}
                          title="取消任务"
                        >
                          <Pause size={16} />
                        </button>
                      )}
                      {(task.status === 'failed' || task.status === 'cancelled') && (
                        <button
                          className="icon-btn text-blue-500"
                          onClick={() => handleTaskAction('restart', task.id)}
                          disabled={actionLoading === `restart-${task.id}`}
                          title="重启任务"
                        >
                          <RotateCcw size={16} />
                        </button>
                      )}
                      <button
                        className="icon-btn text-red-500"
                        onClick={() => handleTaskAction('delete', task.id)}
                        disabled={actionLoading === `delete-${task.id}`}
                        title="删除任务"
                      >
                        <Trash2 size={16} />
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
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">任务信息</h4>
                              <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <dt className="text-gray-500">任务ID</dt>
                                  <dd className="font-mono text-gray-700 dark:text-gray-300">{task.id}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-gray-500">Agent</dt>
                                  <dd className="text-gray-700 dark:text-gray-300">{getAgentName(task.agentId)}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-gray-500">类型</dt>
                                  <dd className="text-gray-700 dark:text-gray-300">{typeCfg.label}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-gray-500">状态</dt>
                                  <dd className="text-gray-700 dark:text-gray-300">{statusCfg.label}</dd>
                                </div>
                              </dl>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">执行结果</h4>
                              {task.result ? (
                                <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-xs font-mono overflow-auto max-h-40">
                                  {JSON.stringify(task.result, null, 2)}
                                </pre>
                              ) : task.error ? (
                                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm text-red-600 dark:text-red-400">
                                  <AlertCircle size={14} className="inline mr-1" />
                                  {task.error}
                                </div>
                              ) : (
                                <p className="text-gray-400 text-sm">暂无结果</p>
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">创建新任务</h2>
                <button className="icon-btn" onClick={() => setShowCreateModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">选择 Agent</label>
                  <select
                    className="form-select"
                    value={newTask.agentId}
                    onChange={e => setNewTask({ ...newTask, agentId: e.target.value })}
                  >
                    <option value="">请选择执行任务的 Agent</option>
                    {agents.filter(a => a.status === 'running' || a.status === 'idle').map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.type || 'unknown'})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">任务描述</label>
                  <textarea
                    className="form-input min-h-[100px]"
                    placeholder="详细描述任务目标和需求..."
                    value={newTask.description}
                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">任务类型</label>
                    <select
                      className="form-select"
                      value={newTask.type}
                      onChange={e => setNewTask({ ...newTask, type: e.target.value })}
                    >
                      {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">优先级</label>
                    <select
                      className="form-select"
                      value={newTask.priority}
                      onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                    >
                      {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}优先级</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>
                  取消
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSubmitTask}
                  disabled={!newTask.agentId || !newTask.description || actionLoading === 'submit'}
                >
                  {actionLoading === 'submit' ? (
                    <><Loader2 size={16} className="animate-spin" /> 提交中...</>
                  ) : (
                    <><CheckCircle2 size={16} /> 提交任务</>
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedTask.name || '未命名任务'}
                  </h2>
                  <p className="text-sm text-gray-500 font-mono mt-1">#{selectedTask.id}</p>
                </div>
                <button className="icon-btn" onClick={() => setShowDetailModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">状态</p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium"
                    style={{ color: STATUS_CONFIG[selectedTask.status]?.color }}>
                    {STATUS_CONFIG[selectedTask.status]?.icon}
                    {STATUS_CONFIG[selectedTask.status]?.label}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">进度</p>
                  <p className="text-lg font-bold">{selectedTask.progress}%</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">分配Agent</p>
                  <p className="text-sm font-medium">{getAgentName(selectedTask.agentId)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">任务类型</p>
                  <p className="text-sm font-medium">{getTaskType(selectedTask.type).label}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">时间信息</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">创建时间: </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {new Date(selectedTask.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">更新时间: </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {selectedTask.updatedAt ? new Date(selectedTask.updatedAt).toLocaleString() : '未更新'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">执行结果</h3>
                {selectedTask.result ? (
                  <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-sm font-mono overflow-auto max-h-60">
                    {JSON.stringify(selectedTask.result, null, 2)}
                  </pre>
                ) : selectedTask.error ? (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-sm text-red-600 dark:text-red-400">
                    <AlertCircle size={16} className="inline mr-2" />
                    {selectedTask.error}
                  </div>
                ) : (
                  <p className="text-gray-400">暂无执行结果</p>
                )}
              </div>

              <div className="flex justify-end gap-3">
                {selectedTask.status === 'running' && (
                  <button
                    className="btn btn-ghost text-amber-600"
                    onClick={() => { handleTaskAction('cancel', selectedTask.id); setShowDetailModal(false); }}
                  >
                    <Pause size={16} /> 取消任务
                  </button>
                )}
                {(selectedTask.status === 'failed' || selectedTask.status === 'cancelled') && (
                  <button
                    className="btn btn-ghost text-blue-600"
                    onClick={() => { handleTaskAction('restart', selectedTask.id); setShowDetailModal(false); }}
                  >
                    <RotateCcw size={16} /> 重启任务
                  </button>
                )}
                <button className="btn btn-primary" onClick={() => setShowDetailModal(false)}>
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
