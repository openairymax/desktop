import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Terminal as TerminalIcon, Play, Trash2, Copy, ChevronUp, ChevronDown,
  History, CheckCircle2, Maximize2, Cpu, Globe, Code2, Loader2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HistoryEntry {
  command: string;
  output: string;
  timestamp: number;
}

const TABS = [
  { id: 'shell' as const, label: 'Shell (Bash)', icon: TerminalIcon, color: '#22c55e' },
  { id: 'gateway' as const, label: 'Gateway API', icon: Globe, color: '#06b6d4' },
];

const COMMAND_HISTORY: string[] = [
  'curl -s http://localhost:18789/health | jq .',
  'curl -s http://localhost:18789/api/v1/tasks | jq .',
  'curl -s http://localhost:18789/api/v1/agents | jq .',
  'curl -s http://localhost:18789/api/v1/sessions | jq .',
];

const Terminal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'shell' | 'gateway'>('shell');
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: 'smooth' });
  }, [history]);

  const executeCommand = useCallback(async (cmd: string) => {
    const entry: HistoryEntry = { command: cmd, output: '', timestamp: Date.now() };
    setHistory(prev => [...prev, entry]);
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
    setLoading(true);

    try {
      if (activeTab === 'gateway') {
        const resp = await fetch(`http://localhost:18789${cmd.replace(/^curl\s+.*?(http:\/\/localhost:\d+)/i, '')}`);
        const text = await resp.text();
        entry.output = `HTTP ${resp.status}\n${text.slice(0, 2000)}${text.length > 2000 ? '\n... (truncated)' : ''}`;
      } else {
        entry.output = `[模拟终端] 命令执行环境未配置。\n提示: 使用 Gateway API 标签页可直接与 AgentOS 交互。\n\n命令: ${cmd}`;
      }
    } catch (e) {
      entry.output = `错误: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
      setLoading(false);
      setHistory(prev => prev.map(h => h.timestamp === entry.timestamp ? entry : h));
    }
  }, [activeTab]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!input.trim()) return;
      executeCommand(input.trim());
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIdx = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIdx);
        setInput(commandHistory[commandHistory.length - 1 - nextIdx] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInput(commandHistory[commandHistory.length - 1 - nextIdx] || '');
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const handleCopyOutput = (output: string) => {
    navigator.clipboard.writeText(output);
  };

  const handleClear = () => {
    setHistory([]);
  };

  const tabCfg = TABS.find(t => t.id === activeTab);

  return (
    <div style={{
      maxWidth: '1280px', margin: '0 auto', padding: '24px',
      ...(maximized ? { position: 'fixed', inset: 0, zIndex: 1000, margin: 0, padding: '16px', background: 'var(--bg-primary)' } : {}),
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #1e293b, #334155)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e',
          }}>
            <TerminalIcon size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>终端</h1>
            <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)' }}>命令行交互界面</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setMaximized(!maximized)} style={{
            padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', fontSize: 'var(--font-size-sm)',
            transition: 'all var(--transition-fast)',
          }}>
            {maximized ? <ChevronDown size={14} /> : <Maximize2 size={14} />}
            {maximized ? '还原' : '最大化'}
          </button>
          <button onClick={handleClear} disabled={history.length === 0} style={{
            padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', fontSize: 'var(--font-size-sm)',
            transition: 'all var(--transition-fast)', opacity: history.length === 0 ? 0.5 : 1,
          }}>
            <Trash2 size={14} /> 清空
          </button>
        </div>
      </div>

      <div style={{
        backgroundColor: '#0a0a0f', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        height: maximized ? 'calc(100vh - 80px)' : 'calc(100vh - 240px)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 16px', borderBottom: '1px solid #1e1e2e', backgroundColor: '#111118',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
            </div>
            <div style={{ display: 'flex', gap: '2px', backgroundColor: '#1e1e2e', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  padding: '4px 12px', borderRadius: 'var(--radius-sm)', border: 'none',
                  backgroundColor: activeTab === tab.id ? '#1e293b' : 'transparent',
                  color: activeTab === tab.id ? tab.color : '#6b7280',
                  fontSize: 'var(--font-size-xs)', fontWeight: activeTab === tab.id ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all var(--transition-fast)',
                }}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: '#4b5563', fontFamily: 'var(--font-mono)' }}>
            AgentOS Terminal — {tabCfg?.label}
          </span>
        </div>

        <div ref={outputRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.7 }}>
          <div style={{ color: '#6b7280', marginBottom: '12px' }}>
            AgentOS 终端 v1.0 · 连接: localhost:18789 · 输入 help 或使用上方标签切换模式
          </div>

          <AnimatePresence>
            {history.map((entry, i) => (
              <motion.div key={entry.timestamp} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ color: '#22c55e', fontWeight: 600 }}>$</span>
                  <span style={{ color: '#e5e7eb' }}>{entry.command}</span>
                  <button onClick={() => handleCopyOutput(entry.output)} style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', padding: '2px', opacity: 0, transition: 'opacity 0.15s',
                    marginLeft: 'auto',
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0'; }}
                  >
                    <Copy size={11} />
                  </button>
                </div>
                {entry.output && (
                  <pre style={{
                    margin: '0 0 12px 16px', color: entry.output.includes('错误') ? '#fca5a5' : '#9ca3af',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '12px',
                  }}>{entry.output}</pre>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b' }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> 执行中...
            </div>
          )}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
          borderTop: '1px solid #1e1e2e', backgroundColor: '#111118',
        }}>
          <span style={{ color: tabCfg?.color, fontWeight: 600, fontSize: 'var(--font-size-xs)' }}>$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={activeTab === 'gateway' ? '输入 API 路径，如 /health 或 /api/v1/tasks...' : '输入命令...'}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#e5e7eb', fontSize: 'var(--font-size-md)', fontFamily: 'var(--font-mono)',
              caretColor: '#22c55e',
            }}
            onFocus={() => inputRef.current?.focus()}
          />
          <button
            onClick={() => { if (input.trim()) executeCommand(input.trim()); setInput(''); }}
            disabled={!input.trim() || loading}
            style={{
              background: 'none', border: 'none', cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
              color: !input.trim() || loading ? '#4b5563' : '#22c55e', padding: '4px', transition: 'color 0.15s',
            }}
          >
            <Play size={14} />
          </button>
        </div>
      </div>

      {activeTab === 'gateway' && (
        <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
          {COMMAND_HISTORY.map(cmd => (
            <button key={cmd} onClick={() => { setInput(cmd); inputRef.current?.focus(); }} style={{
              padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', textAlign: 'left',
              transition: 'all var(--transition-fast)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#06b6d4'; e.currentTarget.style.color = '#06b6d4'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              {cmd}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Terminal;
