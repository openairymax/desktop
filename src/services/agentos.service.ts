import { AGENTOS_GATEWAY_URL } from '../constants/endpoints';
import { logger } from '../utils/logger';

// ============================================================
// AgentOSClient — AgentRT Gateway 统一 JSON-RPC 客户端
// ============================================================
// 所有后端交互统一走 AgentRT Gateway 的 JSON-RPC 契约（唯一权威）：
// - 端点：POST {base}/api/，Content-Type: application/json
// - 请求：{"jsonrpc":"2.0","id":<number>,"method":"<ns>.<method>","params":{...}}
// - 响应：{"jsonrpc":"2.0","result":...,"id":<number>} 或 {"jsonrpc":"2.0","error":{...},"id":<number>}
// - 无任何 REST 资源路径（无 /api/v1/tasks、/health、/metrics、/api/v1/config）
//
// 服务映射：
//   tasks    -> sched.dag_submit / sched.dag_status / sched.dag_cancel / sched.get_stats
//   memories -> mem.write / mem.search / mem.get / mem.delete / mem.count
//   sessions -> 本地会话管理（localStorage），会话消息写 mem_d（metadata.session_id 标记）
//   skills   -> plugin.list / plugin.load / plugin.unload / plugin.execute
//               / plugin.get_metadata / plugin.get_state / plugin.get_stats
//   agents   -> a2a.discover_agents / a2a.register_agent / a2a.unregister_agent
//               / agent.run / agent.cancel
//   健康检查 -> info.health / ping
//   系统监控 -> info.system + observe.query_metrics
//   模型配置 -> llm.list_models（配置实际由 $AIRY_HOME/config/model.yaml 管理）
// ============================================================

const DEFAULT_ENDPOINT = AGENTOS_GATEWAY_URL;
const DEFAULT_TIMEOUT = 30000;

interface ServiceConfig {
  endpoint: string;
  apiKey?: string;
  timeout: number;
}

function defaultConfig(): ServiceConfig {
  return {
    endpoint: localStorage.getItem('agentos-endpoint') || DEFAULT_ENDPOINT,
    apiKey: localStorage.getItem('agentos-api-key') || undefined,
    timeout: DEFAULT_TIMEOUT,
  };
}

// JSON-RPC 请求 id（单调递增，保证同一进程内唯一）
let jsonRpcId = 0;

function nextRequestId(): number {
  jsonRpcId += 1;
  return jsonRpcId;
}

// 核心 JSON-RPC 调用：POST {base}/api/，返回响应中的 result 字段
async function jsonrpc<T>(
  method: string,
  params: Record<string, unknown>,
  config: ServiceConfig,
): Promise<T> {
  const url = `${config.endpoint}/api/`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.apiKey) {
    headers['X-API-Key'] = config.apiKey;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: nextRequestId(),
        method,
        params: params || {},
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`AgentOS Gateway error ${response.status}: ${errorBody || response.statusText}`);
    }

    const json = await response.json();
    if (json && typeof json === 'object' && 'error' in json && json.error) {
      throw new Error(
        `Gateway method '${method}' error: ${json.error.message || JSON.stringify(json.error)}`,
      );
    }
    // 统一读取 result 字段，不做多层猜测
    return (json && typeof json === 'object' && 'result' in json ? json.result : undefined) as T;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`Request timeout after ${config.timeout}ms: ${method}`);
    }
    throw err;
  }
}

// ==================== 通用解析工具 ====================

function getString(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  return typeof v === 'string' ? v : String(v ?? '');
}

function getInt64(obj: Record<string, unknown>, key: string): number {
  const v = obj[key];
  return typeof v === 'number' ? v : Number(v ?? 0);
}

function getMap(obj: Record<string, unknown>, key: string): Record<string, unknown> | undefined {
  const v = obj[key];
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return undefined;
}

function parseTime(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  return new Date().toISOString();
}

