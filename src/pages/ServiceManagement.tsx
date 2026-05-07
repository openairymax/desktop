import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Server,
  Wifi,
  WifiOff,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Link as LinkIcon,
  Activity,
} from 'lucide-react';
import { useHealth, useConnection } from '../hooks/useAgentOS';

interface ServiceInfo {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error' | 'unknown';
  endpoint?: string;
  latencyMs?: number;
  lastCheck?: string;
}

const STATUS_MAP: Record<
  string,
  { icon: React.ReactNode; color: string; bg: string; label: string }
> = {
  connected: {
    icon: <Wifi size={14} />,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    label: '已连接',
  },
  disconnected: {
    icon: <WifiOff size={14} />,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
    label: '未连接',
  },
  error: {
    icon: <AlertCircle size={14} />,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    label: '异常',
  },
  unknown: {
    icon: <AlertCircle size={14} />,
    color: '#94a3b8',
    bg: 'var(--bg-tertiary)',
    label: '未知',
  },
};

const ServiceManagement: React.FC = () => {
  const { health, fetchHealth } = useHealth();
  const { connection } = useConnection();
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  useEffect(() => {
    const gatewayStatus: ServiceInfo['status'] =
      connection.status === 'connected'
        ? 'connected'
        : connection.status === 'error'
          ? 'error'
          : connection.status === 'connecting'
            ? 'unknown'
            : 'disconnected';

    const svcList: ServiceInfo[] = [
      {
        id: 'svc-gateway',
        name: 'AgentOS Gateway',
        type: 'gateway',
        status: gatewayStatus,
        endpoint: localStorage.getItem('agentos-endpoint') || AGENTOS_GATEWAY_URL,
        latencyMs: health?.uptime != null ? 0 : undefined,
        lastCheck: health?.timestamp || new Date().toISOString(),
      },
      {
        id: 'svc-llm',
        name: 'LLM Provider',
        type: 'llm',
        status:
          health?.checks?.llm === 'ok'
            ? 'connected'
            : health?.checks?.llm === 'error'
              ? 'error'
              : 'unknown',
        endpoint: (health?.checks?.llm_endpoint as string) || 'https://api.openai.com/v1',
        lastCheck: health?.timestamp,
      },
      {
        id: 'svc-memory',
        name: 'Memory Store',
        type: 'memory',
        status:
          health?.checks?.memory === 'ok'
            ? 'connected'
            : health?.checks?.memory === 'error'
              ? 'error'
              : 'unknown',
        endpoint: (health?.checks?.memory_endpoint as string) || 'localhost:6379',
        lastCheck: health?.timestamp,
      },
      {
        id: 'svc-queue',
        name: 'Task Queue',
        type: 'queue',
        status:
          health?.checks?.queue === 'ok'
            ? 'connected'
            : health?.checks?.queue === 'error'
              ? 'error'
              : 'unknown',
        endpoint: (health?.checks?.queue_endpoint as string) || 'localhost:5672',
        lastCheck: health?.timestamp,
      },
    ];
    setServices(svcList);
    setLoading(false);
  }, [health, connection]);

  const handleHealthCheck = async (id: string) => {
    setCheckingId(id);
    try {
      await fetchHealth();
    } catch (e) {
      console.error('Health check failed:', e);
    }
    setCheckingId(null);
  };

  const handleCheckAll = async () => {
    try {
      await fetchHealth();
    } catch (e) {
      console.error('Health check all failed:', e);
    }
  };

  const stats = {
    total: services.length,
    connected: services.filter((s) => s.status === 'connected').length,
    error: services.filter((s) => s.status === 'error').length,
    disconnected: services.filter((s) => s.status === 'disconnected').length,
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
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
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <Server size={20} />
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
              服务网关
            </h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              连接状态监控与服务健康检查
            </p>
          </div>
        </div>
        <button
          onClick={handleCheckAll}
          disabled={checkingId !== null}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '8px',
            background: checkingId
              ? 'var(--bg-tertiary)'
              : 'linear-gradient(135deg, #10b981, #059669)',
            color: checkingId ? 'var(--text-muted)' : 'white',
            cursor: checkingId ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {checkingId ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />} 全部检查
        </button>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {[
          {
            label: '总服务数',
            value: stats.total,
            icon: <Server size={16} />,
            bg: 'rgba(99,102,241,0.1)',
            color: '#6366f1',
          },
          {
            label: '已连接',
            value: stats.connected,
            icon: <CheckCircle2 size={16} />,
            bg: 'var(--success-light)',
            color: 'var(--success-color)',
          },
          {
            label: '异常',
            value: stats.error,
            icon: <AlertCircle size={16} />,
            bg: 'var(--warning-light)',
            color: 'var(--warning-color)',
          },
          {
            label: '断开',
            value: stats.disconnected,
            icon: <XCircle size={16} />,
            bg: 'var(--error-light)',
            color: 'var(--error-color)',
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: s.bg,
                color: s.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {s.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{s.label}</p>
              <p
                style={{
                  margin: '2px 0 0 0',
                  fontSize: '20px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                }}
              >
                {s.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Service List */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <Loader2 size={28} />
        </div>
      )}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {services.map((svc, index) => {
            const st = STATUS_MAP[svc.status];
            return (
              <motion.div
                key={svc.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: `1px solid ${st.color}33`,
                  borderRadius: '12px',
                  padding: '18px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: st.bg,
                    color: st.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {st.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {svc.name}
                    </h3>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: '500',
                        color: st.color,
                        backgroundColor: st.bg,
                      }}
                    >
                      {st.label}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {svc.type}
                    </span>
                  </div>
                  {svc.endpoint && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <LinkIcon size={11} />
                      <code>{svc.endpoint}</code>
                      {svc.latencyMs != null && <span>· 延迟 {svc.latencyMs}ms</span>}
                      {svc.lastCheck && (
                        <span>· {new Date(svc.lastCheck).toLocaleTimeString()}</span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleHealthCheck(svc.id)}
                  disabled={checkingId === svc.id}
                  style={{
                    padding: '7px 14px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {checkingId === svc.id ? <Loader2 size={12} /> : <Activity size={12} />}检查
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ServiceManagement;
