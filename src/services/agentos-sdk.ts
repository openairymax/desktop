// ============================================================
// AgentOS SDK — Frontend Service Layer for Tauri Desktop
// ============================================================
// Provides a unified TypeScript API that wraps all Tauri invoke()
// calls, type-safe interfaces, and optional Web API fallback for
// browser-based development.
// ============================================================

// ==================== Core Types ====================

export interface SystemInfo {
  os: string;
  osVersion: string;
  architecture: string;
  cpuCores: number;
  totalMemoryGb: number;
  freeMemoryGb: number;
  hostname: string;
}

export interface ServiceStatus {
  name: string;
  status: string;
  healthy: boolean;
  uptimeSeconds?: number;
  port?: number;
}

export interface AgentInfo {
  id: string;
  name: string;
  type?: string;
  status: string;
  taskCount?: number;
  lastActive?: string;
  description?: string;
  capabilities?: string[];
  config?: Record<string, unknown>;
  createdAt?: string;
}

export interface TaskInfo {
  id: string;
  agentId?: string;
  name?: string;
  type?: string;
  status: string;
  progress: number;
  priority?: string;
  createdAt: string;
  updatedAt?: string;
  result?: Record<string, unknown>;
  error?: string;
}

export interface LLMChatMessage {
  role: string;
  content: string;
  toolCalls?: Record<string, unknown>;
  toolCallId?: string;
}

export interface LLMChatRequest {
  providerId: string;
  messages: LLMChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: Record<string, unknown>;
}

export interface LLMChatResponse {
  id: string;
  content: string;
  role: string;
  model: string;
  finishReason: string;
  usage: UsageInfo;
  toolCalls?: Record<string, unknown>;
}

export interface UsageInfo {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LLMProviderConfig {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
  configured: boolean;
}

export interface MemoryEntry {
  id: string;
  type: string;
  content: string;
  source?: string;
  metadata?: Record<string, unknown>;
  tokens: number;
  createdAt: string;
}

export interface ContextWindowStats {
  totalTokens: number;
  maxTokens: number;
  usedPercent: number;
  breakdown: {
    system: number;
    history: number;
    tools: number;
    output: number;
  };
}

export interface CognitiveStep {
  phase: string;
  thought: string;
  detail?: string;
  timestamp: string;
  toolCall?: Record<string, unknown>;
}

export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  releaseUrl: string;
  releaseNotes: string;
}

export interface VersionInfo {
  appVersion: string;
  buildTime: string;
  gitCommit: string;
  rustVersion: string;
  tauriVersion: string;
}

export interface FileInfo {
  name: string;
  path: string;
  isDir: boolean;
  sizeBytes: number;
  modifiedAt: number;
  permissions: string;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpuPercent: number;
  memoryMb: number;
  status: string;
  command: string;
  startedAt: number;
}

export interface NetworkInterface {
  name: string;
  ipv4: string;
  ipv6: string;
  mac: string;
  isUp: boolean;
  bytesSent: number;
  bytesRecv: number;
}

export interface SystemMonitorData {
  cpu: {
    usagePercent: number;
    cores: Array<{ coreId: number; usage: number }>;
  };
  memory: {
    totalGb: number;
    usedGb: number;
    freeGb: number;
    percent: number;
  };
  disk: {
    totalGb: number;
    usedGb: number;
    freeGb: number;
    percent: number;
  };
  network: NetworkInterface[];
  uptimeSeconds: number;
}

export interface RuntimeMetrics {
  cycleCount: number;
  toolCallCount: number;
  memoryEntriesCount: number;
  avgLatencyMs: number;
  successRate: number;
  totalTokensConsumed: number;
}

export interface CliCommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode?: number;
}

// ==================== Tauri Invoke Wrapper ====================

let invokeFn: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;

/**
 * Initialize the SDK with a custom invoke function.
 * In Tauri mode: import { invoke } from '@tauri-apps/api/core' and pass it.
 * In browser mode: pass a fetch-based implementation.
 */
export function initSdk(
  invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>,
): void {
  invokeFn = invoke;
}

/**
 * Check if running inside Tauri (not in a regular browser).
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Auto-initialize using Tauri's invoke if available.
 */
export async function autoInit(): Promise<void> {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      invokeFn = invoke;
    } catch (e) {
      // Intentionally empty: graceful degradation
    }
  }
}

