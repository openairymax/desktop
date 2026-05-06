import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import {
  AgentOSProvider,
  useAgentOS,
  useTasks,
  useMemory,
  useSessions,
  useSkills,
  useAgents,
  useHealth,
  useConnection,
} from '../useAgentOS';

const mockHealthResponse = {
  status: 'healthy',
  version: '1.0.0',
  uptime: 3600,
  timestamp: '2024-01-01T00:00:00Z',
};

function createWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <AgentOSProvider>{children}</AgentOSProvider>;
  };
}

describe('useAgentOS Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockHealthResponse),
    });
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('throws error when used outside AgentOSProvider', () => {
    console.error = vi.fn();

    expect(() => {
      renderHook(() => useAgentOS());
    }).toThrow('useAgentOS must be used within an AgentOSProvider');
  });

  it('provides client instance', () => {
    const { result } = renderHook(() => useAgentOS(), { wrapper: createWrapper() });

    expect(result.current.client).toBeDefined();
    expect(result.current.connection.status).toBe('disconnected');
  });

  it('provides connect and disconnect functions', () => {
    const { result } = renderHook(() => useAgentOS(), { wrapper: createWrapper() });

    expect(typeof result.current.connect).toBe('function');
    expect(typeof result.current.disconnect).toBe('function');
  });

  it('provides updateEndpoint and getEndpoint functions', () => {
    const { result } = renderHook(() => useAgentOS(), { wrapper: createWrapper() });

    expect(typeof result.current.updateEndpoint).toBe('function');
    expect(typeof result.current.getEndpoint).toBe('function');
    expect(result.current.getEndpoint()).toBe('http://localhost:18789');
  });
});

describe('useConnection Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockHealthResponse),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('returns connection state', () => {
    const { result } = renderHook(() => useConnection(), { wrapper: createWrapper() });

    expect(result.current.connection.status).toBe('disconnected');
  });

  it('connects successfully', async () => {
    const { result } = renderHook(() => useConnection(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.connection.status).toBe('connected');
    expect(result.current.connection.health).toEqual(mockHealthResponse);
  });

  it('handles connection error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useConnection(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.connection.status).toBe('error');
    expect(result.current.connection.error).toBeDefined();
  });

  it('disconnects and stops polling', async () => {
    const { result } = renderHook(() => useConnection(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.connection.status).toBe('connected');

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.connection.status).toBe('disconnected');
  });
});

describe('useTasks Hook', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url?.includes('/tasks')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                tasks: [
                  { id: '1', description: 'Task 1', status: 'completed', priority: 1 },
                  { id: '2', description: 'Task 2', status: 'pending', priority: 2 },
                ],
              },
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: {} }) });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches tasks list', async () => {
    const { result } = renderHook(() => useTasks(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.fetchTasks();
    });

    expect(result.current.tasks).toHaveLength(2);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('submits new task', async () => {
    const { result } = renderHook(() => useTasks(), { wrapper: createWrapper() });

    let task;
    await act(async () => {
      task = await result.current.submitTask('New task');
    });

    expect(task).not.toBeNull();
    expect(task!.description).toBe('New task');
  });

  it('sets loading state during fetch', async () => {
    let resolvePromise: (value: unknown) => void;
    global.fetch = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const { result } = renderHook(() => useTasks(), { wrapper: createWrapper() });

    act(() => {
      result.current.fetchTasks();
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ data: { tasks: [] } }),
      });
    });

    expect(result.current.loading).toBe(false);
  });

  it('handles fetch error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Fetch failed'));

    const { result } = renderHook(() => useTasks(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.fetchTasks();
    });

    expect(result.current.error).toBe('Fetch failed');
    expect(result.current.tasks).toHaveLength(0);
  });

  it('cancels task', async () => {
    const { result } = renderHook(() => useTasks(), { wrapper: createWrapper() });

    let success;
    await act(async () => {
      success = await result.current.cancelTask('task-1');
    });

    expect(success).toBe(true);
  });

  it('deletes task', async () => {
    const { result } = renderHook(() => useTasks(), { wrapper: createWrapper() });

    let success;
    await act(async () => {
      success = await result.current.deleteTask('task-1');
    });

    expect(success).toBe(true);
  });
});

describe('useMemory Hook', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url?.includes('/memories')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                memories: [
                  { id: 'm1', content: 'Memory 1', layer: 'L1' },
                  { id: 'm2', content: 'Memory 2', layer: 'L2' },
                ],
                total: 2,
              },
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: {} }) });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches memories list', async () => {
    const { result } = renderHook(() => useMemory(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.fetchMemories();
    });

    expect(result.current.memories).toHaveLength(2);
  });

  it('writes memory', async () => {
    const { result } = renderHook(() => useMemory(), { wrapper: createWrapper() });

    let memory;
    await act(async () => {
      memory = await result.current.writeMemory('Test memory', 'L1' as any);
    });

    expect(memory).not.toBeNull();
    expect(memory!.content).toBe('Test memory');
  });

  it('searches memories', async () => {
    const { result } = renderHook(() => useMemory(), { wrapper: createWrapper() });

    let searchResult;
    await act(async () => {
      searchResult = await result.current.searchMemory('test query', 5);
    });

    expect(searchResult!.query).toBe('test query');
    expect(searchResult!.topK).toBe(5);
  });

  it('deletes memory', async () => {
    const { result } = renderHook(() => useMemory(), { wrapper: createWrapper() });

    let success;
    await act(async () => {
      success = await result.current.deleteMemory('m1');
    });

    expect(success).toBe(true);
  });
});

