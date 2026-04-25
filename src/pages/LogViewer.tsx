import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText, Search, Download, RefreshCw, Play, Pause,
  Trash2, AlertCircle, Info, AlertTriangle, XCircle,
  Loader2, Copy, CheckCircle2, ArrowDown, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTasks, useMemory, useSessions, useSkills, useAgents, useHealth } from '../hooks/useAgentOS';

const LOG_COLORS: Record<string, string> = {
  DEBUG: '#6b7280',
  INFO: '#3b82f6',
  WARN: '#f59e0b',
  ERROR: '#ef4444',
  TASK: '#10b981',
  MEMORY: '#8b5cf6',
  SESSION: '#06b6d4',
  SKILL: '#f97316',
  AGENT: '#6366f1',
  SYSTEM: '#ec4899',
};

interface LogEntry {
  timestamp: string;
  level: string;
  service: string;
  message: string;
  raw: string;
}

const LogViewer: React.FC = () => {
  const { tasks, fetchTasks } = useTasks();
  const { memories, fetchMemories } = useMemory();
  const { sessions, fetchSessions } = useSessions();
  const { skills, fetchSkills } = useSkills();
  const { agents, fetchAgents } = useAgents();
  const { health, fetchHealth } = useHealth();

  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [copied, setCopied] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const buildLogEntries = useCallback(() => {
    const entries: LogEntry[] = [];
    const now = new Date().toISOString();

    if (health) {
      entries.push({
        timestamp: now,
        level: 'SYSTEM',
        service: 'gateway',
        message: `Gateway 状态: ${health.status || 'unknown'}, 版本: ${health.version || '—'}, 运行时间: ${health.uptime || '—'}`,
        raw: `${now} [SYSTEM] [gateway] Gateway 状态: ${health.status || 'unknown'}`,
      });
    }

    (tasks as any[]).forEach((task: any) => {
      const statusMap: Record<string, string> = {
        pending: 'INFO', running: 'TASK', completed: 'INFO',
        failed: 'ERROR', cancelled: 'WARN',
      };
      entries.push({
        timestamp: task.createdAt || now,
        level: statusMap[task.status] || 'INFO',
        service: 'tasks',
        message: `任务 ${task.id?.slice(0, 8)} 状态=${task.status} 描述="${(task.description || '').slice(0, 60)}"${task.error ? ` 错误: ${task.error.slice(0, 80)}` : ''}`,
        raw: `${task.createdAt || now} [${statusMap[task.status] || 'TASK'}] [tasks] Task ${task.id} status=${task.status}`,
      });
    });

    (memories as any[]).forEach((mem: any) => {
      entries.push({
        timestamp: mem.createdAt || now,
        level: 'MEMORY',
        service: 'memory',
        message: `记忆 ${mem.id?.slice(0, 8)} 层级=${mem.layer} 内容="${(mem.content || '').slice(0, 60)}"`,
        raw: `${mem.createdAt || now} [MEMORY] [memory] Memory ${mem.id} layer=${mem.layer}`,
      });
    });

    (sessions as any[]).forEach((session: any) => {
      const level = session.status === 'active' ? 'SESSION' : session.status === 'expired' ? 'WARN' : 'INFO';
      entries.push({
        timestamp: session.createdAt || now,
        level,
        service: 'sessions',
        message: `会话 ${session.id?.slice(0, 8)} 用户=${session.userId || '—'} 状态=${session.status}`,
        raw: `${session.createdAt || now} [${level}] [sessions] Session ${session.id} status=${session.status}`,
      });
    });

    (skills as any[]).forEach((skill: any) => {
      entries.push({
        timestamp: skill.createdAt || now,
        level: 'SKILL',
        service: 'skills',
        message: `技能 ${skill.name || skill.id?.slice(0, 8)} 状态=${skill.status}${skill.description ? ` 描述="${skill.description.slice(0, 50)}"` : ''}`,
        raw: `${skill.createdAt || now} [SKILL] [skills] Skill ${skill.name} status=${skill.status}`,
      });
    });

    (agents as any[]).forEach((agent: any) => {
      const level = agent.status === 'running' ? 'AGENT' : agent.status === 'error' ? 'ERROR' : 'INFO';
      entries.push({
        timestamp: agent.createdAt || now,
        level,
        service: 'agents',
        message: `智能体 ${agent.name || agent.id?.slice(0, 8)} 状态=${agent.status}${agent.description ? ` 描述="${agent.description.slice(0, 50)}"` : ''}`,
        raw: `${agent.createdAt || now} [${level}] [agents] Agent ${agent.name} status=${agent.status}`,
      });
    });

    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return entries;
  }, [tasks, memories, sessions, skills, agents, health]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.allSettled([
        fetchTasks(), fetchMemories(), fetchSessions(), fetchSkills(), fetchAgents(), fetchHealth(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchTasks, fetchMemories, fetchSessions, fetchSkills, fetchAgents, fetchHealth]);

  useEffect(() => { loadAllData(); }, []);

  useEffect(() => {
    setLogs(buildLogEntries());
  }, [buildLogEntries]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadAllData, 10000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, loadAllData]);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(entry => {
    const matchesLevel = levelFilter === 'all' || entry.level.toLowerCase() === levelFilter.toLowerCase();
    const matchesSearch = !searchTerm ||
      entry.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.service.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const handleDownload = () => {
    const content = logs.map(l => l.raw).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agentos-logs-${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(logs.map(l => l.raw).join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'DEBUG': return <Info size={12} />;
      case 'INFO': return <Info size={12} />;
      case 'WARN': return <AlertTriangle size={12} />;
      case 'ERROR': return <XCircle size={12} />;
      case 'TASK': return <CheckCircle2 size={12} />;
      case 'MEMORY': return <Clock size={12} />;
      case 'SESSION': return <Info size={12} />;
      case 'SKILL': return <AlertCircle size={12} />;
      case 'AGENT': return <Info size={12} />;
      case 'SYSTEM': return <AlertCircle size={12} />;
      default: return <FileText size={12} />;
    }
  };

  const logLevelStats = (() => {
    const stats: Record<string, number> = {};
    logs.forEach(entry => {
      stats[entry.level] = (stats[entry.level] || 0) + 1;
    });
    return stats;
  })();

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #06b6d4, #0284c7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          }}>
            <FileText size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              日志查看
            </h1>
            <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)' }}>AgentOS 活动日志流 — 任务、记忆、会话、技能、智能体</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setAutoRefresh(!autoRefresh)} style={{
            padding: '8px 12px', border: autoRefresh ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', backgroundColor: autoRefresh ? 'var(--primary-light)' : 'var(--bg-card)',
            color: autoRefresh ? 'var(--primary-color)' : 'var(--text-secondary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', fontSize: 'var(--font-size-sm)',
            transition: 'all var(--transition-fast)',
          }}>
            {autoRefresh ? <Pause size={14} /> : <Play size={14} />}
            {autoRefresh ? '停止刷新' : '自动刷新'}
          </button>
          <button onClick={handleCopyAll} style={{
            padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', fontSize: 'var(--font-size-sm)',
            transition: 'all var(--transition-fast)',
          }}>
            {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            复制全部
          </button>
          <button onClick={handleDownload} style={{
            padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', fontSize: 'var(--font-size-sm)',
            transition: 'all var(--transition-fast)',
          }}>
            <Download size={14} /> 下载
          </button>
        </div>
      </div>

      <div style={{
        backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {Object.entries(logLevelStats).map(([level, count]) => (
            <button key={level} onClick={() => setLevelFilter(levelFilter === level.toLowerCase() ? 'all' : level.toLowerCase())} style={{
              padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-medium)', cursor: 'pointer', fontFamily: 'inherit',
              border: levelFilter === level.toLowerCase() ? 'none' : '1px solid var(--border-subtle)',
              backgroundColor: levelFilter === level.toLowerCase() ? (LOG_COLORS[level] || 'var(--primary-color)') : 'var(--bg-tertiary)',
              color: levelFilter === level.toLowerCase() ? 'white' : (LOG_COLORS[level] || 'var(--text-muted)'),
              transition: 'all var(--transition-fast)',
            }}>
              {level}: {count}
            </button>
          ))}
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', alignSelf: 'center', marginLeft: '8px' }}>
            总计: {logs.length} 条
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="搜索日志内容..." style={{
              width: '100%', padding: '10px 14px 10px 36px', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)',
              fontSize: 'var(--font-size-sm)', fontFamily: 'inherit', outline: 'none', transition: 'all var(--transition-fast)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#06b6d4'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(6,182,212,0.2)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
          <button onClick={loadAllData} disabled={loading} style={{
            padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', fontSize: 'var(--font-size-sm)',
            transition: 'all var(--transition-fast)',
          }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 刷新
          </button>
          <button onClick={() => setAutoScroll(!autoScroll)} style={{
            padding: '8px 12px', border: autoScroll ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', backgroundColor: autoScroll ? 'var(--primary-light)' : 'var(--bg-card)',
            color: autoScroll ? 'var(--primary-color)' : 'var(--text-secondary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', fontSize: 'var(--font-size-sm)',
            transition: 'all var(--transition-fast)',
          }}>
            <ArrowDown size={14} /> 自动滚动
          </button>
        </div>
      </div>

      <div style={{
        backgroundColor: '#0a0a0f', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
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
            <span style={{ fontSize: 'var(--font-size-xs)', color: '#6b7280', fontFamily: 'var(--font-mono)' }}>
              AgentOS 活动日志
            </span>
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: '#4b5563' }}>
            显示 {filteredLogs.length} / {logs.length} 条
          </span>
        </div>

        <div
          ref={logContainerRef}
          style={{
            minHeight: '400px', maxHeight: 'calc(100vh - 400px)', overflowY: 'auto',
            fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: '1.8',
          }}
        >
          {loading && filteredLogs.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px', color: '#6b7280' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', marginRight: '12px' }} />
              加载日志中...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '256px', color: '#4b5563' }}>
              <FileText size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>暂无匹配的日志记录</p>
              <p style={{ fontSize: 'var(--font-size-xs)', marginTop: '8px', color: '#374151' }}>尝试调整筛选条件或点击刷新</p>
            </div>
          ) : (
            filteredLogs.map((entry, index) => (
              <div key={index} style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '2px 16px', transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span style={{ color: '#4b5563', whiteSpace: 'nowrap', fontSize: '11px', flexShrink: 0 }}>
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                  whiteSpace: 'nowrap', fontSize: '11px', fontWeight: 600,
                  padding: '0 4px', borderRadius: '2px', flexShrink: 0,
                  color: LOG_COLORS[entry.level] || '#6b7280',
                  backgroundColor: `${LOG_COLORS[entry.level] || '#6b7280'}15`,
                }}>
                  {getLevelIcon(entry.level)}
                  {entry.level}
                </span>
                <span style={{ color: '#a78bfa', whiteSpace: 'nowrap', fontSize: '11px', flexShrink: 0 }}>
                  [{entry.service}]
                </span>
                <span style={{
                  flex: 1, wordBreak: 'break-all', fontSize: '12px',
                  color: entry.level === 'ERROR' ? '#fca5a5' : entry.level === 'WARN' ? '#fcd34d' : '#e5e7eb',
                }}>
                  {entry.message}
                </span>
                <button
                  style={{ opacity: 0, color: '#6b7280', cursor: 'pointer', background: 'none', border: 'none', padding: '2px', flexShrink: 0, transition: 'opacity 0.15s' }}
                  onClick={() => navigator.clipboard.writeText(entry.raw)}
                  title="复制此行"
                >
                  <Copy size={11} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LogViewer;
