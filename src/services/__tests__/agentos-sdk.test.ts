import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInvoke = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

import {
  getSystemInfo,
  getServiceStatus,
  startServices,
  stopServices,
  restartServices,
  getLogs,
  getHealthStatus,
  listAgents,
  getAgentDetails,
  registerAgent,
  startAgent,
  stopAgent,
  submitTask,
  getTaskStatus,
  cancelTask,
  listTasks,
  deleteTask,
  restartTask,
  llmChat,
  testLlmConnection,
  listLlmProviders,
  saveLlmProvider,
  deleteLlmProvider,
  memoryStore,
  memorySearch,
  memoryList,
  memoryDelete,
  memoryClear,
  contextWindowStats,
  callTool,
  listTools,
  runtimeMetrics,
  saveSettings,
  loadSettings,
  listDirectory,
  readFile,
  writeFile,
  deleteFile,
  isTauri,
  initSdk,
  checkForUpdates,
  getVersionInfo,
  getSystemMonitor,
} from '../agentos-sdk';

describe('agentos-sdk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockResolvedValue({});
    initSdk(mockInvoke);
  });

  describe('core functions', () => {
    it('isTauri checks window.__TAURI__', () => {
      const result = isTauri();
      expect(result).toBe(true);
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('getSystemInfo calls invoke', async () => {
      const info = { os: 'linux', osVersion: '6.1', architecture: 'x86_64', cpuCores: 8, totalMemoryGb: 16, freeMemoryGb: 8, hostname: 'test' };
      mockInvoke.mockResolvedValue(info);
      const result = await getSystemInfo();
      expect(mockInvoke).toHaveBeenCalledWith('get_system_info', {});
      expect(result).toEqual(info);
    });

    it('getSystemMonitor calls invoke', async () => {
      const data = { cpu: { usagePercent: 50 }, memory: { totalGb: 16, usedGb: 8, freeGb: 8, percent: 50 }, disk: { totalGb: 256, usedGb: 128, freeGb: 128, percent: 50 }, network: [], uptimeSeconds: 3600 };
      mockInvoke.mockResolvedValue(data);
      const result = await getSystemMonitor();
      expect(mockInvoke).toHaveBeenCalledWith('system_monitor', {});
      expect(result).toEqual(data);
    });
  });

  describe('service management', () => {
    it('getServiceStatus calls invoke', async () => {
      mockInvoke.mockResolvedValue([{ name: 'test', status: 'running', healthy: true }]);
      const result = await getServiceStatus();
      expect(mockInvoke).toHaveBeenCalledWith('get_service_status', {});
      expect(result).toHaveLength(1);
    });

    it('startServices calls invoke with mode', async () => {
      await startServices('prod');
      expect(mockInvoke).toHaveBeenCalledWith('start_services', { mode: 'prod' });
    });

    it('stopServices calls invoke', async () => {
      await stopServices();
      expect(mockInvoke).toHaveBeenCalledWith('stop_services', {});
    });

    it('restartServices calls invoke with mode', async () => {
      await restartServices('dev');
      expect(mockInvoke).toHaveBeenCalledWith('restart_services', { mode: 'dev' });
    });

    it('getLogs calls invoke with params', async () => {
      await getLogs('gateway', 50);
      expect(mockInvoke).toHaveBeenCalledWith('get_logs', { service: 'gateway', tail: 50 });
    });

    it('getHealthStatus calls invoke', async () => {
      await getHealthStatus();
      expect(mockInvoke).toHaveBeenCalledWith('get_health_status', {});
    });
  });

  describe('agent management', () => {
    it('listAgents calls invoke', async () => {
      mockInvoke.mockResolvedValue([{ id: '1', name: 'test', status: 'running' }]);
      const result = await listAgents();
      expect(mockInvoke).toHaveBeenCalledWith('list_agents', {});
      expect(result).toHaveLength(1);
    });

    it('getAgentDetails calls invoke with agent_id', async () => {
      await getAgentDetails('agent-1');
      expect(mockInvoke).toHaveBeenCalledWith('get_agent_details', { agent_id: 'agent-1' });
    });

    it('registerAgent calls invoke with params', async () => {
      await registerAgent('my-agent', 'worker', 'a test agent');
      expect(mockInvoke).toHaveBeenCalledWith('register_agent', {
        agent_name: 'my-agent',
        agent_type: 'worker',
        description: 'a test agent',
      });
    });

    it('startAgent calls invoke with agent_id', async () => {
      await startAgent('agent-1');
      expect(mockInvoke).toHaveBeenCalledWith('start_agent', { agent_id: 'agent-1' });
    });

    it('stopAgent calls invoke with agent_id', async () => {
      await stopAgent('agent-1');
      expect(mockInvoke).toHaveBeenCalledWith('stop_agent', { agent_id: 'agent-1' });
    });
  });

  describe('task management', () => {
    it('submitTask calls invoke with params', async () => {
      await submitTask('agent-1', 'test task', 'high');
      expect(mockInvoke).toHaveBeenCalledWith('submit_task', {
        agent_id: 'agent-1',
        task_description: 'test task',
        priority: 'high',
      });
    });

    it('submitTask calls invoke without priority', async () => {
      await submitTask('agent-1', 'test task');
      expect(mockInvoke).toHaveBeenCalledWith('submit_task', {
        agent_id: 'agent-1',
        task_description: 'test task',
        priority: undefined,
      });
    });

    it('getTaskStatus calls invoke with task_id', async () => {
      await getTaskStatus('task-1');
      expect(mockInvoke).toHaveBeenCalledWith('get_task_status', { task_id: 'task-1' });
    });

    it('cancelTask calls invoke with task_id', async () => {
      await cancelTask('task-1');
      expect(mockInvoke).toHaveBeenCalledWith('cancel_task', { task_id: 'task-1' });
    });

    it('listTasks calls invoke', async () => {
      await listTasks();
      expect(mockInvoke).toHaveBeenCalledWith('list_tasks', {});
    });

    it('deleteTask calls invoke with task_id', async () => {
      await deleteTask('task-1');
      expect(mockInvoke).toHaveBeenCalledWith('delete_task', { task_id: 'task-1' });
    });

    it('restartTask calls invoke with task_id', async () => {
      await restartTask('task-1');
      expect(mockInvoke).toHaveBeenCalledWith('restart_task', { task_id: 'task-1' });
    });
  });

  describe('memory management', () => {
    it('memoryStore calls invoke with params', async () => {
      await memoryStore('fact', 'test content', 'source', { key: 'val' });
      expect(mockInvoke).toHaveBeenCalledWith('memory_store', {
        memory_type: 'fact',
        content: 'test content',
        source: 'source',
        metadata: { key: 'val' },
      });
    });

    it('memorySearch calls invoke with params', async () => {
      await memorySearch('query', 10, 'fact', 0.8);
      expect(mockInvoke).toHaveBeenCalledWith('memory_search', {
        query: 'query',
        limit: 10,
        type_filter: 'fact',
        min_relevance: 0.8,
      });
    });

    it('memorySearch calls invoke with defaults', async () => {
      await memorySearch();
      expect(mockInvoke).toHaveBeenCalledWith('memory_search', {
        query: '',
        limit: 10,
        type_filter: undefined,
        min_relevance: undefined,
      });
    });

    it('memoryList calls invoke with params', async () => {
      await memoryList('fact', 20);
      expect(mockInvoke).toHaveBeenCalledWith('memory_list', { type_filter: 'fact', limit: 20 });
    });

    it('memoryDelete calls invoke with memory_id', async () => {
      await memoryDelete('mem-1');
      expect(mockInvoke).toHaveBeenCalledWith('memory_delete', { memory_id: 'mem-1' });
    });

    it('memoryClear calls invoke with type_filter', async () => {
      await memoryClear('fact');
      expect(mockInvoke).toHaveBeenCalledWith('memory_clear', { type_filter: 'fact' });
    });

    it('contextWindowStats calls invoke', async () => {
      await contextWindowStats();
      expect(mockInvoke).toHaveBeenCalledWith('context_window_stats', {});
    });
  });

  describe('LLM', () => {
    it('llmChat calls invoke with request', async () => {
      const req = { providerId: 'openai', messages: [{ role: 'user', content: 'hi' }], model: 'gpt-4' };
      await llmChat(req);
      expect(mockInvoke).toHaveBeenCalledWith('llm_chat', { request: req });
    });

    it('testLlmConnection calls invoke with provider_id', async () => {
      await testLlmConnection('provider-1');
      expect(mockInvoke).toHaveBeenCalledWith('test_llm_connection', { provider_id: 'provider-1' });
    });

    it('listLlmProviders calls invoke', async () => {
      await listLlmProviders();
      expect(mockInvoke).toHaveBeenCalledWith('list_llm_providers', {});
    });

    it('saveLlmProvider calls invoke with config', async () => {
      await saveLlmProvider({ name: 'openai', baseUrl: 'https://api.openai.com' });
      expect(mockInvoke).toHaveBeenCalledWith('save_llm_provider', { config: { name: 'openai', baseUrl: 'https://api.openai.com' } });
    });

    it('deleteLlmProvider calls invoke with provider_id', async () => {
      await deleteLlmProvider('provider-1');
      expect(mockInvoke).toHaveBeenCalledWith('delete_llm_provider', { provider_id: 'provider-1' });
    });
  });

  describe('file system', () => {
    it('listDirectory calls invoke with path', async () => {
      await listDirectory('/tmp');
      expect(mockInvoke).toHaveBeenCalledWith('list_directory', { path: '/tmp' });
    });

    it('readFile calls invoke with path', async () => {
      await readFile('/tmp/test.txt');
      expect(mockInvoke).toHaveBeenCalledWith('read_file', { path: '/tmp/test.txt' });
    });

    it('writeFile calls invoke with params', async () => {
      await writeFile('/tmp/test.txt', 'content');
      expect(mockInvoke).toHaveBeenCalledWith('write_file', { path: '/tmp/test.txt', content: 'content' });
    });

    it('deleteFile calls invoke with path', async () => {
      await deleteFile('/tmp/test.txt');
      expect(mockInvoke).toHaveBeenCalledWith('delete_file', { path: '/tmp/test.txt' });
    });
  });

  describe('settings', () => {
    it('saveSettings calls invoke', async () => {
      await saveSettings({ theme: 'dark' });
      expect(mockInvoke).toHaveBeenCalledWith('save_settings', { settings: { theme: 'dark' } });
    });

    it('loadSettings calls invoke', async () => {
      mockInvoke.mockResolvedValue({ theme: 'dark' });
      const result = await loadSettings();
      expect(mockInvoke).toHaveBeenCalledWith('load_settings', {});
      expect(result).toEqual({ theme: 'dark' });
    });
  });

  describe('tools', () => {
    it('callTool calls invoke with params', async () => {
      await callTool('read_file', '{"path": "/tmp"}');
      expect(mockInvoke).toHaveBeenCalledWith('call_tool', { name: 'read_file', arguments: '{"path": "/tmp"}' });
    });

    it('listTools calls invoke', async () => {
      await listTools();
      expect(mockInvoke).toHaveBeenCalledWith('list_tools', {});
    });
  });

  describe('runtime', () => {
    it('runtimeMetrics calls invoke', async () => {
      await runtimeMetrics();
      expect(mockInvoke).toHaveBeenCalledWith('runtime_metrics', {});
    });
  });

  describe('updates', () => {
    it('checkForUpdates calls invoke', async () => {
      await checkForUpdates();
      expect(mockInvoke).toHaveBeenCalledWith('check_for_updates', {});
    });

    it('getVersionInfo calls invoke', async () => {
      await getVersionInfo();
      expect(mockInvoke).toHaveBeenCalledWith('get_version_info', {});
    });
  });
});