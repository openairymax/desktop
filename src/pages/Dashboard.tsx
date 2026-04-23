import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Cpu, MemoryStick, HardDrive, Network,
  ArrowUp, ArrowDown, Activity, Clock, AlertCircle,
  Bot, Server, Workflow, Terminal,
  CheckCircle, XCircle, PlayCircle, RefreshCw,
  Shield, MessageSquare, Brain, Zap,
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();

  const systemStats = [
    {
      title: 'CPU',
      value: '42%',
      change: '+5%',
      trend: 'up' as const,
      icon: <Cpu size={20} />,
      status: 'normal',
    },
    {
      title: t('stats.memory'),
      value: '8.2GB',
      change: '+1.2GB',
      trend: 'up' as const,
      icon: <MemoryStick size={20} />,
      status: 'warning',
    },
    {
      title: t('stats.disk'),
      value: '256GB',
      change: '-24GB',
      trend: 'down' as const,
      icon: <HardDrive size={20} />,
      status: 'normal',
    },
    {
      title: t('stats.network'),
      value: '2.4GB/s',
      change: '+0.8GB/s',
      trend: 'up' as const,
      icon: <Network size={20} />,
      status: 'normal',
    },
  ];

  const agents = [
    { name: 'OpenAI Assistant', status: 'online', tasks: 12, model: 'gpt-4' },
    { name: 'Claude Helper', status: 'online', tasks: 8, model: 'claude-3' },
    { name: 'Local Runner', status: 'offline', tasks: 0, model: 'llama-3' },
  ];

  const recentTasks = [
    { title: 'Data Analysis', status: 'completed', agent: 'OpenAI Assistant', time: '2 mins ago' },
    { title: 'Code Review', status: 'running', agent: 'Claude Helper', time: '5 mins ago' },
    { title: 'Report Generation', status: 'failed', agent: 'Local Runner', time: '10 mins ago' },
  ];

  const quickActions = [
    { label: 'New Agent', icon: <Bot size={16} />, path: '/agents' },
    { label: 'Create Task', icon: <Workflow size={16} />, path: '/tasks' },
    { label: 'Open Terminal', icon: <Terminal size={16} />, path: '/terminal' },
    { label: 'AI Chat', icon: <MessageSquare size={16} />, path: '/ai-chat' },
  ];

  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    completed: { bg: 'var(--success-light)', text: 'var(--success-color)', dot: 'var(--success-color)' },
    running: { bg: 'var(--info-light)', text: 'var(--info-color)', dot: 'var(--info-color)' },
    failed: { bg: 'var(--error-light)', text: 'var(--error-color)', dot: 'var(--error-color)' },
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
          }}>
            {t('dashboard.title')}
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            margin: '4px 0 0 0',
          }}>
            {t('dashboard.subtitle')}
          </p>
        </div>
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
            backgroundColor: 'var(--success-color)',
            animation: 'pulse 2s infinite',
          }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            System Online
          </span>
        </div>
      </motion.div>

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
                    <span style={{ color: 'var(--text-muted)' }}>vs last hour</span>
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
                  animate={{ width: stat.title === 'CPU' ? '42%' : stat.title === 'Memory' ? '65%' : stat.title === 'Disk' ? '72%' : '38%' }}
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
                  {agents.filter(a => a.status === 'online').length} of {agents.length} online
                </span>
              </div>
            </div>
            <div style={{ padding: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {agents.map((agent) => (
                  <div
                    key={agent.name}
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
                        {agent.name.charAt(0)}
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
                          {agent.model}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontSize: '11px',
                        color: statusColors[agent.status].text,
                        backgroundColor: statusColors[agent.status].bg,
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontWeight: '500',
                      }}>
                        {agent.status}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                      }}>
                        {agent.tasks} tasks
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
                    Recent Tasks
                  </h3>
                </div>
                <span style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}>
                  Latest activity
                </span>
              </div>
            </div>
            <div style={{ padding: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentTasks.map((task) => (
                  <div
                    key={task.title}
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
                        background: statusColors[task.status].bg,
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
                        {task.status === 'failed' && <XCircle size={16} color="var(--error-color)" />}
                      </div>
                      <div>
                        <h4 style={{
                          margin: 0,
                          fontSize: '13px',
                          color: 'var(--text-primary)',
                          fontWeight: '500',
                        }}>
                          {task.title}
                        </h4>
                        <p style={{
                          margin: '2px 0 0 0',
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                        }}>
                          {task.agent}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: '11px',
                        color: statusColors[task.status].text,
                        backgroundColor: statusColors[task.status].bg,
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontWeight: '500',
                        display: 'inline-block',
                        marginBottom: '4px',
                      }}>
                        {task.status}
                      </span>
                      <p style={{
                        margin: 0,
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                      }}>
                        {task.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
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
                { label: 'Uptime', value: '99.9%', icon: <Clock size={16} /> },
                { label: 'Response Time', value: '24ms', icon: <Zap size={16} /> },
                { label: 'Memory Usage', value: '65%', icon: <Brain size={16} /> },
                { label: 'CPU Load', value: '42%', icon: <Activity size={16} /> },
              ].map((health) => (
                <motion.div
                  key={health.label}
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
                    background: 'linear-gradient(135deg, var(--success-light), transparent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--success-color)',
                  }}>
                    {health.icon}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                      {health.label}
                    </p>
                    <h4 style={{
                      margin: '2px 0 0 0',
                      fontSize: '18px',
                      color: 'var(--text-primary)',
                      fontWeight: '700',
                    }}>
                      {health.value}
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
