import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, MemoryStick, HardDrive, Network, Activity, RefreshCw,
  Terminal, XCircle, ChevronDown, ChevronUp, Eye
} from 'lucide-react';
import { getSystemMonitor, listProcesses, getNetworkInterfaces, killProcess, type SystemMonitorData, type ProcessInfo, type NetworkInterface } from '../services/agentos-sdk';

const SystemMonitor: React.FC = () => {
  const { t } = useTranslation();
  const [monitor, setMonitor] = useState<SystemMonitorData | null>(null);
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [network, setNetwork] = useState<NetworkInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshRate, setRefreshRate] = useState<number>(2000);
  const [showProcesses, setShowProcesses] = useState(true);
  const [showNetwork, setShowNetwork] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [monitorData, procData, netData] = await Promise.allSettled([
        getSystemMonitor(),
        listProcesses(),
        getNetworkInterfaces(),
      ]);
      if (monitorData.status === 'fulfilled') setMonitor(monitorData.value);
      if (procData.status === 'fulfilled') setProcesses(procData.value);
      if (netData.status === 'fulfilled') setNetwork(netData.value);
    } catch (e) {
      console.error('Failed to load system monitor data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, refreshRate);
    return () => clearInterval(interval);
  }, [loadData, refreshRate]);

  const handleKillProcess = async (pid: number, name: string) => {
    if (!window.confirm(t('systemMonitor.killConfirm', { name, pid }))) return;
    try {
      await killProcess(pid, true);
      loadData();
    } catch (e) {
      console.error('Failed to kill process:', e);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${(bytes / 1073741824).toFixed(2)} GB`;
  };

  const formatUptime = (seconds: number): string => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const getUsageColor = (percent: number): string => {
    if (percent < 50) return 'var(--success-color)';
    if (percent < 80) return 'var(--warning-color)';
    return 'var(--error-color)';
  };

  const getBarColor = (percent: number): string => {
    if (percent < 50) return 'var(--success-color)';
    if (percent < 80) return 'var(--warning-color)';
    return 'var(--error-color)';
  };

  if (loading && !monitor) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        minHeight: '400px'
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            marginRight: '12px',
            color: 'var(--text-muted)'
          }}
        >
          <RefreshCw size={32} />
        </motion.div>
        <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-md)' }}>
          {t('common.loading')}
        </span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--primary-color), var(--info-color))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: 'var(--shadow-md)'
          }}>
            <Activity size={20} />
          </div>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}>
              {t('systemMonitor.title')}
            </h1>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: 'var(--font-size-md)',
              color: 'var(--text-muted)',
            }}>
              {t('systemMonitor.subtitle')}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            position: 'relative',
            minWidth: '180px'
          }}>
            <select
              value={refreshRate}
              onChange={(e) => setRefreshRate(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-size-sm)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              <option value={1000}>{t('systemMonitor.everySecond')}</option>
              <option value={2000}>{t('systemMonitor.every2Seconds')}</option>
              <option value={5000}>{t('systemMonitor.every5Seconds')}</option>
            </select>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadData}
            disabled={loading}
            style={{
              padding: '10px 16px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all var(--transition-fast)'
            }}
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCw size={16} />
              </motion.div>
            ) : (
              <RefreshCw size={16} />
            )}
            <span>{t('systemMonitor.refresh')}</span>
          </motion.button>
        </div>
      </motion.div>

      {monitor && (
        <>
          {/* Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }}>
            {/* CPU Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-subtle)',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <Cpu size={18} />
                  </div>
                  <h3 style={{
                    margin: 0,
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)'
                  }}>
                    {t('systemMonitor.cpu')}
                  </h3>
                </div>
                <span style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: getUsageColor(monitor.cpu.usagePercent)
                }}>
                  {monitor.cpu.usagePercent.toFixed(1)}%
                </span>
              </div>
              <div style={{
                width: '100%',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-full)',
                height: '8px',
                marginBottom: '20px',
                overflow: 'hidden'
              }}>
                <motion.div 
                  initial={{ width: '0%' }}
                  animate={{ width: `${monitor.cpu.usagePercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    borderRadius: 'var(--radius-full)',
                    background: getBarColor(monitor.cpu.usagePercent),
                    boxShadow: '0 0 12px rgba(0,0,0,0.1)'
                  }}
                />
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))',
                gap: '12px'
              }}>
                {monitor.cpu.cores.slice(0, 8).map((core) => (
                  <motion.div 
                    key={core.coreId}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: core.coreId * 0.05 }}
                    style={{ textAlign: 'center' }}
                  >
                    <div style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-muted)',
                      marginBottom: '4px'
                    }}>
                      #{core.coreId}
                    </div>
                    <div style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: getUsageColor(core.usage),
                      marginBottom: '6px'
                    }}>
                      {core.usage.toFixed(0)}%
                    </div>
                    <div style={{
                      width: '100%',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-full)',
                      height: '4px'
                    }}>
                      <motion.div 
                        initial={{ width: '0%' }}
                        animate={{ width: `${core.usage}%` }}
                        transition={{ duration: 0.6 }}
                        style={{
                          height: '100%',
                          borderRadius: 'var(--radius-full)',
                          background: getBarColor(core.usage)
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Memory Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-subtle)',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #a855f7, #c084fc)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <MemoryStick size={18} />
                  </div>
                  <h3 style={{
                    margin: 0,
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)'
                  }}>
                    {t('systemMonitor.memory')}
                  </h3>
                </div>
                <span style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: getUsageColor(monitor.memory.percent)
                }}>
                  {monitor.memory.percent.toFixed(1)}%
                </span>
              </div>
              <div style={{
                width: '100%',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-full)',
                height: '8px',
                marginBottom: '20px',
                overflow: 'hidden'
              }}>
                <motion.div 
                  initial={{ width: '0%' }}
                  animate={{ width: `${monitor.memory.percent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    borderRadius: 'var(--radius-full)',
                    background: getBarColor(monitor.memory.percent),
                    boxShadow: '0 0 12px rgba(0,0,0,0.1)'
                  }}
                />
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                textAlign: 'center'
              }}>
                <div>
                  <p style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-muted)',
                    marginBottom: '4px'
                  }}>
                    {t('systemMonitor.total')}
                  </p>
                  <p style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)'
                  }}>
                    {monitor.memory.totalGb.toFixed(1)} GB
                  </p>
                </div>
                <div>
                  <p style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-muted)',
                    marginBottom: '4px'
                  }}>
                    {t('systemMonitor.used')}
                  </p>
                  <p style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: getUsageColor(monitor.memory.percent)
                  }}>
                    {monitor.memory.usedGb.toFixed(1)} GB
                  </p>
                </div>
                <div>
                  <p style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-muted)',
                    marginBottom: '4px'
                  }}>
                    {t('systemMonitor.free')}
                  </p>
                  <p style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--success-color)'
                  }}>
                    {monitor.memory.freeGb.toFixed(1)} GB
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Disk Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-subtle)',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <HardDrive size={18} />
                  </div>
                  <h3 style={{
                    margin: 0,
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)'
                  }}>
                    {t('systemMonitor.disk')}
                  </h3>
                </div>
                <span style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: getUsageColor(monitor.disk.percent)
                }}>
                  {monitor.disk.percent.toFixed(1)}%
                </span>
              </div>
              <div style={{
                width: '100%',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-full)',
                height: '8px',
                marginBottom: '20px',
                overflow: 'hidden'
              }}>
                <motion.div 
                  initial={{ width: '0%' }}
                  animate={{ width: `${monitor.disk.percent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    borderRadius: 'var(--radius-full)',
                    background: getBarColor(monitor.disk.percent),
                    boxShadow: '0 0 12px rgba(0,0,0,0.1)'
                  }}
                />
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                textAlign: 'center'
              }}>
                <div>
                  <p style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-muted)',
                    marginBottom: '4px'
                  }}>
                    {t('systemMonitor.total')}
                  </p>
                  <p style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)'
                  }}>
                    {monitor.disk.totalGb.toFixed(0)} GB
                  </p>
                </div>
                <div>
                  <p style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-muted)',
                    marginBottom: '4px'
                  }}>
                    {t('systemMonitor.used')}
                  </p>
                  <p style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: getUsageColor(monitor.disk.percent)
                  }}>
                    {monitor.disk.usedGb.toFixed(0)} GB
                  </p>
                </div>
                <div>
                  <p style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-muted)',
                    marginBottom: '4px'
                  }}>
                    {t('systemMonitor.free')}
                  </p>
                  <p style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--success-color)'
                  }}>
                    {monitor.disk.freeGb.toFixed(0)} GB
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Network Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-subtle)',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, #06b6d4, #38bdf8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <Network size={18} />
                </div>
                <h3 style={{
                  margin: 0,
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)'
                }}>
                  {t('systemMonitor.network')}
                </h3>
              </div>
              {monitor.network.length === 0 ? (
                <div style={{
                  padding: '20px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-lg)',
                  textAlign: 'center'
                }}>
                  <p style={{
                    color: 'var(--text-muted)',
                    fontSize: 'var(--font-size-sm)'
                  }}>
                    {t('systemMonitor.noNetwork')}
                  </p>
                </div>
              ) : (
                <div style={{ gap: '12px', display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
                  {monitor.network.map((iface) => (
                    <motion.div 
                      key={iface.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-subtle)',
                        transition: 'all var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      }}
                    >
                      <div>
                        <p style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--text-primary)',
                          marginBottom: '4px'
                        }}>
                          {iface.name}
                        </p>
                        <p style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--text-muted)'
                        }}>
                          {iface.ipv4 || '—'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--text-secondary)'
                        }}>
                          ↑ {formatBytes(iface.bytesSent)}
                        </p>
                        <p style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--text-secondary)'
                        }}>
                          ↓ {formatBytes(iface.bytesRecv)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              <div style={{
                paddingTop: '16px',
                borderTop: '1px solid var(--border-subtle)'
              }}>
                <p style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--text-muted)',
                  marginBottom: '4px'
                }}>
                  {t('systemMonitor.uptime')}
                </p>
                <p style={{
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)'
                }}>
                  {formatUptime(monitor.uptimeSeconds)}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Processes Table */}
          {processes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden'
              }}
            >
              <motion.button
                onClick={() => setShowProcesses(!showProcesses)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '20px 24px',
                  background: 'var(--bg-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
                whileHover={{ background: 'var(--bg-tertiary)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)'
                  }}>
                    <Terminal size={16} />
                  </div>
                  <h3 style={{
                    margin: 0,
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)'
                  }}>
                    {t('systemMonitor.topProcesses')}
                  </h3>
                  <span style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-primary)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)'
                  }}>
                    ({processes.length})
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: showProcesses ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown size={20} style={{ color: 'var(--text-muted)' }} />
                </motion.div>
              </motion.button>
              <AnimatePresence>
                {showProcesses && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: 'var(--font-size-sm)'
                      }}>
                        <thead style={{
                          background: 'var(--bg-tertiary)'
                        }}>
                          <tr>
                            <th style={{
                              padding: '12px 16px',
                              textAlign: 'left',
                              fontSize: 'var(--font-size-xs)',
                              fontWeight: 'var(--font-weight-semibold)',
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              borderBottom: '1px solid var(--border-subtle)'
                            }}>
                              {t('systemMonitor.pid')}
                            </th>
                            <th style={{
                              padding: '12px 16px',
                              textAlign: 'left',
                              fontSize: 'var(--font-size-xs)',
                              fontWeight: 'var(--font-weight-semibold)',
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              borderBottom: '1px solid var(--border-subtle)'
                            }}>
                              {t('systemMonitor.processName')}
                            </th>
                            <th style={{
                              padding: '12px 16px',
                              textAlign: 'left',
                              fontSize: 'var(--font-size-xs)',
                              fontWeight: 'var(--font-weight-semibold)',
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              borderBottom: '1px solid var(--border-subtle)'
                            }}>
                              {t('systemMonitor.cpuUsage')}
                            </th>
                            <th style={{
                              padding: '12px 16px',
                              textAlign: 'left',
                              fontSize: 'var(--font-size-xs)',
                              fontWeight: 'var(--font-weight-semibold)',
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              borderBottom: '1px solid var(--border-subtle)'
                            }}>
                              {t('systemMonitor.memUsage')}
                            </th>
                            <th style={{
                              padding: '12px 16px',
                              textAlign: 'left',
                              fontSize: 'var(--font-size-xs)',
                              fontWeight: 'var(--font-weight-semibold)',
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              borderBottom: '1px solid var(--border-subtle)'
                            }}>
                              {t('systemMonitor.status')}
                            </th>
                            <th style={{
                              padding: '12px 16px',
                              textAlign: 'right',
                              fontSize: 'var(--font-size-xs)',
                              fontWeight: 'var(--font-weight-semibold)',
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              borderBottom: '1px solid var(--border-subtle)'
                            }}>
                              {t('systemMonitor.actions')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {processes.slice(0, 20).map((proc) => (
                            <motion.tr 
                              key={proc.pid}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                              style={{
                                borderBottom: '1px solid var(--border-subtle)',
                                transition: 'all var(--transition-fast)'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--bg-tertiary)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              <td style={{
                                padding: '12px 16px',
                                color: 'var(--text-primary)',
                                fontFamily: 'monospace'
                              }}>
                                {proc.pid}
                              </td>
                              <td style={{
                                padding: '12px 16px',
                                color: 'var(--text-primary)',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }} title={proc.name}>
                                {proc.name}
                              </td>
                              <td style={{
                                padding: '12px 16px',
                                fontWeight: 'var(--font-weight-medium)',
                                color: getUsageColor(proc.cpuPercent)
                              }}>
                                {proc.cpuPercent.toFixed(1)}%
                              </td>
                              <td style={{
                                padding: '12px 16px',
                                color: 'var(--text-primary)'
                              }}>
                                {proc.memoryMb} MB
                              </td>
                              <td style={{
                                padding: '12px 16px'
                              }}>
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: 'var(--radius-full)',
                                  fontSize: 'var(--font-size-xs)',
                                  background: 'var(--success-light)',
                                  color: 'var(--success-color)',
                                  fontWeight: 'var(--font-weight-medium)'
                                }}>
                                  {proc.status}
                                </span>
                              </td>
                              <td style={{
                                padding: '12px 16px',
                                textAlign: 'right'
                              }}>
                                <motion.button
                                  onClick={() => handleKillProcess(proc.pid, proc.name)}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--error-color)',
                                    transition: 'all var(--transition-fast)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--error-light)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'none';
                                  }}
                                  title={t('systemMonitor.kill')}
                                >
                                  <XCircle size={16} />
                                </motion.button>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default SystemMonitor;
