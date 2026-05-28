import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText,
  Terminal as TerminalIcon,
  Search,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Info,
  Play,
  Square,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAgentOS, useHealth, useAgents, useTasks } from '../hooks/useAgentOS';

type TabKey = 'logs' | 'terminal';

interface LogEntry {
  id: number;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug' | 'system';
  source: string;
  message: string;
}

const LEVEL_CONFIG = {
  info: {
    color: 'var(--text-primary)',
    bg: 'var(--bg-tertiary)',
    label: 'INFO',
    icon: <Info size={11} />,
  },
  warn: { color: '#f59e0b', bg: '#f59e0b15', label: 'WARN', icon: <AlertCircle size={11} /> },
  error: {
    color: 'var(--error-color)',
    bg: 'var(--error-light)',
    label: 'ERROR',
    icon: <AlertCircle size={11} />,
  },
  debug: {
    color: 'var(--text-muted)',
    bg: 'transparent',
    label: 'DEBUG',
    icon: <Info size={11} />,
  },
  system: {
    color: 'var(--primary-color)',
    bg: 'var(--primary-light)',
    label: 'SYS',
    icon: <CheckCircle2 size={11} />,
  },
};

const LogsTerminal: React.FC = () => {
  const { t } = useTranslation();
  const { connection } = useAgentOS();
  const { health, metrics, fetchHealth, fetchMetrics } = useHealth();
  const { agents, fetchAgents } = useAgents();
  const { tasks, fetchTasks } = useTasks();

  const [activeTab, setActiveTab] = useState<TabKey>('logs');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<
    Array<{ input: string; output: string; time: string }>
  >([]);
  const [running, setRunning] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const logIdRef = useRef(0);

  const addLog = useCallback((level: LogEntry['level'], source: string, message: string) => {
    logIdRef.current += 1;
    setLogs((prev) => [
      ...prev.slice(-499),
      {
        id: logIdRef.current,
        timestamp: new Date().toISOString(),
        level,
        source,
        message,
      },
    ]);
  }, []);

  useEffect(() => {
    if (connection.status === 'connected') {
      addLog('system', 'System', '已连接到 AgentOS 后端');
    } else if (connection.status === 'disconnected') {
      addLog('warn', 'System', '与 AgentOS 后端断开连接');
    } else if (connection.status === 'error') {
      addLog('error', 'System', `连接错误: ${connection.error || '未知'}`);
    }
  }, [connection.status, connection.error, addLog]);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleRefresh = useCallback(async () => {
    if (connection.status === 'connected') {
      try {
        await Promise.all([fetchHealth(), fetchMetrics()]);
        addLog('info', 'System', `日志刷新完成 - 后端状态: ${health?.status || 'unknown'}`);
      } catch (err) {
        addLog('error', 'System', `刷新失败: ${err instanceof Error ? err.message : 'unknown'}`);
      }
    } else {
      addLog('warn', 'System', '未连接后端，无法刷新');
    }
  }, [connection.status, fetchHealth, fetchMetrics, health, addLog]);

  const handleClear = () => {
    setLogs([]);
    addLog('system', 'System', '日志已清空');
  };

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== 'all' && log.level !== filterLevel) return false;
    if (
      searchQuery &&
      !log.message.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !log.source.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const handleTerminalSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!terminalInput.trim()) return;

      const cmd = terminalInput.trim();
      const time = new Date().toLocaleTimeString();
      let output = '';

      try {
        switch (cmd.split(' ')[0]) {
          case 'help':
            output = `可用命令:
  help          显示帮助
  status        查看系统状态
  agents        列出智能体
  tasks         列出任务
  health        健康检查
  metrics       查看指标
  clear         清屏
  version       版本信息`;
            break;
          case 'status': {
            if (connection.status === 'connected') {
              const h = health;
              output = `系统状态:
  后端连接: 已连接 (${connection.status})
  运行时间: ${h?.uptime || 'N/A'}
  版本: ${h?.version || 'N/A'}
  智能体数: ${agents.length}
  任务数: ${tasks.length}`;
            } else {
              output = `系统状态:
  后端连接: 未连接 (${connection.status})
  请先确保 AgentOS 后端正在运行`;
            }
            break;
          }
          case 'agents': {
            if (connection.status === 'connected') {
              await fetchAgents();
              output =
                agents.length > 0
                  ? agents
                      .map((a) => `${a.id.padEnd(14)}${(a.name || 'N/A').padEnd(18)}${a.status}`)
                      .join('\n')
                  : '当前无活跃智能体';
            } else {
              output = '未连接后端，无法获取智能体列表';
            }
            break;
          }
          case 'tasks': {
            if (connection.status === 'connected') {
              await fetchTasks();
              output =
                tasks.length > 0
                  ? tasks
                      .map(
                        (t) =>
                          `${t.id.padEnd(8)}${t.status.padEnd(12)}${t.description?.slice(0, 30) || 'N/A'}`,
                      )
                      .join('\n')
                  : '当前无任务';
            } else {
              output = '未连接后端，无法获取任务列表';
            }
            break;
          }
          case 'health': {
            if (connection.status === 'connected') {
              await fetchHealth();
              const h = health;
              output = h
                ? `健康状态: ${h.status}\n版本: ${h.version || 'N/A'}\n运行时间: ${h.uptime || 'N/A'}`
                : '无法获取健康状态';
            } else {
              output = '后端不可达';
            }
            break;
          }
          case 'metrics': {
            if (connection.status === 'connected') {
              await fetchMetrics();
              output = metrics ? JSON.stringify(metrics, null, 2) : '无法获取指标';
            } else {
              output = '后端不可达';
            }
            break;
          }
          case 'clear':
            setTerminalHistory([]);
            setTerminalInput('');
            return;
          case 'version':
            output = 'Airymax AgentOS v0.0.5 (Tauri Desktop)';
            break;
          default:
            output = `命令未找到: ${cmd}. 输入 help 查看可用命令。`;
        }
      } catch (err) {
        output = `执行错误: ${err instanceof Error ? err.message : 'unknown'}`;
      }

      setTerminalHistory((prev) => [...prev, { input: cmd, output, time }]);
      addLog('debug', 'Terminal', `$ ${cmd}`);
      setTerminalInput('');
    },
    [
      terminalInput,
      connection,
      health,
      metrics,
      agents,
      tasks,
      fetchAgents,
      fetchTasks,
      fetchHealth,
      fetchMetrics,
      addLog,
    ],
  );

  const toggleRun = () => {
    setRunning(!running);
    addLog(running ? 'system' : 'info', 'Terminal', running ? '终端会话已停止' : '终端会话已启动');
  };

  return (
    <div
      role="region"
      aria-label="日志终端"
      style={{
        height: isFullscreen ? 'calc(100vh - 48px)' : 'calc(100vh - 140px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <div>
          <h1
            style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}
          >
            日志与终端
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            查看运行日志和执行命令
            {connection.status === 'connected' && (
              <span role="status" style={{ color: 'var(--success)', marginLeft: '8px' }}>● 已连接</span>
            )}
            {connection.status !== 'connected' && (
              <span role="status" style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>○ 未连接</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          aria-label={isFullscreen ? '退出全屏' : '全屏'}
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          {isFullscreen ? '退出全屏' : '全屏'}
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '4px',
          backgroundColor: 'var(--bg-secondary)',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '16px',
          width: 'fit-content',
        }}
      >
        {[
          { key: 'logs' as TabKey, label: '日志查看器', icon: <FileText size={15} /> },
          { key: 'terminal' as TabKey, label: '集成终端', icon: <TerminalIcon size={15} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            aria-pressed={activeTab === tab.key}
            aria-label={tab.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.key ? 'white' : 'transparent',
              color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: activeTab === tab.key ? '500' : '400',
              fontFamily: 'inherit',
              transition: 'all 150ms ease',
              boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'logs' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
        >
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '12px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                role="searchbox"
                aria-label="搜索日志"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索日志..."
                style={{
                  width: '100%',
                  paddingLeft: '32px',
                  paddingRight: '12px',
                  padding: '8px 12px 8px 32px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <select
              aria-label="日志级别筛选"
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontFamily: 'inherit',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="all">全部级别</option>
              <option value="error">ERROR</option>
              <option value="warn">WARN</option>
              <option value="info">INFO</option>
              <option value="debug">DEBUG</option>
            </select>
            <button
              onClick={handleRefresh}
              aria-label="刷新日志"
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RefreshCw size={13} />
              {t('toolManager.refresh')}
            </button>
            <button
              onClick={handleClear}
              aria-label="清空日志"
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--error-color)',
                fontSize: '12px',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Trash2 size={13} /> 清空
            </button>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                style={{ accentColor: 'var(--primary-color)' }}
              />
              自动滚动
            </label>
          </div>

          <div
            ref={logContainerRef}
            role="log"
            aria-live="polite"
            aria-label="日志输出"
            style={{
              flex: 1,
              overflowY: 'auto',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              padding: '12px',
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              fontSize: '12px',
              lineHeight: '1.6',
            }}
          >
            {filteredLogs.length === 0 ? (
              <div role="status" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <FileText size={28} style={{ marginBottom: '8px' }} />
                <p>暂无日志记录</p>
                <p style={{ fontSize: '11px' }}>连接后端后，系统事件将自动记录</p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const cfg = LEVEL_CONFIG[log.level];
                return (
                  <div
                    key={log.id}
                    style={{
                      display: 'flex',
                      gap: '8px',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      transition: 'background 100ms ease',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <span
                      style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600',
                        backgroundColor: cfg.bg,
                        color: cfg.color,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      {cfg.icon}
                      {cfg.label}
                    </span>
                    <span
                      style={{
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        minWidth: '80px',
                      }}
                    >
                      [{log.source}]
                    </span>
                    <span style={{ color: cfg.color, wordBreak: 'break-word' }}>{log.message}</span>
                  </div>
                );
              })
            )}
          </div>

          <div
            role="status"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '8px',
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}
          >
            <span>
              共 {filteredLogs.length} 条日志{searchQuery ? ` (过滤后)` : ''}
            </span>
            <span>{new Date().toLocaleString()}</span>
          </div>
        </motion.div>
      )}

      {activeTab === 'terminal' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
        >
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              backgroundColor: '#0d1117',
              borderRadius: '10px',
              border: '1px solid #30363d',
              padding: '12px',
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              fontSize: '13px',
              lineHeight: '1.6',
              color: '#c9d1d9',
            }}
            ref={terminalRef}
          >
            <div style={{ color: '#58a6ff', marginBottom: '8px' }}>
              ══════════════════════════════════════════════
              <br />
              &nbsp;&nbsp;Airymax AgentOS Terminal v0.0.5
              <br />
              &nbsp;&nbsp;输入 help 获取可用命令
              <br />
              &nbsp;&nbsp;后端状态: {connection.status === 'connected' ? '已连接' : '未连接'}
              <br />
              ══════════════════════════════════════════════
            </div>
            {terminalHistory.map((item, idx) => (
              <div key={idx}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}
                >
                  <span style={{ color: '#58a6ff' }}>❯</span>
                  <span style={{ color: '#fff' }}>{item.input}</span>
                  <span style={{ color: '#484f58', marginLeft: 'auto', fontSize: '11px' }}>
                    {item.time}
                  </span>
                </div>
                <pre
                  style={{
                    margin: '4px 0 4px 20px',
                    color: '#8b949e',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                  }}
                >
                  {item.output}
                </pre>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleTerminalSubmit}
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '8px',
              alignItems: 'center',
            }}
          >
            <button
              type="button"
              onClick={toggleRun}
              aria-label={running ? '停止终端会话' : '启动终端会话'}
              aria-pressed={running}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: running ? 'var(--error-light)' : 'var(--success-light)',
                color: running ? 'var(--error-color)' : 'var(--success-color)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {running ? <Square size={14} /> : <Play size={14} />}
            </button>
            <div style={{ position: 'relative', flex: 1 }}>
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#58a6ff',
                  fontWeight: '600',
                  pointerEvents: 'none',
                }}
              >
                ❯
              </span>
              <input
                aria-label="终端命令输入"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="输入命令..."
                autoFocus
                spellCheck={false}
                autoComplete="off"
                style={{
                  width: '100%',
                  paddingLeft: '30px',
                  paddingRight: '40px',
                  padding: '10px 40px 10px 30px',
                  borderRadius: '8px',
                  border: '1px solid #30363d',
                  background: '#0d1117',
                  color: '#c9d1d9',
                  fontSize: '13px',
                  fontFamily: "'JetBrains Mono', monospace",
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              type="submit"
              aria-label="执行命令"
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                background: '#238636',
                color: 'white',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                fontFamily: 'inherit',
                flexShrink: 0,
              }}
            >
              {t('toolManager.execute')}
            </button>
          </form>
        </motion.div>
      )}
    </div>
  );
};

export default LogsTerminal;
