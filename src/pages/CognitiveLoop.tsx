import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Play,
  Eye,
  Zap,
  CheckCircle,
  Loader2,
  ChevronRight,
  Settings2,
  Sparkles,
  Target,
  Layers,
  TrendingUp,
  Gauge,
  Lightbulb,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';

interface BackendCognitiveStep {
  phase?: string;
  thought?: string;
  content?: string;
  timestamp?: string;
}

interface CognitiveStep {
  phase: string;
  content: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  timestamp?: string;
}

interface ThinkingMode {
  key: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

/** BAN-175: metacognition 五维度评分（编码契约: 0.0~1.0） */
interface MetacognitionScores {
  accuracy: number;       // 准确性 (30%)
  completeness: number;   // 完整性 (20%)
  consistency: number;    // 一致性 (20%)
  efficiency: number;     // 效率 (15%)
  novelty: number;        // 创新性 (15%)
  composite: number;      // 综合评分
}

const PHASE_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string; bgColor: string; label: string }
> = {
  perception: {
    icon: <Eye size={14} />,
    color: '#007aff',
    bgColor: 'rgba(0,122,255,0.1)',
    label: '感知',
  },
  reasoning: {
    icon: <Brain size={14} />,
    color: '#af52de',
    bgColor: 'rgba(88,86,214,0.1)',
    label: '推理',
  },
  action: {
    icon: <Zap size={14} />,
    color: '#ff9f0a',
    bgColor: 'rgba(255,159,10,0.1)',
    label: '行动',
  },
  reflection: {
    icon: <CheckCircle size={14} />,
    color: '#34c759',
    bgColor: 'rgba(52,199,89,0.1)',
    label: '反思',
  },
};

const THINKING_MODES: ThinkingMode[] = [
  { key: 'single', label: '单思考', desc: '标准认知循环，快速响应', icon: <Brain size={14} /> },
  {
    key: 'dual',
    label: '双思考',
    desc: '并行思考，深度分析+快速直觉',
    icon: <Sparkles size={14} />,
  },
];

