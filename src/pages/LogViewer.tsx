import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText, Search, Filter, Download, RefreshCw, Play, Pause,
  Trash2, ChevronDown, AlertCircle, Info, AlertTriangle, XCircle,
  Loader2, Copy, CheckCircle2, ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import sdk, { ServiceStatus } from '../services/agentos-sdk';

const LOG_LEVELS = [
  { value: 'all', label: '全部级别', color: '#6b7280', icon: FileText },
  { value: 'debug', label: 'DEBUG', color: '#6b7280', icon: Info },
  { value: 'info', label: 'INFO', color: '#3b82f6', icon: Info },
  { value: 'warn', label: 'WARNING', color: '#f59e0b', icon: AlertTriangle },
  { value: 'error', label: 'ERROR', color: '#ef4444', icon: XCircle },
];

const MOCK_SERVICES: ServiceStatus[] = [
  { name: 'kernel', status: 'running', healthy: true, port: 18789 },
  { name: 'gateway', status: 'running', healthy: true, port: 18790 },
  { name: 'memory', status: 'running', healthy: true, port: 18791 },
  { name: 'docker-proxy', status: 'running', healthy: true, port: 2375 },
];

const LOG_COLORS: Record<string, string> = {
  DEBUG: '#6b7280',
  INFO: '#3b82f6',
  WARN: '#f59e0b',
  ERROR: '#ef4444',
};

const generateMockLogs = (service: string, count: number): string[] => {
  const logs: string[] = [];
  const messages = [
    'Request processed successfully',
    'Connection established to database',
    'Cache miss for key: user_session',
    'Task queued for execution',
    'Health check passed',
    'Memory allocation: 256MB',
    'Cognitive loop iteration completed',
    'Tool call executed: web_search',
    'Response generated in 245ms',
    'Agent state updated',
    'Configuration reloaded',
    'Rate limit check passed',
    'Token count: 1024/8192',
    'Service discovery completed',
    'WebSocket connection opened',
  ];
  const levels = ['DEBUG', 'INFO', 'INFO', 'INFO', 'WARN', 'ERROR', 'INFO', 'DEBUG'];

  for (let i = 0; i < count; i++) {
    const level = levels[Math.floor(Math.random() * levels.length)];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    const time = new Date(Date.now() - i * 30000).toISOString();
    logs.push(`${time} [${level}] [${service}] ${msg} (id=${Math.random().toString(36).slice(2, 8)})`);
  }
  return logs.reverse();
};

interface LogEntry {
  timestamp: string;
  level: string;
  service: string;
  message: string;
  raw: string;
}

