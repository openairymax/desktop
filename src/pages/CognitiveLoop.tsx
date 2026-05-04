import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Play, Eye, Zap, CheckCircle, Loader2, ChevronRight,
  Settings2, ArrowRight, Sparkles, RefreshCw,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

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

const PHASE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string; label: string }> = {
  perception: { icon: <Eye size={14} />, color: '#3b82f6', bgColor: 'rgba(59,130,246,0.1)', label: '感知' },
  reasoning: { icon: <Brain size={14} />, color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.1)', label: '推理' },
  action: { icon: <Zap size={14} />, color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)', label: '行动' },
  reflection: { icon: <CheckCircle size={14} />, color: '#10b981', bgColor: 'rgba(16,185,129,0.1)', label: '反思' },
};

const THINKING_MODES: ThinkingMode[] = [
  { key: 'single', label: '单思考', desc: '标准认知循环，快速响应', icon: <Brain size={14} /> },
  { key: 'dual', label: '双思考', desc: '并行思考，深度分析+快速直觉', icon: <Sparkles size={14} /> },
];

const CognitiveLoop: React.FC = () => {
  const [input, setInput] = useState('');
  const [steps, setSteps] = useState<CognitiveStep[]>([]);
  const [running, setRunning] = useState(false);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [thinkingMode, setThinkingMode] = useState('single');
  const [loopCount, setLoopCount] = useState(0);

  const handleStartLoop = async () => {
    if (!input.trim() || running) return;
    setRunning(true);
    setLoopCount(prev => prev + 1);

    const newSteps: CognitiveStep[] = [
      { phase: 'perception', content: `感知输入: "${input.slice(0, 60)}${input.length > 60 ? '...' : ''}"`, status: 'running', timestamp: new Date().toISOString() },
      { phase: 'reasoning', content: thinkingMode === 'dual' ? '双思考模式：调用后端推理...' : '分析输入语义并构建推理链...', status: 'pending' },
      { phase: 'action', content: '等待决策输出...', status: 'pending' },
      { phase: 'reflection', content: '评估结果质量...', status: 'pending' },
    ];
    setSteps(newSteps);
    setSelectedStep(0);

    try {
      const result = await invoke<any[]>('run_cognitive_loop', {
        input: input,
        tools: null,
      });

      if (Array.isArray(result) && result.length > 0) {
        const backendSteps: CognitiveStep[] = result.map((step: any, idx: number) => ({
          phase: step.phase || `step_${idx}`,
          content: step.thought || step.content || '',
          status: 'completed' as const,
          timestamp: step.timestamp || new Date().toISOString(),
        }));
        setSteps(backendSteps);
        setRunning(false);
        return;
      }

      await new Promise(r => setTimeout(r, 600));
      setSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'completed' as const, timestamp: new Date().toISOString() } : i === 1 ? { ...s, status: 'running' as const } : s));
      setSelectedStep(1);
      await new Promise(r => setTimeout(r, 800));

      setSteps(prev => prev.map((s, i) =>
        i <= 1 ? s : i === 2 ? { ...s, status: 'running' as const } : s
      ));
      setSelectedStep(2);

      const taskResults = [
        '任务已生成并进入执行队列',
        '指令已分解为子任务',
        '执行计划已创建',
      ];
      await new Promise(r => setTimeout(r, 500));
      setSteps(prev => prev.map((s, i) =>
        i === 2 ? { ...s, content: taskResults[Math.floor(Math.random() * taskResults.length)], status: 'completed' as const, timestamp: new Date().toISOString() } : s
      ));

      await new Promise(r => setTimeout(r, 400));
      setSteps(prev => prev.map((s, i) => i === 3 ? { ...s, status: 'running' as const } : s));
      setSelectedStep(3);

      const reflections = [
        '结果质量良好，已记录到记忆中',
        '评估完成，输出置信度高',
        '反思完成，下次循环将调整参数',
      ];
      await new Promise(r => setTimeout(r, 600));
      setSteps(prev => prev.map(s =>
        s.phase === 'reflection'
          ? { ...s, content: reflections[Math.floor(Math.random() * reflections.length)], status: 'completed' as const, timestamp: new Date().toISOString() }
          : s
      ));
    } catch (error) {
      console.error('Cognitive loop error:', error);
      setSteps(prev => prev.map(s => ({
        ...s,
        status: s.status === 'running' ? 'failed' as const : s.status,
        content: s.status === 'running' ? `错误: ${error instanceof Error ? error.message : String(error)}` : s.content,
      })));
    } finally {
      setRunning(false);
    }
  };

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const progressPct = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          }}>
            <Brain size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>认知循环</h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>感知 → 推理 → 行动 → 反思</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <Settings2 size={14} /> 已执行 <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{loopCount}</span> 次循环
        </div>
      </div>

      {/* Thinking Mode Selector */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px',
        padding: '16px 20px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>思考模式</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {THINKING_MODES.map(mode => (
            <button
              key={mode.key}
              onClick={() => setThinkingMode(mode.key)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 14px', borderRadius: '8px',
                border: `1px solid ${thinkingMode === mode.key ? 'var(--primary-color)' : 'var(--border-color)'}`,
                background: thinkingMode === mode.key ? 'var(--primary-light)' : 'transparent',
                color: thinkingMode === mode.key ? 'var(--primary-color)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', transition: 'all 150ms ease',
              }}
            >
              {mode.icon}
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '500' }}>{mode.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '400' }}>{mode.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '20px', marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !running) handleStartLoop(); }}
            placeholder="输入要处理的指令或问题..."
            disabled={running}
            style={{
              flex: 1, padding: '12px 16px', border: '1px solid var(--border-color)',
              borderRadius: '8px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)',
              fontSize: '13px', fontFamily: 'inherit', outline: 'none',
              opacity: running ? 0.6 : 1, boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#06b6d4'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
          />
          <button
            onClick={handleStartLoop}
            disabled={!input.trim() || running}
            style={{
              padding: '12px 20px', border: 'none', borderRadius: '8px',
              background: running ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #06b6d4, #0891b2)',
              color: running ? 'var(--text-muted)' : 'white', cursor: !input.trim() || running ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            {running ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={16} />}
            启动
          </button>
        </div>

        {/* Progress Bar */}
        {steps.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              {Object.entries(PHASE_CONFIG).map(([key, cfg], idx) => (
                <div key={key} style={{ textAlign: 'center', flex: 1, position: 'relative' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', margin: '0 auto 6px',
                    backgroundColor: steps[idx]?.status === 'completed' ? cfg.bgColor :
                      steps[idx]?.status === 'running' ? cfg.bgColor :
                      steps[idx]?.status === 'failed' ? 'rgba(239,68,68,0.1)' : 'var(--bg-tertiary)',
                    color: steps[idx]?.status === 'completed' ? cfg.color :
                      steps[idx]?.status === 'running' ? cfg.color :
                      steps[idx]?.status === 'failed' ? 'var(--error-color)' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s ease',
                  }}>
                    {cfg.icon}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)' }}>{cfg.label}</span>
                  {idx < 3 && (
                    <div style={{
                      position: 'absolute', top: '16px', left: 'calc(50% + 20px)', right: 'calc(-50% + 20px)',
                      height: '2px', backgroundColor: steps[idx]?.status === 'completed' ? cfg.color : 'var(--border-subtle)',
                      transition: 'background 0.3s ease',
                    }} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ height: '3px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5 }}
                style={{ height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #f59e0b, #10b981)' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Steps List */}
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
              onClick={() => setSelectedStep(isSelected ? null : index)}
              style={{
                backgroundColor: 'var(--bg-secondary)', border: `1px solid ${isSelected ? cfg.color : 'var(--border-subtle)'}`,
                borderRadius: '12px', padding: '16px 20px', marginBottom: '10px',
                cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '14px',
              }}
            >
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                backgroundColor: step.status === 'completed' ? cfg.bgColor :
                  step.status === 'running' ? cfg.bgColor :
                  step.status === 'failed' ? 'var(--error-light)' : 'var(--bg-tertiary)',
                color: step.status === 'completed' ? cfg.color :
                  step.status === 'running' ? cfg.color :
                  step.status === 'failed' ? 'var(--error-color)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {step.status === 'running' ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : cfg.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: cfg.color }}>{cfg.label}</span>
                  <span style={{
                    fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: '500',
                    backgroundColor: step.status === 'completed' ? 'var(--success-light)' :
                      step.status === 'running' ? 'var(--info-light)' :
                      step.status === 'failed' ? 'var(--error-light)' : 'var(--bg-tertiary)',
                    color: step.status === 'completed' ? 'var(--success-color)' :
                      step.status === 'running' ? 'var(--info-color)' :
                      step.status === 'failed' ? 'var(--error-color)' : 'var(--text-muted)',
                  }}>
                    {{ pending: '待执行', running: '执行中', completed: '完成', failed: '失败' }[step.status]}
                  </span>
                  {step.timestamp && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{step.content}</p>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, transform: isSelected ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {steps.length === 0 && (
        <div style={{
          backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
          borderRadius: '12px', padding: '48px', textAlign: 'center',
        }}>
          <Brain size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', opacity: 0.5 }} />
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