describe('useSessions Hook', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url?.includes('/sessions')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                sessions: [
                  { id: 's1', user_id: 'u1', status: 'active' },
                  { id: 's2', user_id: 'u2', status: 'inactive' },
                ],
              },
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: {} }) });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches sessions list', async () => {
    const { result } = renderHook(() => useSessions(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.fetchSessions();
    });

    expect(result.current.sessions).toHaveLength(2);
  });

  it('creates session', async () => {
    const { result } = renderHook(() => useSessions(), { wrapper: createWrapper() });

    let session;
    await act(async () => {
      session = await result.current.createSession('user-123');
    });

    expect(session).not.toBeNull();
    expect(session!.userId).toBe('user-123');
  });

  it('closes session', async () => {
    const { result } = renderHook(() => useSessions(), { wrapper: createWrapper() });

    let success;
    await act(async () => {
      success = await result.current.closeSession('s1');
    });

    expect(success).toBe(true);
  });
});

describe('useSkills Hook', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url?.includes('/skills')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                skills: [
                  { id: 'sk1', name: 'Skill 1', version: '1.0.0', status: 'active' },
                  { id: 'sk2', name: 'Skill 2', version: '2.0.0', status: 'inactive' },
                ],
              },
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: {} }) });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches skills list', async () => {
    const { result } = renderHook(() => useSkills(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.fetchSkills();
    });

    expect(result.current.skills).toHaveLength(2);
  });

  it('loads skill', async () => {
    const { result } = renderHook(() => useSkills(), { wrapper: createWrapper() });

    let skill;
    await act(async () => {
      skill = await result.current.loadSkill('sk1');
    });

    expect(skill).not.toBeNull();
    expect(skill!.id).toBe('sk1');
  });

  it('executes skill', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: { success: true, output: { result: 'done' } },
        }),
    });

    const { result } = renderHook(() => useSkills(), { wrapper: createWrapper() });

    let execResult;
    await act(async () => {
      execResult = await result.current.executeSkill('sk1', { param: 'val' });
    });

    expect(execResult!.success).toBe(true);
  });

  it('registers skill', async () => {
    const { result } = renderHook(() => useSkills(), { wrapper: createWrapper() });

    let skill;
    await act(async () => {
      skill = await result.current.registerSkill('New Skill', 'Description');
    });

    expect(skill).not.toBeNull();
    expect(skill!.name).toBe('New Skill');
  });
});

describe('useAgents Hook', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url?.includes('/agents')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                agents: [
                  { agent_id: 'a1', name: 'Agent 1', status: 'running' },
                  { agent_id: 'a2', name: 'Agent 2', status: 'idle' },
                ],
              },
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: {} }) });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches agents list', async () => {
    const { result } = renderHook(() => useAgents(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.fetchAgents();
    });

    expect(result.current.agents).toHaveLength(2);
  });

  it('spawns agent', async () => {
    const { result } = renderHook(() => useAgents(), { wrapper: createWrapper() });

    let agent;
    await act(async () => {
      agent = await result.current.spawnAgent('New Agent');
    });

    expect(agent).not.toBeNull();
    expect(agent!.name).toBe('New Agent');
  });

  it('terminates agent', async () => {
    const { result } = renderHook(() => useAgents(), { wrapper: createWrapper() });

    let success;
    await act(async () => {
      success = await result.current.terminateAgent('a1');
    });

    expect(success).toBe(true);
  });
});

describe('useHealth Hook', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url?.includes('/health')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockHealthResponse),
        });
      }
      if (url?.includes('/metrics')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                tasks_total: 100,
                cpu_usage: 65,
                memory_usage: 1024,
              },
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches health status', async () => {
    const { result } = renderHook(() => useHealth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.fetchHealth();
    });

    expect(result.current.health).toEqual(mockHealthResponse);
  });

  it('fetches metrics', async () => {
    const { result } = renderHook(() => useHealth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.fetchMetrics();
    });

    expect(result.current.metrics).toBeDefined();
    expect(result.current.metrics!.tasksTotal).toBe(100);
    expect(result.current.metrics!.cpuUsage).toBe(65);
  });

  it('fetches all health and metrics together', async () => {
    const { result } = renderHook(() => useHealth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.fetchAll();
    });

    expect(result.current.health).toEqual(mockHealthResponse);
    expect(result.current.metrics).toBeDefined();
  });
});
