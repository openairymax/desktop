import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AgentOSClient,
  TaskStatus,
  MemoryLayer,
  SessionStatus,
  SkillStatus,
} from '../agentos.service';

const mockFetch = vi.fn();

// 构造 JSON-RPC 成功响应
function rpcResult(result: unknown) {
  return { ok: true, json: () => Promise.resolve({ jsonrpc: '2.0', result, id: 1 }) };
}

describe('AgentOSClient Service', () => {
  beforeEach(() => {
    global.fetch = mockFetch;
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('creates client with default config', () => {
      const client = new AgentOSClient();
      expect(client.config.endpoint).toBe('http://localhost:8080');
      expect(client.config.timeout).toBe(30000);
    });

    it('creates client with custom config', () => {
      const client = new AgentOSClient({
        endpoint: 'http://custom:8080',
        apiKey: 'test-key',
        timeout: 5000,
      });
      expect(client.config.endpoint).toBe('http://custom:8080');
      expect(client.config.apiKey).toBe('test-key');
      expect(client.config.timeout).toBe(5000);
    });

    it('initializes all service instances', () => {
      const client = new AgentOSClient();
      expect(client.tasks).toBeDefined();
      expect(client.memories).toBeDefined();
      expect(client.sessions).toBeDefined();
      expect(client.skills).toBeDefined();
      expect(client.agents).toBeDefined();
    });
  });

  describe('updateConfig', () => {
    it('updates configuration and persists to localStorage', () => {
      const client = new AgentOSClient();
      client.updateConfig({
        endpoint: 'http://new-endpoint:3000',
        apiKey: 'new-key',
      });

      expect(client.config.endpoint).toBe('http://new-endpoint:3000');
      expect(client.config.apiKey).toBe('new-key');
      expect(localStorage.getItem('agentos-endpoint')).toBe('http://new-endpoint:3000');
      expect(localStorage.getItem('agentos-api-key')).toBe('new-key');
    });
  });

  describe('TaskService', () => {
    it('submits a task via sched.dag_submit', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce(rpcResult({ dag_id: 'task-123' }));

      const task = await client.tasks.submit('Test task');

      expect(task.id).toBe('task-123');
      expect(task.description).toBe('Test task');
      expect(task.status).toBe(TaskStatus.PENDING);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('/api/');
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.method).toBe('sched.dag_submit');
      expect(body.params.dag.nodes[0].goal).toBe('Test task');
    });

    it('throws error for empty task description', async () => {
      const client = new AgentOSClient();

      await expect(client.tasks.submit('')).rejects.toThrow('任务描述 不能为空');
    });

    it('lists tasks via sched.get_stats', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce(
        rpcResult({
          tasks: [
            { id: '1', description: 'Task 1', status: 'completed', priority: 1 },
            { id: '2', description: 'Task 2', status: 'pending', priority: 2 },
          ],
        }),
      );

      const tasks = await client.tasks.list();

      expect(tasks).toHaveLength(2);
      expect(tasks[0].id).toBe('1');
      expect(tasks[1].status).toBe(TaskStatus.PENDING);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.method).toBe('sched.get_stats');
    });

    it('gets task by ID via sched.dag_status', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce(
        rpcResult({ id: 'task-456', description: 'Get task', status: 'running', priority: 5 }),
      );

      const task = await client.tasks.get('task-456');

      expect(task.id).toBe('task-456');
      expect(task.status).toBe(TaskStatus.RUNNING);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.method).toBe('sched.dag_status');
      expect(body.params.dag_id).toBe('task-456');
    });

    it('cancels a task via sched.dag_cancel', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce(rpcResult({}));

      await client.tasks.cancel('task-789');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.method).toBe('sched.dag_cancel');
      expect(body.params.dag_id).toBe('task-789');
    });

    it('deletes a task (falls back to dag_cancel)', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce(rpcResult({}));

      await client.tasks.delete('task-999');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.method).toBe('sched.dag_cancel');
      expect(body.params.dag_id).toBe('task-999');
    });
  });

  describe('MemoryService', () => {
    it('writes memory via mem.write', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce(rpcResult({ id: 'mem-1', content: 'Test memory' }));

      const memory = await client.memories.write('Test memory', MemoryLayer.L2);

      expect(memory.id).toBe('mem-1');
      expect(memory.content).toBe('Test memory');
      expect(memory.layer).toBe(MemoryLayer.L2);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.method).toBe('mem.write');
      expect(body.params.content).toBe('Test memory');
    });

    it('searches memories via mem.search', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce(
        rpcResult({
          memories: [
            { id: 'm1', content: 'Memory about AI', layer: 'L1', score: 0.95 },
            { id: 'm2', content: 'Another memory', layer: 'L2', score: 0.85 },
          ],
          total: 2,
        }),
      );

      const result = await client.memories.search('AI', 10);

      expect(result.memories).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.query).toBe('AI');
      expect(result.topK).toBe(10);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.method).toBe('mem.search');
      expect(body.params.top_k).toBe(10);
    });

    it('deletes memory via mem.delete', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce(rpcResult({}));

      await client.memories.delete('mem-delete');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.method).toBe('mem.delete');
      expect(body.params.id).toBe('mem-delete');
    });

    it('throws error for empty memory content', async () => {
      const client = new AgentOSClient();

      await expect(client.memories.write('', MemoryLayer.L1)).rejects.toThrow('记忆内容 不能为空');
    });
  });

  describe('SessionService', () => {
    it('creates session locally and writes session memory via mem.write', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce(rpcResult({ id: 'session-record' }));

      const session = await client.sessions.create('user-123');

      expect(session.id).toContain('session-');
      expect(session.userId).toBe('user-123');
      expect(session.status).toBe(SessionStatus.ACTIVE);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.method).toBe('mem.write');
      expect(body.params.metadata.session_id).toBe(session.id);
    });

    it('lists sessions from localStorage', async () => {
      const client = new AgentOSClient();
      // create 写 mem.write（第 0 次调用），list 调 mem.search（第 1 次调用），各 mock 一次
      mockFetch.mockResolvedValueOnce(rpcResult({ id: 'session-record' }));
      mockFetch.mockResolvedValueOnce(rpcResult({ memories: [] }));
      await client.sessions.create('u1');

      const sessions = await client.sessions.list();

      expect(sessions.length).toBeGreaterThanOrEqual(1);
      const body = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(body.method).toBe('mem.search');
    });

    it('closes session locally', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValue(rpcResult({}));
      const session = await client.sessions.create('u-close');

      await client.sessions.close(session.id);

      const loaded = await client.sessions.get(session.id);
      expect(loaded.status).toBe(SessionStatus.INACTIVE);
    });
  });

  describe('SkillService', () => {
    it('loads skill via plugin.load', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce(rpcResult({ name: 'Test Skill', version: '1.0.0' }));

      const skill = await client.skills.load('skill-1');

      expect(skill.id).toBe('skill-1');
      expect(skill.name).toBe('Test Skill');
      expect(skill.version).toBe('1.0.0');
      expect(skill.status).toBe(SkillStatus.ACTIVE);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.method).toBe('plugin.load');
      expect(body.params.name).toBe('skill-1');
    });

    it('executes skill via plugin.execute and returns result', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce(rpcResult({ success: true, output: { result: 'done' } }));

      const result = await client.skills.execute('skill-exec', { param: 'value' });

      expect(result.success).toBe(true);
      expect(result.output).toEqual({ result: 'done' });
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.method).toBe('plugin.execute');
      expect(body.params.params).toEqual({ param: 'value' });
    });

    it('registers new skill (falls back to plugin.load)', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce(rpcResult({}));

      const skill = await client.skills.register('New Skill', 'A new test skill');

      expect(skill.name).toBe('New Skill');
      expect(skill.description).toBe('A new test skill');
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.method).toBe('plugin.load');
    });

    it('unloads skill via plugin.unload', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce(rpcResult({}));

      await client.skills.unload('skill-unload');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.method).toBe('plugin.unload');
      expect(body.params.name).toBe('skill-unload');
    });
  });

  describe('AgentService', () => {
    it('lists agents via a2a.discover_agents', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce(
        rpcResult({
          agents: [
            { agent_id: 'a1', name: 'Agent 1', status: 'running' },
            { agent_id: 'a2', name: 'Agent 2', status: 'idle' },
          ],
        }),
      );

      const agents = await client.agents.list();

      expect(agents).toHaveLength(2);
      expect(agents[0].name).toBe('Agent 1');
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.method).toBe('a2a.discover_agents');
    });

    it('spawns new agent via a2a.register_agent', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce(rpcResult({ agent_id: 'new-agent', name: 'New Agent' }));

      const agent = await client.agents.spawn('New Agent');

      expect(agent.id).toBe('new-agent');
      expect(agent.name).toBe('New Agent');
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.method).toBe('a2a.register_agent');
    });

    it('invokes agent via agent.run', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce(rpcResult({ output: 'hello from agent' }));

      const output = await client.agents.invoke('agent-a', 'hi');

      expect(output).toBe('hello from agent');
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.method).toBe('agent.run');
      expect(body.params.prompt).toBe('hi');
    });

    it('terminates agent via a2a.unregister_agent', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce(rpcResult({}));

      await client.agents.terminate('agent-term');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.method).toBe('a2a.unregister_agent');
      expect(body.params.agent_id).toBe('agent-term');
    });
  });

  describe('Health & Metrics', () => {
    it('returns health status via info.health', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce(
        rpcResult({
          status: 'healthy',
          version: '1.0.0',
          uptime: 3600,
          timestamp: '2024-01-01T00:00:00Z',
        }),
      );

      const health = await client.health();

      expect(health.status).toBe('healthy');
      expect(health.version).toBe('1.0.0');
      expect(health.uptime).toBe(3600);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.method).toBe('info.health');
    });

    it('returns unreachable status on fetch failure', async () => {
      const client = new AgentOSClient();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const health = await client.health();

      expect(health.status).toBe('unreachable');
    });

    it('returns metrics data aggregated from gateway stats', async () => {
      const client = new AgentOSClient();
      // metrics() 并行调用 info.get_stats / sched.get_stats / mem.count / info.system
      mockFetch.mockImplementation((_url: unknown, init: RequestInit) => {
        const body = JSON.parse(String(init.body));
        switch (body.method) {
          case 'info.get_stats':
            return Promise.resolve(
              rpcResult({ tasks_total: 100, tasks_completed: 80, tasks_failed: 10, cpu_usage: 65, memory_usage: 1024 }),
            );
          case 'sched.get_stats':
            return Promise.resolve(rpcResult({ total: 100, completed: 80, failed: 10 }));
          case 'mem.count':
            return Promise.resolve(rpcResult({ count: 50 }));
          case 'info.system':
            return Promise.resolve(
              rpcResult({ cpu: { usage_percent: 65 }, memory: { used_percent: 1024 } }),
            );
          default:
            return Promise.resolve(rpcResult({}));
        }
      });

      const metrics = await client.metrics();

      expect(metrics.tasksTotal).toBe(100);
      expect(metrics.tasksCompleted).toBe(80);
      expect(metrics.cpuUsage).toBe(65);
      expect(metrics.memoryUsage).toBe(1024);
      expect(metrics.memoriesTotal).toBe(50);
    });

    it('returns zero metrics on failure', async () => {
      const client = new AgentOSClient();
      mockFetch.mockRejectedValue(new Error('Network error'));

      const metrics = await client.metrics();

      expect(metrics.tasksTotal).toBe(0);
      expect(metrics.cpuUsage).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('handles HTTP error responses', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server error details'),
      });

      await expect(client.tasks.submit('Test')).rejects.toThrow('AgentOS Gateway error 500');
    });

    it('handles JSON-RPC error responses', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            jsonrpc: '2.0',
            error: { code: -32601, message: 'Method not found' },
            id: 1,
          }),
      });

      await expect(client.tasks.submit('Test')).rejects.toThrow(
        "Gateway method 'sched.dag_submit' error: Method not found",
      );
    });

    it('handles request timeout', async () => {
      const client = new AgentOSClient({ timeout: 1 });
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new DOMException('', 'AbortError')), 10),
          ),
      );

      await expect(client.tasks.list()).rejects.toThrow('Request timeout after 1ms');
    });
  });
});
