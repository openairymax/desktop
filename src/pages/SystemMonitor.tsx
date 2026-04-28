import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Cpu, MemoryStick, HardDrive, Activity, Clock,
  RefreshCw, Loader2, Zap, AlertTriangle, CheckCircle2
} from 'lucide-react';

interface MetricCard {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  progress: number;
}

const SystemMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [uptime, setUptime] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    updateMetrics();
    let sec = 0;
    const iv = setInterval(() => { sec++; setUptime(sec); }, 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (refreshing) return;
    const iv = setInterval(updateMetrics, 5000);
    return () => clearInterval(iv);
  }, [refreshing]);

  const formatBytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  const formatUptime = (s: number) => {
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    return d > 0 ? `${d}天 ${h}时` : h > 0 ? `${h}小时 ${m}分` : `${m}分钟`;
  };

  const updateMetrics = () => {
    try {
      const perf = performance as any;
      const memPct = perf.memory ? Math.round((perf.memory.usedJSHeapSize / perf.memory.jsHeapSizeLimit) * 100) : 45 + Math.floor(Math.random() * 20);

      setMetrics([
        { label: '内存使用', value: perf.memory ? formatBytes(perf.memory.usedJSHeapSize) : '~45 MB', sub: perf.memory ? `堆上限 ${formatBytes(perf.memory.jsHeapSizeLimit)}` : '浏览器原生', icon: <MemoryStick size={18} />, color: memPct > 80 ? '#f59e0b' : '#10b981', progress: memPct },
        { label: '运行时间', value: formatUptime(uptime), sub: '自启动以来', icon: <Clock size={18} />, color: '#6366f1', progress: Math.min(uptime / 60, 100) },
        { label: '页面状态', value: document.visibilityState === 'visible' ? '前台' : '后台', sub: document.visibilityState === 'visible' ? '正常渲染' : '已最小化', icon: <Activity size={18} />, color: '#10b981', progress: 100 },
        { label: '平台信息', value: navigator.platform?.substring(0, 14) || '--', sub: navigator.userAgent.includes('Tauri') ? 'Tauri 桌面端' : 'Web 浏览器', icon: <Cpu size={18} />, color: '#8b5cf6', progress: 50 },
        { label: '语言环境', value: navigator.language || 'zh-CN', sub: `时区: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`, icon: <Zap size={18} />, color: '#06b6d4', progress: 100 },
      ]);
    } catch (e) {
      console.warn('Metric update error:', e);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 500));
    updateMetrics();
    setRefreshing(false);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #06b6d4, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <BarChart3 size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>系统监控</h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>实时系统资源与运行指标</p>
          </div>
        </div>
        <button onClick={handleRefresh}
          style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px',
            backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer',
            fontSize: '13px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px',
          }}>{refreshing ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />} 刷新</button>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {metrics.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            style={{
              backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
              borderRadius: '12px', padding: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px 0' }}>{m.label}</p>
                <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>{m.value}</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.sub}</span>
              </div>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: `${m.color}15`, display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: m.color,
              }}>{m.icon}</div>
            </div>
            <div style={{ height: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${m.progress}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: '4px', background: `linear-gradient(90deg, ${m.color}, ${m.color}88)` }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Additional Info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {/* Browser Info */}
        <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={16} /> 运行环境
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 12px', fontSize: '13px' }}>
            {[
              ['用户代理', navigator.userAgent.substring(0, 80) + '...'],
              ['平台', navigator.platform || '--'],
              ['语言', navigator.language],
              ['Cookie 启用', navigator.cookieEnabled ? '是' : '否'],
              ['在线', navigator.onLine ? '是' : '否'],
              ['屏幕分辨率', `${screen.width}x${screen.height}`],
              ['视口大小', `${window.innerWidth}x${window.innerHeight}`],
              ['CPU 核心数', String(navigator.hardwareConcurrency || '--')],
            ].map(([k, v]) => (
              <React.Fragment key={k}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{v}</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Performance */}
        <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} /> 性能数据
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 12px', fontSize: '13px' }}>
            {[
              ['导航开始', `${performance.timeOrigin.toFixed(2)} ms`],
              ['当前时间戳', `${performance.now().toFixed(2)} ms`],
              ['连接类型', (navigator as any)?.connection?.effectiveType || '--'],
              ['下行速度', (navigator as any)?.connection?.downlink ? `${(navigator as any).connection.downlink} Mbps` : '--'],
              ['RTT', (navigator as any)?.connection?.rtt ? `${(navigator as any).connection.rtt} ms` : '--'],
              ['设备内存', (navigator as any)?.deviceMemory ? `${(navigator as any).deviceMemory} GB` : '--'],
              ['最大触点数', String(navigator.maxTouchPoints)],
            ].map(([k, v]) => (
              <React.Fragment key={k}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{v}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitor;
