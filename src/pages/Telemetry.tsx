import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Activity, Cpu, HardDrive, Network, Clock, TrendingUp, AlertTriangle,
  CheckCircle, XCircle, BarChart3, RefreshCw, Zap, Database, Eye, Bell,
  Filter, Download, LayoutDashboard
} from 'lucide-react'

interface MetricPoint {
  timestamp: number
  value: number
}

interface TelemetryMetric {
  id: string
  name: string
  icon: React.ReactNode
  current: number
  unit: string
  min: number
  max: number
  avg: number
  history: MetricPoint[]
  status: 'normal' | 'warning' | 'critical'
  threshold: number
}

interface AgentOSMetric {
  id: string
  name: string
  value: number
  unit: string
  change: number
  icon: React.ReactNode
}

interface AlertItem {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error'
  message: string
  source: string
  acknowledged: boolean
}

const generateHistory = (base: number, variance: number, points: number = 30): MetricPoint[] => {
  const history: MetricPoint[] = []
  const now = Date.now()
  for (let i = points; i >= 0; i--) {
    history.push({
      timestamp: now - i * 60000,
      value: base + (Math.random() - 0.5) * variance
    })
  }
  return history
}

const defaultMetrics: TelemetryMetric[] = [
  {
    id: 'cpu',
    name: 'CPU 使用率',
    icon: <Cpu size={20} />,
    current: 34.2,
    unit: '%',
    min: 12.5,
    max: 67.8,
    avg: 38.4,
    history: generateHistory(35, 20),
    status: 'normal',
    threshold: 80
  },
  {
    id: 'memory',
    name: '内存使用',
    icon: <Database size={20} />,
    current: 2.4,
    unit: 'GB',
    min: 1.8,
    max: 3.2,
    avg: 2.5,
    history: generateHistory(2.5, 0.8),
    status: 'normal',
    threshold: 3.5
  },
  {
    id: 'network',
    name: '网络延迟',
    icon: <Network size={20} />,
    current: 45,
    unit: 'ms',
    min: 23,
    max: 156,
    avg: 52,
    history: generateHistory(50, 30),
    status: 'normal',
    threshold: 200
  },
  {
    id: 'disk',
    name: '磁盘 I/O',
    icon: <HardDrive size={20} />,
    current: 128,
    unit: 'MB/s',
    min: 45,
    max: 234,
    avg: 142,
    history: generateHistory(130, 80),
    status: 'normal',
    threshold: 300
  }
]

const defaultAgentOSMetrics: AgentOSMetric[] = [
  { id: 'sessions', name: '活跃会话', value: 12, unit: '', change: 8.3, icon: <Activity size={18} /> },
  { id: 'tasks', name: '完成任务', value: 847, unit: '', change: 15.2, icon: <CheckCircle size={18} /> },
  { id: 'tools', name: '工具调用', value: 3421, unit: '', change: 22.7, icon: <Zap size={18} /> },
  { id: 'tokens', name: 'Token 消耗', value: 1.2, unit: 'M', change: -5.4, icon: <BarChart3 size={18} /> }
]

const defaultAlerts: AlertItem[] = [
  { id: '1', timestamp: '2026-04-26 14:23:45', level: 'warning', message: 'CPU 使用率超过 70%', source: 'SystemMonitor', acknowledged: false },
  { id: '2', timestamp: '2026-04-26 13:45:12', level: 'error', message: 'Agent "devops" 连接超时', source: 'AgentManager', acknowledged: true },
  { id: '3', timestamp: '2026-04-26 12:30:00', level: 'info', message: '记忆系统完成自动压缩', source: 'MemoryEvolution', acknowledged: true },
  { id: '4', timestamp: '2026-04-26 11:15:33', level: 'warning', message: '网络延迟波动超过阈值', source: 'Gateway', acknowledged: false },
  { id: '5', timestamp: '2026-04-26 10:02:18', level: 'info', message: '工具注册表更新完成', source: 'ToolManager', acknowledged: true }
]