function invoke<T>(cmd: string, args: Record<string, unknown> = {}): Promise<T> {
  if (!invokeFn) {
    // Lazy auto-init on first call
    throw new Error(
      'AgentOS SDK not initialized. Call initSdk() or autoInit() first, ' +
        'or use the invoke wrapper from a Tauri command hook.',
    );
  }
  return invokeFn<T>(cmd, args);
}

// ==================== System Commands ====================

export async function getSystemInfo(): Promise<SystemInfo> {
  return invoke<SystemInfo>('get_system_info');
}

export async function executeCliCommand(
  command: string,
  args: string[] = [],
): Promise<CliCommandResult> {
  return invoke<CliCommandResult>('execute_cli_command', { command, args });
}

export async function getServiceStatus(): Promise<ServiceStatus[]> {
  return invoke<ServiceStatus[]>('get_service_status');
}

export async function startServices(mode: string = 'dev'): Promise<CliCommandResult> {
  return invoke<CliCommandResult>('start_services', { mode });
}

export async function stopServices(): Promise<CliCommandResult> {
  return invoke<CliCommandResult>('stop_services');
}

export async function restartServices(mode: string = 'dev'): Promise<CliCommandResult> {
  return invoke<CliCommandResult>('restart_services', { mode });
}

export async function getLogs(service?: string, tail: number = 100): Promise<string> {
  return invoke<string>('get_logs', { service, tail });
}

export async function getHealthStatus(): Promise<ServiceStatus[]> {
  return invoke<ServiceStatus[]>('get_health_status');
}

// ==================== Agent Commands ====================

export async function listAgents(): Promise<AgentInfo[]> {
  return invoke<AgentInfo[]>('list_agents');
}

export async function getAgentDetails(agentId: string): Promise<AgentInfo> {
  return invoke<AgentInfo>('get_agent_details', { agent_id: agentId });
}

export async function registerAgent(
  agentName: string,
  agentType: string,
  description?: string,
): Promise<AgentInfo> {
  return invoke<AgentInfo>('register_agent', {
    agent_name: agentName,
    agent_type: agentType,
    description,
  });
}

export async function startAgent(agentId: string): Promise<AgentInfo> {
  return invoke<AgentInfo>('start_agent', { agent_id: agentId });
}

export async function stopAgent(agentId: string): Promise<AgentInfo> {
  return invoke<AgentInfo>('stop_agent', { agent_id: agentId });
}

export async function getAgentConfig(agentId: string): Promise<Record<string, unknown>> {
  return invoke<Record<string, unknown>>('get_agent_config', { agent_id: agentId });
}

export async function updateAgentConfig(
  agentId: string,
  config: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return invoke<Record<string, unknown>>('update_agent_config', { agent_id: agentId, config });
}

// ==================== Task Commands ====================

export async function submitTask(
  agentId: string,
  taskDescription: string,
  priority?: string,
): Promise<TaskInfo> {
  return invoke<TaskInfo>('submit_task', {
    agent_id: agentId,
    task_description: taskDescription,
    priority,
  });
}

export async function getTaskStatus(taskId: string): Promise<TaskInfo> {
  return invoke<TaskInfo>('get_task_status', { task_id: taskId });
}

export async function cancelTask(taskId: string): Promise<void> {
  return invoke<void>('cancel_task', { task_id: taskId });
}

export async function listTasks(): Promise<TaskInfo[]> {
  return invoke<TaskInfo[]>('list_tasks');
}

export async function deleteTask(taskId: string): Promise<void> {
  return invoke<void>('delete_task', { task_id: taskId });
}

export async function restartTask(taskId: string): Promise<TaskInfo> {
  return invoke<TaskInfo>('restart_task', { task_id: taskId });
}

// ==================== LLM / AI Chat Commands ====================

export async function llmChat(request: LLMChatRequest): Promise<LLMChatResponse> {
  return invoke<LLMChatResponse>('llm_chat', { request });
}

export async function testLlmConnection(providerId: string): Promise<Record<string, unknown>> {
  return invoke<Record<string, unknown>>('test_llm_connection', { provider_id: providerId });
}

export async function listLlmProviders(): Promise<LLMProviderConfig[]> {
  const raw = await invoke<Record<string, unknown>[]>('list_llm_providers');
  return raw as unknown as LLMProviderConfig[];
}

export async function saveLlmProvider(
  config: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return invoke<Record<string, unknown>>('save_llm_provider', { config });
}

