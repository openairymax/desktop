import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AgentOSClient,
  TaskStatus,
  MemoryLayer,
  SessionStatus,
  SkillStatus,
} from '../agentos.service';

const mockFetch = vi.fn();

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
      expect(client.config.endpoint).toBe('http://localhost:18789');
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
    it('submits a task successfully', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { task_id: 'task-123', description: 'Test task' },
          }),
      });

      const task = await client.tasks.submit('Test task');

      expect(task.id).toBe('task-123');
      expect(task.description).toBe('Test task');
      expect(task.status).toBe(TaskStatus.PENDING);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/tasks'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('throws error for empty task description', async () => {
      const client = new AgentOSClient();

      await expect(client.tasks.submit('')).rejects.toThrow('任务描述 不能为空');
    });

    it('lists tasks successfully', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce({
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

      const tasks = await client.tasks.list();

      expect(tasks).toHaveLength(2);
      expect(tasks[0].id).toBe('1');
      expect(tasks[1].status).toBe(TaskStatus.PENDING);
    });

    it('gets task by ID', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { id: 'task-456', description: 'Get task', status: 'running', priority: 5 },
          }),
      });

      const task = await client.tasks.get('task-456');

      expect(task.id).toBe('task-456');
      expect(task.status).toBe(TaskStatus.RUNNING);
    });

    it('cancels a task', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

      await client.tasks.cancel('task-789');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/tasks/task-789/cancel'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('deletes a task', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

      await client.tasks.delete('task-999');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/tasks/task-999'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('MemoryService', () => {
    it('writes memory successfully', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { memory_id: 'mem-1', content: 'Test memory', layer: 'L2' },
          }),
      });

      const memory = await client.memories.write('Test memory', MemoryLayer.L2);

      expect(memory.id).toBe('mem-1');
      expect(memory.content).toBe('Test memory');
      expect(memory.layer).toBe(MemoryLayer.L2);
    });

    it('searches memories by query', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              memories: [
                { id: 'm1', content: 'Memory about AI', layer: 'L1', score: 0.95 },
                { id: 'm2', content: 'Another memory', layer: 'L2', score: 0.85 },
              ],
              total: 2,
            },
          }),
      });

      const result = await client.memories.search('AI', 10);

      expect(result.memories).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.query).toBe('AI');
      expect(result.topK).toBe(10);
    });

    it('deletes memory by ID', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

      await client.memories.delete('mem-delete');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/memories/mem-delete'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('throws error for empty memory content', async () => {
      const client = new AgentOSClient();

      await expect(client.memories.write('', MemoryLayer.L1)).rejects.toThrow('记忆内容 不能为空');
    });
  });

  describe('SessionService', () => {
    it('creates session successfully', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { session_id: 'sess-1', user_id: 'user-123' },
          }),
      });

      const session = await client.sessions.create('user-123');

      expect(session.id).toBe('sess-1');
      expect(session.userId).toBe('user-123');
      expect(session.status).toBe(SessionStatus.ACTIVE);
    });

    it('lists sessions', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce({
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

      const sessions = await client.sessions.list();

      expect(sessions).toHaveLength(2);
      expect(sessions[0].status).toBe(SessionStatus.ACTIVE);
    });

    it('closes session', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

      await client.sessions.close('sess-close');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/sessions/sess-close'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('SkillService', () => {
    it('loads skill successfully', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { skill_id: 'skill-1', name: 'Test Skill', version: '1.0.0' },
          }),
      });

      const skill = await client.skills.load('skill-1');

      expect(skill.id).toBe('skill-1');
      expect(skill.name).toBe('Test Skill');
      expect(skill.version).toBe('1.0.0');
      expect(skill.status).toBe(SkillStatus.ACTIVE);
    });

    it('executes skill and returns result', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { success: true, output: { result: 'done' } },
          }),
      });

      const result = await client.skills.execute('skill-exec', { param: 'value' });

      expect(result.success).toBe(true);
      expect(result.output).toEqual({ result: 'done' });
    });

    it('registers new skill', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { skill_id: 'new-skill', name: 'New Skill' },
          }),
      });

      const skill = await client.skills.register('New Skill', 'A new test skill');

      expect(skill.name).toBe('New Skill');
      expect(skill.description).toBe('A new test skill');
    });

    it('unloads skill', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

      await client.skills.unload('skill-unload');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/skills/skill-unload/unload'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('AgentService', () => {
    it('lists agents', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce({
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

      const agents = await client.agents.list();

      expect(agents).toHaveLength(2);
      expect(agents[0].name).toBe('Agent 1');
    });

    it('spawns new agent', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { agent_id: 'new-agent', name: 'New Agent' },
          }),
      });

      const agent = await client.agents.spawn('New Agent');

      expect(agent.id).toBe('new-agent');
      expect(agent.name).toBe('New Agent');
      expect(agent.status).toBe('running');
    });

    it('terminates agent', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

      await client.agents.terminate('agent-term');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/agents/agent-term'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('Health & Metrics', () => {
    it('returns health status on successful request', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 'healthy',
            version: '1.0.0',
            uptime: 3600,
            timestamp: '2024-01-01T00:00:00Z',
          }),
      });

      const health = await client.health();

      expect(health.status).toBe('healthy');
      expect(health.version).toBe('1.0.0');
      expect(health.uptime).toBe(3600);
    });

    it('returns unreachable status on fetch failure', async () => {
      const client = new AgentOSClient();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const health = await client.health();

      expect(health.status).toBe('unreachable');
    });

    it('returns metrics data', async () => {
      const client = new AgentOSClient();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              tasks_total: 100,
              tasks_completed: 80,
              tasks_failed: 10,
              memories_total: 50,
              sessions_active: 5,
              skills_loaded: 12,
              cpu_usage: 65,
              memory_usage: 1024,
              request_count: 1000,
              average_latency_ms: 150,
            },
          }),
      });

      const metrics = await client.metrics();

      expect(metrics.tasksTotal).toBe(100);
      expect(metrics.tasksCompleted).toBe(80);
      expect(metrics.cpuUsage).toBe(65);
      expect(metrics.memoryUsage).toBe(1024);
    });

    it('returns zero metrics on failure', async () => {
      const client = new AgentOSClient();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

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

      await expect(client.tasks.submit('Test')).rejects.toThrow('AgentOS API error 500');
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
