import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain,
  Plus,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
  Globe,
  Cpu,
  Sparkles,
  Eye,
  EyeOff,
  Settings,
  Database,
  Save,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgentOS } from '../hooks/useAgentOS';

interface LLMProviderConfig {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
  configured: boolean;
}

const PROVIDER_TEMPLATES = {
  openai: {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    icon: <Zap size={16} />,
    color: '#34c759',
  },
  anthropic: {
    label: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-haiku-3-20250722'],
    icon: <Sparkles size={16} />,
    color: '#d97706',
  },
  ollama: {
    label: 'Ollama (本地)',
    baseUrl: import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434/v1',
    models: ['llama3', 'qwen2.5', 'mistral', 'codellama'],
    icon: <Cpu size={16} />,
    color: '#007aff',
  },
  deepseek: {
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    icon: <Brain size={16} />,
    color: '#0ea5e9',
  },
};

type TabKey = 'providers' | 'system' | 'env';

interface SystemParams {
  maxConcurrentTasks: number;
  taskTimeoutSec: number;
  memoryMaxEntries: number;
  logLevel: string;
  enableDualThinking: boolean;
  defaultModel: string;
}

type NumericParamKey = 'maxConcurrentTasks' | 'taskTimeoutSec' | 'memoryMaxEntries';

