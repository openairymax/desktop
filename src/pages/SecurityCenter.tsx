import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lock,
  FileText,
  Search,
  Filter,
  Bell,
  Settings,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  User,
  Clock,
  Activity,
  Key,
  Database,
} from 'lucide-react';

interface SecurityPolicy {
  id: string;
  name: string;
  type: string;
  status: 'enabled' | 'disabled' | 'warning';
  description: string;
  rules: number;
  lastUpdated: string;
  icon: React.ReactNode;
}

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  result: 'success' | 'denied' | 'error';
  details: string;
}

const defaultPolicies: SecurityPolicy[] = [
  {
    id: 'permission',
    name: '权限控制',
    type: 'permission',
    status: 'enabled',
    description: '管理智能体和工具的访问权限，包括读写权限和执行权限',
    rules: 12,
    lastUpdated: '2026-04-25 10:30',
    icon: <Key size={20} />,
  },
  {
    id: 'sanitizer',
    name: '数据清洗',
    type: 'sanitizer',
    status: 'enabled',
    description: '对输入输出数据进行安全清洗，防止注入攻击和数据泄露',
    rules: 8,
    lastUpdated: '2026-04-24 15:20',
    icon: <Database size={20} />,
  },
  {
    id: 'audit',
    name: '审计日志',
    type: 'audit',
    status: 'enabled',
    description: '记录所有系统操作和访问，提供完整的审计追踪能力',
    rules: 5,
    lastUpdated: '2026-04-26 08:00',
    icon: <FileText size={20} />,
  },
  {
    id: 'access',
    name: '访问控制',
    type: 'access',
    status: 'warning',
    description: '基于角色的访问控制，管理用户和智能体的资源访问',
    rules: 15,
    lastUpdated: '2026-04-23 12:45',
    icon: <Lock size={20} />,
  },
];

const defaultLogs: AuditLog[] = [
  {
    id: '1',
    timestamp: '2026-04-26 14:23:45',
    user: 'admin',
    action: '修改权限策略',
    resource: 'permission-policy',
    result: 'success',
    details: '更新了 agent-executor 的读写权限',
  },
  {
    id: '2',
    timestamp: '2026-04-26 13:45:12',
    user: 'agent-devops',
    action: '访问受限资源',
    resource: 'system-config',
    result: 'denied',
    details: '尝试访问系统配置被拒绝',
  },
  {
    id: '3',
    timestamp: '2026-04-26 12:30:00',
    user: 'system',
    action: '自动数据清洗',
    resource: 'input-sanitizer',
    result: 'success',
    details: '成功清洗 156 条输入数据',
  },
  {
    id: '4',
    timestamp: '2026-04-26 11:15:33',
    user: 'agent-researcher',
    action: '执行工具调用',
    resource: 'web-search',
    result: 'error',
    details: '工具调用超时，已自动重试',
  },
  {
    id: '5',
    timestamp: '2026-04-26 10:02:18',
    user: 'admin',
    action: '更新安全策略',
    resource: 'access-control',
    result: 'success',
    details: '新增 3 条访问控制规则',
  },
];

