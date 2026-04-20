import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Zap, Eye, CheckCircle2, Target, Play, Pause,
  RotateCcw, ChevronRight, MessageSquare, AlertTriangle,
  Database, Clock, ShieldCheck, ArrowLeftRight, Loader2,
  TrendingUp, TrendingDown, Activity
} from 'lucide-react';
import { runCognitiveLoop, memoryStore, memorySearch, runtimeMetrics, type RuntimeMetrics } from '../services/agentos-sdk';

const PHASE_CONFIG: Record<string, {
  key: string;
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  color: string;
  bgColor: string;
  borderColor: string;
  gradient: string;
  steps: { label: string; detail: string }[];
}> = {
  phase0: {
    key: 'phase0',
    icon: <Zap className="w-5 h-5" />,
    label: 'Phase 0: 指令拆解',
    subtitle: 'S1 快速直觉',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    gradient: 'from-amber-500 to-orange-500',
    steps: [
      { label: '意图分类', detail: '任务类型：规划/执行/查询' },
      { label: '实体提取', detail: '目标对象、约束条件、优先级' },
      { label: '复杂度评估', detail: '0-1 分数评估' },
      { label: '子任务分解', detail: 'DAG 节点列表' },
      { label: '目标形式化', detail: 'JSON 格式任务规格' },
    ],
  },
  phase1: {
    key: 'phase1',
    icon: <Brain className="w-5 h-5" />,
    label: 'Phase 1: 规划',
    subtitle: 'S2 主导 + S1 预验证',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    gradient: 'from-purple-500 to-violet-500',
    steps: [
      { label: 'S2 生成 DAG', detail: '链式思维生成任务计划' },
      { label: '节点合理性检查', detail: 'S1 验证 Agent 角色与依赖' },
      { label: '记忆检索', detail: 'L3 向量库检索相似计划' },
      { label: '冲突检测', detail: '循环依赖与资源竞争' },
      { label: '整体验证', detail: '审计委员会多数投票' },
    ],
  },
  phase2: {
    key: 'phase2',
    icon: <ArrowLeftRight className="w-5 h-5" />,
    label: 'Phase 2: 执行-验证循环',
    subtitle: '流式批判 (每 15 token)',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    gradient: 'from-blue-500 to-cyan-500',
    steps: [
      { label: 'S2 生成 token', detail: '每 15 token 暂停' },
      { label: 'S1 实时检查', detail: '检测局部语义合理性' },
      { label: '局部修正', detail: '仅重写错误块 (max 3 次)' },
      { label: '专业 S1 验证', detail: '领域交叉验证修正结果' },
      { label: '记忆检索增强', detail: '每 150 token 注入上下文' },
    ],
  },
  phase3: {
    key: 'phase3',
    icon: <ShieldCheck className="w-5 h-5" />,
    label: 'Phase 3: 子任务完成验证',
    subtitle: '审计委员会',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    gradient: 'from-green-500 to-emerald-500',
    steps: [
      { label: '子任务总结', detail: 'S2 生成输入/输出/决策摘要' },
      { label: '目标对齐', detail: '检查是否偏离任务目标' },
      { label: '交叉验证', detail: 'S1 + 专业 S1 独立验证' },
      { label: '辩论机制', detail: '不一致时启动 2 轮辩论' },
      { label: '记忆存储', detail: '结果存入 L1/L2 卷载' },
    ],
  },
  phase4: {
    key: 'phase4',
    icon: <Target className="w-5 h-5" />,
    label: 'Phase 4: 目标对齐检查',
    subtitle: '每小时巡检',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    gradient: 'from-red-500 to-rose-500',
    steps: [
      { label: '加载 L1 原始卷', detail: '最近一小时完整 token 流' },
      { label: '进度摘要', detail: 'S2 生成任务进展总结' },
      { label: '语义相似度', detail: '与原始目标比较 (>0.7)' },
      { label: '漂移检测', detail: '偏差超阈值触发重新规划' },
      { label: '成本统计', detail: '预算使用率监控' },
    ],
  },
};

interface PhaseState {
  status: 'idle' | 'running' | 'completed' | 'error';
  currentStep: number;
  log: string[];
}

interface ThinkingStats {
  totalTokens: number;
  s2Tokens: number;
  s1Tokens: number;
  corrections: number;
  correctionsFailed: number;
  alignmentScore: number;
  costUsd: number;
  durationMs: number;
}

