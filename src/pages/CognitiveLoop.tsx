import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Play, Sparkles, Eye, MessageSquare, ArrowRight, Loader2,
  Activity, Zap, CheckCircle, Clock, Send, ChevronRight
} from 'lucide-react';
import { useTasks } from '../hooks/useAgentOS';

interface CognitiveStep {
  phase: string;
  content: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  timestamp?: string;
}

const PHASE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string; label: string }> = {
  perception: { icon: <Eye size={14} />, color: '#3b82f6', bgColor: 'rgba(59,130,246,0.1)', label: '感知' },
  reasoning: { icon: <Brain size={14} />, color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.1)', label: '推理' },
  action: { icon: <Zap size={14} />, color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)', label: '行动' },
  reflection: { icon: <CheckCircle size={14} />, color: '#10b981', bgColor: 'rgba(16,185,129,0.1)', label: '反思' },
};

const CognitiveLoop: React.FC = () => {
  const { submitTask, waitForTask } = useTasks();
  const [input, setInput] = useState('');
  const [steps, setSteps] = useState<CognitiveStep[]>([]);
  const [running, setRunning] = useState(false);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  const handleStartLoop = useCallback(async () => {
    if (!input.trim()) return;
    setRunning(true);
    setSteps([
      { phase: 'perception', content: `感知输入: "${input.slice(0, 60)}${input.length > 60 ? '...' : ''}"`, status: 'running', timestamp: new Date().toISOString() },
      { phase: 'reasoning', content: '分析输入语义并构建推理链...', status: 'pending' },
      { phase: 'action', content: '等待决策输出...', status: 'pending' },
      { phase: 'reflection', content: '评估结果质量...', status: 'pending' },
    ]);
    setSelectedStep(0);

    await new Promise(r => setTimeout(r, 600));

    setSteps(prev => prev.map((s, i) =>
      i === 0 ? { ...s, status: 'completed' as const } :
      i === 1 ? { ...s, status: 'running' as const } : s
    ));
    setSelectedStep(1);
    await new Promise(r => setTimeout(r, 800));

    setSteps(prev => prev.map((s, i) =>
      i <= 1 ? s :
      i === 2 ? { ...s, status: 'running' as const } : s
    ));
    setSelectedStep(2);

    try {
      const task = await submitTask(`[认知循环] ${input}`, { priority: 75 });
      setSteps(prev => prev.map((s, i) =>
        i === 2 ? { ...s, content: task ? `任务已提交: ${task.id.slice(0, 8)}` : '任务提交中...', status: 'completed' as const } : s
      ));

      await new Promise(r => setTimeout(r, 400));

      setSteps(prev => prev.map((s, i) =>
        i === 3 ? { ...s, status: 'running' as const } : s
      ));
      setSelectedStep(3);

      if (task) {
        const result = await waitForTask(task.id, 15000).catch(() => null);
        setSteps(prev => prev.map(s =>
          s.phase === 'reflection'
            ? { ...s, content: result?.output ? `结果: ${result.output.slice(0, 200)}` : result?.error ? `错误: ${result.error}` : '等待超时', status: 'completed' as const }
            : s
        ));
      } else {
        setSteps(prev => prev.map(s =>
          s.phase === 'reflection' ? { ...s, status: 'completed' as const } : s
        ));
      }
    } catch (e) {
      setSteps(prev => prev.map(s =>
        s.phase === 'action' ? { ...s, content: `失败: ${e instanceof Error ? e.message : String(e)}`, status: 'failed' as const } : s.status === 'pending' ? { ...s, status: 'failed' as const } : s
      ));
    } finally {
      setRunning(false);
    }
  }, [input, submitTask, waitForTask]);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          }}>
            <Brain size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              认知循环
            </h1>
            <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)' }}>AgentOS 四阶段认知处理流程</p>
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !running) handleStartLoop(); }}
            placeholder="输入要处理的指令或问题..."
            disabled={running}
            style={{
              flex: 1, padding: '12px 16px', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)',
              fontSize: 'var(--font-size-md)', fontFamily: 'inherit', outline: 'none',
              transition: 'all var(--transition-fast)', opacity: running ? 0.6 : 1,
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#06b6d4'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(6,182,212,0.2)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
          <button
            onClick={handleStartLoop}
            disabled={!input.trim() || running}
            style={{
              padding: '12px 20px', border: 'none', borderRadius: 'var(--radius-md)',
              background: running ? 'linear-gradient(135deg, #64748b, #94a3b8)' : 'linear-gradient(135deg, #06b6d4, #0891b2)',
              color: 'white', cursor: !input.trim() || running ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', fontSize: 'var(--font-size-md)', display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all var(--transition-fast)',
            }}
          >
            {running ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={16} />}
            启动循环
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', position: 'relative',
            zIndex: 1, paddingTop: '8px',
          }}>
            {Object.entries(PHASE_CONFIG).map(([key, cfg], idx) => (
              <div key={key} style={{
                textAlign: 'center', flex: 1,
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', margin: '0 auto 6px',
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
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-muted)' }}>
                  {cfg.label}
                </span>
              </div>
            ))}
          </div>

          <div style={{
            position: 'absolute', top: '24px', left: '8%', right: '8%',
            height: '2px', backgroundColor: 'var(--border-subtle)', zIndex: 0,
          }}>
            <motion.div
              initial={{ width: '0%' }}
              animate={{
                width: `${steps.filter(s => s.status === 'completed').length / steps.length * 100}%`,
              }}
              transition={{ duration: 0.5 }}
              style={{ height: '100%', backgroundColor: '#06b6d4', borderRadius: '1px' }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {steps.map((step, index) => {
          const cfg = PHASE_CONFIG[step.phase];
          const isSelected = selectedStep === index;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedStep(isSelected ? null : index)}
              style={{
                backgroundColor: 'var(--bg-card)', border: `1px solid ${isSelected ? cfg.color : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: '10px',
                cursor: 'pointer', transition: 'all var(--transition-fast)',
                display: 'flex', alignItems: 'flex-start', gap: '14px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            >
              <div style={{
                width: '32px', height: '32px', borderRadius: 'var(--radius-md)', flexShrink: 0,
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
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: cfg.color }}>
                    {cfg.label}
                  </span>
                  <span style={{
                    fontSize: 'var(--font-size-xs)', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                    fontWeight: 'var(--font-weight-medium)',
                    backgroundColor: step.status === 'completed' ? 'var(--success-light)' :
                      step.status === 'running' ? 'var(--info-light)' :
                      step.status === 'failed' ? 'var(--error-light)' : 'var(--bg-tertiary)',
                    color: step.status === 'completed' ? 'var(--success-color)' :
                      step.status === 'running' ? 'var(--info-color)' :
                      step.status === 'failed' ? 'var(--error-color)' : 'var(--text-muted)',
                  }}>
                    {{ pending: '待执行', running: '执行中', completed: '完成', failed: '失败' }[step.status]}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {step.content}
                </p>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, transform: isSelected ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {steps.length === 0 && (
        <div style={{
          backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)', padding: '48px', textAlign: 'center',
        }}>
          <Brain size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-muted)' }}>输入指令启动认知循环</p>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: '8px' }}>
            循环将经过: 感知 → 推理 → 行动 → 反思 四个阶段
          </p>
        </div>
      )}
    </div>
  );
};

export default CognitiveLoop;