const ModelConfig: React.FC = () => {
  const { t } = useTranslation();
  const { client } = useAgentOS();
  const [activeTab, setActiveTab] = useState<TabKey>('providers');
  const [providers, setProviders] = useState<LLMProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [_editingId, _setEditingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newProviderType, setNewProviderType] = useState('openai');
  const [newApiKey, setNewApiKey] = useState('');
  const [newBaseUrl, setNewBaseUrl] = useState('');
  const [newModel, setNewModel] = useState('');
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; message: string; latency?: number }>
  >({});
  const [systemParams, setSystemParams] = useState<SystemParams>({
    maxConcurrentTasks: 8,
    taskTimeoutSec: 300,
    memoryMaxEntries: 10000,
    logLevel: 'info',
    enableDualThinking: true,
    defaultModel: '',
  });
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>([]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      if (client) {
        try {
          const configResp = await client.rawRequest<{
            providers?: LLMProviderConfig[];
            systemParams?: Record<string, string | number | boolean>;
            envVars?: Array<{ key: string; value: string }>;
          }>('/api/v1/config', { method: 'GET' });
          if (configResp?.providers) setProviders(configResp.providers);
          if (configResp?.systemParams)
            setSystemParams((prev) => ({ ...prev, ...configResp.systemParams }));
          if (configResp?.envVars) setEnvVars(configResp.envVars);
        } catch {
          try {
            const stored = localStorage.getItem('agentos-config');
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed.providers?.length > 0) setProviders(parsed.providers);
              if (parsed.systemParams)
                setSystemParams((prev) => ({ ...prev, ...(parsed.systemParams as object) }));
              if (parsed.envVars) setEnvVars(parsed.envVars as Array<{ key: string; value: string }>);
            }
          } catch {
            void 0;
          }
        }
      } else {
        try {
          const stored = localStorage.getItem('agentos-config');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.providers?.length > 0) setProviders(parsed.providers);
            if (parsed.systemParams)
              setSystemParams((prev) => ({ ...prev, ...(parsed.systemParams as object) }));
            if (parsed.envVars) setEnvVars(parsed.envVars as Array<{ key: string; value: string }>);
          }
        } catch {
          void 0;
        }
      }
    } catch {
      void 0;
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    let cancelled = false;
    if (!cancelled) loadAllData();
    return () => { cancelled = true; };
  }, [loadAllData]);

  const saveAll = async () => {
    localStorage.setItem('agentos-config', JSON.stringify({ providers, systemParams, envVars }));
    localStorage.setItem('agentos-llm-providers', JSON.stringify(providers));
    if (client) {
      try {
        await client.rawRequest('/api/v1/config', {
          method: 'PUT',
          body: JSON.stringify({ providers, systemParams, envVars }),
        });
      } catch (e) {
        // Intentionally empty: graceful degradation
      }
    }
  };

  const handleAddProvider = async () => {
    if (!newApiKey.trim()) return;
    setSaving(true);
    try {
      const tpl = PROVIDER_TEMPLATES[newProviderType as keyof typeof PROVIDER_TEMPLATES];
      const newProv: LLMProviderConfig = {
        id: `${newProviderType}-${Date.now()}`,
        type: newProviderType,
        name: tpl.label,
        apiKey: newApiKey,
        baseUrl: newBaseUrl || tpl.baseUrl,
        model: newModel || tpl.models[0],
        configured: true,
      };
      setProviders((prev) => [...prev, newProv]);
      await saveAll();
    } catch (e) {
      // Intentionally empty: graceful degradation
    }
    setShowAddModal(false);
    setNewApiKey('');
    setNewBaseUrl('');
    setSaving(false);
  };

  const handleDeleteProvider = async (id: string) => {
    setProviders((prev) => prev.filter((p) => p.id !== id));
    await saveAll();
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      const p = providers.find((x) => x.id === id);
      if (!p) {
        setTestResults({ ...testResults, [id]: { success: false, message: '未找到提供商配置' } });
        setTestingId(null);
        return;
      }

      if (client) {
        const start = Date.now();
        try {
          const healthResult = await client.health();
          const latency = Date.now() - start;
          setTestResults({
            ...testResults,
            [id]: {
              success: healthResult.status !== 'unreachable',
              message: healthResult.status !== 'unreachable' ? '连接成功' : '连接失败',
              latency,
            },
          });
        } catch (e) {
          setTestResults({
            ...testResults,
            [id]: { success: false, message: '连接失败' },
          });
        }
      } else {
        setTestResults({
          ...testResults,
          [id]: {
            success: !!p?.configured,
            message: p?.configured ? '本地配置有效（无后端验证）' : '未配置',
          },
        });
      }
    } catch (e) {
      setTestResults({
        ...testResults,
        [id]: { success: false, message: '测试异常' },
      });
    }
    setTestingId(null);
  };

  const handleSaveSystem = async () => {
    await saveAll();
  };

  const addEnvVar = () => {
    setEnvVars((prev) => [...prev, { key: '', value: '' }]);
  };

  const updateEnvVar = (idx: number, field: 'key' | 'value', val: string) => {
    setEnvVars((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: val } : e)));
  };

  const removeEnvVar = (idx: number) => {
    setEnvVars((prev) => prev.filter((_, i) => i !== idx));
  };

  const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
    { key: 'providers', label: '模型提供商', icon: <Brain size={15} /> },
    { key: 'system', label: '系统参数', icon: <Settings size={15} /> },
    { key: 'env', label: '环境变量', icon: <Database size={15} /> },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }} role="region" aria-label="模型配置">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1
            style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}
          >
            模型与系统配置
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            管理 LLM 提供商、系统运行参数和环境变量
          </p>
        </div>
        <button
          aria-label="添加模型提供商"
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 18px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            fontFamily: 'inherit',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <Plus size={16} />
          {t('llmConfig.addProvider')}
        </button>
      </div>

      <div
        role="tablist"
        aria-label="配置标签页"
        style={{
          display: 'flex',
          gap: '4px',
          backgroundColor: 'var(--bg-secondary)',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '20px',
          width: 'fit-content',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            id={`tab-${tab.key}`}
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`panel-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.key ? 'white' : 'transparent',
              color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: activeTab === tab.key ? '500' : '400',
              fontFamily: 'inherit',
              transition: 'all 150ms ease',
              boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== Providers Tab ===== */}
      {activeTab === 'providers' && (
        <motion.div
          id="panel-providers"
          role="tabpanel"
          aria-labelledby="tab-providers"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {loading ? (
            <div role="status" aria-live="polite" style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <Loader2 size={28} className="spin" />
            </div>
          ) : providers.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '1px dashed var(--border-color)',
              }}
            >
              <Brain size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                尚未配置任何 LLM 提供商
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                点击上方「添加提供商」开始配置 AI 模型连接
              </p>
            </div>
          ) : (
            <div
              role="list"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: '16px',
              }}
            >
              {providers.map((p) => {
                const tpl = PROVIDER_TEMPLATES[p.type as keyof typeof PROVIDER_TEMPLATES];
                const testRes = testResults[p.id];
                const iconBg = (tpl?.color || '#666') + '15';
                const iconColor = tpl?.color || '#666';
                return (
                  <motion.div
                    key={p.id}
                    role="listitem"
                    layout
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-subtle)',
                      padding: '20px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: iconBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: iconColor,
                          }}
                        >
                          {tpl?.icon || <Globe size={16} />}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: '600',
                              fontSize: '14px',
                              color: 'var(--text-primary)',
                            }}
                          >
                            {p.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {p.type.toUpperCase()}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {p.configured ? (
                          <CheckCircle2 size={14} style={{ color: 'var(--success-color)' }} />
                        ) : (
                          <XCircle size={14} style={{ color: 'var(--error-color)' }} />
                        )}
                        <button
                          aria-label={`删除 ${p.name}`}
                          onClick={() => handleDeleteProvider(p.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            padding: '2px',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>模型:</span> {p.model}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        wordBreak: 'break-all',
                        marginBottom: '12px',
                      }}
                    >
                      {p.baseUrl.replace(/\/v\d+$/, '/...')}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        aria-label={`测试连接 ${p.name}`}
                        onClick={() => handleTestConnection(p.id)}
                        disabled={testingId === p.id}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          padding: '6px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'transparent',
                          cursor: testingId === p.id ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          fontFamily: 'inherit',
                        }}
                      >
                        {testingId === p.id ? (
                          <Loader2 size={12} className="spin" />
                        ) : (
                          <RefreshCw size={12} />
                        )}
                        {t('protocolPlayground.testConnection')}
                      </button>
                    </div>

                    {testRes && (
                      <AnimatePresence>
                        <motion.div
                          role="status"
                          aria-live="polite"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          style={{
                            marginTop: '10px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: testRes.success
                              ? 'var(--success-light)'
                              : 'var(--error-light)',
                            color: testRes.success ? 'var(--success-color)' : 'var(--error-color)',
                          }}
                        >
                          {testRes.success ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {testRes.message}
                          {testRes.latency ? ` (${testRes.latency}ms)` : ''}
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ===== System Params Tab ===== */}
      {activeTab === 'system' && (
        <motion.div
          id="panel-system"
          role="tabpanel"
          aria-labelledby="tab-system"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div
            role="form"
            aria-label="系统运行参数"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              padding: '24px',
              maxWidth: '700px',
            }}
          >
            <h3
              style={{
                fontSize: '15px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginTop: 0,
                marginBottom: '20px',
              }}
            >
              系统运行参数
            </h3>

            {(
              [
                {
                  key: 'maxConcurrentTasks' as NumericParamKey,
                  label: '最大并发任务数',
                  type: 'number',
                  min: 1,
                  max: 32,
                },
                {
                  key: 'taskTimeoutSec' as NumericParamKey,
                  label: '任务超时时间（秒）',
                  type: 'number',
                  min: 30,
                  max: 3600,
                },
                {
                  key: 'memoryMaxEntries' as NumericParamKey,
                  label: '记忆最大条目数',
                  type: 'number',
                  min: 100,
                  max: 100000,
                },
              ] as const
            ).map((field) => (
              <div key={field.key} style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                  }}
                >
                  {field.label}
                </label>
                <input
                  aria-label={field.label}
                  type="number"
                  value={systemParams[field.key]}
                  onChange={(e) =>
                    setSystemParams((prev) => ({
                      ...prev,
                      [field.key]: parseInt(e.target.value) || 0,
                    }))
                  }
                  min={field.min}
                  max={field.max}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                日志级别
              </label>
              <select
                aria-label="日志级别"
                value={systemParams.logLevel}
                onChange={(e) => setSystemParams((prev) => ({ ...prev, logLevel: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="debug">DEBUG - 调试</option>
                <option value="info">INFO - 信息</option>
                <option value="warn">WARN - 警告</option>
                <option value="error">ERROR - 错误</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  aria-label="启用双思考模式"
                  checked={systemParams.enableDualThinking}
                  onChange={(e) =>
                    setSystemParams((prev) => ({ ...prev, enableDualThinking: e.target.checked }))
                  }
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                />
                启用双思考模式（认知循环增强）
              </label>
            </div>

            <button
              aria-label="保存配置"
              onClick={handleSaveSystem}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 20px',
                borderRadius: '8px',
                background: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                fontFamily: 'inherit',
              }}
            >
              <Save size={14} /> 保存配置
            </button>
          </div>
        </motion.div>
      )}

      {/* ===== Env Vars Tab ===== */}
      {activeTab === 'env' && (
        <motion.div
          id="panel-env"
          role="tabpanel"
          aria-labelledby="tab-env"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              padding: '24px',
              maxWidth: '700px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginTop: 0,
                }}
              >
                {t('config.envVariables')}
              </h3>
              <button
                aria-label="新增环境变量"
                onClick={addEnvVar}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px dashed var(--border-color)',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: 'var(--primary-color)',
                  fontFamily: 'inherit',
                }}
              >
                <Plus size={13} /> 新增
              </button>
            </div>

            {envVars.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '30px',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                }}
              >
                暂无环境变量
              </div>
            ) : (
              envVars.map((ev, idx) => (
                <div
                  key={idx}
                  style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}
                >
                  <input
                    aria-label="环境变量 KEY"
                    placeholder="KEY"
                    value={ev.key}
                    onChange={(e) => updateEnvVar(idx, 'key', e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontFamily: 'inherit',
                      outline: 'none',
                    }}
                  />
                  <input
                    aria-label="环境变量 VALUE"
                    placeholder="VALUE"
                    value={ev.value}
                    onChange={(e) => updateEnvVar(idx, 'value', e.target.value)}
                    style={{
                      flex: 2,
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontFamily: 'inherit',
                      outline: 'none',
                    }}
                  />
                  <button
                    aria-label="删除环境变量"
                    onClick={() => removeEnvVar(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--error-color)',
                      padding: '4px',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
            <button
              aria-label="保存配置"
              onClick={handleSaveSystem}
              style={{
                marginTop: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 20px',
                borderRadius: '8px',
                background: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                fontFamily: 'inherit',
              }}
            >
              <Save size={14} /> 保存配置
            </button>
          </div>
        </motion.div>
      )}

      {/* Add Provider Modal */}
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
                backgroundColor: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)',
                zIndex: 100,
              }}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="添加 LLM 提供商"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '480px',
                maxWidth: '90vw',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                zIndex: 101,
                boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                padding: '24px',
              }}
            >
              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginTop: 0,
                  marginBottom: '20px',
                }}
              >
                添加 LLM 提供商
              </h3>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                  }}
                >
                  选择类型
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {(
                    Object.entries(PROVIDER_TEMPLATES) as [
                      string,
                      typeof PROVIDER_TEMPLATES.openai,
                    ][]
                  ).map(([k, t]) => (
                    <button
                      key={k}
                      aria-label={`选择 ${t.label}`}
                      onClick={() => {
                        setNewProviderType(k);
                        setNewBaseUrl(t.baseUrl);
                        setNewModel(t.models[0]);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${newProviderType === k ? 'var(--primary-color)' : 'var(--border-color)'}`,
                        background:
                          newProviderType === k ? 'var(--primary-light)' : 'var(--bg-primary)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color:
                          newProviderType === k ? 'var(--primary-color)' : 'var(--text-secondary)',
                        fontFamily: 'inherit',
                        transition: 'all 150ms ease',
                      }}
                    >
                      <span style={{ color: t.color }}>{t.icon}</span> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                  }}
                >
                  API Key *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    role="textbox"
                    aria-label="API Key"
                    type={showApiKey === 'new' ? 'text' : 'password'}
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    placeholder="sk-..."
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    aria-label="显示/隐藏 API Key"
                    aria-pressed={showApiKey === 'new'}
                    onClick={() => setShowApiKey(showApiKey === 'new' ? null : 'new')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      padding: '2px',
                    }}
                  >
                    {showApiKey === 'new' ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                  }}
                >
                  Base URL
                </label>
                <input
                  aria-label="Base URL"
                  value={newBaseUrl}
                  onChange={(e) => setNewBaseUrl(e.target.value)}
                  placeholder={
                    PROVIDER_TEMPLATES[newProviderType as keyof typeof PROVIDER_TEMPLATES]?.baseUrl
                  }
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                  }}
                >
                  默认模型
                </label>
                <select
                  aria-label="默认模型"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {PROVIDER_TEMPLATES[
                    newProviderType as keyof typeof PROVIDER_TEMPLATES
                  ]?.models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  aria-label="取消"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    fontFamily: 'inherit',
                  }}
                >
                  {t('toolManager.cancel')}
                </button>
                <button
                  aria-label="添加提供商"
                  onClick={handleAddProvider}
                  disabled={!newApiKey.trim() || saving}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: !newApiKey.trim() ? 'var(--bg-tertiary)' : 'var(--primary-color)',
                    color: !newApiKey.trim() ? 'var(--text-muted)' : 'white',
                    cursor: !newApiKey.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {saving ? <Loader2 size={14} className="spin" /> : <Plus size={14} />} 添加
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModelConfig;
