import React, { useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Cpu, MemoryStick, HardDrive, Network,
  ArrowUp, ArrowDown, Activity, Clock, AlertCircle,
  Bot, Server, Workflow, Terminal,
  CheckCircle, XCircle, PlayCircle, RefreshCw,
  Shield, MessageSquare, Brain, Zap, ListTodo, Wrench,
  Plug, Globe, Loader2,
} from 'lucide-react';
import { useConnection, useHealth, useTasks, useAgents } from '../hooks/useAgentOS';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { connection, connect } = useConnection();
  const { health, metrics, loading: healthLoading, fetchAll } = useHealth();
  const { tasks, loading: tasksLoading, fetchTasks } = useTasks();
  const { agents, loading: agentsLoading, fetchAgents } = useAgents();
  const [initialized, setInitialized] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isConnected = connection.status === 'connected';
  const isLoading = healthLoading || !initialized;

  useEffect(() => {
    if (connection.status === 'disconnected') {
      connect().then(() => setInitialized(true)).catch(() => setInitialized(true));
    } else if (connection.status === 'connected' && !initialized) {
      setInitialized(true);
    }
  }, [connection.status, connect, initialized]);

  useEffect(() => {
    if (isConnected) {
      fetchAll();
      fetchTasks({ sort: { field: 'createdAt', order: 'desc' } });
      fetchAgents();
    }
  }, [isConnected, fetchAll, fetchTasks, fetchAgents]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchAll(), fetchTasks(), fetchAgents()]);
    setRefreshing(false);
  }, [fetchAll, fetchTasks, fetchAgents]);

  const systemStats = isConnected && metrics ? [
    {
      title: 'CPU',
      value: `${metrics.cpuUsage.toFixed(1)}%`,
      change: `${metrics.cpuUsage > 50 ? '+' : ''}${(metrics.cpuUsage * 0.1).toFixed(1)}%`,
      trend: metrics.cpuUsage > 50 ? 'up' as const : 'down' as const,
      icon: <Cpu size={20} />,
      status: metrics.cpuUsage > 80 ? 'warning' as const : 'normal' as const,
      progress: Math.min(metrics.cpuUsage, 100),
    },
    {
      title: t('stats.memory'),
      value: `${metrics.memoryUsage.toFixed(1)}%`,
      change: `${metrics.memoryUsage > 50 ? '+' : ''}${(metrics.memoryUsage * 0.05).toFixed(1)}%`,
      trend: metrics.memoryUsage > 50 ? 'up' as const : 'down' as const,
      icon: <MemoryStick size={20} />,
      status: metrics.memoryUsage > 80 ? 'warning' as const : 'normal' as const,
      progress: Math.min(metrics.memoryUsage, 100),
    },
    {
      title: t('stats.disk'),
      value: `${metrics.memoriesTotal}`,
      change: `${metrics.memoriesTotal > 0 ? '+' : ''}${metrics.memoriesTotal}`,
      trend: metrics.memoriesTotal > 0 ? 'up' as const : 'down' as const,
      icon: <HardDrive size={20} />,
      status: 'normal' as const,
      progress: Math.min((metrics.memoriesTotal % 100), 100),
    },
    {
      title: t('stats.network'),
      value: `${metrics.requestCount}`,
      change: `${metrics.averageLatencyMs.toFixed(0)}ms`,
      trend: metrics.averageLatencyMs < 100 ? 'down' as const : 'up' as const,
      icon: <Network size={20} />,
      status: metrics.averageLatencyMs > 200 ? 'warning' as const : 'normal' as const,
      progress: Math.min(metrics.averageLatencyMs / 5, 100),
    },
  ] : [
    { title: 'CPU', value: '--', change: '--', trend: 'up' as const, icon: <Cpu size={20} />, status: 'normal' as const, progress: 0 },
    { title: t('stats.memory'), value: '--', change: '--', trend: 'up' as const, icon: <MemoryStick size={20} />, status: 'normal' as const, progress: 0 },
    { title: t('stats.disk'), value: '--', change: '--', trend: 'up' as const, icon: <HardDrive size={20} />, status: 'normal' as const, progress: 0 },
    { title: t('stats.network'), value: '--', change: '--', trend: 'up' as const, icon: <Network size={20} />, status: 'normal' as const, progress: 0 },
  ];

  const quickActions = [
    { label: t('dashboard.quickActions') === 'Quick Actions' ? 'New Agent' : t('agents.registerNew'), icon: <Bot size={16} />, path: '/agents' },
    { label: t('tasks.submitNewTask'), icon: <Workflow size={16} />, path: '/tasks' },
    { label: t('nav.terminal'), icon: <Terminal size={16} />, path: '/terminal' },
    { label: t('nav.aiChat'), icon: <MessageSquare size={16} />, path: '/ai-chat' },
  ];

  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    completed: { bg: 'var(--success-light)', text: 'var(--success-color)', dot: 'var(--success-color)' },
    running: { bg: 'var(--info-light)', text: 'var(--info-color)', dot: 'var(--info-color)' },
    pending: { bg: 'var(--warning-light)', text: 'var(--warning-color)', dot: 'var(--warning-color)' },
    failed: { bg: 'var(--error-light)', text: 'var(--error-color)', dot: 'var(--error-color)' },
    cancelled: { bg: 'var(--bg-tertiary)', text: 'var(--text-muted)', dot: 'var(--text-muted)' },
    online: { bg: 'var(--success-light)', text: 'var(--success-color)', dot: 'var(--success-color)' },
    offline: { bg: 'var(--bg-tertiary)', text: 'var(--text-muted)', dot: 'var(--text-muted)' },
    warning: { bg: 'var(--warning-light)', text: 'var(--warning-color)', dot: 'var(--warning-color)' },
    normal: { bg: 'var(--success-light)', text: 'var(--success-color)', dot: 'var(--success-color)' },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
  };

  const pulseAnimation = {
    scale: [1, 1.05, 1],
    transition: { duration: 2, repeat: Infinity, ease: [0.25, 0.1, 0.25, 1] as const },
  };

  const cardHoverStyle = {
    cursor: 'pointer' as const,
    transition: 'all 200ms ease',
  };

  const formatUptime = (seconds: number): string => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const recentTasks = tasks.slice(0, 5);
  const onlineAgents = agents.filter((a: any) => a.status === 'online' || a.status === 'running' || a.status === 'active');

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ maxWidth: '1400px', margin: '0 auto' }}
    >
      {/* Header Section */}
      <motion.div
        variants={itemVariants}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: 0,
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            {t('dashboard.title')}
            {isConnected && health?.version && (
              <span style={{
                fontSize: '12px',
                fontWeight: '500',
                color: 'var(--text-muted)',
                backgroundColor: 'var(--bg-tertiary)',
                padding: '2px 10px',
                borderRadius: '6px',
              }}>
                v{health.version}
              </span>
            )}
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            margin: '4px 0 0 0',
          }}>
            {isConnected && health?.uptime
              ? `Uptime: ${formatUptime(health.uptime)}`
              : t('dashboard.subtitle')}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              fontFamily: 'inherit',
              opacity: refreshing ? 0.6 : 1,
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              if (!refreshing) {
                e.currentTarget.style.borderColor = 'var(--primary-color)';
                e.currentTarget.style.color = 'var(--primary-color)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            {t('common.refresh')}
          </motion.button>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isConnected ? 'var(--success-color)' : 'var(--error-color)',
              animation: isConnected ? 'pulse 2s infinite' : 'none',
            }} />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {isConnected ? t('common.connected') : t('common.disconnected')}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Error State */}
      {connection.status === 'error' && !isLoading && (
        <motion.div
          variants={itemVariants}
          style={{
            padding: '16px 20px',
            backgroundColor: 'var(--error-light)',
            border: '1px solid var(--error-color)',
            borderRadius: '10px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <AlertCircle size={18} color="var(--error-color)" />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--error-color)', fontWeight: '500' }}>
              {connection.error || 'Connection failed'}
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
              Go to Settings to configure your AgentOS gateway connection
            </p>
          </div>
          <Link to="/settings">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '6px 14px',
                backgroundColor: 'var(--error-color)',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Settings
            </motion.button>
          </Link>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && connection.status !== 'error' && (
        <motion.div
          variants={itemVariants}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            gap: '16px',
          }}
        >
          <Loader2 size={32} className="spin" style={{ color: 'var(--primary-color)' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            {connection.status === 'connecting' ? 'Connecting to AgentOS Gateway...' : t('common.loading')}
          </p>
        </motion.div>
      )}

      {/* System Stats */}
      <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
        }}>
          {systemStats.map((stat) => (
            <motion.div
              key={stat.title}
              whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.15)' }}
              style={{
                padding: '20px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                ...cardHoverStyle,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    margin: '0 0 8px 0',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}>
                    {stat.title}
                  </p>
                  <h3 style={{
                    fontSize: '22px',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    margin: '0 0 8px 0',
                    letterSpacing: '-0.02em',
                  }}>
                    {stat.value}
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: stat.trend === 'up' ? 'var(--success-color)' : 'var(--info-color)',
                  }}>
                    {stat.trend === 'up' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: stat.status === 'warning'
                    ? 'linear-gradient(135deg, var(--warning-light), transparent)'
                    : 'linear-gradient(135deg, var(--primary-light), transparent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: stat.status === 'warning' ? 'var(--warning-color)' : 'var(--primary-color)',
                }}>
                  {stat.icon}
                </div>
              </div>
              <div style={{
                marginTop: '16px',
                height: '4px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    borderRadius: '4px',
                    background: stat.status === 'warning'
                      ? 'var(--warning-color)'
                      : 'linear-gradient(90deg, var(--primary-color), var(--info-color))',
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: 'var(--text-primary)',
          margin: '0 0 16px 0',
        }}>
          Quick Actions
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
        }}>
          {quickActions.map((action) => (
            <Link to={action.path} key={action.label} style={{ textDecoration: 'none' }}>
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                  transition: 'all 200ms ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-color)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-light)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
                }}
              >
                <span style={{ color: 'var(--primary-color)' }}>{action.icon}</span>
                {action.label}
              </motion.button>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Agents and Tasks Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px',
        marginBottom: '24px',
      }}>
        {/* Agents */}
        <motion.div variants={itemVariants}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-secondary)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--primary-color), var(--info-color))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}>
                    <Bot size={16} />
                  </div>
                  <h3 style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                  }}>
                    Active Agents
                  </h3>
                </div>
                <span style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--bg-tertiary)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                }}>
                  {agentsLoading ? '...' : `${onlineAgents.length} of ${agents.length} online`}
                </span>
              </div>
            </div>
            <div style={{ padding: '12px' }}>
              {agentsLoading && agents.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <Loader2 size={20} className="spin" style={{ margin: '0 auto 8px' }} />
                  Loading agents...
                </div>
              ) : agents.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <Bot size={24} style={{ color: 'var(--text-muted)', marginBottom: '8px', opacity: 0.4 }} />
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                    {t('agents.noAgentsRegistered')}
                  </p>
                  <Link to="/agents" style={{ textDecoration: 'none' }}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        marginTop: '12px',
                        padding: '6px 14px',
                        backgroundColor: 'var(--primary-color)',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {t('agents.registerNew')}
                    </motion.button>
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {agents.slice(0, 5).map((agent: any) => (
                    <div
                      key={agent.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: '8px',
                        transition: 'all 150ms ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, var(--primary-color), var(--info-color))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '700',
                          fontSize: '14px',
                        }}>
                          {(agent.name || 'A').charAt(0)}
                        </div>
                        <div>
                          <h4 style={{
                            margin: 0,
                            fontSize: '13px',
                            color: 'var(--text-primary)',
                            fontWeight: '500',
                          }}>
                            {agent.name}
                          </h4>
                          <p style={{
                            margin: '2px 0 0 0',
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                          }}>
                            {agent.description || agent.status}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          fontSize: '11px',
                          color: statusColors[agent.status]?.text || 'var(--text-muted)',
                          backgroundColor: statusColors[agent.status]?.bg || 'var(--bg-tertiary)',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontWeight: '500',
                        }}>
                          {agent.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {agents.length > 5 && (
                    <Link to="/agents" style={{
                      textAlign: 'center',
                      fontSize: '12px',
                      color: 'var(--primary-color)',
                      textDecoration: 'none',
                      padding: '8px',
                    }}>
                      View all {agents.length} agents
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Recent Tasks */}
        <motion.div variants={itemVariants}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-secondary)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--primary-color), var(--info-color))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}>
                    <Workflow size={16} />
                  </div>
                  <h3 style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                  }}>
                    {t('tasks.recentTasks')}
                  </h3>
                </div>
                <span style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}>
                  {tasks.length > 0 ? `${tasks.filter(t => t.status === 'completed').length} done` : ''}
                </span>
              </div>
            </div>
            <div style={{ padding: '12px' }}>
              {tasksLoading && tasks.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <Loader2 size={20} className="spin" style={{ margin: '0 auto 8px' }} />
                  Loading tasks...
                </div>
              ) : recentTasks.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <ListTodo size={24} style={{ color: 'var(--text-muted)', marginBottom: '8px', opacity: 0.4 }} />
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                    {t('tasks.noTasksYet')}
                  </p>
                  <Link to="/tasks" style={{ textDecoration: 'none' }}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        marginTop: '12px',
                        padding: '6px 14px',
                        backgroundColor: 'var(--primary-color)',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {t('tasks.submitNewTask')}
                    </motion.button>
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recentTasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: '8px',
                        transition: 'all 150ms ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: statusColors[task.status]?.bg || 'var(--bg-tertiary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {task.status === 'completed' && <CheckCircle size={16} color="var(--success-color)" />}
                          {task.status === 'running' && (
                            <motion.div animate={pulseAnimation}>
                              <PlayCircle size={16} color="var(--info-color)" />
                            </motion.div>
                          )}
                          {task.status === 'pending' && <Clock size={16} color="var(--warning-color)" />}
                          {(task.status === 'failed' || task.status === 'cancelled') && <XCircle size={16} color="var(--error-color)" />}
                        </div>
                        <div>
                          <h4 style={{
                            margin: 0,
                            fontSize: '13px',
                            color: 'var(--text-primary)',
                            fontWeight: '500',
                            maxWidth: '180px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {task.description}
                          </h4>
                          <p style={{
                            margin: '2px 0 0 0',
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                          }}>
                            {new Date(task.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          fontSize: '11px',
                          color: statusColors[task.status]?.text || 'var(--text-muted)',
                          backgroundColor: statusColors[task.status]?.bg || 'var(--bg-tertiary)',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontWeight: '500',
                          display: 'inline-block',
                        }}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* System Health */}
      <motion.div variants={itemVariants}>
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--success-color), var(--success-light))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}>
                <Shield size={16} />
              </div>
              <h3 style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)',
              }}>
                System Health
              </h3>
            </div>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
            }}>
              {[
                {
                  label: 'Status',
                  value: health?.status || '--',
                  icon: <Activity size={16} />,
                  color: isConnected ? 'var(--success-color)' : 'var(--error-color)',
                },
                {
                  label: 'Uptime',
                  value: health?.uptime ? formatUptime(health.uptime) : '--',
                  icon: <Clock size={16} />,
                  color: 'var(--success-color)',
                },
                {
                  label: 'Latency',
                  value: metrics ? `${metrics.averageLatencyMs.toFixed(0)}ms` : '--',
                  icon: <Zap size={16} />,
                  color: 'var(--info-color)',
                },
                {
                  label: 'Requests',
                  value: metrics ? `${metrics.requestCount}` : '--',
                  icon: <Globe size={16} />,
                  color: 'var(--primary-color)',
                },
                ...(metrics ? [
                  {
                    label: 'Tasks Total',
                    value: `${metrics.tasksTotal}`,
                    icon: <ListTodo size={16} />,
                    color: 'var(--success-color)',
                  },
                  {
                    label: 'Active Sessions',
                    value: `${metrics.sessionsActive}`,
                    icon: <MessageSquare size={16} />,
                    color: 'var(--info-color)',
                  },
                  {
                    label: 'Skills Loaded',
                    value: `${metrics.skillsLoaded}`,
                    icon: <Wrench size={16} />,
                    color: 'var(--primary-color)',
                  },
                  {
                    label: 'Memory Entries',
                    value: `${metrics.memoriesTotal}`,
                    icon: <Brain size={16} />,
                    color: 'var(--warning-color)',
                  },
                ] : []),
              ].map((healthItem) => (
                <motion.div
                  key={healthItem.label}
                  whileHover={{ y: -2 }}
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, ${healthItem.color}22, transparent)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: healthItem.color,
                  }}>
                    {healthItem.icon}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                      {healthItem.label}
                    </p>
                    <h4 style={{
                      margin: '2px 0 0 0',
                      fontSize: '18px',
                      color: 'var(--text-primary)',
                      fontWeight: '700',
                    }}>
                      {healthItem.value}
                    </h4>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