function validateRequiredString(value: string, name: string): void {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} 不能为空`);
  }
}

// 从 JSON-RPC result 中宽容提取对象数组（兼容 gateway 各 ns 的返回结构）
function toObjectArray(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) {
    return result as Array<Record<string, unknown>>;
  }
  if (result && typeof result === 'object') {
    const obj = result as Record<string, unknown>;
    for (const key of [
      'items',
      'results',
      'records',
      'tasks',
      'dags',
      'agents',
      'skills',
      'memories',
      'sessions',
      'plugins',
      'models',
    ]) {
      const v = obj[key];
      if (Array.isArray(v)) {
        return v as Array<Record<string, unknown>>;
      }
    }
  }
  return [];
}

// 从 result 中提取文本输出（兼容 agent.run 等方法的返回结构）
function extractText(result: unknown): string {
  if (typeof result === 'string') return result;
  if (result && typeof result === 'object') {
    const obj = result as Record<string, unknown>;
    for (const key of ['output', 'content', 'response', 'result', 'answer', 'message']) {
      const v = obj[key];
      if (typeof v === 'string' && v) return v;
      if (v && typeof v === 'object') {
        const nested = v as Record<string, unknown>;
        if (typeof nested.content === 'string' && nested.content) return nested.content;
        if (typeof nested.text === 'string' && nested.text) return nested.text;
      }
    }
  }
  return '';
}

// 从 result 中提取真实 token 用量（无则返回 undefined，不编造）
function extractUsage(
  result: unknown,
): { promptTokens: number; completionTokens: number; totalTokens: number } | undefined {
  if (!result || typeof result !== 'object') return undefined;
  const obj = result as Record<string, unknown>;
  const usage = obj['usage'] ?? obj['token_usage'] ?? obj['tokens'];
  if (usage && typeof usage === 'object') {
    const u = usage as Record<string, unknown>;
    const prompt = getInt64(u, 'prompt_tokens') || getInt64(u, 'promptTokens') || 0;
    const completion = getInt64(u, 'completion_tokens') || getInt64(u, 'completionTokens') || 0;
    const total = getInt64(u, 'total_tokens') || getInt64(u, 'totalTokens') || prompt + completion;
    if (prompt || completion || total) {
      return { promptTokens: prompt, completionTokens: completion, totalTokens: total };
    }
  }
  const prompt = getInt64(obj, 'prompt_tokens') || getInt64(obj, 'promptTokens');
  const completion = getInt64(obj, 'completion_tokens') || getInt64(obj, 'completionTokens');
  if (prompt || completion) {
    return { promptTokens: prompt, completionTokens: completion, totalTokens: prompt + completion };
  }
  return undefined;
}

// ==================== 类型定义（与旧版兼容） ====================

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum MemoryLayer {
  L1 = 'L1',
  L2 = 'L2',
  L3 = 'L3',
  L4 = 'L4',
}

export enum SessionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
}

export enum SkillStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DEPRECATED = 'deprecated',
}

export interface Task {
  id: string;
  description: string;
  status: TaskStatus;
  priority: number;
  output?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TaskResult {
  id: string;
  status: TaskStatus;
  output?: string;
  error?: string;
  startTime: string;
  endTime: string;
  duration: number;
}

export interface Memory {
  id: string;
  content: string;
  layer: MemoryLayer;
  score?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MemorySearchResult {
  memories: Memory[];
  total: number;
  query: string;
  topK: number;
}

export interface MemoryWriteItem {
  content: string;
  layer: MemoryLayer;
  metadata?: Record<string, unknown>;
}

export interface Session {
  id: string;
  userId: string;
  status: SessionStatus;
  context?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  lastActivity: string;
}

export interface Skill {
  id: string;
  name: string;
  version: string;
  description: string;
  status: SkillStatus;
  parameters?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface SkillResult<T = unknown> {
  success: boolean;
  output?: T;
  error?: string;
}

export interface SkillInfo {
  name: string;
  description: string;
  version: string;
  parameters?: Record<string, unknown>;
}

export interface SkillExecuteRequest {
  skillId: string;
  parameters?: Record<string, unknown>;
}

export interface HealthStatus {
  status: string;
  version: string;
  uptime: number;
  checks?: Record<string, unknown>;
  timestamp: string;
}

export interface Metrics {
  tasksTotal: number;
  tasksCompleted: number;
  tasksFailed: number;
  memoriesTotal: number;
  sessionsActive: number;
  skillsLoaded: number;
  cpuUsage: number;
  memoryUsage: number;
  requestCount: number;
  averageLatencyMs: number;
}

export interface ListOptions {
  pagination?: { page: number; pageSize: number };
  sort?: { field: string; order: 'asc' | 'desc' };
  filter?: { key: string; value: string };
}

export interface AgentInfo {
  id: string;
  name: string;
  description?: string;
  status: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ==================== 状态映射 ====================

function mapTaskStatus(value: unknown): TaskStatus {
  const s = String(value || '').toLowerCase();
  if (['completed', 'success', 'done', 'finished'].includes(s)) return TaskStatus.COMPLETED;
  if (['running', 'in_progress', 'processing', 'executing'].includes(s)) return TaskStatus.RUNNING;
  if (['failed', 'error', 'exception'].includes(s)) return TaskStatus.FAILED;
  if (['cancelled', 'canceled', 'cancel'].includes(s)) return TaskStatus.CANCELLED;
  return TaskStatus.PENDING;
}

function mapMemoryLayer(value: unknown): MemoryLayer {
  const s = String(value || '').toUpperCase();
  if (s === 'L2' || s === 'L3' || s === 'L4') return s as MemoryLayer;
  return MemoryLayer.L1;
}

function parseTask(data: Record<string, unknown>): Task {
  const rawStatus = data['status'] ?? data['state'] ?? data['dag_status'];
  return {
    id: getString(data, 'id') || getString(data, 'dag_id') || getString(data, 'task_id'),
    description:
      getString(data, 'description') ||
      getString(data, 'goal') ||
      getString(data, 'name') ||
      '',
    status: mapTaskStatus(rawStatus),
    priority: getInt64(data, 'priority'),
    output: getString(data, 'output') || getString(data, 'result') || undefined,
    error: getString(data, 'error') || undefined,
    metadata: getMap(data, 'metadata') || getMap(data, 'params'),
    createdAt: parseTime(data['created_at'] || data['createdAt'] || data['created']),
    updatedAt: parseTime(data['updated_at'] || data['updatedAt'] || data['updated']),
  };
}

function parseMemory(data: Record<string, unknown>): Memory {
  return {
    id: getString(data, 'id') || getString(data, 'memory_id') || getString(data, 'record_id'),
    content: getString(data, 'content') || getString(data, 'data'),
    layer: mapMemoryLayer(data['layer'] ?? data['layer_level']),
    score: getInt64(data, 'score') || undefined,
    metadata: getMap(data, 'metadata'),
    createdAt: parseTime(data['created_at'] || data['createdAt']),
    updatedAt: parseTime(data['updated_at'] || data['updatedAt']),
  };
}

function parseSession(data: Record<string, unknown>): Session {
  return {
    id: getString(data, 'id') || getString(data, 'session_id'),
    userId: getString(data, 'user_id') || getString(data, 'userId') || 'default',
    status: (getString(data, 'status') as SessionStatus) || SessionStatus.ACTIVE,
    context: getMap(data, 'context'),
    metadata: getMap(data, 'metadata'),
    createdAt: parseTime(data['created_at'] || data['createdAt']),
    lastActivity: parseTime(data['last_activity'] || data['lastActivity']),
  };
}

function parseSkill(data: Record<string, unknown>, skillId?: string): Skill {
  return {
    id: skillId || getString(data, 'id') || getString(data, 'skill_id') || getString(data, 'name'),
    name: getString(data, 'name'),
    version: getString(data, 'version') || '1.0.0',
    description: getString(data, 'description') || '',
    status:
      (getString(data, 'status') as SkillStatus) ||
      (getString(data, 'state') === 'loaded' ? SkillStatus.ACTIVE : SkillStatus.INACTIVE),
    parameters: getMap(data, 'parameters') || getMap(data, 'params'),
    metadata: getMap(data, 'metadata'),
    createdAt: parseTime(data['created_at'] || data['createdAt']),
  };
}

// ==================== TaskService（sched.*） ====================

class TaskService {
  constructor(private config: ServiceConfig) {}

  // sched.dag_submit：提交 DAG 任务，返回 {dag_id}
  private async submitDag(
    description: string,
    metadata?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    validateRequiredString(description, '任务描述');
    const node: Record<string, unknown> = {
      id: `node-${Date.now()}`,
      goal: description,
      role: 'default',
      depends: [],
    };
    if (metadata) node['params'] = metadata;
    const data = await jsonrpc<Record<string, unknown>>(
      'sched.dag_submit',
      { dag: { nodes: [node] } },
      this.config,
    );
    return data || {};
  }

  async submit(description: string): Promise<Task> {
    const data = await this.submitDag(description);
    return {
      id: getString(data, 'dag_id') || getString(data, 'id'),
      description,
      status: TaskStatus.PENDING,
      priority: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async submitWithOptions(
    description: string,
    priority: number,
    metadata?: Record<string, unknown>,
  ): Promise<Task> {
    const data = await this.submitDag(description, metadata);
    return {
      id: getString(data, 'dag_id') || getString(data, 'id'),
      description,
      priority,
      status: TaskStatus.PENDING,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // sched.dag_status：查询 DAG 任务状态
  async get(taskId: string): Promise<Task> {
    validateRequiredString(taskId, '任务ID');
    const data = await jsonrpc<Record<string, unknown>>(
      'sched.dag_status',
      { dag_id: taskId },
      this.config,
    );
    const task = parseTask(data || {});
    return { ...task, id: task.id || taskId };
  }

  async query(taskId: string): Promise<TaskStatus> {
    const task = await this.get(taskId);
    return task.status;
  }

  async wait(taskId: string, timeout?: number): Promise<TaskResult> {
    const start = Date.now();
    const pollInterval = 500;
    /* eslint-disable-next-line no-constant-condition */
    while (true) {
      const task = await this.get(taskId);

      if (
        task.status === TaskStatus.COMPLETED ||
        task.status === TaskStatus.FAILED ||
        task.status === TaskStatus.CANCELLED
      ) {
        return {
          id: task.id,
          status: task.status,
          output: task.output,
          error: task.error,
          startTime: new Date(start).toISOString(),
          endTime: new Date().toISOString(),
          duration: (Date.now() - start) / 1000,
        };
      }

      if (timeout && timeout > 0 && Date.now() - start > timeout) {
        throw new Error(`Task ${taskId} wait timeout after ${timeout}ms`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  // sched.dag_cancel：取消 DAG 任务
  async cancel(taskId: string): Promise<void> {
    validateRequiredString(taskId, '任务ID');
    await jsonrpc('sched.dag_cancel', { dag_id: taskId }, this.config);
  }

  // sched.get_stats：任务列表/统计
  async list(opts?: ListOptions): Promise<Task[]> {
    void opts;
    const data = await jsonrpc<unknown>('sched.get_stats', {}, this.config);
    return toObjectArray(data).map(parseTask);
  }

  // gateway 未提供 DAG 删除方法，退化为取消（dag_cancel）
  async delete(taskId: string): Promise<void> {
    await this.cancel(taskId);
  }

  async getResult(taskId: string): Promise<TaskResult> {
    const task = await this.get(taskId);
    if (
      task.status !== TaskStatus.COMPLETED &&
      task.status !== TaskStatus.FAILED &&
      task.status !== TaskStatus.CANCELLED
    ) {
      throw new Error('Task not yet completed');
    }
    return {
      id: task.id,
      status: task.status,
      output: task.output,
      error: task.error,
      startTime: task.createdAt,
      endTime: task.updatedAt,
      duration: 0,
    };
  }

  async batchSubmit(descriptions: string[]): Promise<Task[]> {
    const tasks: Task[] = [];
    for (const desc of descriptions) {
      tasks.push(await this.submit(desc));
    }
    return tasks;
  }

  async count(): Promise<number> {
    const data = await jsonrpc<unknown>('sched.get_stats', {}, this.config);
    const obj = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
    const explicit = getInt64(obj, 'total') || getInt64(obj, 'count') || getInt64(obj, 'total_tasks');
    return explicit || toObjectArray(data).length;
  }
}

// ==================== MemoryService（mem.*） ====================

class MemoryService {
  constructor(private config: ServiceConfig) {}

  // mem.write：写入记忆（metadata 携带 layer 等分层信息）
  private async writeRaw(
    content: string,
    metadata?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    validateRequiredString(content, '记忆内容');
    const params: Record<string, unknown> = { content };
    if (metadata && Object.keys(metadata).length > 0) params.metadata = metadata;
    const data = await jsonrpc<Record<string, unknown>>('mem.write', params, this.config);
    return data || {};
  }

  async write(content: string, layer: MemoryLayer): Promise<Memory> {
    const data = await this.writeRaw(content, { layer });
    return {
      id:
        getString(data, 'id') ||
        getString(data, 'memory_id') ||
        getString(data, 'record_id') ||
        `mem-${Date.now()}`,
      content,
      layer,
      metadata: getMap(data, 'metadata'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async writeWithOptions(
    content: string,
    layer: MemoryLayer,
    metadata?: Record<string, unknown>,
  ): Promise<Memory> {
    const data = await this.writeRaw(content, { layer, ...metadata });
    return {
      id:
        getString(data, 'id') ||
        getString(data, 'memory_id') ||
        getString(data, 'record_id') ||
        `mem-${Date.now()}`,
      content,
      layer,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // mem.get：按 id 获取记忆
  async get(memoryId: string): Promise<Memory> {
    validateRequiredString(memoryId, '记忆ID');
    const data = await jsonrpc<Record<string, unknown>>('mem.get', { id: memoryId }, this.config);
    return parseMemory(data || {});
  }

  // mem.search：语义搜索记忆
  async search(query: string, topK = 10): Promise<MemorySearchResult> {
    const data = await jsonrpc<unknown>(
      'mem.search',
      { query, top_k: topK },
      this.config,
    );
    const memories = toObjectArray(data).map(parseMemory);
    const obj = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
    const total = getInt64(obj, 'total') || memories.length;
    return { memories, total, query, topK };
  }

  // mem.search + 前端按 layer 过滤（gateway 无 layer 查询参数）
  async searchByLayer(query: string, layer: MemoryLayer, topK = 10): Promise<MemorySearchResult> {
    const result = await this.search(query, topK);
    return {
      ...result,
      memories: result.memories.filter((m) => m.layer === layer),
    };
  }

  // gateway 未提供 mem.update，退化为重新写入（metadata 标记原记忆 id）
  async update(memoryId: string, content: string): Promise<Memory> {
    validateRequiredString(memoryId, '记忆ID');
    validateRequiredString(content, '记忆内容');
    const data = await this.writeRaw(content, { memory_id: memoryId, updated: true });
    return parseMemory({ ...data, id: getString(data, 'id') || memoryId });
  }

  // mem.delete：按 id 删除记忆
  async delete(memoryId: string): Promise<void> {
    validateRequiredString(memoryId, '记忆ID');
    await jsonrpc('mem.delete', { id: memoryId }, this.config);
  }

  // gateway 未提供 mem.list，列表通过空查询召回（top_k=50）
  async list(opts?: ListOptions): Promise<Memory[]> {
    void opts;
    const result = await this.search('', 50);
    return result.memories;
  }

  async listByLayer(layer: MemoryLayer, opts?: ListOptions): Promise<Memory[]> {
    const result = await this.list(opts);
    return result.filter((m) => m.layer === layer);
  }

  // mem.count：记忆总数
  async count(): Promise<number> {
    const data = await jsonrpc<Record<string, unknown>>('mem.count', {}, this.config);
    return getInt64(data || {}, 'count') || getInt64(data || {}, 'total') || 0;
  }

  // gateway 未提供清空方法，退化为空查询后逐条删除
  async clear(): Promise<void> {
    const memories = await this.list();
    for (const memory of memories) {
      await this.delete(memory.id);
    }
  }

  async batchWrite(items: MemoryWriteItem[]): Promise<Memory[]> {
    const memories: Memory[] = [];
    for (const item of items) {
      memories.push(await this.write(item.content, item.layer));
    }
    return memories;
  }

  // gateway 未提供记忆进化方法（契约白名单无 mem.evolve），明确报错而非伪造
  async evolve(): Promise<void> {
    throw new Error('Gateway 未提供 mem.evolve 方法，记忆进化暂不可用');
  }

  async getStats(): Promise<Record<string, number>> {
    const count = await this.count();
    return { count, total: count };
  }
}

// ==================== SessionService（本地会话管理） ====================
// 会话是 UI 概念，本地持久化到 localStorage；
// 会话消息内容写入 mem_d（metadata.session_id 标记），列表可经 mem.search 召回。

const SESSION_STORAGE_KEY = 'agentos-sessions';

function loadLocalSessions(): Session[] {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Session[]) : [];
  } catch {
    return [];
  }
}

function saveLocalSessions(sessions: Session[]): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
}

class SessionService {
  constructor(private config: ServiceConfig) {}

  async create(userId: string): Promise<Session> {
    return this.createWithOptions(userId);
  }

  async createWithOptions(userId: string, metadata?: Record<string, unknown>): Promise<Session> {
    validateRequiredString(userId, '用户ID');
    const now = new Date().toISOString();
    const session: Session = {
      id: `session-${Date.now()}`,
      userId,
      status: SessionStatus.ACTIVE,
      context: {},
      metadata,
      createdAt: now,
      lastActivity: now,
    };
    const sessions = loadLocalSessions();
    sessions.push(session);
    saveLocalSessions(sessions);

    // 会话消息内容写 mem_d（metadata.session_id 标记）
    try {
      await jsonrpc(
        'mem.write',
        {
          content: `会话创建: ${userId}`,
          metadata: { session_id: session.id, user_id: userId, type: 'session', ...metadata },
        },
        this.config,
      );
    } catch (err) {
      // 会话记忆写入失败不影响本地会话，记录日志
      logger.warn('会话创建时 mem.write 失败', err);
    }
    return session;
  }

  async get(sessionId: string): Promise<Session> {
    validateRequiredString(sessionId, '会话ID');
    const session = loadLocalSessions().find((s) => s.id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    return session;
  }

  async setContext(sessionId: string, key: string, value: unknown): Promise<void> {
    validateRequiredString(sessionId, '会话ID');
    validateRequiredString(key, '上下文键');
    const sessions = loadLocalSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    session.context = { ...(session.context || {}), [key]: value };
    session.lastActivity = new Date().toISOString();
    saveLocalSessions(sessions);
  }

  async getContext(sessionId: string, key: string): Promise<unknown> {
    const session = await this.get(sessionId);
    return session.context ? session.context[key] : undefined;
  }

  async getAllContext(sessionId: string): Promise<Record<string, unknown>> {
    const session = await this.get(sessionId);
    return session.context || {};
  }

  async deleteContext(sessionId: string, key: string): Promise<void> {
    validateRequiredString(sessionId, '会话ID');
    const sessions = loadLocalSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    if (session.context) {
      delete session.context[key];
    }
    session.lastActivity = new Date().toISOString();
    saveLocalSessions(sessions);
  }

  async close(sessionId: string): Promise<void> {
    validateRequiredString(sessionId, '会话ID');
    const sessions = loadLocalSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    session.status = SessionStatus.INACTIVE;
    session.lastActivity = new Date().toISOString();
    saveLocalSessions(sessions);
  }

  // 本地会话列表 + mem.search 召回带 metadata.session_id 的会话记忆
  async list(opts?: ListOptions): Promise<Session[]> {
    void opts;
    const local = loadLocalSessions();
    try {
      const data = await jsonrpc<unknown>(
        'mem.search',
        { query: '', top_k: 100 },
        this.config,
      );
      const memories = toObjectArray(data);
      const sessions = [...local];
      for (const memory of memories) {
        const metadata = getMap(memory, 'metadata') || {};
        const sessionId = getString(metadata, 'session_id');
        if (!sessionId) continue;
        const existing = sessions.find((s) => s.id === sessionId);
        if (existing) {
          const messages = getInt64(existing.context || {}, 'messages') + 1;
          existing.context = { ...(existing.context || {}), messages };
          existing.lastActivity = parseTime(memory['created_at'] || memory['createdAt']);
        } else {
          sessions.push({
            id: sessionId,
            userId: getString(metadata, 'user_id') || 'default',
            status: SessionStatus.ACTIVE,
            context: { messages: 1 },
            metadata,
            createdAt: parseTime(memory['created_at'] || memory['createdAt']),
            lastActivity: parseTime(memory['created_at'] || memory['createdAt']),
          });
        }
      }
      return sessions;
    } catch (err) {
      // Gateway 不可达时仅返回本地会话，记录日志
      logger.warn('mem.search 召回会话记忆失败，仅返回本地会话', err);
      return local;
    }
  }

  async listByUser(userId: string, opts?: ListOptions): Promise<Session[]> {
    const sessions = await this.list(opts);
    return sessions.filter((s) => s.userId === userId);
  }

  async listActive(): Promise<Session[]> {
    const sessions = await this.list();
    return sessions.filter((s) => s.status === SessionStatus.ACTIVE);
  }

  async update(sessionId: string, metadata: Record<string, unknown>): Promise<Session> {
    validateRequiredString(sessionId, '会话ID');
    const sessions = loadLocalSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    session.metadata = { ...(session.metadata || {}), ...metadata };
    session.lastActivity = new Date().toISOString();
    saveLocalSessions(sessions);
    return session;
  }

  async refresh(sessionId: string): Promise<void> {
    validateRequiredString(sessionId, '会话ID');
    const sessions = loadLocalSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    session.status = SessionStatus.ACTIVE;
    session.lastActivity = new Date().toISOString();
    saveLocalSessions(sessions);
  }

  async isExpired(sessionId: string): Promise<boolean> {
    const session = await this.get(sessionId);
    return session.status === SessionStatus.EXPIRED;
  }

  async count(): Promise<number> {
    return loadLocalSessions().length;
  }

  async countActive(): Promise<number> {
    return loadLocalSessions().filter((s) => s.status === SessionStatus.ACTIVE).length;
  }

  // 清理过期会话（lastActivity 超过 30 天视为过期）
  async cleanExpired(): Promise<number> {
    const sessions = loadLocalSessions();
    const now = Date.now();
    const keep = sessions.filter((s) => {
      if (s.status === SessionStatus.EXPIRED) return false;
      const lastActive = new Date(s.lastActivity || s.createdAt).getTime();
      return now - lastActive < 30 * 24 * 60 * 60 * 1000;
    });
    saveLocalSessions(keep);
    return sessions.length - keep.length;
  }
}

// ==================== SkillService（plugin.*） ====================

class SkillService {
  constructor(private config: ServiceConfig) {}

  // plugin.load：加载插件
  async load(skillId: string): Promise<Skill> {
    validateRequiredString(skillId, '技能ID');
    const data = await jsonrpc<Record<string, unknown>>(
      'plugin.load',
      { name: skillId },
      this.config,
    );
    return parseSkill({ ...(data || {}), status: 'active' }, skillId);
  }

  // plugin.get_metadata：获取插件元数据
  async get(skillId: string): Promise<Skill> {
    validateRequiredString(skillId, '技能ID');
    const data = await jsonrpc<Record<string, unknown>>(
      'plugin.get_metadata',
      { name: skillId },
      this.config,
    );
    return parseSkill(data || {}, skillId);
  }

  // plugin.execute：执行插件
  async execute(skillId: string, parameters?: Record<string, unknown>): Promise<SkillResult> {
    validateRequiredString(skillId, '技能ID');
    const data = await jsonrpc<Record<string, unknown>>(
      'plugin.execute',
      { name: skillId, params: parameters || {} },
      this.config,
    );
    const obj = data || {};
    return {
      success: obj['success'] === true || obj['success'] === undefined,
      output: (obj['output'] ?? obj['result'] ?? obj['data']) as SkillResult['output'],
      error: getString(obj, 'error') || (obj['success'] === false ? 'Plugin execution failed' : undefined),
    };
  }

  // plugin.execute + session 上下文（gateway 契约无 session 参数，仅传 params）
  async executeWithContext(
    skillId: string,
    parameters?: Record<string, unknown>,
    _sessionId?: string,
  ): Promise<SkillResult> {
    return this.execute(skillId, parameters);
  }

  // plugin.unload：卸载插件
  async unload(skillId: string): Promise<void> {
    validateRequiredString(skillId, '技能ID');
    await jsonrpc('plugin.unload', { name: skillId }, this.config);
  }

  // plugin.list：插件列表
  async list(opts?: ListOptions): Promise<Skill[]> {
    void opts;
    const data = await jsonrpc<unknown>('plugin.list', {}, this.config);
    return toObjectArray(data).map((item) => parseSkill(item));
  }

  async listLoaded(): Promise<Skill[]> {
    const skills = await this.list();
    return skills.filter((s) => s.status === SkillStatus.ACTIVE);
  }

  // gateway 未提供 plugin.register，退化为 plugin.load（name 即插件名）
  async register(
    name: string,
    description: string,
    parameters?: Record<string, unknown>,
  ): Promise<Skill> {
    validateRequiredString(name, '技能名称');
    await jsonrpc('plugin.load', { name }, this.config);
    return {
      id: name,
      name,
      version: '1.0.0',
      description,
      status: SkillStatus.ACTIVE,
      parameters,
      createdAt: new Date().toISOString(),
    };
  }

  // gateway 未提供 plugin.update，退化为 plugin.load 重载
  async update(
    skillId: string,
    description: string,
    parameters?: Record<string, unknown>,
  ): Promise<Skill> {
    validateRequiredString(skillId, '技能ID');
    const data = await jsonrpc<Record<string, unknown>>(
      'plugin.load',
      { name: skillId },
      this.config,
    );
    return parseSkill({ ...(data || {}), description, parameters }, skillId);
  }

  // gateway 未提供插件删除方法，退化为 plugin.unload
  async delete(skillId: string): Promise<void> {
    await this.unload(skillId);
  }

  async getInfo(skillId: string): Promise<SkillInfo> {
    const skill = await this.get(skillId);
    return {
      name: skill.name,
      description: skill.description,
      version: skill.version,
      parameters: skill.parameters,
    };
  }

  // gateway 未提供插件校验方法，明确报错而非伪造校验结果
  async validate(
    _skillId: string,
    _parameters: Record<string, unknown>,
  ): Promise<{ valid: boolean; errors: string[] }> {
    throw new Error('Gateway 未提供 plugin 校验方法');
  }

  async count(): Promise<number> {
    return (await this.list()).length;
  }

  async countLoaded(): Promise<number> {
    return (await this.listLoaded()).length;
  }

  // market.search_skills：从 gateway 技能市场检索；结果按 query 前端过滤
  async search(query: string, topK = 10): Promise<Skill[]> {
    const data = await jsonrpc<unknown>('market.search_skills', {}, this.config);
    const skills = toObjectArray(data).map((item) => parseSkill(item));
    const q = (query || '').toLowerCase();
    if (!q) return skills.slice(0, topK);
    return skills
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q),
      )
      .slice(0, topK);
  }

  async batchExecute(requests: SkillExecuteRequest[]): Promise<SkillResult[]> {
    const results: SkillResult[] = [];
    for (const req of requests) {
      results.push(await this.execute(req.skillId, req.parameters));
    }
    return results;
  }

  // plugin.get_stats：插件统计
  async getStats(skillId: string): Promise<Record<string, number>> {
    try {
      const data = await jsonrpc<Record<string, unknown>>('plugin.get_stats', {}, this.config);
      const obj = data || {};
      const scoped = getMap(obj, skillId) || obj;
      const result: Record<string, number> = {};
      for (const [key, value] of Object.entries(scoped)) {
        if (typeof value === 'number') result[key] = value;
      }
      return result;
    } catch (err) {
      logger.warn(`plugin.get_stats 失败（skillId=${skillId}），返回空统计`, err);
      return {};
    }
  }
}

// ==================== AgentService（a2a.* / agent.*） ====================

class AgentService {
  constructor(private config: ServiceConfig) {}

  // a2a.discover_agents：发现已注册智能体
  async list(): Promise<AgentInfo[]> {
    const data = await jsonrpc<unknown>('a2a.discover_agents', {}, this.config);
    return toObjectArray(data).map((a) => ({
      id: getString(a, 'id') || getString(a, 'agent_id') || getString(a, 'agentId'),
      name: getString(a, 'name'),
      description: getString(a, 'description') || undefined,
      status: getString(a, 'status') || getString(a, 'state') || 'unknown',
      metadata: getMap(a, 'metadata'),
      createdAt: parseTime(a['created_at'] || a['createdAt'] || a['registered_at']),
    }));
  }

  // a2a.register_agent：注册智能体
  async spawn(name: string, agentSpec?: Record<string, unknown>): Promise<AgentInfo> {
    validateRequiredString(name, 'Agent名称');
    const data = await jsonrpc<Record<string, unknown>>(
      'a2a.register_agent',
      { name, ...agentSpec },
      this.config,
    );
    const obj = data || {};
    return {
      id: getString(obj, 'id') || getString(obj, 'agent_id') || `agent-${Date.now()}`,
      name: getString(obj, 'name') || name,
      status: getString(obj, 'status') || 'registered',
      metadata: getMap(obj, 'metadata'),
      createdAt: new Date().toISOString(),
    };
  }

  // a2a.unregister_agent：注销智能体
  async terminate(agentId: string): Promise<void> {
    validateRequiredString(agentId, 'AgentID');
    await jsonrpc('a2a.unregister_agent', { agent_id: agentId }, this.config);
  }

  // agent.run：智能体完整对话链路（think→llm），desktop 聊天唯一入口。
  // gateway 契约：agent.run {prompt, session_id?}，session_id 复用 agentId 作为会话标识
  async invoke(agentId: string, input: string): Promise<string> {
    validateRequiredString(agentId, 'AgentID');
    const data = await jsonrpc<unknown>(
      'agent.run',
      { prompt: input, session_id: agentId },
      this.config,
    );
    return extractText(data);
  }

  // agent.run 详细结果（含真实 token 用量，无则 usage 为 undefined）
  async invokeDetailed(
    agentId: string,
    input: string,
  ): Promise<{
    output: string;
    usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
    model?: string;
  }> {
    validateRequiredString(agentId, 'AgentID');
    const data = await jsonrpc<unknown>(
      'agent.run',
      { prompt: input, session_id: agentId },
      this.config,
    );
    const obj = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
    return {
      output: extractText(data),
      usage: extractUsage(data),
      model: getString(obj, 'model') || undefined,
    };
  }

  // a2a.discover_agents 结果中按 id 查找（gateway 无单查方法）
  async get(agentId: string): Promise<AgentInfo> {
    validateRequiredString(agentId, 'AgentID');
    const agents = await this.list();
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    return agent;
  }
}

// ==================== AgentOSClient ====================

export class AgentOSClient {
  config: ServiceConfig;
  tasks: TaskService;
  memories: MemoryService;
  sessions: SessionService;
  skills: SkillService;
  agents: AgentService;

  constructor(config?: Partial<ServiceConfig>) {
    this.config = { ...defaultConfig(), ...config };
    this.tasks = new TaskService(this.config);
    this.memories = new MemoryService(this.config);
    this.sessions = new SessionService(this.config);
    this.skills = new SkillService(this.config);
    this.agents = new AgentService(this.config);
  }

  updateConfig(config: Partial<ServiceConfig>) {
    this.config = { ...this.config, ...config };
    localStorage.setItem('agentos-endpoint', this.config.endpoint);
    if (this.config.apiKey) {
      localStorage.setItem('agentos-api-key', this.config.apiKey);
    }
    this.tasks = new TaskService(this.config);
    this.memories = new MemoryService(this.config);
    this.sessions = new SessionService(this.config);
    this.skills = new SkillService(this.config);
    this.agents = new AgentService(this.config);
  }

  // info.health：健康检查
  async health(): Promise<HealthStatus> {
    try {
      const resp = await jsonrpc<Record<string, unknown>>('info.health', {}, this.config);
      const data = resp || {};
      return {
        status: getString(data, 'status') || getString(data, 'state') || 'unknown',
        version: getString(data, 'version') || '',
        uptime: getInt64(data, 'uptime') || getInt64(data, 'uptime_seconds'),
        checks: getMap(data, 'checks'),
        timestamp: parseTime(data['timestamp'] || data['time']),
      };
    } catch (err) {
      // Gateway 不可达：返回 unreachable 状态供 UI 展示连接指示，并记录日志
      logger.warn('info.health 调用失败，Gateway 不可达', err);
      return {
        status: 'unreachable',
        version: '',
        uptime: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // 兼容层：将历史 REST 路径转换为 JSON-RPC 方法名。
  // gateway 无任何 REST 资源路径，此方法仅用于保留旧调用方签名。
  async rawRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const method = normalizeMethodName(path);
    let params: Record<string, unknown> = {};
    if (options.body && typeof options.body === 'string') {
      try {
        const parsed = JSON.parse(options.body);
        params = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
      } catch {
        params = {};
      }
    }
    // 配置写入：gateway 无配置写入方法（配置由 $AIRY_HOME/config/model.yaml 管理），本地静默成功
    if (method === 'llm.list_models' && options.method && options.method !== 'GET') {
      return {} as T;
    }
    return jsonrpc<T>(method, params, this.config);
  }

  // 系统统计：聚合 observe.query_metrics / info.get_stats / sched.get_stats /
  // mem.count / info.system（任一失败不影响整体，缺失字段归零）
  async metrics(): Promise<Metrics> {
    const empty: Metrics = {
      tasksTotal: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      memoriesTotal: 0,
      sessionsActive: 0,
      skillsLoaded: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      requestCount: 0,
      averageLatencyMs: 0,
    };
    try {
      const [infoStats, schedStats, memStats, systemStats, obsStats] =
        await Promise.allSettled([
          jsonrpc<unknown>('info.get_stats', {}, this.config),
          jsonrpc<unknown>('sched.get_stats', {}, this.config),
          jsonrpc<unknown>('mem.count', {}, this.config),
          jsonrpc<unknown>('info.system', {}, this.config),
          jsonrpc<unknown>('observe.query_metrics', {}, this.config),
        ]);

      const pick = (settled: PromiseSettledResult<unknown>): Record<string, unknown> =>
        settled.status === 'fulfilled' && settled.value && typeof settled.value === 'object'
          ? (settled.value as Record<string, unknown>)
          : {};

      const info = pick(infoStats);
      const sched = pick(schedStats);
      const mem = pick(memStats);
      const system = pick(systemStats);
      const obs = pick(obsStats);

      const cpuObj = getMap(system, 'cpu') || system;
      const memObj = getMap(system, 'memory') || {};

      return {
        tasksTotal: getInt64(sched, 'total') || getInt64(sched, 'total_tasks') || getInt64(info, 'tasks_total') || 0,
        tasksCompleted: getInt64(sched, 'completed') || getInt64(info, 'tasks_completed') || 0,
        tasksFailed: getInt64(sched, 'failed') || getInt64(info, 'tasks_failed') || 0,
        memoriesTotal: getInt64(mem, 'count') || getInt64(mem, 'total') || getInt64(info, 'memories_total') || 0,
        sessionsActive: getInt64(info, 'sessions_active') || getInt64(info, 'sessionsActive') || 0,
        skillsLoaded: getInt64(info, 'skills_loaded') || getInt64(info, 'skillsLoaded') || 0,
        cpuUsage: getInt64(cpuObj, 'usage_percent') || getInt64(cpuObj, 'usage') || getInt64(system, 'cpu_usage') || 0,
        memoryUsage:
          getInt64(memObj, 'used_percent') || getInt64(memObj, 'percent') || getInt64(system, 'memory_usage') || 0,
        requestCount:
          getInt64(obs, 'request_count') || getInt64(obs, 'requests') ||
          getInt64(info, 'request_count') || getInt64(info, 'requests') || 0,
        averageLatencyMs:
          getInt64(obs, 'average_latency_ms') || getInt64(obs, 'avg_latency_ms') ||
          getInt64(info, 'average_latency_ms') || getInt64(info, 'avg_latency_ms') || 0,
      };
    } catch (err) {
      // 指标聚合失败：返回零值兜底并记录，供 UI 容错
      logger.warn('metrics 聚合失败', err);
      return empty;
    }
  }

  testConnection(): Promise<HealthStatus> {
    return this.health();
  }
}

// REST 路径 → JSON-RPC 方法名转换（仅兼容旧调用方，新代码直接调用 jsonrpc）
const METHOD_ALIAS: Record<string, string> = {
  config: 'llm.list_models',
  health: 'info.health',
  metrics: 'info.get_stats',
};

function normalizeMethodName(path: string): string {
  let name = path.replace(/^\/+/, '').replace(/^api\/v1\//, '').replace(/\//g, '.');
  return METHOD_ALIAS[name] || name;
}
