import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
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
    if (percent < 50) return 'text-green-500';
    if (percent < 80) return 'text-amber-500';
    return 'text-red-500';
  };

  const getBarColor = (percent: number): string => {
    if (percent < 50) return 'bg-green-500';
    if (percent < 80) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (loading && !monitor) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
        <span className="ml-3 text-gray-500">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-8 h-8 text-blue-600" />
            {t('systemMonitor.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('systemMonitor.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={refreshRate}
            onChange={(e) => setRefreshRate(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value={1000}>{t('systemMonitor.everySecond')}</option>
            <option value={2000}>{t('systemMonitor.every2Seconds')}</option>
            <option value={5000}>{t('systemMonitor.every5Seconds')}</option>
          </select>
          <button
            onClick={loadData}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {monitor && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t('systemMonitor.cpu')}</h3>
                </div>
                <span className={`text-2xl font-bold ${getUsageColor(monitor.cpu.usagePercent)}`}>
                  {monitor.cpu.usagePercent.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                <div className={`${getBarColor(monitor.cpu.usagePercent)} h-3 rounded-full transition-all`} style={{ width: `${monitor.cpu.usagePercent}%` }} />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {monitor.cpu.cores.slice(0, 8).map((core) => (
                  <div key={core.coreId} className="text-center">
                    <div className="text-xs text-gray-500">#{core.coreId}</div>
                    <div className={`text-sm font-medium ${getUsageColor(core.usage)}`}>{core.usage.toFixed(0)}%</div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                      <div className={`${getBarColor(core.usage)} h-1.5 rounded-full`} style={{ width: `${core.usage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MemoryStick className="w-5 h-5 text-purple-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t('systemMonitor.memory')}</h3>
                </div>
                <span className={`text-2xl font-bold ${getUsageColor(monitor.memory.percent)}`}>
                  {monitor.memory.percent.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                <div className={`${getBarColor(monitor.memory.percent)} h-3 rounded-full transition-all`} style={{ width: `${monitor.memory.percent}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-500">{t('systemMonitor.total')}</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{monitor.memory.totalGb.toFixed(1)} GB</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('systemMonitor.used')}</p>
                  <p className={`text-lg font-semibold ${getUsageColor(monitor.memory.percent)}`}>{monitor.memory.usedGb.toFixed(1)} GB</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('systemMonitor.free')}</p>
                  <p className="text-lg font-semibold text-green-600">{monitor.memory.freeGb.toFixed(1)} GB</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-amber-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t('systemMonitor.disk')}</h3>
                </div>
                <span className={`text-2xl font-bold ${getUsageColor(monitor.disk.percent)}`}>
                  {monitor.disk.percent.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                <div className={`${getBarColor(monitor.disk.percent)} h-3 rounded-full transition-all`} style={{ width: `${monitor.disk.percent}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-500">{t('systemMonitor.total')}</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{monitor.disk.totalGb.toFixed(0)} GB</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('systemMonitor.used')}</p>
                  <p className={`text-lg font-semibold ${getUsageColor(monitor.disk.percent)}`}>{monitor.disk.usedGb.toFixed(0)} GB</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('systemMonitor.free')}</p>
                  <p className="text-lg font-semibold text-green-600">{monitor.disk.freeGb.toFixed(0)} GB</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Network className="w-5 h-5 text-cyan-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">{t('systemMonitor.network')}</h3>
              </div>
              {monitor.network.length === 0 ? (
                <p className="text-sm text-gray-400">{t('systemMonitor.noNetwork')}</p>
              ) : (
                <div className="space-y-3">
                  {monitor.network.map((iface) => (
                    <div key={iface.name} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{iface.name}</p>
                        <p className="text-xs text-gray-500">{iface.ipv4 || '—'}</p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <p>↑ {formatBytes(iface.bytesSent)}</p>
                        <p>↓ {formatBytes(iface.bytesRecv)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500">{t('systemMonitor.uptime')}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatUptime(monitor.uptimeSeconds)}</p>
              </div>
            </motion.div>
          </div>

          {processes.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <button
                onClick={() => setShowProcesses(!showProcesses)}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-gray-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t('systemMonitor.topProcesses')}</h3>
                  <span className="text-sm text-gray-500">({processes.length})</span>
                </div>
                {showProcesses ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>
              {showProcesses && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('systemMonitor.pid')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('systemMonitor.processName')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('systemMonitor.cpuUsage')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('systemMonitor.memUsage')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('systemMonitor.status')}</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('systemMonitor.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {processes.slice(0, 20).map((proc) => (
                        <tr key={proc.pid} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 text-gray-900 dark:text-white font-mono">{proc.pid}</td>
                          <td className="px-4 py-3 text-gray-900 dark:text-white truncate max-w-[200px]" title={proc.name}>{proc.name}</td>
                          <td className={`px-4 py-3 font-medium ${getUsageColor(proc.cpuPercent)}`}>{proc.cpuPercent.toFixed(1)}%</td>
                          <td className="px-4 py-3 text-gray-900 dark:text-white">{proc.memoryMb} MB</td>
                          <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">{proc.status}</span></td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleKillProcess(proc.pid, proc.name)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title={t('systemMonitor.kill')}
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default SystemMonitor;
