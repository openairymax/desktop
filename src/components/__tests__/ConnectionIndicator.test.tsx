import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ConnectionIndicator from '../../components/ConnectionIndicator';

vi.mock('../../hooks/useAgentOS', () => ({
  useConnection: vi.fn(),
}));

vi.mock('lucide-react', () => ({
  Wifi: (props: Record<string, unknown>) => React.createElement('svg', { ...props, 'data-icon': 'wifi' }),
  WifiOff: (props: Record<string, unknown>) => React.createElement('svg', { ...props, 'data-icon': 'wifi-off' }),
  Loader: (props: Record<string, unknown>) => React.createElement('svg', { ...props, 'data-icon': 'loader' }),
  AlertTriangle: (props: Record<string, unknown>) => React.createElement('svg', { ...props, 'data-icon': 'alert-triangle' }),
  RefreshCw: (props: Record<string, unknown>) => React.createElement('svg', { ...props, 'data-icon': 'refresh-cw' }),
}));

import { useConnection } from '../../hooks/useAgentOS';

function setupConnection(status: string, error?: string) {
  const mockConnect = vi.fn().mockResolvedValue(undefined);
  const mockDisconnect = vi.fn();
  (useConnection as ReturnType<typeof vi.fn>).mockReturnValue({
    connection: {
      status,
      error: error || null,
      metrics: { latency: 0, uptime: 0, reconnectCount: 0 },
    },
    connect: mockConnect,
    disconnect: mockDisconnect,
  });
  return { mockConnect, mockDisconnect };
}

describe('ConnectionIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders connected state', () => {
    setupConnection('connected');
    render(<ConnectionIndicator />);
    expect(screen.getByText('已连接')).toBeInTheDocument();
  });

  it('renders connecting state', () => {
    setupConnection('connecting');
    render(<ConnectionIndicator />);
    expect(screen.getByText('连接中')).toBeInTheDocument();
  });

  it('renders disconnected state', () => {
    setupConnection('disconnected');
    render(<ConnectionIndicator />);
    expect(screen.getByText('未连接')).toBeInTheDocument();
  });

  it('renders error state', () => {
    setupConnection('error', 'Network timeout');
    render(<ConnectionIndicator />);
    expect(screen.getByText('连接错误')).toBeInTheDocument();
  });

  it('shows reconnect button in error state', () => {
    setupConnection('error', 'Network timeout');
    render(<ConnectionIndicator />);
    expect(screen.getByText('重连')).toBeInTheDocument();
  });

  it('hides label in compact mode', () => {
    setupConnection('connected');
    render(<ConnectionIndicator compact={true} showLabel={false} />);
    expect(screen.queryByText('已连接')).not.toBeInTheDocument();
  });

  it('shows label in compact mode when showLabel is true', () => {
    setupConnection('connected');
    render(<ConnectionIndicator compact={true} showLabel={true} />);
    expect(screen.getByText('已连接')).toBeInTheDocument();
  });

  it('hides reconnect button when showReconnect is false', () => {
    setupConnection('error', 'Network timeout');
    render(<ConnectionIndicator showReconnect={false} />);
    expect(screen.queryByText('重连')).not.toBeInTheDocument();
  });

  it('has pointer cursor in disconnected state', () => {
    setupConnection('disconnected');
    render(<ConnectionIndicator />);
    const indicator = screen.getByTitle('未连接');
    expect(indicator.style.cursor).toBe('pointer');
  });

  it('has default cursor in connected state', () => {
    setupConnection('connected');
    render(<ConnectionIndicator />);
    const indicator = screen.getByTitle('已连接');
    expect(indicator.style.cursor).toBe('default');
  });

  it('shows error tooltip with detail', () => {
    setupConnection('error', 'Connection refused');
    render(<ConnectionIndicator />);
    const container = screen.getByTitle('连接错误: Connection refused');
    expect(container).toBeInTheDocument();
  });

  it('shows tooltip without detail for non-error states', () => {
    setupConnection('connected');
    render(<ConnectionIndicator />);
    expect(screen.getByTitle('已连接')).toBeInTheDocument();
  });
});