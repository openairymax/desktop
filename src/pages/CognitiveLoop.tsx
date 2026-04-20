import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Play, Sparkles, Eye, MessageSquare, ArrowRight, Loader2,
  Activity, Zap, CheckCircle, Clock
} from 'lucide-react';
import { runCognitiveLoop, runtimeMetrics, type CognitiveStep, type RuntimeMetrics } from '../services/agentos-sdk';

const PHASE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  perception: { icon: <Eye className="w-5 h-5" />, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  reasoning: { icon: <Brain className="w-5 h-5" />, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
  action: { icon: <Zap className="w-5 h-5" />, color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
  reflection: { icon: <CheckCircle className="w-5 h-5" />, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20' },
};

const CognitiveLoop: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [input, setInput] = useState('');
  const [steps, setSteps] = useState<CognitiveStep[]>([]);
  const [metrics, setMetrics] = useState<RuntimeMetrics | null>(null);
  const [running, setRunning] = useState(false);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  const handleStartLoop = useCallback(async () => {
    if (!input.trim()) return;
    setRunning(true);
    setSteps([]);
    setSelectedStep(null);
    try {
      const result = await runCognitiveLoop(input);
      setSteps(result);
    } catch (e) {
      console.error('Failed to run cognitive loop:', e);
    } finally {
      setRunning(false);
    }
  }, [input]);

  const loadMetrics = useCallback(async () => {
    try {
      const data = await runtimeMetrics();
      setMetrics(data);
    } catch (e) {
      console.error('Failed to load runtime metrics:', e);
    }
  }, []);

  React.useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString(i18n.language === 'zh' ? 'zh-CN' : 'en-US');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Brain className="w-8 h-8 text-purple-600" />
          {t('cognitiveLoop.title')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('cognitiveLoop.subtitle')}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('cognitiveLoop.inputPlaceholder')}
            rows={3}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
          <button
            onClick={handleStartLoop}
            disabled={running || !input.trim()}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {running ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            {running ? t('cognitiveLoop.running') : t('cognitiveLoop.startLoop')}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {steps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              {t('cognitiveLoop.steps')} ({steps.length})
            </h2>
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const config = PHASE_CONFIG[step.phase] || { icon: <Sparkles />, color: 'text-gray-600', bgColor: 'bg-gray-50' };
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.15 }}
                      className="relative flex gap-4"
                    >
                      <div className={`relative z-10 w-16 h-16 rounded-full ${config.bgColor} flex items-center justify-center ${config.color} flex-shrink-0 border-2 border-white dark:border-gray-800 shadow-sm`}>
                        {config.icon}
                      </div>
                      <div
                        className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                        onClick={() => setSelectedStep(selectedStep === index ? null : index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                              {t(`cognitiveLoop.phases.${step.phase}`)}
                            </span>
                            <span className="text-xs text-gray-400">{formatTime(step.timestamp)}</span>
                          </div>
                          <ArrowRight className={`w-4 h-4 text-gray-400 transition-transform ${selectedStep === index ? 'rotate-90' : ''}`} />
                        </div>
                        <p className="text-sm text-gray-900 dark:text-white mt-2 font-medium">{step.thought}</p>
                        <AnimatePresence>
                          {selectedStep === index && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-700 space-y-3">
                                {step.detail && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1">{t('cognitiveLoop.detail')}</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-2 rounded">{step.detail}</p>
                                  </div>
                                )}
                                {step.toolCall && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1">{t('cognitiveLoop.toolCall')}</p>
                                    <pre className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                                      {JSON.stringify(step.toolCall, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {metrics && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500" />
            {t('cognitiveLoop.metrics.title') || 'Runtime Metrics'}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{t('cognitiveLoop.metrics.cycleCount')}</span>
              </div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{metrics.cycleCount}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-sm">{t('cognitiveLoop.metrics.toolCallCount')}</span>
              </div>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{metrics.toolCallCount}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <Activity className="w-4 h-4" />
                <span className="text-sm">{t('cognitiveLoop.metrics.avgLatencyMs')}</span>
              </div>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{metrics.avgLatencyMs}ms</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">{t('cognitiveLoop.metrics.successRate')}</span>
              </div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{metrics.successRate}%</p>
            </div>
            <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-cyan-600 mb-1">
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm">{t('cognitiveLoop.metrics.totalTokensConsumed')}</span>
              </div>
              <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">{metrics.totalTokensConsumed.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {steps.length === 0 && !running && (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t('cognitiveLoop.noSteps')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('cognitiveLoop.noStepsHint')}</p>
        </div>
      )}
    </div>
  );
};

export default CognitiveLoop;