const LogViewer: React.FC = () => {
  const [services, setServices] = useState<ServiceStatus[]>(MOCK_SERVICES);
  const [selectedService, setSelectedService] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [rawLogs, setRawLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [tailLines, setTailLines] = useState(200);
  const [copied, setCopied] = useState(false);

  const logContainerRef = useRef<HTMLDivElement>(null);

  const parseLogLine = useCallback((line: string): LogEntry | null => {
    const match = line.match(/^(\S+)\s+\[(\w+)\]\s+\[([^\]]+)\]\s+(.*)/);
    if (!match) return null;
    return {
      timestamp: match[1],
      level: match[2],
      service: match[3],
      message: match[4],
      raw: line,
    };
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      let logText: string;
      if (selectedService === 'all') {
        logText = '';
        for (const svc of services) {
          try {
            const svcLogs = await sdk.getLogs(svc.name, tailLines);
            logText += svcLogs ? `${svcLogs}\n` : '';
          } catch {
            const mock = generateMockLogs(svc.name, 20).join('\n');
            logText += `${mock}\n`;
          }
        }
      } else {
        try {
          logText = await sdk.getLogs(selectedService, tailLines);
        } catch {
          logText = generateMockLogs(selectedService, tailLines).join('\n');
        }
      }

      if (!logText || logText.trim().length === 0) {
        const serviceList = selectedService === 'all'
          ? services.map(s => s.name)
          : [selectedService];
        const mockLines: string[] = [];
        for (const svc of serviceList) {
          mockLines.push(...generateMockLogs(svc, 30));
        }
        setRawLogs(mockLines);
      } else {
        const lines = logText.split('\n').filter(l => l.trim());
        setRawLogs(lines);
      }
    } catch (e) {
      console.error('Failed to load logs:', e);
      const serviceList = selectedService === 'all'
        ? services.map(s => s.name)
        : [selectedService];
      const mockLines: string[] = [];
      for (const svc of serviceList) {
        mockLines.push(...generateMockLogs(svc, 30));
      }
      setRawLogs(mockLines);
    } finally {
      setLoading(false);
    }
  }, [selectedService, tailLines, services]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, loadLogs]);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  useEffect(() => {
    const parsed = rawLogs
      .map(line => parseLogLine(line))
      .filter((entry): entry is LogEntry => entry !== null);

    let filtered = parsed;
    if (levelFilter !== 'all') {
      filtered = filtered.filter(e => e.level.toLowerCase() === levelFilter.toLowerCase());
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.message.toLowerCase().includes(term) ||
        e.service.toLowerCase().includes(term) ||
        e.raw.toLowerCase().includes(term)
      );
    }
    setLogs(filtered);
  }, [rawLogs, levelFilter, searchTerm, parseLogLine]);

  const handleDownload = () => {
    const content = rawLogs.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agentos-logs-${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(rawLogs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearLogs = () => {
    setRawLogs([]);
    setLogs([]);
  };

  const scrollToBottom = () => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  };

  const logLevelStats = (() => {
    const stats: Record<string, number> = { DEBUG: 0, INFO: 0, WARN: 0, ERROR: 0 };
    rawLogs.forEach(line => {
      const match = line.match(/\[(\w+)\]/);
      if (match && stats[match[1]] !== undefined) {
        stats[match[1]]++;
      }
    });
    return stats;
  })();

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'DEBUG': return <Info size={14} />;
      case 'INFO': return <Info size={14} />;
      case 'WARN': return <AlertTriangle size={14} />;
      case 'ERROR': return <XCircle size={14} />;
      default: return <FileText size={14} />;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="icon-badge bg-gradient-to-br from-cyan-500 to-blue-600">
            <FileText size={20} color="white" />
          </div>
          <div>
            <h1 className="page-title">日志查看</h1>
            <p className="page-subtitle">实时日志流查看、过滤搜索与下载分析</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className={`btn ${autoRefresh ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Pause size={16} /> : <Play size={16} />}
            {autoRefresh ? '停止刷新' : '自动刷新'}
          </button>
          <button className="btn btn-ghost" onClick={handleCopyAll}>
            {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
            复制全部
          </button>
          <button className="btn btn-ghost" onClick={handleDownload}>
            <Download size={16} /> 下载
          </button>
        </div>
      </div>

      {/* Stats & Filters */}
      <div className="card">
        {/* Log Level Stats */}
        <div className="flex gap-4 mb-4 flex-wrap">
          {Object.entries(logLevelStats).map(([level, count]) => (
            <button
              key={level}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                levelFilter === level.toLowerCase()
                  ? 'text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              style={levelFilter === level.toLowerCase() ? { background: LOG_COLORS[level] } : {}}
              onClick={() => setLevelFilter(levelFilter === level.toLowerCase() ? 'all' : level.toLowerCase())}
            >
              {level}: {count}
            </button>
          ))}
          <span className="text-xs text-gray-400 self-center">
            总计: {rawLogs.length} 条
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="form-group flex-1 min-w-[160px]">
            <select
              className="form-select"
              value={selectedService}
              onChange={e => setSelectedService(e.target.value)}
            >
              <option value="all">全部服务</option>
              {services.map(svc => (
                <option key={svc.name} value={svc.name}>{svc.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group flex-1 min-w-[160px]">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="form-input pl-10"
                placeholder="搜索日志内容..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group min-w-[120px]">
            <select
              className="form-select"
              value={tailLines}
              onChange={e => setTailLines(Number(e.target.value))}
            >
              <option value={50}>最近 50 行</option>
              <option value={100}>最近 100 行</option>
              <option value={200}>最近 200 行</option>
              <option value={500}>最近 500 行</option>
              <option value={1000}>最近 1000 行</option>
            </select>
          </div>
          <button className="btn btn-ghost" onClick={loadLogs} disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            刷新
          </button>
          <button className="btn btn-ghost text-red-500" onClick={handleClearLogs}>
            <Trash2 size={16} />
            清空
          </button>
          <button
            className={`btn ${autoScroll ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setAutoScroll(!autoScroll)}
          >
            <ArrowDown size={16} />
            自动滚动
          </button>
        </div>
      </div>

      {/* Log Display */}
      <div className="card card-elevated" style={{ padding: 0, overflow: 'hidden', background: '#0a0a0f' }}>
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800" style={{ background: '#111118' }}>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#22c55e' }} />
            </div>
            <span className="text-xs text-gray-400 font-mono">
              {selectedService === 'all' ? '所有服务日志' : `${selectedService} 服务日志`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              显示 {logs.length} / {rawLogs.length} 条
            </span>
            <button
              className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded"
              onClick={scrollToBottom}
            >
              <ArrowDown size={12} className="inline mr-1" />
              底部
            </button>
          </div>
        </div>

        {/* Log Lines */}
        <div
          ref={logContainerRef}
          className="overflow-y-auto"
          style={{
            minHeight: '500px',
            maxHeight: 'calc(100vh - 400px)',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            lineHeight: '1.8',
          }}
        >
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <Loader2 size={24} className="animate-spin mr-3" />
              加载日志中...
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <FileText size={48} className="mb-4 text-gray-600" />
              <p>暂无匹配的日志记录</p>
              <p className="text-xs mt-2 text-gray-600">尝试调整筛选条件或点击刷新</p>
            </div>
          ) : (
            logs.map((entry, index) => (
              <div
                key={index}
                className="px-4 py-0.5 hover:bg-white/5 transition-colors flex items-start gap-3 group"
              >
                <span className="text-gray-600 whitespace-nowrap select-none text-xs">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className="whitespace-nowrap select-none font-semibold text-xs px-1.5 py-0.5 rounded"
                  style={{
                    color: LOG_COLORS[entry.level] || '#6b7280',
                    background: `${LOG_COLORS[entry.level] || '#6b7280'}15`,
                  }}
                >
                  {getLevelIcon(entry.level)}
                  {entry.level}
                </span>
                <span className="text-purple-400 whitespace-nowrap select-none text-xs">
                  [{entry.service}]
                </span>
                <span
                  className="flex-1 break-all"
                  style={{
                    color: entry.level === 'ERROR' ? '#fca5a5' :
                      entry.level === 'WARN' ? '#fcd34d' : '#e5e7eb',
                  }}
                >
                  {entry.message}
                </span>
                <button
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-opacity"
                  onClick={() => navigator.clipboard.writeText(entry.raw)}
                  title="复制此行"
                >
                  <Copy size={12} />
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