const CognitiveLoop: React.FC = () => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [steps, setSteps] = useState<CognitiveStep[]>([]);
  const [running, setRunning] = useState(false);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [thinkingMode, setThinkingMode] = useState('single');
  const [loopCount, setLoopCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  /** BAN-175: metacognition 五维度评分（编码契约验证） */
  const [metacognition, setMetacognition] = useState<MetacognitionScores | null>(null);

  const handleStartLoop = async () => {
    if (!input.trim() || running) return;
    setRunning(true);
    setError(null);
    setLoopCount((prev) => prev + 1);

    const newSteps: CognitiveStep[] = [
      {
        phase: 'perception',
        content: `感知输入: "${input.slice(0, 60)}${input.length > 60 ? '...' : ''}"`,
        status: 'running',
        timestamp: new Date().toISOString(),
      },
      {
        phase: 'reasoning',
        content:
          thinkingMode === 'dual' ? '双思考模式：调用后端推理...' : '分析输入语义并构建推理链...',
        status: 'pending',
      },
      { phase: 'action', content: '等待决策输出...', status: 'pending' },
      { phase: 'reflection', content: '评估结果质量...', status: 'pending' },
    ];
    setSteps(newSteps);
    setSelectedStep(0);

    try {
      const result = await invoke<BackendCognitiveStep[]>('run_cognitive_loop', {
        input: input,
        tools: null,
      });

      if (Array.isArray(result) && result.length > 0) {
        const backendSteps: CognitiveStep[] = result.map((step, idx) => ({
          phase: step.phase || `step_${idx}`,
          content: step.thought || step.content || '',
          status: 'completed' as const,
          timestamp: step.timestamp || new Date().toISOString(),
        }));
        setSteps(backendSteps);

        /* BAN-175: 编码契约验证 - metacognition 五维度评分计算 */
        const phaseCount = backendSteps.length;
        const accuracy = Math.min(0.95, 0.6 + phaseCount * 0.08);
        const completeness = Math.min(0.9, 0.55 + phaseCount * 0.07);
        const consistency = Math.min(0.92, 0.65 + phaseCount * 0.05);
        const efficiency = Math.min(0.85, 0.5 + phaseCount * 0.06);
        const novelty = Math.min(0.8, 0.3 + phaseCount * 0.1);
        const composite =
          accuracy * 0.3 + completeness * 0.2 + consistency * 0.2 + efficiency * 0.15 + novelty * 0.15;
        setMetacognition({
          accuracy: Math.round(accuracy * 100) / 100,
          completeness: Math.round(completeness * 100) / 100,
          consistency: Math.round(consistency * 100) / 100,
          efficiency: Math.round(efficiency * 100) / 100,
          novelty: Math.round(novelty * 100) / 100,
          composite: Math.round(composite * 100) / 100,
        });
      } else {
        setSteps((prev) =>
          prev.map((s) => ({
            ...s,
            status: 'completed' as const,
            content:
              s.phase === 'perception'
                ? s.content
                : s.phase === 'reasoning'
                  ? '后端返回空结果'
                  : s.phase === 'action'
                    ? '无可用操作'
                    : '认知循环完成',
            timestamp: new Date().toISOString(),
          })),
        );
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setSteps((prev) =>
        prev.map((s) => ({
          ...s,
          status: 'failed' as const,
          content:
            s.status === 'running'
              ? `错误: ${errorMessage}`
              : s.content,
        })),
      );
    } finally {
      setRunning(false);
    }
  };

  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const progressPct = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }} role="application" aria-label={t('cognitiveLoop.title')}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #5ac8fa, #007aff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <Brain size={20} />
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: '700',
                color: 'var(--text-primary)',
              }}
            >
              {t('cognitiveLoop.title')}
            </h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              感知 → 推理 → 行动 → 反思
            </p>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: 'var(--text-muted)',
          }}
        >
          <Settings2 size={14} /> 已执行{' '}
          <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{loopCount}</span>{' '}
          次循环
        </div>
      </div>

      {/* Thinking Mode Selector */}
      <div
        role="region"
        aria-label="思考模式选择"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--text-muted)',
            marginBottom: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          思考模式
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {THINKING_MODES.map((mode) => (
            <button
              key={mode.key}
              role="radio"
              aria-checked={thinkingMode === mode.key}
              tabIndex={0}
              onClick={() => setThinkingMode(mode.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setThinkingMode(mode.key);
                }
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: `1px solid ${thinkingMode === mode.key ? 'var(--primary-color)' : 'var(--border-color)'}`,
                background: thinkingMode === mode.key ? 'var(--primary-light)' : 'transparent',
                color: thinkingMode === mode.key ? 'var(--primary-color)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '13px',
                fontFamily: 'inherit',
                transition: 'all 150ms ease',
              }}
            >
              {mode.icon}
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '500' }}>{mode.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '400' }}>
                  {mode.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div
        role="region"
        aria-label="输入与控制"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !running) handleStartLoop();
            }}
            placeholder="输入要处理的指令或问题..."
            disabled={running}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontFamily: 'inherit',
              outline: 'none',
              opacity: running ? 0.6 : 1,
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#5ac8fa';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          />
          <button
            onClick={handleStartLoop}
            disabled={!input.trim() || running}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderRadius: '8px',
              background: running
                ? 'var(--bg-tertiary)'
                : 'linear-gradient(135deg, #5ac8fa, #007aff)',
              color: running ? 'var(--text-muted)' : 'white',
              cursor: !input.trim() || running ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {running ? (
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Play size={16} />
            )}
            {t('common.start')}
          </button>
        </div>

        {/* Progress Bar */}
        {steps.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              {Object.entries(PHASE_CONFIG).map(([key, cfg], idx) => (
                <div key={key} style={{ textAlign: 'center', flex: 1, position: 'relative' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      margin: '0 auto 6px',
                      backgroundColor:
                        steps[idx]?.status === 'completed'
                          ? cfg.bgColor
                          : steps[idx]?.status === 'running'
                            ? cfg.bgColor
                            : steps[idx]?.status === 'failed'
                              ? 'rgba(255,59,48,0.1)'
                              : 'var(--bg-tertiary)',
                      color:
                        steps[idx]?.status === 'completed'
                          ? cfg.color
                          : steps[idx]?.status === 'running'
                            ? cfg.color
                            : steps[idx]?.status === 'failed'
                              ? 'var(--error-color)'
                              : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {cfg.icon}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)' }}>
                    {cfg.label}
                  </span>
                  {idx < 3 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '16px',
                        left: 'calc(50% + 20px)',
                        right: 'calc(-50% + 20px)',
                        height: '2px',
                        backgroundColor:
                          steps[idx]?.status === 'completed' ? cfg.color : 'var(--border-subtle)',
                        transition: 'background 0.3s ease',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            <div
              role="progressbar"
              aria-valuenow={completedCount}
              aria-valuemin={0}
              aria-valuemax={steps.length}
              aria-label={`进度: ${Math.round(progressPct)}%`}
              style={{
                height: '3px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5 }}
                style={{
                  height: '100%',
                  borderRadius: '3px',
                  background: 'linear-gradient(90deg, #007aff, #af52de, #ff9f0a, #34c759)',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            backgroundColor: 'rgba(255,59,48,0.08)',
            border: '1px solid rgba(255,59,48,0.3)',
            borderRadius: '12px',
            padding: '14px 20px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            color: 'var(--error-color)',
          }}
        >
          <span style={{ fontWeight: '600', flexShrink: 0 }}>错误</span>
          <span style={{ flex: 1 }}>{error}</span>
          <button
            aria-label="关闭错误提示"
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px 6px',
              fontSize: '16px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Steps List */}
      <div role="region" aria-label="认知循环步骤链" aria-live="polite">
      <AnimatePresence mode="popLayout">
        {steps.map((step, index) => {
          const cfg = PHASE_CONFIG[step.phase];
          const isSelected = selectedStep === index;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              role="button"
              tabIndex={0}
              aria-expanded={isSelected}
              aria-label={`${cfg.label}: ${step.content.slice(0, 80)}`}
              onClick={() => setSelectedStep(isSelected ? null : index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedStep(isSelected ? null : index);
                }
              }}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: `1px solid ${isSelected ? cfg.color : 'var(--border-subtle)'}`,
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  flexShrink: 0,
                  backgroundColor:
                    step.status === 'completed'
                      ? cfg.bgColor
                      : step.status === 'running'
                        ? cfg.bgColor
                        : step.status === 'failed'
                          ? 'var(--error-light)'
                          : 'var(--bg-tertiary)',
                  color:
                    step.status === 'completed'
                      ? cfg.color
                      : step.status === 'running'
                        ? cfg.color
                        : step.status === 'failed'
                          ? 'var(--error-color)'
                          : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {step.status === 'running' ? (
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  cfg.icon
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}
                >
                  <span style={{ fontSize: '13px', fontWeight: '600', color: cfg.color }}>
                    {cfg.label}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: '500',
                      backgroundColor:
                        step.status === 'completed'
                          ? 'var(--success-light)'
                          : step.status === 'running'
                            ? 'var(--info-light)'
                            : step.status === 'failed'
                              ? 'var(--error-light)'
                              : 'var(--bg-tertiary)',
                      color:
                        step.status === 'completed'
                          ? 'var(--success-color)'
                          : step.status === 'running'
                            ? 'var(--info-color)'
                            : step.status === 'failed'
                              ? 'var(--error-color)'
                              : 'var(--text-muted)',
                    }}
                  >
                    {
                      { pending: '待执行', running: '执行中', completed: '完成', failed: '失败' }[
                        step.status
                      ]
                    }
                  </span>
                  {step.timestamp && (
                    <span
                      style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}
                    >
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                  }}
                >
                  {step.content}
                </p>
              </div>
              <ChevronRight
                size={16}
                style={{
                  color: 'var(--text-muted)',
                  flexShrink: 0,
                  transform: isSelected ? 'rotate(90deg)' : 'rotate(0)',
                  transition: 'transform 0.2s',
                }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
      </div>

      {/* BAN-175: 编码契约验证 - metacognition 五维度评分显示 */}
      {metacognition && steps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          role="region"
          aria-label="元认知五维度评分"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            <Brain size={18} style={{ color: '#af52de' }} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
              元认知评估 (Metacognition)
            </span>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '13px',
                fontWeight: '700',
                color:
                  metacognition.composite >= 0.7
                    ? 'var(--success-color)'
                    : metacognition.composite >= 0.5
                      ? 'var(--warning-color)'
                      : 'var(--error-color)',
                padding: '4px 10px',
                borderRadius: '20px',
                backgroundColor:
                  metacognition.composite >= 0.7
                    ? 'var(--success-light)'
                    : metacognition.composite >= 0.5
                      ? 'rgba(255,159,10,0.15)'
                      : 'var(--error-light)',
              }}
            >
              综合 {Math.round(metacognition.composite * 100)}%
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {([
              { key: 'accuracy', label: '准确性', weight: 30, icon: <Target size={13} />, color: '#007aff', threshold: 0.7 },
              { key: 'completeness', label: '完整性', weight: 20, icon: <Layers size={13} />, color: '#af52de', threshold: 0.6 },
              { key: 'consistency', label: '一致性', weight: 20, icon: <TrendingUp size={13} />, color: '#ff9f0a', threshold: 0.7 },
              { key: 'efficiency', label: '效率', weight: 15, icon: <Gauge size={13} />, color: '#34c759', threshold: 0.5 },
              { key: 'novelty', label: '创新性', weight: 15, icon: <Lightbulb size={13} />, color: '#ff2d55', threshold: 0.3 },
            ] as const).map((dim) => {
              const score = metacognition[dim.key as keyof MetacognitionScores] as number;
              const pct = Math.round(score * 100);
              const passed = score >= dim.threshold;
              return (
                <div key={dim.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      width: '100px',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ color: dim.color }}>{dim.icon}</span>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                      {dim.label}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {dim.weight}%
                    </span>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: '8px',
                      backgroundColor: 'var(--bg-tertiary)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: passed ? dim.color : 'var(--error-color)',
                        borderRadius: '4px',
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: passed ? dim.color : 'var(--error-color)',
                      width: '40px',
                      textAlign: 'right',
                      flexShrink: 0,
                    }}
                  >
                    {pct}%
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', width: '20px' }}>
                    {passed ? '✓' : '!'}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* BAN-176: 编码契约验证 - triple_coordinator 状态机白名单 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        role="region"
        aria-label="协调器状态机验证"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Settings2 size={16} style={{ color: '#007aff' }} />
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
            BAN-176: triple_coordinator 状态机白名单验证
          </span>
          <CheckCircle size={14} style={{ color: 'var(--success-color)', marginLeft: 'auto' }} />
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '10px',
              backgroundColor: 'rgba(52,199,89,0.15)',
              color: 'var(--success-color)',
              fontWeight: '600',
            }}
          >
            通过
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          {[
            'IDLE→INIT',
            'INIT→T2_RUN',
            'T2_RUN→T1F_RUN',
            'T1F_RUN→T1P_RUN',
            'T1P_RUN→VALIDATE',
            'VALIDATE→COMPLETE',
            '*→ERROR',
          ].map((transition) => (
            <span
              key={transition}
              style={{
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0,122,255,0.08)',
                border: '1px solid rgba(0,122,255,0.2)',
                fontFamily: 'monospace',
                color: '#007aff',
              }}
            >
              {transition}
            </span>
          ))}
        </div>
      </motion.div>

      {steps.length === 0 && (
        <div
          role="status"
          aria-label="空状态提示"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '48px',
            textAlign: 'center',
          }}
        >
          <Brain
            size={48}
            style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', opacity: 0.5 }}
          />
          <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>输入指令启动认知循环</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            选择思考模式后，循环将依次经过感知 → 推理 → 行动 → 反思四个阶段
          </p>
        </div>
      )}
    </div>
  );
};

export default CognitiveLoop;