export async function deleteLlmProvider(providerId: string): Promise<void> {
  return invoke<void>('delete_llm_provider', { provider_id: providerId });
}

// ==================== Memory System Commands ====================

export async function memoryStore(
  memoryType: string,
  content: string,
  source?: string,
  metadata?: Record<string, unknown>,
): Promise<MemoryEntry> {
  return invoke<MemoryEntry>('memory_store', {
    memory_type: memoryType,
    content,
    source,
    metadata,
  });
}

export async function memorySearch(
  query: string = '',
  limit: number = 10,
  typeFilter?: string,
  minRelevance?: number,
): Promise<MemoryEntry[]> {
  return invoke<MemoryEntry[]>('memory_search', {
    query,
    limit,
    type_filter: typeFilter,
    min_relevance: minRelevance,
  });
}

export async function memoryList(typeFilter?: string, limit: number = 50): Promise<MemoryEntry[]> {
  return invoke<MemoryEntry[]>('memory_list', { type_filter: typeFilter, limit });
}

export async function memoryDelete(memoryId: string): Promise<void> {
  return invoke<void>('memory_delete', { memory_id: memoryId });
}

export async function memoryClear(typeFilter?: string): Promise<number> {
  return invoke<number>('memory_clear', { type_filter: typeFilter });
}

export async function contextWindowStats(): Promise<ContextWindowStats> {
  return invoke<ContextWindowStats>('context_window_stats');
}

// ==================== Cognitive Loop / Tool Commands ====================

export async function runCognitiveLoop(
  input: string,
  tools?: Record<string, unknown>,
): Promise<CognitiveStep[]> {
  return invoke<CognitiveStep[]>('run_cognitive_loop', { input, tools });
}

export async function callTool(name: string, arguments_: string): Promise<Record<string, unknown>> {
  return invoke<Record<string, unknown>>('call_tool', { name, arguments: arguments_ });
}

export async function listTools(): Promise<Record<string, unknown>[]> {
  return invoke<Record<string, unknown>[]>('list_tools');
}

export async function runtimeMetrics(): Promise<RuntimeMetrics> {
  return invoke<RuntimeMetrics>('runtime_metrics');
}

// ==================== Settings Commands ====================

export async function saveSettings(settings: Record<string, unknown>): Promise<void> {
  return invoke<void>('save_settings', { settings });
}

export async function loadSettings(): Promise<Record<string, unknown>> {
  return invoke<Record<string, unknown>>('load_settings');
}

// ==================== File System Commands ====================

export async function listDirectory(path: string): Promise<{
  path: string;
  files: FileInfo[];
  totalSize: number;
  fileCount: number;
  dirCount: number;
}> {
  return invoke('list_directory', { path });
}

export async function readFile(path: string): Promise<string> {
  return invoke<string>('read_file', { path });
}

export async function writeFile(path: string, content: string): Promise<void> {
  return invoke<void>('write_file', { path, content });
}

export async function deleteFile(path: string): Promise<void> {
  return invoke<void>('delete_file', { path });
}

export async function copyFile(src: string, dst: string): Promise<void> {
  return invoke<void>('copy_file', { src, dst });
}

export async function moveFile(src: string, dst: string): Promise<void> {
  return invoke<void>('move_file', { src, dst });
}

export async function createDirectory(path: string): Promise<void> {
  return invoke<void>('create_directory', { path });
}

// ==================== Process Management Commands ====================

export async function listProcesses(): Promise<ProcessInfo[]> {
  return invoke<ProcessInfo[]>('list_processes');
}

export async function killProcess(pid: number, force: boolean = false): Promise<void> {
  return invoke<void>('kill_process', { pid, force });
}

export async function getProcessInfo(pid: number): Promise<ProcessInfo> {
  return invoke<ProcessInfo>('get_process_info', { pid });
}

// ==================== Network Diagnostics Commands ====================

export async function getNetworkInterfaces(): Promise<NetworkInterface[]> {
  return invoke<NetworkInterface[]>('get_network_interfaces');
}

export async function checkPort(
  host: string,
  port: number,
  timeoutMs?: number,
): Promise<Record<string, unknown>> {
  return invoke<Record<string, unknown>>('check_port', { host, port, timeout_ms: timeoutMs });
}

export async function ping(host: string, count: number = 4): Promise<Record<string, unknown>> {
  return invoke<Record<string, unknown>>('ping', { host, count });
}

