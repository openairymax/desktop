// ============================================================
// Tauri Compatibility Layer
// ============================================================
// Provides a unified interface that works in both Tauri and
// browser environments. Automatically initializes the AgentOS SDK.
// ============================================================

import { initSdk, isTauri, autoInit } from './agentos-sdk';

let initialized = false;

/**
 * Initialize all Tauri-dependent services.
 * Should be called once at application startup.
 */
export async function initializeTauri(): Promise<void> {
  if (initialized) return;

  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      initSdk(invoke);
      console.log('[Tauri] SDK initialized with native invoke');
    } catch (e) {
      console.warn('[Tauri] Failed to initialize native invoke, falling back to mock:', e);
      setupMockInvoke();
    }
  } else {
    console.log('[Browser] Running in browser mode with mock invoke');
    setupMockInvoke();
  }

  initialized = true;
}

/**
 * Set up a mock invoke function for browser development.
 * Returns simulated data for all commands.
 */
function setupMockInvoke(): void {
  const now = new Date().toISOString();
  const mockData: Record<string, unknown> = {
    get_system_info: {
      os: 'Linux',
      osVersion: 'Arch Linux 6.8',
      architecture: 'x86_64',
      cpuCores: 8,
      totalMemoryGb: 16.0,
      freeMemoryGb: 8.5,
      hostname: 'agentos-dev',
    },
    get_service_status: [
      { name: 'api-server', status: 'running', healthy: true, uptimeSeconds: 3600, port: 18080 },
      { name: 'redis', status: 'running', healthy: true, uptimeSeconds: 3600, port: 6379 },
      { name: 'postgres', status: 'running', healthy: true, uptimeSeconds: 3600, port: 5432 },
      { name: 'worker', status: 'idle', healthy: false, uptimeSeconds: 0 },
    ],
    get_health_status: [
      { name: 'api-server', status: 'healthy', healthy: true, port: 18080 },
      { name: 'redis', status: 'healthy', healthy: true, port: 6379 },
      { name: 'postgres', status: 'healthy', healthy: true, port: 5432 },
    ],
    list_agents: [
      { id: 'agent-001', name: 'Research Assistant', type: 'research', status: 'idle', taskCount: 0, lastActive: now, description: 'Web search, document analysis', capabilities: ['search', 'analyze', 'summarize'], config: null, createdAt: now },
      { id: 'agent-002', name: 'Code Reviewer', type: 'coding', status: 'running', taskCount: 3, lastActive: now, description: 'Code generation, debugging', capabilities: ['generate', 'debug', 'review'], config: null, createdAt: now },
      { id: 'agent-003', name: 'Data Analyst', type: 'analysis', status: 'idle', taskCount: 1, lastActive: null, description: 'Data analysis, visualization', capabilities: ['analyze', 'visualize'], config: null, createdAt: now },
    ],
    list_tasks: [
      { id: 'task-001', agentId: 'agent-001', name: '市场分析报告', type: 'research', status: 'completed', progress: 100, createdAt: now, updatedAt: now, result: { summary: '完成' }, error: null },
      { id: 'task-002', agentId: 'agent-002', name: '代码重构', type: 'coding', status: 'running', progress: 65, createdAt: now, updatedAt: now, result: null, error: null },
      { id: 'task-003', agentId: 'agent-003', name: '数据清洗', type: 'analysis', status: 'pending', progress: 0, createdAt: now, updatedAt: null, result: null, error: null },
    ],
    list_llm_providers: [
      { id: 'openai', name: 'OpenAI', type: 'openai', baseUrl: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4', configured: false },
      { id: 'anthropic', name: 'Anthropic', type: 'anthropic', baseUrl: 'https://api.anthropic.com', apiKey: '', model: 'claude-3-opus', configured: false },
    ],
    memory_list: [
      { id: 'mem-001', type: 'episodic', content: '用户偏好使用中文交流', source: 'user_input', metadata: null, tokens: 12, createdAt: now },
      { id: 'mem-002', type: 'procedural', content: 'AgentOS 启动流程：docker-compose up -d → 验证服务健康 → 加载配置', source: 'system', metadata: null, tokens: 45, createdAt: now },
      { id: 'mem-003', type: 'semantic', content: 'AgentOS 是一个基于微内核架构的 AI 操作系统，支持多 Agent 协作', source: 'documentation', metadata: null, tokens: 38, createdAt: now },
    ],
    memory_search: [
      { id: 'mem-001', type: 'episodic', content: '用户偏好使用中文交流', source: 'user_input', metadata: null, tokens: 12, createdAt: now },
    ],
    context_window_stats: {
      totalTokens: 3842,
      maxTokens: 128000,
      usedPercent: 3.0,
      breakdown: { system: 256, history: 3456, tools: 128, output: 256 },
    },
    list_tools: [
      { name: 'web_search', description: '搜索互联网获取实时信息', category: 'system', schema: { type: 'object', properties: { query: { type: 'string' } } } },
      { name: 'code_execution', description: '在沙箱中执行代码片段', category: 'system', schema: { type: 'object', properties: { code: { type: 'string' }, language: { type: 'string' } } } },
      { name: 'file_read', description: '读取文件内容', category: 'io', schema: { type: 'object', properties: { path: { type: 'string' } } } },
      { name: 'agent_query', description: '查询 Agent 状态', category: 'agent', schema: { type: 'object', properties: { agent_id: { type: 'string' } } } },
      { name: 'task_submit', description: '提交新任务到 Agent', category: 'task', schema: { type: 'object', properties: { description: { type: 'string' } } } },
      { name: 'memory_store', description: '存储记忆到长期记忆系统', category: 'memory', schema: { type: 'object', properties: { content: { type: 'string' }, type: { type: 'string' } } } },
    ],
    runtime_metrics: {
      cycleCount: 142,
      toolCallCount: 89,
      memoryEntriesCount: 23,
      avgLatencyMs: 245,
      successRate: 97.5,
      totalTokensConsumed: 156780,
    },
    load_settings: {
      language: 'zh',
      theme: 'light',
      serviceMode: 'dev',
      backendUrl: 'http://localhost:18080',
      autoStart: false,
      notifications: true,
    },
    list_protocols: [
      { id: 'mcp', name: 'Model Context Protocol', description: 'Anthropic 提出的模型上下文协议', status: 'available', host: 'localhost', port: 8080, configured: false },
      { id: 'a2a', name: 'Agent-to-Agent Protocol', description: 'AgentOS 原生 Agent 间通信协议', status: 'available', host: 'localhost', port: 8081, configured: true },
    ],
    get_protocol_capabilities: {
      protocols: ['mcp', 'a2a'],
      maxMessageSize: 1048576,
      supportedFormats: ['json', 'msgpack'],
    },
    system_monitor: {
      cpu: {
        usagePercent: 32.5,
        cores: [
          { coreId: 0, usage: 45 }, { coreId: 1, usage: 32 }, { coreId: 2, usage: 28 }, { coreId: 3, usage: 51 },
          { coreId: 4, usage: 15 }, { coreId: 5, usage: 22 }, { coreId: 6, usage: 38 }, { coreId: 7, usage: 12 },
        ],
      },
      memory: { totalGb: 16, usedGb: 7.5, freeGb: 8.5, percent: 46.88 },
      disk: { totalGb: 500, usedGb: 250, freeGb: 250, percent: 50.0 },
      network: [
        { name: 'eth0', ipv4: '192.168.3.6', ipv6: 'fe80::1', mac: 'AA:BB:CC:DD:EE:01', isUp: true, bytesSent: 1234567, bytesRecv: 8901234 },
        { name: 'lo', ipv4: '127.0.0.1', ipv6: '::1', mac: '00:00:00:00:00:00', isUp: true, bytesSent: 45678, bytesRecv: 45678 },
      ],
      uptimeSeconds: 7200,
    },
    list_processes: [
      { pid: 1, name: 'systemd', cpuPercent: 0.1, memoryMb: 12, status: 'running', command: '/usr/lib/systemd/systemd', startedAt: Date.now() - 7200000 },
      { pid: 1234, name: 'docker-compose', cpuPercent: 2.5, memoryMb: 156, status: 'running', command: 'docker-compose up', startedAt: Date.now() - 3600000 },
      { pid: 2345, name: 'agentos-api', cpuPercent: 15.3, memoryMb: 512, status: 'running', command: 'python -m agentos.api', startedAt: Date.now() - 3600000 },
      { pid: 3456, name: 'redis-server', cpuPercent: 1.2, memoryMb: 64, status: 'running', command: 'redis-server *:6379', startedAt: Date.now() - 3600000 },
      { pid: 4567, name: 'postgres', cpuPercent: 3.8, memoryMb: 256, status: 'running', command: 'postgres -D /data/pgsql', startedAt: Date.now() - 3600000 },
    ],
    get_network_interfaces: [
      { name: 'eth0', ipv4: '192.168.3.6', ipv6: 'fe80::1', mac: 'AA:BB:CC:DD:EE:01', isUp: true, bytesSent: 1234567, bytesRecv: 8901234 },
      { name: 'lo', ipv4: '127.0.0.1', ipv6: '::1', mac: '00:00:00:00:00:00', isUp: true, bytesSent: 45678, bytesRecv: 45678 },
    ],
    get_version_info: {
      appVersion: '1.0.0-beta.1',
      buildTime: '2026-04-19T00:00:00Z',
      gitCommit: 'abc1234',
      rustVersion: '1.78.0',
      tauriVersion: '2.0.0',
    },
    check_for_updates: {
      currentVersion: '1.0.0-beta.1',
      latestVersion: '1.0.0-beta.1',
      updateAvailable: false,
      releaseUrl: '',
      releaseNotes: '',
    },
    llm_chat: {
      id: 'chat-001',
      content: '你好！我是 AgentOS 智能助手。我可以帮助你管理 AgentOS 的各项功能，包括服务管理、智能体注册、任务提交、LLM 配置和记忆系统等。有什么我可以帮你的吗？',
      role: 'assistant',
      model: 'gpt-4',
      finishReason: 'stop',
      usage: { promptTokens: 120, completionTokens: 85, totalTokens: 205 },
    },
    memory_store: { id: 'mem-new', type: 'episodic', content: '测试记忆', source: 'test', metadata: null, tokens: 8, createdAt: now },
    memory_delete: null,
    memory_clear: 0,
    save_settings: null,
    call_tool: { success: true, output: '工具执行成功' },
    run_cognitive_loop: [
      { phase: 'perception', thought: '接收到任务：分析用户请求并理解意图', detail: '解析自然语言输入，提取关键实体', timestamp: now },
      { phase: 'reasoning', thought: '分析任务类型：需要调用多个工具来完成', detail: '根据历史经验，这是一个多步骤任务', timestamp: now },
      { phase: 'action', thought: '执行工具调用：web_search → code_execution', detail: '按依赖顺序调用工具', timestamp: now, toolCall: { function: { name: 'web_search', arguments: '{"query": "example"}' } } },
      { phase: 'reflection', thought: '评估执行结果：工具调用成功，结果符合预期', detail: '对比预期输出与实际输出', timestamp: now },
    ],
    submit_task: { id: 'task-new', agentId: 'agent-001', name: '新任务', type: 'research', status: 'pending', progress: 0, createdAt: now, updatedAt: null, result: null, error: null },
    get_task_status: { id: 'task-001', agentId: 'agent-001', name: '市场分析报告', type: 'research', status: 'completed', progress: 100, createdAt: now, updatedAt: now, result: { summary: '完成' }, error: null },
    cancel_task: null,
    delete_task: null,
    restart_task: { id: 'task-001', agentId: 'agent-001', name: '市场分析报告', type: 'research', status: 'pending', progress: 0, createdAt: now, updatedAt: null, result: null, error: null },
    register_agent: { id: 'agent-new', name: 'New Agent', type: 'custom', status: 'idle', taskCount: 0, lastActive: null, description: '新建 Agent', capabilities: [], config: null, createdAt: now },
    start_agent: { id: 'agent-001', name: 'Research Assistant', type: 'research', status: 'running', taskCount: 0, lastActive: now, description: 'Web search', capabilities: ['search'], config: null, createdAt: now },
    stop_agent: { id: 'agent-001', name: 'Research Assistant', type: 'research', status: 'idle', taskCount: 0, lastActive: now, description: 'Web search', capabilities: ['search'], config: null, createdAt: now },
    get_agent_config: { temperature: 0.7, maxTokens: 2048, model: 'gpt-4' },
    update_agent_config: { temperature: 0.7, maxTokens: 2048, model: 'gpt-4' },
    get_agent_details: { id: 'agent-001', name: 'Research Assistant', type: 'research', status: 'idle', taskCount: 0, lastActive: now, description: 'Web search', capabilities: ['search'], config: null, createdAt: now },
    save_llm_provider: { id: 'openai', name: 'OpenAI', type: 'openai', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4', configured: true },
    delete_llm_provider: null,
    test_llm_connection: { success: true, latency: 245 },
    list_directory: { path: '/home', files: [], totalSize: 0, fileCount: 0, dirCount: 0 },
    read_file: '',
    write_file: null,
    delete_file: null,
    copy_file: null,
    move_file: null,
    create_directory: null,
    kill_process: null,
    get_process_info: { pid: 1, name: 'systemd', cpuPercent: 0.1, memoryMb: 12, status: 'running', command: '/usr/lib/systemd/systemd', startedAt: Date.now() - 7200000 },
    check_port: { open: true, latency: 12 },
    ping: { host: 'localhost', count: 4, min: 0.03, avg: 0.05, max: 0.08, loss: 0 },
    dns_lookup: { hostname: 'localhost', addresses: ['127.0.0.1'] },
    test_protocol_connection: { success: true, latency: 15 },
    send_protocol_message: { success: true, response: {} },
    read_config_file: '',
    write_config_file: null,
    open_terminal: null,
    open_browser: null,
    download_and_install_update: null,
    start_services: { success: true, stdout: 'Services started', stderr: '' },
    stop_services: { success: true, stdout: 'Services stopped', stderr: '' },
    restart_services: { success: true, stdout: 'Services restarted', stderr: '' },
    get_logs: '[INFO] AgentOS API server started on :18080\n[INFO] Connected to Redis\n[INFO] Connected to PostgreSQL\n[INFO] Loading agent configurations...',
    execute_cli_command: { success: true, stdout: 'OK', stderr: '', exitCode: 0 },
    get_protocol_capabilities_mock: { protocols: ['mcp', 'a2a'], maxMessageSize: 1048576, supportedFormats: ['json'] },
  };

  initSdk(async <T>(cmd: string, _args?: Record<string, unknown>): Promise<T> => {
    const data = mockData[cmd];
    if (data !== undefined) {
      return data as T;
    }
    // Smart fallback based on expected return type pattern
    if (cmd.includes('list') || cmd.includes('search')) return [] as T;
    if (cmd.includes('get') && cmd.includes('status')) return { healthy: true } as T;
    return {} as T;
  });
}

/**
 * Check if running inside Tauri.
 */
export { isTauri };

/**
 * Re-export all SDK functions for convenience.
 */
export * from './agentos-sdk';

export default {
  initializeTauri,
  isTauri,
};
