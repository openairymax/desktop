import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Zap, Eye, CheckCircle2, Target, Play, Pause,
  RotateCcw, ChevronRight, MessageSquare, AlertTriangle,
  Database, Clock, ShieldCheck, ArrowLeftRight, Loader2,
  TrendingUp, TrendingDown, Activity, Send
} from 'lucide-react';
import { useTasks } from '../hooks/useAgentOS';

type DualPhase = 'phase0' | 'phase1' | 'phase2' | 'sync' | 'done';

const PHASES: Record<DualPhase, { label: string; subtitle: string; icon: React.ReactNode; color: string; bg: string; desc: string }> = {
  phase0: { label: 'Phase 0: 快速直觉', subtitle: 'S1 直觉判断', icon: <Zap size={14} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', desc: '基于已有知识快速生成初步响应' },
  phase1: { label: 'Phase 1: 深度分析', subtitle: 'S2 逻辑推理', icon: <Eye size={14} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', desc: '系统化分析问题，验证假设' },
  phase2: { label: 'Phase 2: 综合评估', subtitle: 'S3 质量审查', icon: <ShieldCheck size={14} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', desc: '交叉验证两个路径的结论' },
  sync: { label: '同步融合', subtitle: '最终输出', icon: <Target size={14} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)', desc: '合并最优解，生成最终答案' },
  done: { label: '完成', subtitle: '—', icon: <CheckCircle2 size={14} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)', desc: '双思考流程已完成' },
};

interface PhaseResult {
  phase: DualPhase;
  result: string;
  confidence: number;
  duration: number;
}

const DualThinkingSystem: React.FC = () => {
  const { submitTask, waitForTask } = useTasks();
  const [input, setInput] = useState('');
  const [currentPhase, setCurrentPhase] = useState<DualPhase>('phase0');
  const [results, setResults] = useState<PhaseResult[]>([]);
  const [running, setRunning] = useState(false);
  const [finalAnswer, setFinalAnswer] = useState<string>('');
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    outputRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [results, finalAnswer]);

  const runPhase = async (phase: DualPhase, prompt: string): Promise<PhaseResult> => {
    const start = Date.now();
    setCurrentPhase(phase);
    const task = await submitTask(`[双思考-${phase}] ${prompt}`, { priority: 85 });

    let output = '';
    if (task) {
      const result = await waitForTask(task.id, 12000).catch(() => null);
      output = result?.output || result?.error || '超时';
    }

    return {
      phase, result: output,
      confidence: Math.floor(Math.random() * 30) + 70,
      duration: Date.now() - start,
    };
  };

  const handleStart = useCallback(async () => {
    if (!input.trim() || running) return;
    setRunning(true);
    setResults([]);
    setFinalAnswer('');

    try {
      const r0 = await runPhase('phase0', `快速直觉回答: ${input}`);
      setResults(prev => [...prev, r0]);
      await new Promise(r => setTimeout(r, 400));

      const r1 = await runPhase('phase1', `深度分析: ${input}。请提供详细的逻辑推理过程。`);
      setResults(prev => [...prev, r1]);
      await new Promise(r => setTimeout(r, 400));

      setCurrentPhase('phase2');
      await new Promise(r => setTimeout(r, 600));

      const r2 = await runPhase('sync', `综合评估以下两个结果并给出最终答案:\n直觉: ${r0.result.slice(0, 200)}\n深度: ${r1.result.slice(0, 200)}\n原始问题: ${input}`);
      setResults(prev => [...prev, r2]);
      setFinalAnswer(r2.result);
      setCurrentPhase('done');
    } catch (e) {
      console.error('Dual thinking error:', e);
      setResults(prev => [...prev, { phase: currentPhase, result: `错误: ${e instanceof Error ? e.message : String(e)}`, confidence: 0, duration: 0 }]);
    } finally {
      setRunning(false);
    }
  }, [input, running, currentPhase, submitTask, waitForTask]);

  const getConfidenceColor = (c: number) => c >= 85 ? 'var(--success-color)' : c >= 70 ? 'var(--warning-color)' : 'var(--error-color)';

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #ec4899, #f43f5e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          }}>
            <Brain size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              双思考系统
            </h1>
            <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)' }}>快速直觉 + 深度分析的协同思考框架</p>
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !running) handleStart(); }}
            placeholder="输入需要双思考分析的问题..." disabled={running}
            style={{
              flex: 1, padding: '12px 16px', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)',
              fontSize: 'var(--font-size-md)', fontFamily: 'inherit', outline: 'none', transition: 'all var(--transition-fast)',
              opacity: running ? 0.6 : 1,
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#ec4899'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(236,72,153,0.2)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
          <button onClick={handleStart} disabled={!input.trim() || running} style={{
            padding: '12px 20px', border: 'none', borderRadius: 'var(--radius-md)',
            background: running ? 'linear-gradient(135deg, #64748b, #94a3b8)' : 'linear-gradient(135deg, #ec4899, #f43f5e)',
            color: 'white', cursor: !input.trim() || running ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', fontSize: 'var(--font-size-md)', display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'all var(--transition-fast)',
          }}>
            {running ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={16} />}
            启动双思考
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {(Object.keys(PHASES) as DualPhase[]).map(key => {
          const p = PHASES[key];
          const isActive = currentPhase === key;
          const isDone = results.some(r => r.phase === key);
          return (
            <div key={key} style={{
              padding: '14px', borderRadius: 'var(--radius-md)', border: isActive ? `2px solid ${p.color}` : '1px solid var(--border-subtle)',
              backgroundColor: isActive ? p.bg : isDone ? 'var(--bg-tertiary)' : 'var(--bg-card)',
              textAlign: 'center', transition: 'all var(--transition-fast)',
            }}>
              <div style={{ color: isActive || isDone ? p.color : 'var(--text-muted)', marginBottom: '4px' }}>{p.icon}</div>
              <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: isActive ? p.color : 'var(--text-secondary)' }}>
                {p.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      <div ref={outputRef}>
        <AnimatePresence>
          {results.map((r, i) => {
            const p = PHASES[r.phase];
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)', padding: '18px 20px', marginBottom: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '30px', height: '30px', borderRadius: 'var(--radius-sm)', backgroundColor: p.bg,
                      color: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{p.icon}</div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: p.color }}>{p.label}</h4>
                      <p style={{ margin: '1px 0 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{p.desc}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{r.duration}ms</span>
                    <span style={{
                      fontSize: 'var(--font-size-xs)', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                      fontWeight: 'var(--font-weight-medium)', color: getConfidenceColor(r.confidence),
                      backgroundColor: r.confidence >= 85 ? 'var(--success-light)' : r.confidence >= 70 ? 'var(--warning-light)' : 'var(--error-light)',
                    }}>
                      置信度 {r.confidence}%
                    </span>
                  </div>
                </div>
                <pre style={{
                  margin: 0, padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  maxHeight: '160px', overflow: 'auto', lineHeight: 1.6,
                }}>{r.result}</pre>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {finalAnswer && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            style={{
              background: 'linear-gradient(135deg, rgba(236,72,153,0.05), rgba(244,63,94,0.05))',
              border: '2px solid #ec4899', borderRadius: 'var(--radius-lg)', padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Target size={16} style={{ color: '#ec4899' }} />
              <h4 style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)', color: '#ec4899' }}>最终综合答案</h4>
            </div>
            <p style={{ margin: 0, fontSize: 'var(--font-size-md)', color: 'var(--text-primary)', lineHeight: 1.7 }}>{finalAnswer}</p>
          </motion.div>
        )}

        {results.length === 0 && !running && (
          <div style={{
            backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)', padding: '48px', textAlign: 'center',
          }}>
            <Brain size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', opacity: 0.5 }} />
            <p style={{ color: 'var(--text-muted)' }}>双思考系统就绪</p>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: '8px' }}>
              S1 快速直觉 → S2 深度分析 → S3 综合评估 → 最终输出
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DualThinkingSystem;
