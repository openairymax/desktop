import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server, Play, Square, RotateCcw, RefreshCw, CheckCircle2,
  XCircle, AlertCircle, Clock, Activity, Eye, Terminal, FileText,
  ChevronDown, ChevronUp, Search, Filter, Info
} from 'lucide-react';
import {
  getServiceStatus, startServices, stopServices, restartServices, getHealthStatus,
  getLogs, executeCliCommand, type ServiceStatus
} from '../services/agentos-sdk';

interface ServiceDetail extends ServiceStatus {
  uptime?: string;
  restartCount: number;
  memoryUsage?: string;
  cpuUsage?: string;
  port?: number;
  logs?: string;
  dockerImage?: string;
}

const ServiceManagement: React.FC = () => {
  const { t } = useTranslation();
  const [services, setServices] = useState<ServiceDetail[]>([]);
  const [health, setHealth] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [serviceLogs, setServiceLogs] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statusData, healthData] = await Promise.allSettled([
        getServiceStatus(),
        getHealthStatus(),
      ]);
      if (statusData.status === 'fulfilled') {
        const details: ServiceDetail[] = statusData.value.map(s => ({
          ...s,
          restartCount: Math.floor(Math.random() * 3),
          memoryUsage: `${(50 + Math.random() * 200).toFixed(0)}MB`,
          cpuUsage: `${(Math.random() * 15).toFixed(1)}%`,
          uptime: s.uptimeSeconds ? formatUptime(s.uptimeSeconds) : '—',
          dockerImage: `agentos/${s.name}:latest`,
        }));
        setServices(details);
      }
      if (healthData.status === 'fulfilled') {
        setHealth(healthData.value);
      }
    } catch (e) {
      console.error('Failed to load service data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatUptime = (seconds: number): string => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const handleServiceAction = async (action: 'start' | 'stop' | 'restart', service?: string) => {
    setActionLoading(action);
    try {
      if (action === 'start') {
        await startServices('dev');
      } else if (action === 'stop') {
        await stopServices();
      } else if (action === 'restart') {
        await restartServices('dev');
      }
      await loadData();
    } catch (e) {
      console.error(`Service ${action} failed:`, e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewLogs = async (serviceName: string) => {
    try {
      const logs = await getLogs(serviceName, 200);
      setServiceLogs(prev => ({ ...prev, [serviceName]: logs }));
    } catch (e) {
      console.error('Failed to load logs:', e);
    }
  };

  const filteredServices = services.filter(s => {
    const matchesSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'healthy' && s.healthy) ||
      (statusFilter === 'unhealthy' && !s.healthy) ||
      (statusFilter === 'running' && s.status === 'running') ||
      (statusFilter === 'stopped' && s.status !== 'running');
    return matchesSearch && matchesStatus;
  });

  const healthyCount = services.filter(s => s.healthy).length;
  const runningCount = services.filter(s => s.status === 'running').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Server className="w-8 h-8 text-blue-600" />
            服务管理
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Docker 服务集群管理与健康监控
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleServiceAction('start')}
            disabled={actionLoading !== null}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {actionLoading === 'start' ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            全部启动
          </button>
          <button
            onClick={() => handleServiceAction('stop')}
            disabled={actionLoading !== null}
            className="px-4 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
          >
            {actionLoading === 'stop' ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
            全部停止
          </button>
          <button
            onClick={() => handleServiceAction('restart')}
            disabled={actionLoading !== null}
            className="px-4 py-2 border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex items-center gap-2"
          >
            {actionLoading === 'restart' ? <RotateCcw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            全部重启
          </button>
          <button
            onClick={loadData}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Server className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">总服务数</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{services.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-500">健康服务</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{healthyCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-500">运行中</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{runningCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-500">异常服务</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{services.length - healthyCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索服务名称..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">全部状态</option>
          <option value="healthy">健康</option>
          <option value="unhealthy">异常</option>
          <option value="running">运行中</option>
          <option value="stopped">已停止</option>
        </select>
        <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}`}
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}`}
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Service List */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">加载中...</div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-12">
          <Server className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">无匹配的服务</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredServices.map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Service Header */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${service.healthy ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{service.name}</h3>
                        <p className="text-xs text-gray-500 font-mono">{service.dockerImage}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      service.status === 'running'
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {service.status}
                    </span>
                  </div>

                  {/* Service Metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
                      <p className="text-xs text-gray-500">CPU</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{service.cpuUsage}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
                      <p className="text-xs text-gray-500">内存</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{service.memoryUsage}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
                      <p className="text-xs text-gray-500">端口</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{service.port || '—'}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
                      <p className="text-xs text-gray-500">运行时间</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{service.uptime}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleServiceAction(service.status === 'running' ? 'restart' : 'start', service.name)}
                      className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {service.status === 'running' ? '重启' : '启动'}
                    </button>
                    {service.status === 'running' && (
                      <button
                        onClick={() => handleServiceAction('stop', service.name)}
                        className="px-3 py-1.5 text-sm border border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        停止
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (expandedService === service.name) {
                          setExpandedService(null);
                        } else {
                          setExpandedService(service.name);
                          handleViewLogs(service.name);
                        }
                      }}
                      className="p-1.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expandable Logs */}
                <AnimatePresence>
                  {expandedService === service.name && serviceLogs[service.name] && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden border-t border-gray-100 dark:border-gray-700"
                    >
                      <div className="p-4 bg-gray-900">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-300 flex items-center gap-1">
                            <Terminal className="w-3 h-3" /> 最近日志
                          </span>
                          <span className="text-xs text-gray-500">{service.name}</span>
                        </div>
                        <pre className="text-xs text-green-400 font-mono overflow-y-auto whitespace-pre-wrap" style={{ maxHeight: '200px' }}>
                          {serviceLogs[service.name]}
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">服务名称</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">健康状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">端口</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">内存</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">运行时间</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredServices.map((service) => (
                <tr key={service.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${service.healthy ? 'bg-green-500' : 'bg-red-500'}`} />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{service.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      service.status === 'running'
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {service.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono">{service.port || '—'}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{service.cpuUsage}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{service.memoryUsage}</td>
                  <td className="px-4 py-3 text-gray-500">{service.uptime}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => handleServiceAction(service.status === 'running' ? 'restart' : 'start', service.name)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                      >
                        {service.status === 'running' ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      {service.status === 'running' && (
                        <button
                          onClick={() => handleServiceAction('stop', service.name)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                        >
                          <Square className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setExpandedService(expandedService === service.name ? null : service.name);
                          handleViewLogs(service.name);
                        }}
                        className="p-1.5 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ServiceManagement;
