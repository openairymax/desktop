import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server, RefreshCw, CheckCircle2, XCircle, AlertCircle,
  Clock, Loader2, Search, Wifi, WifiOff, Activity, Cpu, HardDrive, Zap
} from 'lucide-react';
import { useHealth, useConnection } from '../hooks/useAgentOS';

const ServiceManagement: React.FC = () => {
  const { health, metrics, fetchHealth, loading: healthLoading, error: healthError } = useHealth();
  const { connection, connect, disconnect } = useConnection();

  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { fetchHealth(); }, []);

  const isGatewayUp = connection.status === 'connected';

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          }}>
            <Server size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              服务管理
            </h1>
            <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)' }}>AgentOS 服务状态监控与管理</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => fetchHealth()} style={{
            padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', fontSize: 'var(--font-size-md)',
            transition: 'all var(--transition-fast)',
          }}>
            <RefreshCw size={14} className={healthLoading ? 'animate-spin' : ''} /> 刷新
          </button>
          {isGatewayUp ? (
            <button onClick={disconnect} style={{
              padding: '8px 12px', border: '1px solid var(--warning-color)', borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--warning-light)', color: 'var(--warning-color)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', fontSize: 'var(--font-size-md)',
              transition: 'all var(--transition-fast)',
            }}>
              <WifiOff size={14} /> 断开
            </button>
          ) : (
            <button onClick={connect} style={{
              padding: '8px 12px', border: '1px solid var(--success-color)', borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--success-light)', color: 'var(--success-color)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', fontSize: 'var(--font-size-md)',
              transition: 'all var(--transition-fast)',
            }}>
              <Wifi size={14} /> 连接
            </button>
          )}
        </div>
      </div>

      {healthError && (
        <div style={{
          padding: '12px 16px', marginBottom: '16px', backgroundColor: 'var(--error-light)',
          border: '1px solid var(--error-color)', borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error-color)',
        }}>
          <AlertCircle size={16} />
          <span style={{ fontSize: 'var(--font-size-sm)' }}>{healthError}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => fetchHealth()}>重试</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          {
            label: '网关状态',
            value: isGatewayUp ? '运行中' : '未连接',
            icon: isGatewayUp ? <Wifi size={18} /> : <WifiOff size={18} />,
            color: isGatewayUp ? 'var(--success-color)' : 'var(--error-color)',
            bg: isGatewayUp ? 'var(--success-light)' : 'var(--error-light)',
          },
          {
            label: '健康状态',
            value: health?.status || '—',
            icon: <Activity size={18} />,
            color: health?.status === 'ok' ? 'var(--success-color)' : 'var(--warning-color)',
            bg: health?.status === 'ok' ? 'var(--success-light)' : 'var(--warning-light)',
          },
          {
            label: '版本',
            value: health?.version || '—',
            icon: <Zap size={18} />,
            color: 'var(--info-color)',
            bg: 'var(--info-light)',
          },
          {
            label: '运行时间',
            value: health?.uptime || '—',
            icon: <Clock size={18} />,
            color: 'var(--primary-color)',
            bg: 'var(--primary-light)',
          },
        ].map(s => (
          <div key={s.label} style={{
            backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px',
            boxShadow: 'var(--shadow-sm)', transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{
              width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
              backgroundColor: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {s.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>{s.label}</p>
              <p style={{ margin: '2px 0 0 0', fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {metrics && (
        <div style={{
          backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '24px',
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={16} style={{ color: '#10b981' }} /> 系统指标
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            {Object.entries(metrics).map(([key, value]) => (
              <div key={key} style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{key}</p>
                <p style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>
                  {typeof value === 'number' ? value.toLocaleString() : String(value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{
        backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', padding: '24px',
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
          AgentOS Gateway
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: 'var(--radius-md)',
              background: isGatewayUp ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            }}>
              <Server size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                AgentOS Gateway
              </h4>
              <p style={{ margin: '2px 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                核心网关服务 — 任务调度、记忆管理、会话控制
              </p>
            </div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-xs)',
              padding: '4px 10px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--font-weight-medium)',
              color: isGatewayUp ? 'var(--success-color)' : 'var(--error-color)',
              backgroundColor: isGatewayUp ? 'var(--success-light)' : 'var(--error-light)',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isGatewayUp ? 'var(--success-color)' : 'var(--error-color)', display: 'inline-block' }} />
              {isGatewayUp ? '运行中' : '未连接'}
            </span>
          </div>

          {health && (
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>健康检查详情</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {Object.entries(health).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>{key}</span>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isGatewayUp && (
            <div style={{
              padding: '20px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
              textAlign: 'center',
            }}>
              <WifiOff size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto', opacity: 0.5 }} />
              <p style={{ margin: '0 0 12px 0', color: 'var(--text-muted)' }}>Gateway 未连接</p>
              <button onClick={connect} style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none',
                borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--font-size-md)',
                transition: 'all var(--transition-fast)',
              }}>
                <Wifi size={16} /> 连接 Gateway
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceManagement;
