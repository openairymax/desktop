import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Cpu,
  MemoryStick,
  HardDrive,
  Activity,
  Clock,
  RefreshCw,
  Loader2,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';

interface SystemData {
  cpu: { usagePercent: number; cores: Array<{ coreId: number; usage: number }> };
  memory: { totalGb: number; usedGb: number; freeGb: number; percent: number };
  disk: { totalGb: number; usedGb: number; freeGb: number; percent: number };
  network: Array<{
    name: string;
    ipv4: string;
    mac: string;
    isUp: boolean;
    bytesSent: number;
    bytesRecv: number;
  }>;
  uptimeSeconds: number;
}

interface MetricCard {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  progress: number;
}

const SystemMonitor: React.FC = () => {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [systemData, setSystemData] = useState<SystemData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const formatUptime = useCallback((s: number) => {
    const d = Math.floor(s / 86400),
      h = Math.floor((s % 86400) / 3600),
      m = Math.floor((s % 3600) / 60);
    if (d > 0) return t('systemMonitorExtended.uptimeFormat', { days: d, hours: h });
    if (h > 0) return t('systemMonitorExtended.uptimeFormatHours', { hours: h, minutes: m });
    return t('systemMonitorExtended.uptimeFormatMinutes', { minutes: m });
  }, [t]);

  const updateBrowserMetrics = useCallback(() => {
    const perf = performance as Performance & {
      memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
    };
    const memPct = perf.memory
      ? Math.round((perf.memory.usedJSHeapSize / perf.memory.jsHeapSizeLimit) * 100)
      : 45;

    setMetrics([
      {
        label: t('systemMonitorExtended.jsHeapMemory'),
        value: perf.memory ? `${(perf.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB` : '--',
        sub: perf.memory
          ? t('systemMonitorExtended.memoryLimit', {
              mb: (perf.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(0),
            })
          : t('systemMonitorExtended.browserNotSupported'),
        icon: <MemoryStick size={18} />,
        color: memPct > 80 ? '#f59e0b' : '#10b981',
        progress: memPct,
      },
      {
        label: t('systemMonitorExtended.platform'),
        value: navigator.platform?.substring(0, 14) || '--',
        sub: navigator.userAgent.includes('Tauri')
          ? t('systemMonitorExtended.tauriDesktop')
          : t('systemMonitorExtended.webBrowser'),
        icon: <Cpu size={18} />,
        color: '#8b5cf6',
        progress: 50,
      },
      {
        label: t('systemMonitorExtended.language'),
        value: navigator.language || 'zh-CN',
        sub: t('systemMonitorExtended.timezone', {
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
        icon: <Zap size={18} />,
        color: '#06b6d4',
        progress: 100,
      },
      {
        label: t('systemMonitorExtended.onlineStatus'),
        value: navigator.onLine
          ? t('systemMonitorExtended.online')
          : t('systemMonitorExtended.offline'),
        sub: navigator.onLine
          ? t('systemMonitorExtended.networkAvailable')
          : t('systemMonitorExtended.networkUnavailable'),
        icon: navigator.onLine ? <Wifi size={18} /> : <WifiOff size={18} />,
        color: navigator.onLine ? '#10b981' : '#ef4444',
        progress: navigator.onLine ? 100 : 0,
      },
    ]);
  }, [t]);

  const fetchSystemData = useCallback(async () => {
    try {
      const data = await invoke<SystemData>('system_monitor');
      setSystemData(data);
      setConnected(true);
      setError(null);

      const cpuColor =
        data.cpu.usagePercent > 80 ? '#ef4444' : data.cpu.usagePercent > 60 ? '#f59e0b' : '#10b981';
      const memColor =
        data.memory.percent > 80 ? '#ef4444' : data.memory.percent > 60 ? '#f59e0b' : '#10b981';
      const diskColor =
        data.disk.percent > 80 ? '#ef4444' : data.disk.percent > 60 ? '#f59e0b' : '#10b981';

      setMetrics([
        {
          label: t('systemMonitorExtended.cpuUsage'),
          value: `${data.cpu.usagePercent.toFixed(1)}%`,
          sub: t('systemMonitorExtended.cores', { count: data.cpu.cores.length }),
          icon: <Cpu size={18} />,
          color: cpuColor,
          progress: data.cpu.usagePercent,
        },
        {
          label: t('systemMonitorExtended.memoryUsage'),
          value: `${data.memory.usedGb.toFixed(1)} / ${data.memory.totalGb.toFixed(1)} GB`,
          sub: t('systemMonitorExtended.memoryAvailable', {
            gb: data.memory.freeGb.toFixed(1),
            percent: data.memory.percent.toFixed(1),
          }),
          icon: <MemoryStick size={18} />,
          color: memColor,
          progress: data.memory.percent,
        },
        {
          label: t('systemMonitorExtended.diskUsage'),
          value: `${data.disk.usedGb.toFixed(0)} / ${data.disk.totalGb.toFixed(0)} GB`,
          sub: t('systemMonitorExtended.diskAvailable', {
            gb: data.disk.freeGb.toFixed(0),
            percent: data.disk.percent.toFixed(1),
          }),
          icon: <HardDrive size={18} />,
          color: diskColor,
          progress: data.disk.percent,
        },
        {
          label: t('systemMonitorExtended.uptime'),
          value: formatUptime(data.uptimeSeconds),
          sub: t('systemMonitorExtended.sinceBoot'),
          icon: <Clock size={18} />,
          color: '#6366f1',
          progress: Math.min((data.uptimeSeconds / 86400) * 100, 100),
        },
        {
          label: t('systemMonitorExtended.networkInterfaces'),
          value: t('systemMonitorExtended.activeCount', {
            count: data.network.filter((n) => n.isUp).length,
          }),
          sub: t('systemMonitorExtended.totalInterfaces', { count: data.network.length }),
          icon: data.network.some((n) => n.isUp) ? <Wifi size={18} /> : <WifiOff size={18} />,
          color: data.network.some((n) => n.isUp) ? '#10b981' : '#ef4444',
          progress:
            data.network.length > 0
              ? (data.network.filter((n) => n.isUp).length / data.network.length) * 100
              : 0,
        },
      ]);

      setLastUpdate(new Date());
    } catch (e) {
      setConnected(false);
      setError(e instanceof Error ? e.message : String(e));
      updateBrowserMetrics();
    }
  }, [t, formatUptime, updateBrowserMetrics]);

  useEffect(() => {
    let cancelled = false;
    if (!cancelled) fetchSystemData();
    return () => { cancelled = true; };
  }, [fetchSystemData]);

  useEffect(() => {
    if (refreshing) return;
    let cancelled = false;
    const iv = setInterval(() => {
      if (!cancelled) fetchSystemData();
    }, 5000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [refreshing, fetchSystemData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSystemData();
    setRefreshing(false);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <BarChart3 size={20} />
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: '700',
                color: 'var(--text-primary)',
              }}
            >
              {t('systemMonitor.title')}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {t('systemMonitorExtended.realtimeMetrics')}
              </span>
              {connected ? (
                <span
                  role="status"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: '#10b981',
                  }}
                >
                  <CheckCircle2 size={12} /> {t('systemMonitorExtended.backendConnected')}
                </span>
              ) : (
                <span
                  role="status"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: '#f59e0b',
                  }}
                >
                  <AlertTriangle size={12} /> {t('systemMonitorExtended.browserMode')}
                </span>
              )}
              {lastUpdate && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {t('systemMonitorExtended.updatedAt', { time: lastUpdate.toLocaleTimeString() })}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="刷新监控数据"
          style={{
            padding: '8px 12px',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            cursor: refreshing ? 'wait' : 'pointer',
            fontSize: '13px',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {refreshing ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}{' '}
          {t('common.refresh')}
        </button>
      </div>

      {error && !connected && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            marginBottom: '16px',
            background: 'var(--bg-error)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: 'var(--error)',
          }}
        >
          <AlertTriangle size={14} /> {t('systemMonitorExtended.backendUnavailable', { error })}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            role="status"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    margin: '0 0 4px 0',
                  }}
                >
                  {m.label}
                </p>
                <h3
                  style={{
                    fontSize: '22px',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    margin: 0,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {m.value}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.sub}</span>
              </div>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: `${m.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: m.color,
                }}
              >
                {m.icon}
              </div>
            </div>
            <div
              style={{
                height: '4px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${m.progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  borderRadius: '4px',
                  background: `linear-gradient(90deg, ${m.color}, ${m.color}88)`,
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {systemData && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Cpu size={16} /> {t('systemMonitorExtended.cpuCoreDetails')}
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                gap: '8px',
              }}
            >
              {systemData.cpu.cores.map((core) => (
                <div
                  key={core.coreId}
                  style={{
                    textAlign: 'center',
                    padding: '8px 4px',
                    borderRadius: '8px',
                    background:
                      core.usage > 80 ? '#ef444415' : core.usage > 50 ? '#f59e0b15' : '#10b98115',
                  }}
                >
                  <div
                    style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}
                  >
                    Core {core.coreId}
                  </div>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: core.usage > 80 ? '#ef4444' : core.usage > 50 ? '#f59e0b' : '#10b981',
                    }}
                  >
                    {core.usage}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Activity size={16} /> {t('systemMonitorExtended.networkInterfaceDetails')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {systemData.network.map((iface) => (
                <div
                  key={iface.name}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-tertiary)',
                  }}
                >
                  <div>
                    <span
                      style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)' }}
                    >
                      {iface.name}
                    </span>
                    <span
                      style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-muted)' }}
                    >
                      {iface.ipv4}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: iface.isUp ? '#10b981' : '#ef4444' }}>
                    {iface.isUp ? 'UP' : 'DOWN'}
                  </span>
                </div>
              ))}
              {systemData.network.length === 0 && (
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    padding: '12px',
                  }}
                >
                  {t('systemMonitorExtended.noNetworkData')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!systemData && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Cpu size={16} /> {t('systemMonitorExtended.runtimeEnvironment')}
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '8px 12px',
                fontSize: '13px',
              }}
            >
              {[
                [t('systemMonitorExtended.platformLabel'), navigator.platform || '--'],
                [t('systemMonitorExtended.languageLabel'), navigator.language],
                [
                  t('systemMonitorExtended.onlineLabel'),
                  navigator.onLine ? t('systemMonitorExtended.yes') : t('systemMonitorExtended.no'),
                ],
                [
                  t('systemMonitorExtended.cpuCores'),
                  String(navigator.hardwareConcurrency || '--'),
                ],
                [t('systemMonitorExtended.screenResolution'), `${screen.width}x${screen.height}`],
                [
                  t('systemMonitorExtended.viewportSize'),
                  `${window.innerWidth}x${window.innerHeight}`,
                ],
              ].map(([k, v]) => (
                <React.Fragment key={k}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                    {v}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Activity size={16} /> {t('systemMonitorExtended.performanceData')}
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '8px 12px',
                fontSize: '13px',
              }}
            >
              {[
                [t('systemMonitorExtended.navStart'), `${performance.timeOrigin.toFixed(2)} ms`],
                [t('systemMonitorExtended.currentTimestamp'), `${performance.now().toFixed(2)} ms`],
                [
                  t('systemMonitorExtended.connectionType'),
                  (navigator as Navigator & { connection?: { effectiveType?: string } })?.connection?.effectiveType || '--',
                ],
                [
                  t('systemMonitorExtended.deviceMemory'),
                  (navigator as Navigator & { deviceMemory?: number })?.deviceMemory
                    ? `${(navigator as Navigator & { deviceMemory?: number }).deviceMemory} GB`
                    : '--',
                ],
              ].map(([k, v]) => (
                <React.Fragment key={k}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{v}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemMonitor;
