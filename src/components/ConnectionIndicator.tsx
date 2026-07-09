import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useConnection } from '../hooks/useAgentOS';
import { Wifi, WifiOff, Loader, AlertTriangle, RefreshCw } from 'lucide-react';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface ConnectionIndicatorProps {
  compact?: boolean;
  showLabel?: boolean;
  showReconnect?: boolean;
}

const STATUS_CONFIG: Record<
  ConnectionStatus,
  {
    color: string;
    bgColor: string;
    label: string;
    labelCn: string;
    icon: React.ReactNode;
    pulse: boolean;
  }
> = {
  connected: {
    color: 'var(--success-color, #22c55e)',
    bgColor: 'rgba(52, 199, 89, 0.1)',
    label: 'Connected',
    labelCn: '已连接',
    icon: <Wifi size={12} />,
    pulse: false,
  },
  connecting: {
    color: 'var(--warning-color, #ff9f0a)',
    bgColor: 'rgba(255, 159, 10, 0.1)',
    label: 'Connecting',
    labelCn: '连接中',
    icon: <Loader size={12} />,
    pulse: true,
  },
  disconnected: {
    color: 'var(--text-muted, #9ca3af)',
    bgColor: 'rgba(156, 163, 175, 0.1)',
    label: 'Disconnected',
    labelCn: '未连接',
    icon: <WifiOff size={12} />,
    pulse: false,
  },
  error: {
    color: 'var(--error-color, #ff3b30)',
    bgColor: 'rgba(255, 59, 48, 0.1)',
    label: 'Error',
    labelCn: '连接错误',
    icon: <AlertTriangle size={12} />,
    pulse: false,
  },
};

const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({
  compact = false,
  showLabel = true,
  showReconnect = true,
}) => {
  const { connection, connect, disconnect } = useConnection();
  const status = connection.status;
  const config = STATUS_CONFIG[status];
  const [reconnecting, setReconnecting] = useState(false);
  const [_lastChecked, setLastChecked] = useState<Date | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status === 'connected' || status === 'error') {
      setLastChecked(new Date());
    }
  }, [status]);

  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, []);

  const handleReconnect = useCallback(async () => {
    if (reconnecting) return;
    setReconnecting(true);
    try {
      disconnect();
      await new Promise<void>((resolve) => {
        reconnectTimerRef.current = setTimeout(resolve, 500);
      });
      await connect();
    } finally {
      setReconnecting(false);
    }
  }, [connect, disconnect, reconnecting]);

  const dotStyle: React.CSSProperties = {
    width: compact ? '5px' : '6px',
    height: compact ? '5px' : '6px',
    borderRadius: '50%',
    backgroundColor: config.color,
    animation: config.pulse ? 'connectionPulse 1.5s ease-in-out infinite' : 'none',
    flexShrink: 0,
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: compact ? '4px' : '6px',
    padding: compact ? '0' : '2px 8px',
    borderRadius: '4px',
    backgroundColor: compact ? 'transparent' : config.bgColor,
    transition: 'all 0.3s ease',
    cursor:
      (status === 'disconnected' || status === 'error') && showReconnect ? 'pointer' : 'default',
    userSelect: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: compact ? '10px' : '11px',
    color: config.color,
    fontWeight: 500,
    whiteSpace: 'nowrap',
  };

  const reconnectButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    padding: '1px 6px',
    border: '1px solid var(--border-subtle, #e5e7eb)',
    borderRadius: '3px',
    backgroundColor: 'transparent',
    color: 'var(--text-muted, #9ca3af)',
    fontSize: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const errorDetail = status === 'error' && connection.error ? connection.error : null;

  return (
    <>
      <style>{`
        @keyframes connectionPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
      <div
        style={containerStyle}
        onClick={
          (status === 'disconnected' || status === 'error') && showReconnect
            ? handleReconnect
            : undefined
        }
        title={
          status === 'error' && errorDetail ? `${config.labelCn}: ${errorDetail}` : config.labelCn
        }
      >
        <div style={dotStyle} />
        {showLabel && <span style={labelStyle}>{config.labelCn}</span>}
        {status === 'error' && showReconnect && !compact && (
          <button
            style={reconnectButtonStyle}
            onClick={(e) => {
              e.stopPropagation();
              handleReconnect();
            }}
            disabled={reconnecting}
          >
            <RefreshCw
              size={9}
              style={{
                animation: reconnecting ? 'connectionSpin 1s linear infinite' : 'none',
              }}
            />
            {reconnecting ? '重连中' : '重连'}
          </button>
        )}
      </div>
      <style>{`
        @keyframes connectionSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default ConnectionIndicator;
