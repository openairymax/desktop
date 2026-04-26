import React, { useState, useEffect } from 'react';
import {
  Settings, Plus, Trash2, Save, CheckCircle2, X, Loader2,
  Search, TestTube, Key, Globe, Cpu, Database, Eye, EyeOff,
  Download, Upload, RotateCcw, AlertCircle, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LLMProviderConfig {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
  configured: boolean;
}

const CONFIG_SECTIONS = [
  { id: 'llm', label: 'LLM 模型配置', icon: Cpu, color: '#8b5cf6' },
  { id: 'service', label: '服务配置', icon: Globe, color: '#3b82f6' },
  { id: 'system', label: '系统参数', icon: Database, color: '#06b6d4' },
  { id: 'env', label: '环境变量', icon: Key, color: '#f59e0b' },
];

const DEFAULT_LLM_PROVIDERS: LLMProviderConfig[] = [
  { id: 'openai', name: 'OpenAI', type: 'openai', baseUrl: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4', configured: false },
  { id: 'anthropic', name: 'Anthropic', type: 'anthropic', baseUrl: 'https://api.anththropic.com/v1', apiKey: '', model: 'claude-3-opus', configured: false },
  { id: 'ollama', name: 'Ollama', type: 'ollama', baseUrl: 'http://localhost:11434', apiKey: '', model: 'llama3', configured: false },
];

const Configuration: React.FC = () => {
  const [activeSection, setActiveSection] = useState('llm');
  const [providers, setProviders] = useState<LLMProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});

  const [systemParams, setSystemParams] = useState({
    maxContextTokens: '8192',
    maxToolCalls: '10',
    taskTimeout: '300',
    logLevel: 'info',
    autoSaveMemory: 'true',
    maxConcurrentAgents: '5',
  });

  const [serviceConfig, setServiceConfig] = useState({
    kernelPort: '18789',
    gatewayPort: '18790',
    memoryPort: '18791',
    mode: 'dev',
    autoRestart: 'true',
    healthCheckInterval: '30',
  });

  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>([
    { key: 'AGENTOS_ENV', value: 'development' },
    { key: 'AGENTOS_DEBUG', value: 'false' },
    { key: 'AGENTOS_LOG_LEVEL', value: 'info' },
  ]);

  const [newEnvVar, setNewEnvVar] = useState({ key: '', value: '' });
  const [editingProvider, setEditingProvider] = useState<LLMProviderConfig | null>(null);
  const [showAddProvider, setShowAddProvider] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('agentos-config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.providers?.length > 0) setProviders(parsed.providers);
        if (parsed.systemParams) setSystemParams(prev => ({ ...prev, ...(parsed.systemParams as object) }));
        if (parsed.serviceConfig) setServiceConfig(prev => ({ ...prev, ...(parsed.serviceConfig as object) }));
        if (parsed.envVars) setEnvVars(parsed.envVars as Array<{ key: string; value: string }>);
      }
    } catch (e) {
      console.error('Failed to load configuration:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveLocalConfig = () => {
    const config = { providers, systemParams, serviceConfig, envVars };
    localStorage.setItem('agentos-config', JSON.stringify(config));
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveProvider = async (provider: LLMProviderConfig) => {
    setSaving(provider.id);
    try {
      setProviders(prev => {
        const idx = prev.findIndex(p => p.id === provider.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...provider, configured: true };
          return updated;
        }
        return [...prev, { ...provider, configured: true }];
      });
      saveLocalConfig();
      setEditingProvider(null);
      setShowAddProvider(false);
    } catch (e) {
      console.error('Failed to save provider:', e);
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    setSaving(providerId);
    try {
      setProviders(prev => prev.filter(p => p.id !== providerId));
      saveLocalConfig();
    } catch (e) {
      console.error('Failed to delete provider:', e);
    } finally {
      setSaving(null);
    }
  };

  const handleTestConnection = async (providerId: string) => {
    setTesting(providerId);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const provider = providers.find(p => p.id === providerId);
      setTestResults(prev => ({
        ...prev,
        [providerId]: {
          success: provider?.configured || false,
          message: provider?.configured ? '连接测试成功' : '未配置，无法测试',
        }
      }));
    } catch (e) {
      setTestResults(prev => ({
        ...prev,
        [providerId]: { success: false, message: String(e) }
      }));
    } finally {
      setTesting(null);
    }
  };

  const handleSaveSystemParams = async () => {
    setSaving('system');
    try {
      saveLocalConfig();
    } catch (e) {
      console.error('Failed to save system params:', e);
    } finally {
      setSaving(null);
    }
  };

  const handleSaveServiceConfig = async () => {
    setSaving('service');
    try {
      saveLocalConfig();
    } catch (e) {
      console.error('Failed to save service config:', e);
    } finally {
      setSaving(null);
    }
  };

  const handleSaveEnvVars = async () => {
    setSaving('env');
    try {
      saveLocalConfig();
    } catch (e) {
      console.error('Failed to save env vars:', e);
    } finally {
      setSaving(null);
    }
  };

  const addEnvVar = () => {
    if (!newEnvVar.key) return;
    setEnvVars([...envVars, { ...newEnvVar }]);
    setNewEnvVar({ key: '', value: '' });
  };

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const exportConfig = () => {
    const config = { systemParams, serviceConfig, envVars, providers };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agentos-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const config = JSON.parse(text);
        if (config.systemParams) setSystemParams(config.systemParams);
        if (config.serviceConfig) setServiceConfig(config.serviceConfig);
        if (config.envVars) setEnvVars(config.envVars);
        if (config.providers) setProviders(config.providers);
      } catch (err) {
        console.error('Failed to import config:', err);
      }
    };
    input.click();
  };

  const activeSectionInfo = CONFIG_SECTIONS.find(s => s.id === activeSection);
  const ActiveIcon = activeSectionInfo?.icon || Settings;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="icon-badge bg-gradient-to-br from-amber-500 to-orange-600">
            <Settings size={20} color="white" />
          </div>
          <div>
            <h1 className="page-title">配置管理</h1>
            <p className="page-subtitle">LLM 模型、服务参数、系统配置与环境变量管理</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={importConfig}>
            <Upload size={16} /> 导入
          </button>
          <button className="btn btn-ghost" onClick={exportConfig}>
            <Download size={16} /> 导出
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="card">
        <div className="flex gap-2 flex-wrap">
          {CONFIG_SECTIONS.map(section => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeSection === section.id
                    ? 'text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                style={activeSection === section.id ? { background: section.color } : {}}
                onClick={() => setActiveSection(section.id)}
              >
                <Icon size={14} className="inline mr-2" />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-12">
          <Loader2 size={32} className="animate-spin mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">加载配置数据...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* LLM Configuration */}
          {activeSection === 'llm' && (
            <motion.div
              key="llm"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Cpu size={20} className="text-purple-500" />
                  LLM 服务提供商
                </h2>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setEditingProvider({ id: '', name: '', type: 'openai', baseUrl: '', apiKey: '', model: '', configured: false });
                    setShowAddProvider(true);
                  }}
                >
                  <Plus size={16} /> 添加提供商
                </button>
              </div>

              <div className="space-y-3">
                {providers.map(provider => (
                  <div key={provider.id} className="card card-elevated">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <Cpu size={20} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{provider.name}</h3>
                          <p className="text-sm text-gray-500 font-mono">{provider.baseUrl}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          provider.configured
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                        }`}>
                          {provider.configured ? '已配置' : '未配置'}
                        </span>
                        {testResults[provider.id] && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            testResults[provider.id].success
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {testResults[provider.id].success ? '✓' : '✗'} {testResults[provider.id].message}
                          </span>
                        )}
                        <button
                          className="icon-btn text-blue-500"
                          onClick={() => handleTestConnection(provider.id)}
                          disabled={testing === provider.id}
                          title="测试连接"
                        >
                          {testing === provider.id ? <Loader2 size={16} className="animate-spin" /> : <TestTube size={16} />}
                        </button>
                        <button
                          className="icon-btn text-amber-500"
                          onClick={() => setEditingProvider(provider)}
                          title="编辑"
                        >
                          <Settings size={16} />
                        </button>
                        <button
                          className="icon-btn text-red-500"
                          onClick={() => handleDeleteProvider(provider.id)}
                          disabled={saving === provider.id}
                          title="删除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">模型: </span>
                        <span className="font-mono text-gray-700 dark:text-gray-300">{provider.model}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">类型: </span>
                        <span className="text-gray-700 dark:text-gray-300">{provider.type}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Edit/Add Provider Modal */}
              <AnimatePresence>
                {(editingProvider || showAddProvider) && editingProvider && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => { setEditingProvider(null); setShowAddProvider(false); }}
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6"
                      onClick={e => e.stopPropagation()}
                    >
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                        {showAddProvider ? '添加 LLM 提供商' : '编辑配置'}
                      </h2>
                      <div className="space-y-4">
                        <div className="form-group">
                          <label className="form-label">名称</label>
                          <input
                            className="form-input"
                            value={editingProvider.name}
                            onChange={e => setEditingProvider({ ...editingProvider, name: e.target.value })}
                            placeholder="例如: OpenAI"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">类型</label>
                          <select
                            className="form-select"
                            value={editingProvider.type}
                            onChange={e => setEditingProvider({ ...editingProvider, type: e.target.value })}
                          >
                            <option value="openai">OpenAI</option>
                            <option value="anthropic">Anthropic</option>
                            <option value="ollama">Ollama</option>
                            <option value="custom">自定义</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">API Base URL</label>
                          <input
                            className="form-input"
                            value={editingProvider.baseUrl}
                            onChange={e => setEditingProvider({ ...editingProvider, baseUrl: e.target.value })}
                            placeholder="https://api.example.com/v1"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">API Key</label>
                          <div className="relative">
                            <input
                              className="form-input pr-10"
                              type={showApiKey[editingProvider.id] ? 'text' : 'password'}
                              value={editingProvider.apiKey || ''}
                              onChange={e => setEditingProvider({ ...editingProvider, apiKey: e.target.value })}
                              placeholder="sk-..."
                            />
                            <button
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                              onClick={() => setShowApiKey(prev => ({ ...prev, [editingProvider.id]: !prev[editingProvider.id] }))}
                            >
                              {showApiKey[editingProvider.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">默认模型</label>
                          <input
                            className="form-input"
                            value={editingProvider.model}
                            onChange={e => setEditingProvider({ ...editingProvider, model: e.target.value })}
                            placeholder="gpt-4, claude-3, etc."
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 mt-6">
                        <button className="btn btn-ghost" onClick={() => { setEditingProvider(null); setShowAddProvider(false); }}>
                          取消
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleSaveProvider(editingProvider)}
                          disabled={saving === editingProvider.id || !editingProvider.name || !editingProvider.baseUrl}
                        >
                          {saving === editingProvider.id ? (
                            <><Loader2 size={16} className="animate-spin" /> 保存中...</>
                          ) : (
                            <><Save size={16} /> 保存</>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Service Configuration */}
          {activeSection === 'service' && (
            <motion.div
              key="service"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="card"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                <Globe size={20} className="text-blue-500" />
                服务配置
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Kernel 端口</label>
                  <input
                    className="form-input"
                    type="number"
                    value={serviceConfig.kernelPort}
                    onChange={e => setServiceConfig({ ...serviceConfig, kernelPort: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gateway 端口</label>
                  <input
                    className="form-input"
                    type="number"
                    value={serviceConfig.gatewayPort}
                    onChange={e => setServiceConfig({ ...serviceConfig, gatewayPort: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Memory 端口</label>
                  <input
                    className="form-input"
                    type="number"
                    value={serviceConfig.memoryPort}
                    onChange={e => setServiceConfig({ ...serviceConfig, memoryPort: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">运行模式</label>
                  <select
                    className="form-select"
                    value={serviceConfig.mode}
                    onChange={e => setServiceConfig({ ...serviceConfig, mode: e.target.value })}
                  >
                    <option value="dev">开发模式 (dev)</option>
                    <option value="prod">生产模式 (prod)</option>
                    <option value="test">测试模式 (test)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">自动重启</label>
                  <select
                    className="form-select"
                    value={serviceConfig.autoRestart}
                    onChange={e => setServiceConfig({ ...serviceConfig, autoRestart: e.target.value })}
                  >
                    <option value="true">启用</option>
                    <option value="false">禁用</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">健康检查间隔 (秒)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={serviceConfig.healthCheckInterval}
                    onChange={e => setServiceConfig({ ...serviceConfig, healthCheckInterval: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  className="btn btn-primary"
                  onClick={handleSaveServiceConfig}
                  disabled={saving === 'service'}
                >
                  {saving === 'service' ? (
                    <><Loader2 size={16} className="animate-spin" /> 保存中...</>
                  ) : (
                    <><Save size={16} /> 保存服务配置</>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* System Parameters */}
          {activeSection === 'system' && (
            <motion.div
              key="system"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="card"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                <Database size={20} className="text-cyan-500" />
                系统参数
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">最大上下文 Token 数</label>
                  <input
                    className="form-input"
                    type="number"
                    value={systemParams.maxContextTokens}
                    onChange={e => setSystemParams({ ...systemParams, maxContextTokens: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">最大工具调用次数</label>
                  <input
                    className="form-input"
                    type="number"
                    value={systemParams.maxToolCalls}
                    onChange={e => setSystemParams({ ...systemParams, maxToolCalls: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">任务超时 (秒)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={systemParams.taskTimeout}
                    onChange={e => setSystemParams({ ...systemParams, taskTimeout: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">日志级别</label>
                  <select
                    className="form-select"
                    value={systemParams.logLevel}
                    onChange={e => setSystemParams({ ...systemParams, logLevel: e.target.value })}
                  >
                    <option value="debug">DEBUG</option>
                    <option value="info">INFO</option>
                    <option value="warn">WARNING</option>
                    <option value="error">ERROR</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">自动保存记忆</label>
                  <select
                    className="form-select"
                    value={systemParams.autoSaveMemory}
                    onChange={e => setSystemParams({ ...systemParams, autoSaveMemory: e.target.value })}
                  >
                    <option value="true">启用</option>
                    <option value="false">禁用</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">最大并发 Agent 数</label>
                  <input
                    className="form-input"
                    type="number"
                    value={systemParams.maxConcurrentAgents}
                    onChange={e => setSystemParams({ ...systemParams, maxConcurrentAgents: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  className="btn btn-primary"
                  onClick={handleSaveSystemParams}
                  disabled={saving === 'system'}
                >
                  {saving === 'system' ? (
                    <><Loader2 size={16} className="animate-spin" /> 保存中...</>
                  ) : (
                    <><Save size={16} /> 保存系统参数</>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Environment Variables */}
          {activeSection === 'env' && (
            <motion.div
              key="env"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <Key size={20} className="text-amber-500" />
                  环境变量
                </h2>
                <div className="space-y-2">
                  {envVars.map((envVar, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <code className="text-sm font-mono text-purple-600 dark:text-purple-400 flex-1">{envVar.key}</code>
                      <code className="text-sm font-mono text-gray-600 dark:text-gray-300 flex-1">{envVar.value}</code>
                      <button
                        className="icon-btn text-red-500"
                        onClick={() => removeEnvVar(index)}
                        title="删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">添加新变量</h3>
                  <div className="flex gap-3">
                    <input
                      className="form-input flex-1"
                      placeholder="变量名 (例如: AGENTOS_DEBUG)"
                      value={newEnvVar.key}
                      onChange={e => setNewEnvVar({ ...newEnvVar, key: e.target.value })}
                    />
                    <input
                      className="form-input flex-1"
                      placeholder="变量值"
                      value={newEnvVar.value}
                      onChange={e => setNewEnvVar({ ...newEnvVar, value: e.target.value })}
                    />
                    <button className="btn btn-primary" onClick={addEnvVar} disabled={!newEnvVar.key}>
                      <Plus size={16} /> 添加
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  className="btn btn-primary"
                  onClick={handleSaveEnvVars}
                  disabled={saving === 'env'}
                >
                  {saving === 'env' ? (
                    <><Loader2 size={16} className="animate-spin" /> 保存中...</>
                  ) : (
                    <><Save size={16} /> 保存环境变量</>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default Configuration;