export async function dnsLookup(hostname: string): Promise<Record<string, unknown>> {
  return invoke<Record<string, unknown>>('dns_lookup', { hostname });
}

// ==================== System Monitor Command ====================

export async function getSystemMonitor(): Promise<SystemMonitorData> {
  return invoke<SystemMonitorData>('system_monitor');
}

// ==================== Update / Version Commands ====================

export async function checkForUpdates(): Promise<UpdateInfo> {
  return invoke<UpdateInfo>('check_for_updates');
}

export async function getVersionInfo(): Promise<VersionInfo> {
  return invoke<VersionInfo>('get_version_info');
}

// ==================== Utility Commands ====================

export async function readConfigFile(path: string): Promise<string> {
  return invoke<string>('read_config_file', { path });
}

export async function writeConfigFile(path: string, content: string): Promise<void> {
  return invoke<void>('write_config_file', { path, content });
}

export async function openTerminal(workingDir?: string): Promise<void> {
  return invoke<void>('open_terminal', { working_dir: workingDir });
}

export async function openBrowser(url: string): Promise<void> {
  return invoke<void>('open_browser', { url });
}

export async function downloadAndInstallUpdate(): Promise<void> {
  return invoke<void>('download_and_install_update');
}

// ==================== Protocol Compatibility Commands ====================

export async function listProtocols(): Promise<Record<string, unknown>[]> {
  return invoke<Record<string, unknown>[]>('list_protocols');
}

export async function testProtocolConnection(
  protocol: string,
  host: string,
  port: number,
  options?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return invoke<Record<string, unknown>>('test_protocol_connection', {
    protocol,
    host,
    port,
    options,
  });
}

export async function sendProtocolMessage(
  protocol: string,
  message: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return invoke<Record<string, unknown>>('send_protocol_message', { protocol, message });
}

export async function getProtocolCapabilities(): Promise<Record<string, unknown>> {
  return invoke<Record<string, unknown>>('get_protocol_capabilities');
}

// ==================== Protocol Compatibility Types ====================

export interface ProtocolInfo {
  id: string;
  name: string;
  description: string;
  status: 'available' | 'unavailable' | 'error';
  host?: string;
  port?: number;
  configured: boolean;
}

export interface ProtocolMessage {
  id: string;
  protocol: string;
  direction: 'send' | 'receive';
  content: Record<string, unknown>;
  timestamp: string;
}

export interface ProtocolCapabilities {
  protocols: string[];
  maxMessageSize: number;
  supportedFormats: string[];
}

export type AgentRuntimeMetrics = RuntimeMetrics;

export interface ToolDefinition {
  name: string;
  description: string;
  category?: string;
  parameters?: Record<string, unknown>;
  schema?: Record<string, unknown>;
}

// ==================== Export Everything ====================

export default {
  getSystemInfo,
  executeCliCommand,
  getServiceStatus,
  startServices,
  stopServices,
  restartServices,
  getLogs,
  getHealthStatus,
  getSystemMonitor,
  listAgents,
  getAgentDetails,
  registerAgent,
  startAgent,
  stopAgent,
  getAgentConfig,
  updateAgentConfig,
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
  runCognitiveLoop,
  callTool,
  listTools,
  runtimeMetrics,
  saveSettings,
  loadSettings,
  listDirectory,
  readFile,
  writeFile,
  deleteFile,
  copyFile,
  moveFile,
  createDirectory,
  listProcesses,
  killProcess,
  getProcessInfo,
  getNetworkInterfaces,
  checkPort,
  ping,
  dnsLookup,
  checkForUpdates,
  getVersionInfo,
  downloadAndInstallUpdate,
  listProtocols,
  testProtocolConnection,
  sendProtocolMessage,
  getProtocolCapabilities,
  readConfigFile,
  writeConfigFile,
  openTerminal,
  openBrowser,
  initSdk,
  autoInit,
  isTauri,
  chat: llmChat,
  listAvailableTools: listTools,
  getRuntimeMetrics: runtimeMetrics,
  listLLMProviders: listLlmProviders,
  testLLMConnection: testLlmConnection,
  saveLLMProvider: saveLlmProvider,
  deleteLLMProvider: deleteLlmProvider,
  getContextWindowStats: contextWindowStats,
  getSystemMonitorData: getSystemMonitor,
  stopTask: cancelTask,
  init: autoInit,
};
