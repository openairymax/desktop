import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench, Search, Play, ChevronDown, ChevronUp, Code,
  Terminal, Brain, ListTodo, MessageSquare, HardDrive, Loader2
} from 'lucide-react';
import { listTools, callTool, type RuntimeMetrics, runtimeMetrics } from '../services/agentos-sdk';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  system: <Terminal className="w-4 h-4" />,
  agent: <Brain className="w-4 h-4" />,
  task: <ListTodo className="w-4 h-4" />,
  memory: <MessageSquare className="w-4 h-4" />,
  io: <HardDrive className="w-4 h-4" />,
};

const ToolManager: React.FC = () => {
  const { t } = useTranslation();
  const [tools, setTools] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [executingTool, setExecutingTool] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<Record<string, unknown> | null>(null);
  const [execArgs, setExecArgs] = useState('{}');
  const [execResult, setExecResult] = useState<Record<string, unknown> | null>(null);
  const [execHistory, setExecHistory] = useState<Array<{ name: string; result: Record<string, unknown>; timestamp: string }>>([]);
  const [metrics, setMetrics] = useState<RuntimeMetrics | null>(null);

  const loadTools = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listTools();
      setTools(data);
    } catch (e) {
      console.error('Failed to load tools:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMetrics = useCallback(async () => {
    try {
      const data = await runtimeMetrics();
      setMetrics(data);
    } catch (e) {
      console.error('Failed to load metrics:', e);
    }
  }, []);

  useEffect(() => {
    loadTools();
    loadMetrics();
  }, [loadTools, loadMetrics]);

  const handleExecute = async (toolName: string) => {
    setExecutingTool(toolName);
    setExecResult(null);
    try {
      JSON.parse(execArgs);
    } catch {
      setExecResult({ error: t('protocols.errors.invalidJson') });
      setExecutingTool(null);
      return;
    }
    try {
      const result = await callTool(toolName, execArgs);
      setExecResult(result);
      setExecHistory(prev => [{ name: toolName, result, timestamp: new Date().toISOString() }, ...prev].slice(0, 10));
    } catch (e) {
      setExecResult({ error: String(e) });
    } finally {
      setExecutingTool(null);
    }
  };

  const filteredTools = tools.filter((tool) => {
    const name = (tool.name as string)?.toLowerCase() || '';
    const desc = (tool.description as string)?.toLowerCase() || '';
    const cat = (tool.category as string) || '';
    const matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase()) || desc.includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || cat === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(tools.map(t => (t.category as string) || '').filter(Boolean))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Wrench className="w-8 h-8 text-amber-600" />
          {t('tools.title')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('tools.subtitle')}</p>
      </div>

      {metrics && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500">{t('cognitiveLoop.metrics.toolCallCount')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.toolCallCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500">{t('cognitiveLoop.metrics.successRate')}</p>
            <p className="text-2xl font-bold text-green-600">{metrics.successRate}%</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500">{t('cognitiveLoop.metrics.avgLatencyMs')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.avgLatencyMs}ms</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('tools.searchTools')}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat === 'all' ? t('tools.allCategories') : t(`tools.${cat}`)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">{t('common.loading')}</div>
      ) : filteredTools.length === 0 ? (
        <div className="text-center py-12">
          <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t('tools.noTools')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredTools.map((tool, index) => {
              const name = (tool.name as string) || '';
              const desc = (tool.description as string) || '';
              const cat = (tool.category as string) || '';
              const isSelected = selectedTool === tool;
              return (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    onClick={() => setSelectedTool(isSelected ? null : tool)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600">
                        {CATEGORY_ICONS[cat] || <Code className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{name}</p>
                        <p className="text-sm text-gray-500">{desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">{cat}</span>
                      {isSelected ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-gray-100 dark:border-gray-700"
                      >
                        <div className="p-4 space-y-4">
                          {(tool.schema as any) && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('tools.schema')}</p>
                              <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg overflow-x-auto">
                                {JSON.stringify(tool.schema as any, null, 2)}
                              </pre>
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('tools.execute')}</label>
                            <textarea
                              value={execArgs}
                              onChange={(e) => setExecArgs(e.target.value)}
                              placeholder={t('tools.argsPlaceholder')}
                              rows={3}
                              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                            />
                          </div>
                          <button
                            onClick={() => handleExecute(name)}
                            disabled={executingTool === name}
                            className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {executingTool === name ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                            {executingTool === name ? t('tools.executing') : t('tools.execute')}
                          </button>
                          {execResult && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('tools.result')}</p>
                              <pre className={`text-xs p-3 rounded-lg overflow-x-auto ${'error' in execResult ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'}`}>
                                {JSON.stringify(execResult, null, 2)}
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

      {execHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Code className="w-5 h-5 text-gray-500" />
            {t('tools.executionHistory')}
          </h3>
          <div className="space-y-2">
            {execHistory.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
                <span className="text-xs text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                  {t('tools.executionSuccess')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolManager;