const SecurityCenter: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'policies' | 'logs'>('policies');
  const [policies, setPolicies] = useState<SecurityPolicy[]>(() => {
    const saved = localStorage.getItem('agentos-security-policies');
    return saved ? JSON.parse(saved) : defaultPolicies;
  });
  const [logs, setLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('agentos-audit-logs');
    return saved ? JSON.parse(saved) : defaultLogs;
  });
  const [filterResult, setFilterResult] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem('agentos-security-policies', JSON.stringify(policies));
  }, [policies]);

  useEffect(() => {
    localStorage.setItem('agentos-audit-logs', JSON.stringify(logs));
  }, [logs]);

  const togglePolicy = (id: string) => {
    setPolicies((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return { ...p, status: p.status === 'enabled' ? 'disabled' : 'enabled' };
        }
        return p;
      }),
    );
  };

  const filteredLogs = logs.filter((log) => {
    const matchResult = filterResult === 'all' || log.result === filterResult;
    const matchSearch =
      !searchQuery ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchResult && matchSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enabled':
        return 'var(--success-color)';
      case 'disabled':
        return 'var(--text-muted)';
      case 'warning':
        return 'var(--warning-color)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'success':
        return 'var(--success-color)';
      case 'denied':
        return 'var(--warning-color)';
      case 'error':
        return 'var(--error-color)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'success':
        return <CheckCircle size={16} />;
      case 'denied':
        return <AlertTriangle size={16} />;
      case 'error':
        return <XCircle size={16} />;
      default:
        return <Activity size={16} />;
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: '700',
            margin: '0 0 4px 0',
            color: 'var(--text-primary)',
          }}
        >
          <Shield
            size={24}
            style={{ marginRight: '8px', verticalAlign: 'middle', color: 'var(--primary-color)' }}
          />
          {t('security.title')}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
          安全策略管理与审计日志查看
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '8px',
        }}
      >
        <button
          onClick={() => setActiveTab('policies')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'policies' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'policies' ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activeTab === 'policies' ? '500' : '400',
            transition: 'all 150ms ease',
          }}
        >
          <Settings size={16} />
          {t('security.securityPolicies')}
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'logs' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'logs' ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activeTab === 'logs' ? '500' : '400',
            transition: 'all 150ms ease',
          }}
        >
          <FileText size={16} />
          审计日志
          {logs.filter((l) => l.result === 'denied' || l.result === 'error').length > 0 && (
            <span
              style={{
                background: 'rgba(255,255,255,0.3)',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '11px',
              }}
            >
              {logs.filter((l) => l.result === 'denied' || l.result === 'error').length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'policies' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '16px',
            }}
          >
            {policies.map((policy) => (
              <div
                key={policy.id}
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        background: 'var(--bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: getStatusColor(policy.status),
                      }}
                    >
                      {policy.icon}
                    </div>
                    <div>
                      <h3
                        style={{
                          fontSize: '15px',
                          fontWeight: '600',
                          margin: '0 0 4px 0',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {policy.name}
                      </h3>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        状态:{' '}
                        <span style={{ color: getStatusColor(policy.status), fontWeight: '500' }}>
                          {policy.status === 'enabled'
                            ? '已启用'
                            : policy.status === 'disabled'
                              ? '已禁用'
                              : '警告'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => togglePolicy(policy.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background:
                        policy.status === 'enabled' ? 'var(--success-light)' : 'var(--bg-tertiary)',
                      color:
                        policy.status === 'enabled'
                          ? 'var(--success-color)'
                          : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      transition: 'all 150ms ease',
                    }}
                  >
                    {policy.status === 'enabled' ? '禁用' : '启用'}
                  </button>
                </div>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    margin: '0 0 16px 0',
                    lineHeight: 1.5,
                  }}
                >
                  {policy.description}
                </p>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FileText size={12} />
                    {policy.rules} 条规则
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    更新于 {policy.lastUpdated}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              borderRadius: '10px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <h4
              style={{
                fontSize: '14px',
                fontWeight: '600',
                margin: '0 0 12px 0',
                color: 'var(--text-primary)',
              }}
            >
              <Shield size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              安全概览
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--success-color)' }}>
                  {policies.filter((p) => p.status === 'enabled').length}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>已启用</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-muted)' }}>
                  {policies.filter((p) => p.status === 'disabled').length}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {t('toolManager.statuses.disabled')}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--warning-color)' }}>
                  {policies.filter((p) => p.status === 'warning').length}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('logs.warn')}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {policies.reduce((sum, p) => sum + p.rules, 0)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>总规则数</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'logs' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索日志..."
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['all', 'success', 'denied', 'error'].map((result) => (
                <button
                  key={result}
                  onClick={() => setFilterResult(result)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: filterResult === result ? 'var(--primary-light)' : 'transparent',
                    color:
                      filterResult === result ? 'var(--primary-color)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 150ms ease',
                  }}
                >
                  {result === 'all'
                    ? '全部'
                    : result === 'success'
                      ? '成功'
                      : result === 'denied'
                        ? '拒绝'
                        : '错误'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '10px',
                  padding: '16px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                    <div style={{ color: getResultColor(log.result), marginTop: '2px' }}>
                      {getResultIcon(log.result)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: 'var(--text-primary)',
                          marginBottom: '4px',
                        }}
                      >
                        {log.action}
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          marginBottom: '8px',
                        }}
                      >
                        {log.details}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '16px',
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} />
                          {log.user}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Eye size={12} />
                          {log.resource}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} />
                          {log.timestamp}
                        </span>
                        <span
                          style={{
                            color: getResultColor(log.result),
                            textTransform: 'capitalize',
                            fontWeight: '500',
                          }}
                        >
                          {log.result === 'success'
                            ? '成功'
                            : log.result === 'denied'
                              ? '拒绝'
                              : '错误'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredLogs.length === 0 && (
              <div
                style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}
              >
                <FileText size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>未找到匹配的日志</p>
                <p style={{ margin: 0, fontSize: '13px' }}>尝试调整搜索条件或筛选器</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SecurityCenter;