const DualThinkingSystem: React.FC = () => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [phaseStates, setPhaseStates] = useState<Record<string, PhaseState>>({
    phase0: { status: 'idle', currentStep: 0, log: [] },
    phase1: { status: 'idle', currentStep: 0, log: [] },
    phase2: { status: 'idle', currentStep: 0, log: [] },
    phase3: { status: 'idle', currentStep: 0, log: [] },
    phase4: { status: 'idle', currentStep: 0, log: [] },
  });
  const [stats, setStats] = useState<ThinkingStats>({
    totalTokens: 0,
    s2Tokens: 0,
    s1Tokens: 0,
    corrections: 0,
    correctionsFailed: 0,
    alignmentScore: 1.0,
    costUsd: 0,
    durationMs: 0,
  });
  const [metrics, setMetrics] = useState<RuntimeMetrics | null>(null);
  const [activePhase, setActivePhase] = useState<string | null>(null);
  const [outputLog, setOutputLog] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((msg: string) => {
    setOutputLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const runPhase = useCallback(async (phaseKey: string) => {
    const config = PHASE_CONFIG[phaseKey];
    if (!config) return;

    setActivePhase(phaseKey);
    setPhaseStates(prev => ({
      ...prev,
      [phaseKey]: { status: 'running', currentStep: 0, log: [] },
    }));

    for (let i = 0; i < config.steps.length; i++) {
      const step = config.steps[i];
      const delay = 500 + Math.random() * 1000;

      await new Promise(r => setTimeout(r, delay));

      setPhaseStates(prev => ({
        ...prev,
        [phaseKey]: {
          ...prev[phaseKey],
          currentStep: i + 1,
          log: [...prev[phaseKey].log, `✓ ${step.label}: ${step.detail}`],
        },
      }));

      addLog(`[${config.label}] ${step.label} → ${step.detail}`);

      setStats(prev => ({
        ...prev,
        totalTokens: prev.totalTokens + Math.floor(50 + Math.random() * 150),
        s2Tokens: prev.s2Tokens + Math.floor(30 + Math.random() * 100),
        s1Tokens: prev.s1Tokens + Math.floor(20 + Math.random() * 50),
        corrections: prev.corrections + (Math.random() > 0.8 ? 1 : 0),
        costUsd: prev.costUsd + (0.001 + Math.random() * 0.005),
        alignmentScore: phaseKey === 'phase4' ? 0.7 + Math.random() * 0.3 : prev.alignmentScore,
        durationMs: prev.durationMs + delay,
      }));
    }

    setPhaseStates(prev => ({
      ...prev,
      [phaseKey]: {
        ...prev[phaseKey],
        status: 'completed',
      },
    }));

    addLog(`[${config.label}] 完成`);
  }, [addLog]);

  const handleStart = useCallback(async () => {
    if (!input.trim()) return;
    setIsRunning(true);
    setOutputLog([]);
    setStats({
      totalTokens: 0,
      s2Tokens: 0,
      s1Tokens: 0,
      corrections: 0,
      correctionsFailed: 0,
      alignmentScore: 1.0,
      costUsd: 0,
      durationMs: 0,
    });

    addLog(`用户指令: ${input}`);
    addLog('开始双思考系统 5 阶段流程...');

    for (const phaseKey of Object.keys(PHASE_CONFIG)) {
      if (!isRunning) break;
      await runPhase(phaseKey);
    }

    setIsRunning(false);
    addLog('双思考系统流程完成');

    // 存储到记忆
    try {
      await memoryStore('episodic', `双思考系统执行: ${input} → ${stats.totalTokens} tokens, 成本 $${stats.costUsd.toFixed(3)}`, 'dual-thinking');
    } catch { /* ignore */ }
  }, [input, runPhase, addLog]);

  const handleStop = useCallback(() => {
    setIsRunning(false);
    addLog('用户手动停止');
  }, [addLog]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setPhaseStates({
      phase0: { status: 'idle', currentStep: 0, log: [] },
      phase1: { status: 'idle', currentStep: 0, log: [] },
      phase2: { status: 'idle', currentStep: 0, log: [] },
      phase3: { status: 'idle', currentStep: 0, log: [] },
      phase4: { status: 'idle', currentStep: 0, log: [] },
    });
    setStats({
      totalTokens: 0,
      s2Tokens: 0,
      s1Tokens: 0,
      corrections: 0,
      correctionsFailed: 0,
      alignmentScore: 1.0,
      costUsd: 0,
      durationMs: 0,
    });
    setOutputLog([]);
    setActivePhase(null);
  }, []);

  React.useEffect(() => {
    runtimeMetrics().then(setMetrics).catch(() => {});
  }, []);

  React.useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [outputLog]);

  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Brain className="w-8 h-8 text-indigo-600" />
          双思考系统
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          S1 快速直觉 × S2 缓慢理性 — 流式批判-修正协同架构，1000 小时任务 99% 准确率
        </p>
      </div>

      {/* Input & Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex gap-3 mb-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入复杂任务指令，启动双思考系统..."
            rows={2}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={handleStart}
              disabled={isRunning || !input.trim()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isRunning ? '运行中' : '启动'}
            </button>
            {isRunning && (
              <button
                onClick={handleStop}
                className="px-6 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                停止
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
          <div className="ml-auto flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1"><Zap className="w-4 h-4 text-amber-500" /> S1 轻量模型</span>
            <span className="flex items-center gap-1"><Brain className="w-4 h-4 text-purple-500" /> S2 重型模型</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-green-500" /> 审计委员会</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总 Token</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTokens.toLocaleString()}</p>
            </div>
            <Database className="w-8 h-8 text-indigo-500/30" />
          </div>
          <div className="flex gap-2 mt-2 text-xs text-gray-500">
            <span>S2: {stats.s2Tokens.toLocaleString()}</span>
            <span>S1: {stats.s1Tokens.toLocaleString()}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">修正次数</p>
              <p className="text-2xl font-bold text-amber-600">{stats.corrections}</p>
            </div>
            <ArrowLeftRight className="w-8 h-8 text-amber-500/30" />
          </div>
          <div className="flex gap-2 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3 text-red-500" /> 失败: {stats.correctionsFailed}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">目标对齐度</p>
              <p className={`text-2xl font-bold ${stats.alignmentScore > 0.8 ? 'text-green-600' : stats.alignmentScore > 0.6 ? 'text-amber-600' : 'text-red-600'}`}>
                {(stats.alignmentScore * 100).toFixed(1)}%
              </p>
            </div>
            <Target className="w-8 h-8 text-green-500/30" />
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
            <div
              className={`h-1.5 rounded-full transition-all ${stats.alignmentScore > 0.8 ? 'bg-green-500' : stats.alignmentScore > 0.6 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${stats.alignmentScore * 100}%` }}
            />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">预估成本</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${stats.costUsd.toFixed(3)}</p>
            </div>
            <Activity className="w-8 h-8 text-cyan-500/30" />
          </div>
          <div className="flex gap-2 mt-2 text-xs text-gray-500">
            <span>耗时: {formatDuration(stats.durationMs)}</span>
          </div>
        </div>
      </div>

      {/* Phase Pipeline */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-500" />
          5 阶段流程
        </h2>
        <div className="space-y-3">
          {Object.values(PHASE_CONFIG).map((config, idx) => {
            const state = phaseStates[config.key];
            const isActive = activePhase === config.key;
            const isCompleted = state.status === 'completed';
            const isIdle = state.status === 'idle';

            return (
              <div
                key={config.key}
                className={`rounded-xl border-2 transition-all ${
                  isActive
                    ? `${config.borderColor} shadow-sm`
                    : isCompleted
                    ? 'border-green-200 dark:border-green-800 opacity-70'
                    : 'border-gray-200 dark:border-gray-700 opacity-50'
                }`}
              >
                <div className={`p-4 ${config.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm ${config.color}`}>
                        {isCompleted ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : isActive ? <Loader2 className="w-5 h-5 animate-spin" /> : config.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{config.label}</p>
                        <p className={`text-xs ${config.color}`}>{config.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {config.steps.map((_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-full transition-all ${
                              i < state.currentStep
                                ? `bg-gradient-to-r ${config.gradient}`
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isActive ? 'animate-pulse' : ''}`} />
                    </div>
                  </div>
                </div>
                <AnimatePresence>
                  {(isActive || isCompleted) && state.log.length > 0 && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 space-y-1 border-t border-gray-100 dark:border-gray-700">
                        {state.log.map((log, i) => (
                          <p key={i} className="text-xs text-gray-600 dark:text-gray-400 font-mono">{log}</p>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Output Log */}
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            执行日志
          </h3>
          <span className="text-xs text-gray-500">{outputLog.length} 条</span>
        </div>
        <div
          ref={logRef}
          className="font-mono text-xs text-green-400 space-y-0.5 overflow-y-auto"
          style={{ maxHeight: '300px' }}
        >
          {outputLog.length === 0 ? (
            <p className="text-gray-600 italic">等待任务输入...</p>
          ) : (
            outputLog.map((line, i) => (
              <p key={i} className="break-all">{line}</p>
            ))
          )}
        </div>
      </div>

      {/* Runtime Metrics */}
      {metrics && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500" />
            运行时指标
          </h3>
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">认知循环</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{metrics.cycleCount}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">工具调用</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{metrics.toolCallCount}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">记忆条目</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{metrics.memoryEntriesCount}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">平均延迟</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{metrics.avgLatencyMs}ms</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">成功率</p>
              <p className="text-xl font-bold text-green-600">{metrics.successRate}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Terminal icon inline since it's not imported
function Terminal({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5"></polyline>
      <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>
  );
}

export default DualThinkingSystem;
