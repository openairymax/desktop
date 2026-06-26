import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  AgentOSClient,
  HealthStatus,
  Metrics,
  Task,
  TaskResult,
  Memory,
  MemoryLayer,
  MemorySearchResult,
  Session,
  SessionStatus,
  Skill,
  SkillResult,
  AgentInfo,
  ListOptions,
} from '../services/agentos.service';

interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  health?: HealthStatus;
  error?: string;
}

interface AgentOSContextValue {
  client: AgentOSClient;
  connection: ConnectionState;
  connect: () => Promise<void>;
  disconnect: () => void;
  updateEndpoint: (endpoint: string, apiKey?: string) => void;
  getEndpoint: () => string;
}

const AgentOSContext = createContext<AgentOSContextValue | undefined>(undefined);

const POLL_INTERVAL_MS = 15000;

export function AgentOSProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new AgentOSClient());
  const [connection, setConnection] = useState<ConnectionState>({
    status: 'disconnected',
  });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    setConnection((prev) => ({ ...prev, status: 'connecting' }));
    try {
      const health = await client.testConnection();
      if (health.status === 'unreachable') {
        setConnection({
          status: 'error',
          error: `Cannot reach AgentRT Gateway at ${client.config.endpoint}`,
        });
        return;
      }
      setConnection({ status: 'connected', health });
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const h = await client.testConnection();
          setConnection((prev) => ({ ...prev, health: h }));
        } catch (e) {
          setConnection((prev) =>
            prev.status === 'connected'
              ? { status: 'disconnected', error: 'Connection lost' }
              : prev,
          );
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      setConnection({
        status: 'error',
        error: err instanceof Error ? err.message : 'Connection failed',
      });
    }
  }, [client, stopPolling]);

  const disconnect = useCallback(() => {
    stopPolling();
    setConnection({ status: 'disconnected' });
  }, [stopPolling]);

  const updateEndpoint = useCallback(
    (endpoint: string, apiKey?: string) => {
      client.updateConfig({ endpoint, apiKey });
      stopPolling();
      setConnection({ status: 'disconnected' });
    },
    [client, stopPolling],
  );

  const getEndpoint = useCallback(() => client.config.endpoint, [client]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return (
    <AgentOSContext.Provider
      value={{ client, connection, connect, disconnect, updateEndpoint, getEndpoint }}
    >
      {children}
    </AgentOSContext.Provider>
  );
}

export function useAgentOS(): AgentOSContextValue {
  const context = useContext(AgentOSContext);
  if (!context) {
    throw new Error('useAgentOS must be used within an AgentOSProvider');
  }
  return context;
}

export function useConnection() {
  const { connection, connect, disconnect } = useAgentOS();
  return { connection, connect, disconnect };
}

