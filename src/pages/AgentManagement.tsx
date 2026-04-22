import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Plus, Play, Square, RotateCcw, Trash2, Search, Filter,
  Eye, Settings, Terminal, BarChart3, ChevronDown, CheckCircle2,
  AlertCircle, Clock, X, Edit, Save, RefreshCw, Info, Zap
} from 'lucide-react';
import {
  listAgents, getAgentDetails, registerAgent, startAgent, stopAgent,
  getAgentConfig, updateAgentConfig, deleteTask, type AgentInfo
} from '../services/agentos-sdk';

interface AgentFormData {
  name: string;
  type: string;
  description: string;
  capabilities: string[];
}

const AGENT_TYPES = [
  { value: 'research', label: '研究型', icon: '🔍', description: '网络搜索、文档分析、信息聚合' },
  { value: 'coding', label: '编程型', icon: '💻', description: '代码生成、调试、重构、审查' },
  { value: 'analysis', label: '分析型', icon: '📊', description: '数据分析、可视化、报告生成' },
  { value: 'assistant', label: '助手型', icon: '🤖', description: '通用任务处理、日程管理、邮件处理' },
  { value: 'custom', label: '自定义', icon: '⚙️', description: '根据需求自定义 Agent 行为' },
];

const AgentManagement: React.FC = () => {
  const { t } = useTranslation();
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [agentConfig, setAgentConfig] = useState<Record<string, unknown> | null>(null);
  const [showConfigEditor, setShowConfigEditor] = useState(false);
  const [configJson, setConfigJson] = useState('{}');
  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    type: 'research',
    description: '',
    capabilities: [],
  });
  const [newCapability, setNewCapability] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listAgents();
      setAgents(data);
    } catch (e) {
      console.error('Failed to load agents:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleViewDetail = async (agent: AgentInfo) => {
    try {
      const detail = await getAgentDetails(agent.id);
      setSelectedAgent(detail);
      setShowDetail(true);
    } catch (e) {
      console.error('Failed to get agent details:', e);
    }
  };

  const handleStartAgent = async (agentId: string) => {
    setActionLoading(agentId);
    try {
      await startAgent(agentId);
      loadData();
    } catch (e) {
      console.error('Failed to start agent:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStopAgent = async (agentId: string) => {
    setActionLoading(agentId);
    try {
      await stopAgent(agentId);
      loadData();
    } catch (e) {
      console.error('Failed to stop agent:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewConfig = async (agentId: string) => {
    try {
      const config = await getAgentConfig(agentId);
      setAgentConfig(config);
      setConfigJson(JSON.stringify(config, null, 2));
      setShowConfigEditor(true);
    } catch (e) {
      console.error('Failed to get agent config:', e);
    }
  };

  const handleSaveConfig = async (agentId: string) => {
    try {
      const parsed = JSON.parse(configJson);
      await updateAgentConfig(agentId, parsed);
      setAgentConfig(parsed);
      setShowConfigEditor(false);
    } catch (e) {
      console.error('Invalid JSON or failed to save config:', e);
    }
  };

  const handleCreateAgent = async () => {
    if (!formData.name.trim()) return;
    try {
      await registerAgent(formData.name, formData.type, formData.description);
      setFormData({ name: '', type: 'research', description: '', capabilities: [] });
      setShowCreateModal(false);
      loadData();
    } catch (e) {
      console.error('Failed to create agent:', e);
    }
  };

  const addCapability = () => {
    if (newCapability.trim() && !formData.capabilities.includes(newCapability.trim())) {
      setFormData({ ...formData, capabilities: [...formData.capabilities, newCapability.trim()] });
      setNewCapability('');
    }
  };

  const removeCapability = (cap: string) => {
    setFormData({ ...formData, capabilities: formData.capabilities.filter(c => c !== cap) });
  };

  const filteredAgents = agents.filter(a => {
    const matchesSearch = !searchQuery ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ((a as any).description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || (a as any).type === typeFilter;
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const runningCount = agents.filter(a => a.status === 'running').length;
  const idleCount = agents.filter(a => a.status === 'idle').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bot className="w-8 h-8 text-purple-600" />
            智能体管理
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            AgentOS 智能体注册、配置与生命周期管理
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            创建智能体
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Bot className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">智能体总数</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{agents.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-500">运行中</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{runningCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-gray-500">空闲</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{idleCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-500">总任务数</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{agents.reduce((sum, a) => sum + ((a as any).taskCount || 0), 0)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索智能体..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">全部类型</option>
          {AGENT_TYPES.map(at => (
            <option key={at.value} value={at.value}>{at.icon} {at.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">全部状态</option>
          <option value="running">运行中</option>
          <option value="idle">空闲</option>
        </select>
      </div>

      {/* Agent List */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">加载中...</div>
      ) : filteredAgents.length === 0 ? (
        <div className="text-center py-12">
          <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">无匹配的智能体</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredAgents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                        agent.status === 'running'
                          ? 'bg-green-50 dark:bg-green-900/30'
                          : 'bg-gray-50 dark:bg-gray-700'
                      }`}>
                        {AGENT_TYPES.find(at => at.value === (agent as any).type)?.icon || '🤖'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{agent.name}</h3>
                        <p className="text-xs text-gray-500">
                          {AGENT_TYPES.find(at => at.value === (agent as any).type)?.label || (agent as any).type}
                        </p>
                      </div>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full mt-2 ${
                      agent.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                    }`} />
                  </div>

                  {(agent as any).description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{(agent as any).description}</p>
                  )}

                  {(agent as any).capabilities && (agent as any).capabilities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {((agent as any).capabilities as string[]).slice(0, 3).map(cap => (
                        <span key={cap} className="px-2 py-0.5 text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                          {cap}
                        </span>
                      ))}
                      {((agent as any).capabilities as string[]).length > 3 && (
                        <span className="px-2 py-0.5 text-xs text-gray-500">
                          +{((agent as any).capabilities as string[]).length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" /> 任务: {(agent as any).taskCount || 0}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {(agent as any).lastActive ? new Date((agent as any).lastActive).toLocaleTimeString() : '—'}
                    </span>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleViewDetail(agent)}
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> 详情
                    </button>
                    {agent.status === 'running' ? (
                      <button
                        onClick={() => handleStopAgent(agent.id)}
                        disabled={actionLoading === agent.id}
                        className="flex-1 px-2 py-1.5 text-sm border border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center gap-1"
                      >
                        {actionLoading === agent.id ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
                        停止
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartAgent(agent.id)}
                        disabled={actionLoading === agent.id}
                        className="flex-1 px-2 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-1"
                      >
                        {actionLoading === agent.id ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        启动
                      </button>
                    )}
                    <button
                      onClick={() => handleViewConfig(agent.id)}
                      className="p-1.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Agent Detail Modal */}
      <AnimatePresence>
        {showDetail && selectedAgent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetail(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Bot className="w-6 h-6 text-purple-600" />
                  智能体详情
                </h3>
                <button onClick={() => setShowDetail(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <p className="text-xs text-gray-500">ID</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedAgent.id}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <p className="text-xs text-gray-500">名称</p>
                    <p className="text-sm text-gray-900 dark:text-white">{selectedAgent.name}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <p className="text-xs text-gray-500">类型</p>
                    <p className="text-sm text-gray-900 dark:text-white">{AGENT_TYPES.find(at => at.value === (selectedAgent as any).type)?.label || (selectedAgent as any).type}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <p className="text-xs text-gray-500">状态</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                      selectedAgent.status === 'running'
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${selectedAgent.status === 'running' ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {selectedAgent.status}
                    </span>
                  </div>
                </div>
                {(selectedAgent as any).description && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">描述</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{(selectedAgent as any).description}</p>
                  </div>
                )}
                {(selectedAgent as any).capabilities && (selectedAgent as any).capabilities.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-2">能力</p>
                    <div className="flex flex-wrap gap-1">
                      {((selectedAgent as any).capabilities as string[]).map(cap => (
                        <span key={cap} className="px-2 py-1 text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">{cap}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(selectedAgent as any).createdAt && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <p className="text-xs text-gray-500">创建时间</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{new Date((selectedAgent as any).createdAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Agent Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-600" />
                  创建智能体
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="输入智能体名称..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">类型</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {AGENT_TYPES.map(at => (
                      <option key={at.value} value={at.value}>{at.icon} {at.label} — {at.description}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                    placeholder="描述智能体的功能..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">能力标签</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newCapability}
                      onChange={(e) => setNewCapability(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCapability()}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="输入能力标签..."
                    />
                    <button onClick={addCapability} className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {formData.capabilities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {formData.capabilities.map(cap => (
                        <span key={cap} className="px-2 py-1 text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center gap-1">
                          {cap}
                          <button onClick={() => removeCapability(cap)} className="hover:text-red-500">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleCreateAgent}
                    disabled={!formData.name.trim()}
                    className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    创建
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Config Editor Modal */}
      <AnimatePresence>
        {showConfigEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowConfigEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-500" />
                  配置编辑器
                </h3>
                <button onClick={() => setShowConfigEditor(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <textarea
                value={configJson}
                onChange={(e) => setConfigJson(e.target.value)}
                rows={12}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowConfigEditor(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  取消
                </button>
                <button
                  onClick={() => selectedAgent && handleSaveConfig(selectedAgent.id)}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  保存
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentManagement;
