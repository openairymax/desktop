import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface ChromePerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface ChromePerformance extends Performance {
  memory?: ChromePerformanceMemory;
}
import {
  Cpu,
  MemoryStick,
  Activity,
  Bot,
  Workflow,
  Terminal,
  MessageSquare,
  Brain,
  Wrench,
  Zap,
  ArrowUpRight,
  Sparkles,
  Server,
  BarChart3,
  Eye,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHealth, useConnection } from '../hooks/useAgentOS';

interface SystemStat {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  progress: number;
}

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  path: string;
  desc: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: '管理智能体',
    icon: <Bot size={18} />,
    path: '/agents',
    desc: '注册、启动、监控 AI 智能体',
    color: '#6366f1',
  },
  {
    label: '提交任务',
    icon: <Workflow size={18} />,
    path: '/tasks',
    desc: '创建和跟踪任务执行状态',
    color: '#10b981',
  },
  {
    label: 'AI 助手',
    icon: <MessageSquare size={18} />,
    path: '/ai-chat',
    desc: '与 AI 智能体对话交互',
    color: '#f59e0b',
  },
  {
    label: '模型配置',
    icon: <Brain size={18} />,
    path: '/model-config',
    desc: '配置 LLM 提供商和模型参数',
    color: '#ef4444',
  },
  {
    label: '认知循环',
    icon: <Eye size={18} />,
    path: '/cognitive-loop',
    desc: '查看感知→推理→行动流程',
    color: '#8b5cf6',
  },
  {
    label: '系统监控',
    icon: <BarChart3 size={18} />,
    path: '/system-monitor',
    desc: '实时查看系统资源使用情况',
    color: '#06b6d4',
  },
];

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { health, metrics, fetchHealth, fetchMetrics } = useHealth();
  const { connection } = useConnection();
  const [systemStats, setSystemStats] = useState<SystemStat[]>([]);
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6) setGreeting('夜深了');
    else if (hour < 12) setGreeting('早上好');
    else if (hour < 14) setGreeting('中午好');
    else if (hour < 18) setGreeting('下午好');
    else setGreeting('晚上好');

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let seconds = 0;
    const iv = setInterval(() => {
      seconds++;
      setUptime(seconds);
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    fetchHealth();
    fetchMetrics();
  }, [fetchHealth, fetchMetrics]);

  useEffect(() => {
    const updateStats = () => {
      const connStatus =
        connection.status === 'connected'
          ? '已连接'
          : connection.status === 'connecting'
            ? '连接中'
            : connection.status === 'error'
              ? '连接错误'
              : '未连接';
      const connColor =
        connection.status === 'connected'
          ? '#10b981'
          : connection.status === 'connecting'
            ? '#f59e0b'
            : connection.status === 'error'
              ? '#ef4444'
              : '#9ca3af';

      const memPct = metrics?.memoryUsage ?? 0;
      const cpuPct = metrics?.cpuUsage ?? 0;
      const activeTasks = metrics?.tasksTotal ?? 0;
      const totalAgents = metrics?.sessionsActive ?? 0;

      const stats: SystemStat[] = [
        {
          title: '网关状态',
          value: connStatus,
          sub: health?.version ? `v${health.version}` : 'AgentRT Gateway',
          icon: <Server size={20} />,
          color: connColor,
          progress: connection.status === 'connected' ? 100 : 0,
        },
        {
          title: '内存使用',
          value:
            memPct > 0
              ? `${memPct}%`
              : `${Math.round(((performance as ChromePerformance)?.memory?.usedJSHeapSize ?? 0) / 1024 / 1024)} MB`,
          sub: memPct > 0 ? '后端内存占用' : '浏览器堆',
          icon: <MemoryStick size={20} />,
          color: memPct > 80 ? '#f59e0b' : '#10b981',
          progress:
            memPct ||
            Math.round(
              (((performance as ChromePerformance)?.memory?.usedJSHeapSize ?? 0) /
                ((performance as ChromePerformance)?.memory?.jsHeapSizeLimit ?? 1)) * 100,
            ),
        },
        {
          title: '活跃任务',
          value: `${activeTasks}`,
          sub: totalAgents > 0 ? `${totalAgents} 个智能体` : '运行中',
          icon: <Activity size={20} />,
          color: activeTasks > 0 ? '#6366f1' : '#10b981',
          progress: Math.min(activeTasks * 10, 100),
        },
        {
          title: 'CPU 占用',
          value: cpuPct > 0 ? `${cpuPct}%` : '--',
          sub: cpuPct > 0 ? (cpuPct > 80 ? '负载较高' : '负载正常') : '无数据',
          icon: <Cpu size={20} />,
          color: cpuPct > 80 ? '#ef4444' : '#8b5cf6',
          progress: cpuPct || 0,
        },
      ];
      setSystemStats(stats);
    };
    updateStats();
    const iv = setInterval(updateStats, 5000);
    return () => clearInterval(iv);
  }, [uptime, health, metrics, connection]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ maxWidth: '1280px', margin: '0 auto' }}
    >
      {/* Header */}
      <motion.div variants={itemVariants} style={{ marginBottom: '28px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '26px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              {greeting}，欢迎使用 Airymax AgentRT
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px' }}>
              {currentTime.toLocaleDateString('zh-CN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              &nbsp;·&nbsp;{currentTime.toLocaleTimeString('zh-CN')}
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 16px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--success-color)',
                animation: 'pulse 2s infinite',
              }}
            />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>系统就绪</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '4px' }}>
              v0.2.0
            </span>
          </div>
        </div>
      </motion.div>

      {/* System Stats */}
      <motion.div variants={itemVariants} style={{ marginBottom: '28px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '14px',
          }}
        >
          {systemStats.map((stat) => (
            <motion.div
              key={stat.title}
              whileHover={{ y: -3 }}
              style={{
                padding: '18px 20px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                cursor: 'default',
              }}
              role="status"
              aria-label={stat.title}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      margin: '0 0 6px 0',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {stat.title}
                  </p>
                  <h3
                    style={{
                      fontSize: '22px',
                      fontWeight: '700',
                      color: 'var(--text-primary)',
                      margin: '0 0 4px 0',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {stat.value}
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{stat.sub}</span>
                </div>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: `${stat.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: stat.color,
                  }}
                >
                  {stat.icon}
                </div>
              </div>
              <div
                style={{
                  marginTop: '12px',
                  height: '4px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    borderRadius: '4px',
                    background: `linear-gradient(90deg, ${stat.color}, ${stat.color}88)`,
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} style={{ marginBottom: '28px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <h2
            style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}
          >
            {t('dashboard.quickActions')}
          </h2>
          <Link
            to="/settings"
            style={{
              fontSize: '13px',
              color: 'var(--primary-color)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {t('settingsExtended.title')}
            <ArrowUpRight size={13} />
          </Link>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px',
          }}
        >
          {QUICK_ACTIONS.map((action) => (
            <Link to={action.path} key={action.label} style={{ textDecoration: 'none' }} aria-label={action.desc}>
              <motion.div
                whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: '18px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = action.color)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: `${action.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: action.color,
                    marginBottom: '12px',
                  }}
                >
                  {action.icon}
                </div>
                <h4
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    margin: '0 0 4px 0',
                  }}
                >
                  {action.label}
                </h4>
                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    margin: 0,
                    lineHeight: '1.5',
                  }}
                >
                  {action.desc}
                </p>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Info Cards */}
      <motion.div variants={itemVariants}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '16px',
          }}
        >
          {/* Getting Started */}
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '18px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'linear-gradient(135deg, #6366f110, transparent)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <Sparkles size={16} />
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                  }}
                >
                  快速开始
                </h3>
              </div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <ol
                style={{
                  margin: 0,
                  paddingLeft: '18px',
                  fontSize: '13px',
                  lineHeight: '2',
                  color: 'var(--text-secondary)',
                }}
              >
                <li>
                  前往<strong style={{ color: 'var(--text-primary)' }}>「模型配置」</strong>添加 LLM
                  提供商（如 OpenAI、DeepSeek）
                </li>
                <li>
                  在<strong style={{ color: 'var(--text-primary)' }}>「智能体」</strong>
                  页面创建你的第一个 AI Agent
                </li>
                <li>
                  使用<strong style={{ color: 'var(--text-primary)' }}>「AI 助手」</strong>开始与
                  Agent 对话
                </li>
                <li>
                  在<strong style={{ color: 'var(--text-primary)' }}>「任务」</strong>
                  页面提交并跟踪执行进度
                </li>
              </ol>
              <Link
                to="/model-config"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '12px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: 'var(--primary-color)',
                  textDecoration: 'none',
                }}
              >
                前往配置 <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>

          {/* System Overview */}
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '18px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'linear-gradient(135deg, #10b98110, transparent)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <Zap size={16} />
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                  }}
                >
                  系统能力概览
                </h3>
              </div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  {
                    label: '认知引擎',
                    status: connection.status === 'connected' ? '已启用' : '离线',
                    icon: <Brain size={14} />,
                    color:
                      connection.status === 'connected'
                        ? 'var(--success-color)'
                        : 'var(--text-muted)',
                  },
                  {
                    label: '四层记忆',
                    status: connection.status === 'connected' ? '已就绪' : '离线',
                    icon: <MemoryStick size={14} />,
                    color:
                      connection.status === 'connected'
                        ? 'var(--success-color)'
                        : 'var(--text-muted)',
                  },
                  {
                    label: '双思考模式',
                    status: connection.status === 'connected' ? '可配置' : '离线',
                    icon: <Eye size={14} />,
                    color:
                      connection.status === 'connected'
                        ? 'var(--warning-color)'
                        : 'var(--text-muted)',
                  },
                  {
                    label: '工具调用',
                    status: connection.status === 'connected' ? '已就绪' : '离线',
                    icon: <Wrench size={14} />,
                    color:
                      connection.status === 'connected'
                        ? 'var(--success-color)'
                        : 'var(--text-muted)',
                  },
                  {
                    label: '协议支持',
                    status: connection.status === 'connected' ? 'MCP/A2A/JSON-RPC' : '离线',
                    icon: <Server size={14} />,
                    color:
                      connection.status === 'connected' ? 'var(--info-color)' : 'var(--text-muted)',
                  },
                  {
                    label: '日志终端',
                    status: connection.status === 'connected' ? '可用' : '离线',
                    icon: <Terminal size={14} />,
                    color:
                      connection.status === 'connected'
                        ? 'var(--success-color)'
                        : 'var(--text-muted)',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      backgroundColor: 'var(--bg-tertiary)',
                      borderRadius: '8px',
                    }}
                  >
                    <span style={{ color: item.color }}>{item.icon}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 1 }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: '11px', color: item.color, fontWeight: '500' }}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
