import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Terminal as TerminalIcon, Search, Filter,
  Trash2, Download, RefreshCw, AlertCircle, CheckCircle2,
  Info, Clock, ChevronDown, Play, Square, RotateCcw,
  Maximize2, Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TabKey = 'logs' | 'terminal';

interface LogEntry {
  id: number;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug' | 'system';
  source: string;
  message: string;
}

const LEVEL_CONFIG = {
  info: { color: 'var(--text-primary)', bg: 'var(--bg-tertiary)', label: 'INFO', icon: <Info size={11} /> },
  warn: { color: '#f59e0b', bg: '#f59e0b15', label: 'WARN', icon: <AlertCircle size={11} /> },
  error: { color: 'var(--error-color)', bg: 'var(--error-light)', label: 'ERROR', icon: <AlertCircle size={11} /> },
  debug: { color: 'var(--text-muted)', bg: 'transparent', label: 'DEBUG', icon: <Info size={11} /> },
  system: { color: 'var(--primary-color)', bg: 'var(--primary-light)', label: 'SYS', icon: <CheckCircle2 size={11} /> },
};

const SAMPLE_LOGS: LogEntry[] = [
  { id: 1, timestamp: new Date().toISOString(), level: 'system', source: 'System', message: 'Airymax AgentOS v0.2.0 启动完成' },
  { id: 2, timestamp: new Date(Date.now() - 5000).toISOString(), level: 'info', source: 'Gateway', message: '网关连接已建立 (ws://localhost:8080)' },
  { id: 3, timestamp: new Date(Date.now() - 4000).toISOString(), level: 'info', source: 'Memory', message: '记忆系统初始化完成，共 4 层记忆结构就绪' },
  { id: 4, timestamp: new Date(Date.now() - 3000).toISOString(), level: 'info', source: 'LLM', message: 'OpenAI 提供商连接测试通过 (gpt-4o)' },
  { id: 5, timestamp: new Date(Date.now() - 2000).toISOString(), level: 'warn', source: 'Agent', message: '智能体 agent-main 等待任务分配中...' },
  { id: 6, timestamp: new Date(Date.now() - 1000).toISOString(), level: 'debug', source: 'CognitiveLoop', message: '认知循环引擎启动，双思考模式已启用' },
];

