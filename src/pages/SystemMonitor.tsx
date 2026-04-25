import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Cpu, MemoryStick, HardDrive, Activity, RefreshCw,
  Loader2, AlertCircle, Wifi, Clock, Zap
} from 'lucide-react';
import { useHealth, useConnection, useTasks, useAgents, useMemory, useSessions, useSkills } from '../hooks/useAgentOS';

const SystemMonitor: React.FC = () => {
  const { health, metrics, fetchHealth, fetchMetrics, loading: healthLoading } = useHealth();
  const { connection } = useConnection();
  const { tasks, fetchTasks } = useTasks();
  const { agents, fetchAgents } = useAgents();
  const { memories, fetchMemories } = useMemory();
  const { sessions, fetchSessions } = useSessions();
  const { skills, fetchSkills } = useSkills();

  const [refreshRate, setRefreshRate] = useState(5000);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAll();
    if (refreshRate > 0) {
      const interval = setInterval(fetchAll, refreshRate);
      return () => clearInterval(interval);
    }
  }, [refreshRate]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.allSettled([fetchHealth(), fetchMetrics(), fetchTasks(), fetchAgents(), fetchMemories(), fetchSessions(), fetchSkills()]);
    } finally {
      setLoading(false);
    }
  };

  const isUp = connection.status === 'connected';

  const systemMetrics: Array<{ label: string; value: string | number; icon: React.ReactNode; color: string; bg: string }> = [
    { label: '网关状态', value: isUp ? '在线' : '离线', icon: <Wifi size={18} />, color: isUp ? 'var(--success-color)' : 'var(--error-color)', bg: isUp ? 'var(--success-light)' : 'var(--error-light)' },
    { label: '健康状态', value: health?.status || '—', icon: <Activity size={18} />, color: health?.status === 'ok' ? 'var(--success-color)' : 'var(--warning-color)', bg: health?.status === 'ok' ? 'var(--success-light)' : 'var(--warning-light)' },
    { label: '版本', value: health?.version || '—', icon: <Zap size={18} />, color: 'var(--info-color)', bg: 'var(--info-light)' },
    { label: '运行时间', value: health?.uptime || '—', icon: <Clock size={18} />, color: 'var(--primary-color)', bg: 'var(--primary-light)' },
    { label: '任务总数', value: tasks.length, icon: <Activity size={18} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: '智能体', value: agents.length, icon: <Cpu size={18} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { label: '记忆条目', value: memories.length, icon: <MemoryStick size={18} />, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    { label: '活跃会话', value: (sessions as any[]).filter((s: any) => s.status === 'active').length, icon: <Clock size={18} />, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
    { label: '已注册技能', value: skills.length, icon: <Zap size={18} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  ];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #ef4444, #f97316)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          }}>
            <Activity size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              系统监控
            </h1>
            <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)' }}>AgentOS 平台资源与运行状态监控</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select value={refreshRate} onChange={e => setRefreshRate(Number(e.target.value))} style={{
            padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
          }}>
            <option value={0}>手动刷新</option>
            <option value={3000}>3秒</option>
            <option value={5000}>5秒</option>
            <option value={10000}>10秒</option>
          </select>
          <button onClick={fetchAll} disabled={loading} style={{
            padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', fontSize: 'var(--font-size-md)',
            transition: 'all var(--transition-fast)',
          }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 刷新
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {systemMetrics.map(m => (
          <motion.div key={m.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px',
              boxShadow: 'var(--shadow-sm)', transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{
              width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
              backgroundColor: m.bg, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {m.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{m.label}</p>
              <p style={{ margin: '2px 0 0 0', fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: m.color }}>{m.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {metrics && Object.keys(metrics).length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
          backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)', padding: '20px',
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HardDrive size={16} style={{ color: '#ef4444' }} /> Gateway 指标
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
            {Object.entries(metrics).map(([key, value]) => (
              <div key={key} style={{
                padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                display: 'flex', flexDirection: 'column', gap: '4px',
              }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{key}</span>
                <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {typeof value === 'number' ? value.toLocaleString() : String(value)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {!isUp && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
          marginTop: '16px', padding: '16px', backgroundColor: 'var(--error-light)',
          border: '1px solid var(--error-color)', borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--error-color)',
        }}>
          <AlertCircle size={18} />
          <span>Gateway 未连接。请在设置页面配置连接地址。</span>
        </motion.div>
      )}
    </div>
  );
};

export default SystemMonitor;