const MiniChart: React.FC<{ data: MetricPoint[]; color: string; height?: number }> = ({ data, color, height = 40 }) => {
  if (data.length < 2) return null
  const values = data.map(d => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const width = 200
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((d.value - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#gradient-${color.replace('#', '')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const Telemetry: React.FC = () => {
  const [metrics, setMetrics] = useState<TelemetryMetric[]>(() => {
    const saved = localStorage.getItem('agentos-telemetry-metrics')
    return saved ? JSON.parse(saved) : defaultMetrics
  })
  const [agentOSMetrics] = useState<AgentOSMetric[]>(defaultAgentOSMetrics)
  const [alerts, setAlerts] = useState<AlertItem[]>(() => {
    const saved = localStorage.getItem('agentos-telemetry-alerts')
    return saved ? JSON.parse(saved) : defaultAlerts
  })
  const [activeTab, setActiveTab] = useState<'dashboard' | 'metrics' | 'alerts'>('dashboard')
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    localStorage.setItem('agentos-telemetry-metrics', JSON.stringify(metrics))
  }, [metrics])

  useEffect(() => {
    localStorage.setItem('agentos-telemetry-alerts', JSON.stringify(alerts))
  }, [alerts])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(m => {
        const variance = m.max - m.min
        const newValue = Math.max(m.min, Math.min(m.max,
          m.current + (Math.random() - 0.5) * variance * 0.2
        ))
        const newHistory = [...m.history.slice(1), { timestamp: Date.now(), value: newValue }]
        const newStatus = newValue > m.threshold * 0.9 ? 'warning' : newValue > m.threshold ? 'critical' : 'normal'
        return {
          ...m,
          current: Math.round(newValue * 10) / 10,
          history: newHistory,
          status: newStatus,
          min: Math.min(m.min, newValue),
          max: Math.max(m.max, newValue)
        }
      }))
    }, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  const handleAcknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a))
  }

  const filteredAlerts = filterLevel === 'all' ? alerts : alerts.filter(a => a.level === filterLevel)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'var(--success-color)'
      case 'warning': return 'var(--warning-color)'
      case 'critical': return 'var(--error-color)'
      default: return 'var(--text-secondary)'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'var(--info-color)'
      case 'warning': return 'var(--warning-color)'
      case 'error': return 'var(--error-color)'
      default: return 'var(--text-secondary)'
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info': return <Eye size={16} />
      case 'warning': return <AlertTriangle size={16} />
      case 'error': return <XCircle size={16} />
      default: return <Activity size={16} />
    }
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
            遥测仪表盘
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            AgentOS 系统指标监控与性能分析
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-color)',
              background: autoRefresh ? 'var(--primary-light)' : 'transparent',
              color: autoRefresh ? 'var(--primary-color)' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '13px', transition: 'all 150ms ease'
            }}
          >
            <RefreshCw size={14} className={autoRefresh ? 'animate-spin' : ''} />
            {autoRefresh ? '自动刷新' : '已暂停'}
          </button>
          <button
            onClick={() => {
              const data = { metrics, alerts, exportedAt: new Date().toISOString() }
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `agentos-telemetry-${Date.now()}.json`
              a.click()
              URL.revokeObjectURL(url)
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-color)',
              background: 'transparent', color: 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '13px', transition: 'all 150ms ease'
            }}
          >
            <Download size={14} />
            导出
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
        {[
          { key: 'dashboard', label: '总览', icon: <LayoutDashboard size={16} /> },
          { key: 'metrics', label: '系统指标', icon: <BarChart3 size={16} /> },
          { key: 'alerts', label: '警报', icon: <Bell size={16} /> }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: activeTab === tab.key ? 'var(--primary-color)' : 'transparent',
              color: activeTab === tab.key ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === tab.key ? '500' : '400',
              transition: 'all 150ms ease'
            }}
          >
            {tab.icon}
            {tab.label}
            {tab.key === 'alerts' && alerts.filter(a => !a.acknowledged).length > 0 && (
              <span style={{
                background: 'rgba(255,255,255,0.3)', padding: '2px 6px', borderRadius: '10px', fontSize: '11px'
              }}>
                {alerts.filter(a => !a.acknowledged).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {agentOSMetrics.map(metric => (
              <div
                key={metric.id}
                style={{
                  background: 'var(--bg-secondary)', borderRadius: '12px', padding: '20px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'var(--primary-light)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'var(--primary-color)'
                  }}>
                    {metric.icon}
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px',
                    color: metric.change >= 0 ? 'var(--success-color)' : 'var(--error-color)'
                  }}>
                    <TrendingUp size={12} style={{ transform: metric.change < 0 ? 'rotate(180deg)' : 'none' }} />
                    {Math.abs(metric.change)}%
                  </div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {metric.value.toLocaleString()}{metric.unit}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{metric.name}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {metrics.map(metric => (
              <div
                key={metric.id}
                style={{
                  background: 'var(--bg-secondary)', borderRadius: '12px', padding: '20px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>{metric.icon}</div>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{metric.name}</span>
                  </div>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    backgroundColor: getStatusColor(metric.status)
                  }} />
                </div>
                <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {metric.current}{metric.unit}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  阈值: {metric.threshold}{metric.unit}
                </div>
                <MiniChart
                  data={metric.history}
                  color={metric.status === 'normal' ? 'var(--success-color)' : metric.status === 'warning' ? 'var(--warning-color)' : 'var(--error-color)'}
                  height={50}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>最低: {metric.min}{metric.unit}</span>
                  <span>平均: {metric.avg}{metric.unit}</span>
                  <span>最高: {metric.max}{metric.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'metrics' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {metrics.map(metric => (
              <div
                key={metric.id}
                style={{
                  background: 'var(--bg-secondary)', borderRadius: '12px', padding: '24px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '12px',
                      background: 'var(--primary-light)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: 'var(--primary-color)'
                    }}>
                      {metric.icon}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                        {metric.name}
                      </h3>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        状态: <span style={{ color: getStatusColor(metric.status), fontWeight: '500' }}>{metric.status}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '36px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {metric.current}{metric.unit}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      阈值: {metric.threshold}{metric.unit}
                    </div>
                  </div>
                </div>
                <MiniChart
                  data={metric.history}
                  color={getStatusColor(metric.status)}
                  height={80}
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '20px' }}>
                  {[
                    { label: '当前', value: `${metric.current}${metric.unit}` },
                    { label: '最低', value: `${metric.min}${metric.unit}` },
                    { label: '平均', value: `${metric.avg}${metric.unit}` },
                    { label: '最高', value: `${metric.max}${metric.unit}` }
                  ].map(stat => (
                    <div key={stat.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                        {stat.label}
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'alerts' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <Filter size={16} style={{ color: 'var(--text-muted)', marginTop: '4px' }} />
            {['all', 'info', 'warning', 'error'].map(level => (
              <button
                key={level}
                onClick={() => setFilterLevel(level)}
                style={{
                  padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)',
                  background: filterLevel === level ? 'var(--primary-light)' : 'transparent',
                  color: filterLevel === level ? 'var(--primary-color)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '12px', textTransform: 'capitalize', transition: 'all 150ms ease'
                }}
              >
                {level === 'all' ? '全部' : level === 'info' ? '信息' : level === 'warning' ? '警告' : '错误'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredAlerts.map(alert => (
              <div
                key={alert.id}
                style={{
                  background: 'var(--bg-secondary)', borderRadius: '10px', padding: '16px',
                  border: '1px solid var(--border-subtle)',
                  opacity: alert.acknowledged ? 0.6 : 1,
                  transition: 'all 150ms ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                    <div style={{ color: getLevelColor(alert.level), marginTop: '2px' }}>
                      {getLevelIcon(alert.level)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {alert.message}
                      </div>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <span>{alert.timestamp}</span>
                        <span>来源: {alert.source}</span>
                        <span style={{ textTransform: 'capitalize', color: getLevelColor(alert.level) }}>
                          级别: {alert.level === 'info' ? '信息' : alert.level === 'warning' ? '警告' : '错误'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      style={{
                        padding: '6px 12px', borderRadius: '6px', border: 'none',
                        background: 'var(--success-light)', color: 'var(--success-color)',
                        cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px',
                        transition: 'all 150ms ease'
                      }}
                    >
                      <CheckCircle size={14} />
                      确认
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filteredAlerts.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '40px', color: 'var(--text-muted)'
              }}>
                <CheckCircle size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>暂无警报</p>
                <p style={{ margin: 0, fontSize: '13px' }}>所有系统运行正常</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default Telemetry