export function useTasks() {
  const { client } = useAgentOS();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(
    async (opts?: ListOptions) => {
      setLoading(true);
      setError(null);
      try {
        const result = await client.tasks.list(opts);
        setTasks(result);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch tasks';
        setError(msg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const submitTask = useCallback(
    async (
      description: string,
      options?: { priority?: number; metadata?: Record<string, unknown> },
    ): Promise<Task | null> => {
      try {
        const task =
          options?.priority !== undefined || options?.metadata
            ? await client.tasks.submitWithOptions(
                description,
                options.priority ?? 0,
                options.metadata,
              )
            : await client.tasks.submit(description);
        await fetchTasks();
        return task;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit task');
        return null;
      }
    },
    [client, fetchTasks],
  );

  const getTask = useCallback(
    async (taskId: string): Promise<Task | null> => {
      try {
        return await client.tasks.get(taskId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get task');
        return null;
      }
    },
    [client],
  );

  const cancelTask = useCallback(
    async (taskId: string): Promise<boolean> => {
      try {
        await client.tasks.cancel(taskId);
        await fetchTasks();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to cancel task');
        return false;
      }
    },
    [client, fetchTasks],
  );

  const deleteTask = useCallback(
    async (taskId: string): Promise<boolean> => {
      try {
        await client.tasks.delete(taskId);
        await fetchTasks();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete task');
        return false;
      }
    },
    [client, fetchTasks],
  );

  const waitForTask = useCallback(
    async (taskId: string, timeout?: number): Promise<TaskResult | null> => {
      try {
        return await client.tasks.wait(taskId, timeout);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to wait for task');
        return null;
      }
    },
    [client],
  );

  const batchSubmit = useCallback(
    async (descriptions: string[]): Promise<Task[]> => {
      try {
        const result = await client.tasks.batchSubmit(descriptions);
        await fetchTasks();
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to batch submit');
        return [];
      }
    },
    [client, fetchTasks],
  );

  const getTaskCount = useCallback(async (): Promise<number> => {
    try {
      return await client.tasks.count();
    } catch (e) {
      return tasks.length;
    }
  }, [client, tasks.length]);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    submitTask,
    getTask,
    cancelTask,
    deleteTask,
    waitForTask,
    batchSubmit,
    getTaskCount,
  };
}

export function useMemory() {
  const { client } = useAgentOS();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMemories = useCallback(
    async (opts?: ListOptions) => {
      setLoading(true);
      setError(null);
      try {
        const result = await client.memories.list(opts);
        setMemories(result);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch memories';
        setError(msg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const writeMemory = useCallback(
    async (content: string, layer: MemoryLayer): Promise<Memory | null> => {
      try {
        const memory = await client.memories.write(content, layer);
        await fetchMemories();
        return memory;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to write memory');
        return null;
      }
    },
    [client, fetchMemories],
  );

  const searchMemory = useCallback(
    async (query: string, topK = 10): Promise<MemorySearchResult> => {
      try {
        return await client.memories.search(query, topK);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search memory');
        return { memories: [], total: 0, query, topK };
      }
    },
    [client],
  );

  const deleteMemory = useCallback(
    async (memoryId: string): Promise<boolean> => {
      try {
        await client.memories.delete(memoryId);
        await fetchMemories();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete memory');
        return false;
      }
    },
    [client, fetchMemories],
  );

  const getMemoryCount = useCallback(async (): Promise<number> => {
    try {
      return await client.memories.count();
    } catch (e) {
      return memories.length;
    }
  }, [client, memories.length]);

  const evolveMemory = useCallback(async (): Promise<boolean> => {
    try {
      await client.memories.evolve();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evolve memory');
      return false;
    }
  }, [client]);

  const getMemoryStats = useCallback(async (): Promise<Record<string, number>> => {
    try {
      return await client.memories.getStats();
    } catch (e) {
      return {};
    }
  }, [client]);

  const clearMemories = useCallback(async (): Promise<boolean> => {
    try {
      await client.memories.clear();
      await fetchMemories();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear memories');
      return false;
    }
  }, [client, fetchMemories]);

  return {
    memories,
    loading,
    error,
    fetchMemories,
    writeMemory,
    searchMemory,
    deleteMemory,
    getMemoryCount,
    evolveMemory,
    getMemoryStats,
    clearMemories,
  };
}

export function useSessions() {
  const { client } = useAgentOS();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(
    async (opts?: ListOptions) => {
      setLoading(true);
      setError(null);
      try {
        const result = await client.sessions.list(opts);
        setSessions(result);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch sessions';
        setError(msg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const createSession = useCallback(
    async (userId: string): Promise<Session | null> => {
      try {
        const session = await client.sessions.create(userId);
        await fetchSessions();
        return session;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create session');
        return null;
      }
    },
    [client, fetchSessions],
  );

  const closeSession = useCallback(
    async (sessionId: string): Promise<boolean> => {
      try {
        await client.sessions.close(sessionId);
        await fetchSessions();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to close session');
        return false;
      }
    },
    [client, fetchSessions],
  );

  const getSessionCount = useCallback(async (): Promise<number> => {
    try {
      return await client.sessions.count();
    } catch (e) {
      return sessions.length;
    }
  }, [client, sessions.length]);

  const getActiveSessionCount = useCallback(async (): Promise<number> => {
    try {
      return await client.sessions.countActive();
    } catch (e) {
      return sessions.filter((s) => s.status === SessionStatus.ACTIVE).length;
    }
  }, [client, sessions]);

  const cleanExpiredSessions = useCallback(async (): Promise<number> => {
    try {
      const count = await client.sessions.cleanExpired();
      await fetchSessions();
      return count;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clean expired sessions');
      return 0;
    }
  }, [client, fetchSessions]);

  return {
    sessions,
    loading,
    error,
    fetchSessions,
    createSession,
    closeSession,
    getSessionCount,
    getActiveSessionCount,
    cleanExpiredSessions,
  };
}

export function useSkills() {
  const { client } = useAgentOS();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSkills = useCallback(
    async (opts?: ListOptions) => {
      setLoading(true);
      setError(null);
      try {
        const result = await client.skills.list(opts);
        setSkills(result);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch skills';
        setError(msg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const loadSkill = useCallback(
    async (skillId: string): Promise<Skill | null> => {
      try {
        const skill = await client.skills.load(skillId);
        await fetchSkills();
        return skill;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load skill');
        return null;
      }
    },
    [client, fetchSkills],
  );

  const executeSkill = useCallback(
    async (skillId: string, parameters?: Record<string, unknown>): Promise<SkillResult | null> => {
      try {
        return await client.skills.execute(skillId, parameters);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to execute skill');
        return null;
      }
    },
    [client],
  );

  const unloadSkill = useCallback(
    async (skillId: string): Promise<boolean> => {
      try {
        await client.skills.unload(skillId);
        await fetchSkills();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to unload skill');
        return false;
      }
    },
    [client, fetchSkills],
  );

  const registerSkill = useCallback(
    async (
      name: string,
      description: string,
      parameters?: Record<string, unknown>,
    ): Promise<Skill | null> => {
      try {
        const skill = await client.skills.register(name, description, parameters);
        await fetchSkills();
        return skill;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to register skill');
        return null;
      }
    },
    [client, fetchSkills],
  );

  const deleteSkill = useCallback(
    async (skillId: string): Promise<boolean> => {
      try {
        await client.skills.delete(skillId);
        await fetchSkills();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete skill');
        return false;
      }
    },
    [client, fetchSkills],
  );

  const searchSkills = useCallback(
    async (query: string, topK = 10): Promise<Skill[]> => {
      try {
        return await client.skills.search(query, topK);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search skills');
        return [];
      }
    },
    [client],
  );

  const getSkillCount = useCallback(async (): Promise<number> => {
    try {
      return await client.skills.count();
    } catch (e) {
      return skills.length;
    }
  }, [client, skills.length]);

  return {
    skills,
    loading,
    error,
    fetchSkills,
    loadSkill,
    executeSkill,
    unloadSkill,
    registerSkill,
    deleteSkill,
    searchSkills,
    getSkillCount,
  };
}

export function useAgents() {
  const { client } = useAgentOS();
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await client.agents.list();
      setAgents(result);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch agents';
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, [client]);

  const spawnAgent = useCallback(
    async (name: string, spec?: Record<string, unknown>) => {
      try {
        const agent = await client.agents.spawn(name, spec);
        await fetchAgents();
        return agent;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to spawn agent');
        return null;
      }
    },
    [client, fetchAgents],
  );

  const terminateAgent = useCallback(
    async (agentId: string): Promise<boolean> => {
      try {
        await client.agents.terminate(agentId);
        await fetchAgents();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to terminate agent');
        return false;
      }
    },
    [client, fetchAgents],
  );

  const invokeAgent = useCallback(
    async (agentId: string, input: string): Promise<string | null> => {
      try {
        return await client.agents.invoke(agentId, input);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to invoke agent');
        return null;
      }
    },
    [client],
  );

  return {
    agents,
    loading,
    error,
    fetchAgents,
    spawnAgent,
    terminateAgent,
    invokeAgent,
  };
}

export function useHealth() {
  const { client } = useAgentOS();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await client.health();
      setHealth(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await client.metrics();
      setMetrics(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchHealth(), fetchMetrics()]);
  }, [fetchHealth, fetchMetrics]);

  return {
    health,
    metrics,
    loading,
    error,
    fetchHealth,
    fetchMetrics,
    fetchAll,
  };
}
