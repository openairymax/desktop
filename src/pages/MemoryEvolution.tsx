import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Database, Search, Plus, Trash2, X, Clock,
  MessageSquare, FileText, Settings, AlertCircle, Eye, BarChart3
} from 'lucide-react';
import { memoryList, memoryStore, memorySearch, memoryDelete, memoryClear, contextWindowStats, type MemoryEntry, type ContextWindowStats } from '../services/agentos-sdk';

const MEMORY_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  episodic: { icon: <Clock className="w-4 h-4" />, color: 'text-blue-500 bg-blue-50', label: 'episodic' },
  semantic: { icon: <Database className="w-4 h-4" />, color: 'text-purple-500 bg-purple-50', label: 'semantic' },
  procedural: { icon: <Settings className="w-4 h-4" />, color: 'text-green-500 bg-green-50', label: 'procedural' },
  preference: { icon: <FileText className="w-4 h-4" />, color: 'text-amber-500 bg-amber-50', label: 'preference' },
  error: { icon: <AlertCircle className="w-4 h-4" />, color: 'text-red-500 bg-red-50', label: 'error' },
  observation: { icon: <Eye className="w-4 h-4" />, color: 'text-cyan-500 bg-cyan-50', label: 'observation' },
};

const MemoryEvolution: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [stats, setStats] = useState<ContextWindowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [newMemory, setNewMemory] = useState({ type: 'episodic', content: '', source: '' });
  const [activeTab, setActiveTab] = useState<'list' | 'store' | 'stats'>('list');

  const loadMemories = useCallback(async () => {
    try {
      setLoading(true);
      const filter = typeFilter === 'all' ? undefined : typeFilter;
      let data: MemoryEntry[];
      if (searchQuery.trim()) {
        data = await memorySearch(searchQuery, 50, filter);
      } else {
        data = await memoryList(filter, 50);
      }
      setMemories(data);
    } catch (e) {
      console.error('Failed to load memories:', e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, typeFilter]);

  const loadStats = useCallback(async () => {
    try {
      const data = await contextWindowStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load context window stats:', e);
    }
  }, []);

  useEffect(() => {
    loadMemories();
    loadStats();
  }, [loadMemories, loadStats]);

  const handleStoreMemory = async () => {
    if (!newMemory.content.trim()) return;
    try {
      await memoryStore(newMemory.type, newMemory.content, newMemory.source || undefined);
      setNewMemory({ type: 'episodic', content: '', source: '' });
      setShowStoreModal(false);
      loadMemories();
      loadStats();
    } catch (e) {
      console.error('Failed to store memory:', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('memoryEvolution.deleteConfirm'))) return;
    try {
      await memoryDelete(id);
      loadMemories();
      loadStats();
    } catch (e) {
      console.error('Failed to delete memory:', e);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm(t('memoryEvolution.clearConfirm'))) return;
    try {
      await memoryClear();
      setMemories([]);
      loadStats();
    } catch (e) {
      console.error('Failed to clear memories:', e);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString(i18n.language === 'zh' ? 'zh-CN' : 'en-US');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="w-8 h-8 text-purple-600" />
            {t('memoryEvolution.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('memoryEvolution.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowStoreModal(true)}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('memoryEvolution.storeMemory')}
          </button>
          <button
            onClick={handleClearAll}
            className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t('memoryEvolution.clearAll')}
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        {(['list', 'store', 'stats'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab === 'list' && <Search className="w-4 h-4 inline mr-2" />}
            {tab === 'store' && <Plus className="w-4 h-4 inline mr-2" />}
            {tab === 'stats' && <BarChart3 className="w-4 h-4 inline mr-2" />}
            {tab === 'list' ? t('memoryEvolution.memoryList') : tab === 'store' ? t('memoryEvolution.storeMemory') : t('memoryEvolution.contextWindow.title')}
          </button>
        ))}
      </div>

      {activeTab === 'list' && (
        <>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('memoryEvolution.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">{t('memoryEvolution.memoryTypes.all')}</option>
              {Object.entries(MEMORY_TYPE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{t(`memoryEvolution.memoryTypes.${config.label}`)}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">{t('common.loading')}</div>
          ) : memories.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t('memoryEvolution.noMemories') || 'No memories stored yet'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {memories.map((memory) => (
                  <motion.div
                    key={memory.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${MEMORY_TYPE_CONFIG[memory.type]?.color || 'text-gray-500 bg-gray-50'}`}>
                          {MEMORY_TYPE_CONFIG[memory.type]?.icon || <Database className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {t(`memoryEvolution.memoryTypes.${MEMORY_TYPE_CONFIG[memory.type]?.label || 'all'}`)}
                            </span>
                            <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                              {memory.tokens} tokens
                            </span>
                            {memory.source && (
                              <span className="text-xs text-gray-500 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                                {memory.source}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{memory.content}</p>
                          <p className="text-xs text-gray-400 mt-2">{formatTime(memory.createdAt)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(memory.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {activeTab === 'store' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('memoryEvolution.storeMemory')}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('memoryEvolution.type')}
              </label>
              <select
                value={newMemory.type}
                onChange={(e) => setNewMemory({ ...newMemory, type: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {Object.entries(MEMORY_TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{t(`memoryEvolution.memoryTypes.${config.label}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('memoryEvolution.content')}
              </label>
              <textarea
                value={newMemory.content}
                onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                rows={4}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter memory content..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('memoryEvolution.source')} ({t('common.optional') || 'Optional'})
              </label>
              <input
                type="text"
                value={newMemory.source}
                onChange={(e) => setNewMemory({ ...newMemory, source: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="e.g., user_input, system_event, agent_output"
              />
            </div>
            <button
              onClick={handleStoreMemory}
              disabled={!newMemory.content.trim()}
              className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              {t('memoryEvolution.storeMemory')}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500">{t('memoryEvolution.contextWindow.totalTokens')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTokens.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500">{t('memoryEvolution.contextWindow.maxTokens')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.maxTokens.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500">{t('memoryEvolution.contextWindow.usedPercent')}</p>
              <p className="text-2xl font-bold text-green-600">{stats.usedPercent}%</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500">{t('memoryEvolution.stats.totalEntries')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{memories.length}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('memoryEvolution.contextWindow.title')}
            </h3>
            <div className="space-y-4">
              {Object.entries(stats.breakdown).map(([key, value]) => {
                const percent = ((value / stats.maxTokens) * 100).toFixed(2);
                const colors: Record<string, string> = {
                  system: 'bg-blue-500',
                  history: 'bg-purple-500',
                  tools: 'bg-amber-500',
                  output: 'bg-green-500',
                };
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300">{t(`memoryEvolution.contextWindow.${key}`)}</span>
                      <span className="text-gray-500">{value.toLocaleString()} tokens ({percent}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className={`${colors[key] || 'bg-gray-500'} h-2.5 rounded-full transition-all`}
                        style={{ width: `${Math.min(parseFloat(percent) * 10, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showStoreModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowStoreModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('memoryEvolution.storeMemory')}</h3>
                <button onClick={() => setShowStoreModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('memoryEvolution.type')}</label>
                  <select
                    value={newMemory.type}
                    onChange={(e) => setNewMemory({ ...newMemory, type: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {Object.entries(MEMORY_TYPE_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{t(`memoryEvolution.memoryTypes.${config.label}`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('memoryEvolution.content')}</label>
                  <textarea
                    value={newMemory.content}
                    onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Enter memory content..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('memoryEvolution.source')} ({t('common.optional') || 'Optional'})</label>
                  <input
                    type="text"
                    value={newMemory.source}
                    onChange={(e) => setNewMemory({ ...newMemory, source: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowStoreModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleStoreMemory}
                    disabled={!newMemory.content.trim()}
                    className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('memoryEvolution.storeMemory')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MemoryEvolution;
