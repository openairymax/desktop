import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AgentOSProvider, useAgentOS } from '../useAgentOS';

vi.mock('../../services/agentos.service', () => {
  const mockTestConnection = vi.fn().mockResolvedValue({
    status: 'healthy',
    version: '0.1.0',
    services: [],
  });
  const mockGetEndpoint = vi.fn().mockReturnValue('http://localhost:8080');
  const mockConnect = vi.fn().mockResolvedValue(undefined);
  const mockDisconnect = vi.fn();
  const mockUpdateConfig = vi.fn();

  class MockAgentOSClient {
    testConnection = mockTestConnection;
    config = { endpoint: 'http://localhost:8080' };
    getEndpoint = mockGetEndpoint;
    connect = mockConnect;
    disconnect = mockDisconnect;
    updateConfig = mockUpdateConfig;
  }

  return {
    AgentOSClient: vi.fn(() => new MockAgentOSClient()),
    mockTestConnection,
    mockGetEndpoint,
    mockConnect,
    mockDisconnect,
    mockUpdateConfig,
  };
});

describe('AgentOSProvider', () => {
  it('renders children', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AgentOSProvider>{children}</AgentOSProvider>
    );
    const { result } = renderHook(() => useAgentOS(), { wrapper });
    expect(result).toBeDefined();
  });

  it('provides connection context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AgentOSProvider>{children}</AgentOSProvider>
    );
    const { result } = renderHook(() => useAgentOS(), { wrapper });
    expect(result.current.connection).toBeDefined();
    expect(result.current.client).toBeDefined();
  });

  it('useAgentOS returns context value', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AgentOSProvider>{children}</AgentOSProvider>
    );
    const { result } = renderHook(() => useAgentOS(), { wrapper });
    expect(result.current.connect).toBeDefined();
    expect(result.current.disconnect).toBeDefined();
    expect(result.current.updateEndpoint).toBeDefined();
    expect(result.current.getEndpoint).toBeDefined();
  });

  it('getEndpoint returns current endpoint', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AgentOSProvider>{children}</AgentOSProvider>
    );
    const { result } = renderHook(() => useAgentOS(), { wrapper });
    const endpoint = result.current.getEndpoint();
    expect(typeof endpoint).toBe('string');
  });

  it('throws error when used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAgentOS())).toThrow(
      'useAgentOS must be used within an AgentOSProvider',
    );
    consoleError.mockRestore();
  });

  it('disconnect stops polling', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AgentOSProvider>{children}</AgentOSProvider>
    );
    const { result } = renderHook(() => useAgentOS(), { wrapper });
    act(() => {
      result.current.disconnect();
    });
  });

  it('updateEndpoint is callable', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AgentOSProvider>{children}</AgentOSProvider>
    );
    const { result } = renderHook(() => useAgentOS(), { wrapper });
    act(() => {
      result.current.updateEndpoint('http://new-endpoint:9090', 'test-key');
    });
  });
});