const LogsTerminal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('logs');
  const [logs, setLogs] = useState<LogEntry[]>(SAMPLE_LOGS);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<Array<{ input: string; output: string; time: string }>>([]);
  const [running, setRunning] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const addLog = (level: LogEntry['level'], source: string, message: string) => {
    setLogs(prev => [...prev.slice(-499), {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      level, source, message,
    }]);
  };

  const handleRefresh = () => {
    addLog('system', 'System', `日志刷新 - 共 ${logs.length} 条记录`);
  };

  const handleClear = () => {
    setLogs([]);
    addLog('system', 'System', '日志已清空');
  };

  const filteredLogs = logs.filter(log => {
    if (filterLevel !== 'all' && log.level !== filterLevel) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase()) && !log.source.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    const time = new Date().toLocaleTimeString();

    let output = '';
    switch (cmd.split(' ')[0]) {
      case 'help':
        output = `可用命令:
  help          显示帮助
  status        查看系统状态
  agents        列出智能体
  tasks         列出任务
  clear         清屏
  version       版本信息`;
        break;
      case 'status':
        output = `系统状态:
  运行时间: ${Math.floor(performance.now() / 1000)}s
  内存使用: ${((performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 45).toFixed(1)} MB
  智能体数: 3 (2 运行中)
  待处理任务: 7`;
        break;
      case 'agents':
        output = `ID           名称              状态     模型
agent-main   主控智能体        running  gpt-4o
researcher   研究助手          idle    claude-sonnet
coder        编码助手          idle    deepseek-chat`;
        break;
      case 'tasks':
        output = `ID    状态      类型          智能体
#001  running   code_review   coder
#002  pending   research      researcher
#003  done      analysis      agent-main`;
        break;
      case 'clear':
        setTerminalHistory([]);
        setTerminalInput('');
        return;
      case 'version':
        output = 'Airymax AgentOS v0.2.0 (Tauri Desktop)';
        break;
      default:
        output = `命令未找到: ${cmd}. 输入 help 查看可用命令。`;
    }

    setTerminalHistory(prev => [...prev, { input: cmd, output, time }]);
    addLog('debug', 'Terminal', `$ ${cmd}`);
    setTerminalInput('');
  };

  const toggleRun = () => {
    setRunning(!running);
    addLog(running ? 'system' : 'info', 'Terminal', running ? '终端会话已停止' : '终端会话已启动');
  };

  return (
    <div style={{ height: isFullscreen ? 'calc(100vh - 48px)' : 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>日志与终端</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>查看运行日志和执行命令</p>
        </div>
        <button onClick={() => setIsFullscreen(!isFullscreen)} style={{
          padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)',
          background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)',
          fontSize: '12px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          {isFullscreen ? '退出全屏' : '全屏'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '4px', backgroundColor: 'var(--bg-secondary)',
        padding: '4px', borderRadius: '10px', marginBottom: '16px', width: 'fit-content',
      }}>
        {[{ key: 'logs' as TabKey, label: '日志查看器', icon: <FileText size={15} /> }, { key: 'terminal' as TabKey, label: '集成终端', icon: <TerminalIcon size={15} /> }].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: activeTab === tab.key ? 'white' : 'transparent',
              color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === tab.key ? '500' : '400',
              fontFamily: 'inherit', transition: 'all 150ms ease',
              boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* Logs Panel */}
      {activeTab === 'logs' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索日志..."
                style={{
                  width: '100%', paddingLeft: '32px', paddingRight: '12px',
                  padding: '8px 12px 8px 32px', borderRadius: '8px',
                  border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)', fontSize: '12px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                fontSize: '12px', fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="all">全部级别</option>
              <option value="error">ERROR</option>
              <option value="warn">WARN</option>
              <option value="info">INFO</option>
              <option value="debug">DEBUG</option>
            </select>
            <button onClick={handleRefresh} style={{
              padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)',
              background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '12px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <RefreshCw size={13} /> 刷新
            </button>
            <button onClick={handleClear} style={{
              padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)',
              background: 'transparent', cursor: 'pointer', color: 'var(--error-color)', fontSize: '12px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <Trash2 size={13} /> 清空
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} style={{ accentColor: 'var(--primary-color)' }} />
              自动滚动
            </label>
          </div>

          {/* Log entries */}
          <div ref={logContainerRef} style={{
            flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-secondary)',
            borderRadius: '10px', border: '1px solid var(--border-subtle)', padding: '12px',
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace", fontSize: '12px', lineHeight: '1.6',
          }}>
            {filteredLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <FileText size={28} style={{ marginBottom: '8px' }} />
                <p>暂无日志记录</p>
              </div>
            ) : (
              filteredLogs.map(log => {
                const cfg = LEVEL_CONFIG[log.level];
                return (
                  <div key={log.id} style={{
                    display: 'flex', gap: '8px', padding: '4px 6px', borderRadius: '4px',
                    transition: 'background 100ms ease',
                  }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span style={{
                      padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '600',
                      backgroundColor: cfg.bg, color: cfg.color, whiteSpace: 'nowrap', flexShrink: 0,
                      display: 'inline-flex', alignItems: 'center', gap: '3px',
                    }}>
                      {cfg.icon}{cfg.label}
                    </span>
                    <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0, minWidth: '80px' }}>
                      [{log.source}]
                    </span>
                    <span style={{ color: cfg.color, wordBreak: 'break-word' }}>{log.message}</span>
                  </div>
                );
              })
            )}
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)',
          }}>
            <span>共 {filteredLogs.length} 条日志{searchQuery ? ` (过滤后)` : ''}</span>
            <span>{new Date().toLocaleString()}</span>
          </div>
        </motion.div>
      )}

      {/* Terminal Panel */}
      {activeTab === 'terminal' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{
            flex: 1, overflowY: 'auto', backgroundColor: '#0d1117',
            borderRadius: '10px', border: '1px solid #30363d', padding: '12px',
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace", fontSize: '13px', lineHeight: '1.6',
            color: '#c9d1d9',
          }} ref={terminalRef}>
            <div style={{ color: '#58a6ff', marginBottom: '8px' }}>
              ══════════════════════════════════════════════<br/>
              &nbsp;&nbsp;Airymax AgentOS Terminal v0.2.0<br/>
              &nbsp;&nbsp;输入 help 获取可用命令<br/>
              ══════════════════════════════════════════════
            </div>
            {terminalHistory.map((item, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <span style={{ color: '#58a6ff' }}>❯</span>
                  <span style={{ color: '#fff' }}>{item.input}</span>
                  <span style={{ color: '#484f58', marginLeft: 'auto', fontSize: '11px' }}>{item.time}</span>
                </div>
                <pre style={{ margin: '4px 0 4px 20px', color: '#8b949e', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{item.output}</pre>
              </div>
            ))}
          </div>

          <form onSubmit={handleTerminalSubmit} style={{
            display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center',
          }}>
            <button type="button" onClick={toggleRun} style={{
              width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--border-color)',
              background: running ? 'var(--error-light)' : 'var(--success-light)',
              color: running ? 'var(--error-color)' : 'var(--success-color)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {running ? <Square size={14} /> : <Play size={14} />}
            </button>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{
                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                color: '#58a6ff', fontWeight: '600', pointerEvents: 'none',
              }}>❯</span>
              <input
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="输入命令..."
                autoFocus
                spellCheck={false}
                autoComplete="off"
                style={{
                  width: '100%', paddingLeft: '30px', paddingRight: '40px',
                  padding: '10px 40px 10px 30px', borderRadius: '8px',
                  border: '1px solid #30363d', background: '#0d1117',
                  color: '#c9d1d9', fontSize: '13px', fontFamily: "'JetBrains Mono', monospace",
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <button type="submit" style={{
              padding: '10px 18px', borderRadius: '8px', border: 'none',
              background: '#238636', color: 'white', cursor: 'pointer',
              fontSize: '13px', fontWeight: '500', fontFamily: 'inherit', flexShrink: 0,
            }}>
              执行
            </button>
          </form>
        </motion.div>
      )}
    </div>
  );
};

export default LogsTerminal;
