const DEFAULT_ENDPOINT = 'http://localhost:18789';
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

function toQueryParams(opts?: ListOptions): string {
  if (!opts) return '';
  const params = new URLSearchParams();
  if (opts.pagination) {
    params.set('page', String(opts.pagination.page));
    params.set('page_size', String(opts.pagination.pageSize));
  }
  if (opts.sort) {
    params.set('sort_by', opts.sort.field);
    params.set('sort_order', opts.sort.order);
  }
  if (opts.filter) {
    params.set(opts.filter.key, opts.filter.value);
  }
  return params.toString();
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  config: ServiceConfig,
): Promise<T> {
  const url = `${config.endpoint}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (config.apiKey) {
    headers['X-API-Key'] = config.apiKey;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`AgentOS API error ${response.status}: ${errorBody || response.statusText}`);
    }

    return response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`Request timeout after ${config.timeout}ms: ${path}`);
    }
    throw err;
  }
}

function getString(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  return typeof v === 'string' ? v : String(v ?? '');
}

function getInt64(obj: Record<string, unknown>, key: string): number {
  const v = obj[key];
  return typeof v === 'number' ? v : Number(v ?? 0);
}

function getMap(
  obj: Record<string, unknown>,
  key: string,
): Record<string, unknown> | undefined {
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

function extractData(resp: unknown): Record<string, unknown> {
  const r = resp as Record<string, unknown>;
  if (r && typeof r === 'object' && 'data' in r) {
    const d = r['data'];
    if (d && typeof d === 'object' && !Array.isArray(d)) {
      return d as Record<string, unknown>;
    }
    if (d && typeof d === 'string') {
      try {
        return JSON.parse(d);
      } catch {
        return { raw: d };
      }
    }
    return {};
  }
  return r as Record<string, unknown>;
}

function parseList<T>(
  resp: unknown,
  key: string,
  parser: (item: Record<string, unknown>) => T,
): T[] {
  const r = resp as Record<string, unknown>;
  let items: unknown[] = [];
  if (r && typeof r === 'object' && 'data' in r) {
    const d = r['data'];
    if (d && typeof d === 'object') {
      const arr = (d as Record<string, unknown>)[key];
      if (Array.isArray(arr)) items = arr;
    }
  }
  if (items.length === 0 && Array.isArray(r)) {
    items = r;
  }
  if (items.length === 0 && Array.isArray(r[key])) {
    items = r[key] as unknown[];
  }
  return items.map((item) => parser(item as Record<string, unknown>));
}

function buildListPath(basePath: string, opts?: ListOptions): string {
  const qs = toQueryParams(opts);
  return qs ? `${basePath}?${qs}` : basePath;
}

function parseTask(data: Record<string, unknown>): Task {
  return {
    id: getString(data, 'id') || getString(data, 'task_id'),
    description: getString(data, 'description'),
    status: (getString(data, 'status') as TaskStatus) || TaskStatus.PENDING,
    priority: getInt64(data, 'priority'),
    output: getString(data, 'output') || undefined,
    error: getString(data, 'error') || undefined,
    metadata: getMap(data, 'metadata'),
    createdAt: parseTime(data['created_at'] || data['createdAt']),
    updatedAt: parseTime(data['updated_at'] || data['updatedAt']),
  };
}

function parseSession(data: Record<string, unknown>): Session {
  return {
    id: getString(data, 'id') || getString(data, 'session_id'),
    userId: getString(data, 'user_id') || getString(data, 'userId'),
    status: (getString(data, 'status') as SessionStatus) || SessionStatus.ACTIVE,
    context: getMap(data, 'context'),
    metadata: getMap(data, 'metadata'),
    createdAt: parseTime(data['created_at'] || data['createdAt']),
    lastActivity: parseTime(data['last_activity'] || data['lastActivity']),
  };
}

function parseMemory(data: Record<string, unknown>): Memory {
  return {
    id: getString(data, 'id') || getString(data, 'memory_id') || getString(data, 'record_id'),
    content: getString(data, 'content') || getString(data, 'data'),
    layer: (getString(data, 'layer') as MemoryLayer) || MemoryLayer.L1,
    score: getInt64(data, 'score') || undefined,
    metadata: getMap(data, 'metadata'),
    createdAt: parseTime(data['created_at'] || data['createdAt']),
    updatedAt: parseTime(data['updated_at'] || data['updatedAt']),
  };
}

function parseSkill(data: Record<string, unknown>, skillId?: string): Skill {
  return {
    id: skillId || getString(data, 'id') || getString(data, 'skill_id'),
    name: getString(data, 'name'),
    version: getString(data, 'version') || '1.0.0',
    description: getString(data, 'description') || '',
    status: (getString(data, 'status') as SkillStatus) || SkillStatus.ACTIVE,
    parameters: getMap(data, 'parameters'),
    metadata: getMap(data, 'metadata'),
    createdAt: parseTime(data['created_at'] || data['createdAt']),
  };
}

class TaskService {
  constructor(private config: ServiceConfig) {}

  async submit(description: string): Promise<Task> {
    validateRequiredString(description, '任务描述');
    const resp = await request<Record<string, unknown>>(
      '/api/v1/tasks',
      { method: 'POST', body: JSON.stringify({ description }) },
      this.config,
    );
    const data = extractData(resp);
    return {
      id: getString(data, 'task_id') || getString(data, 'id'),
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
    validateRequiredString(description, '任务描述');
    const body: Record<string, unknown> = { description, priority };
    if (metadata) body.metadata = metadata;
    const resp = await request<Record<string, unknown>>(
      '/api/v1/tasks',
      { method: 'POST', body: JSON.stringify(body) },
      this.config,
    );
    const data = extractData(resp);
    return {
      id: getString(data, 'task_id') || getString(data, 'id'),
      description,
      priority,
      status: TaskStatus.PENDING,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async get(taskId: string): Promise<Task> {
    validateRequiredString(taskId, '任务ID');
    const resp = await request<Record<string, unknown>>(
      `/api/v1/tasks/${taskId}`,
      { method: 'GET' },
      this.config,
    );
    return parseTask(extractData(resp));
  }

  async query(taskId: string): Promise<TaskStatus> {
    const task = await this.get(taskId);
    return task.status;
  }

  async wait(taskId: string, timeout?: number): Promise<TaskResult> {
    const start = Date.now();
    const pollInterval = 500;
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

  async cancel(taskId: string): Promise<void> {
    validateRequiredString(taskId, '任务ID');
    await request(`/api/v1/tasks/${taskId}/cancel`, { method: 'POST' }, this.config);
  }

  async list(opts?: ListOptions): Promise<Task[]> {
    const path = buildListPath('/api/v1/tasks', opts);
    const resp = await request<Record<string, unknown>>(path, { method: 'GET' }, this.config);
    return parseList<Task>(resp, 'tasks', parseTask);
  }

  async delete(taskId: string): Promise<void> {
    validateRequiredString(taskId, '任务ID');
    await request(`/api/v1/tasks/${taskId}`, { method: 'DELETE' }, this.config);
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
    try {
      const resp = await request<Record<string, unknown>>(
        '/api/v1/tasks/count',
        { method: 'GET' },
        this.config,
      );
      const data = extractData(resp);
      return getInt64(data, 'count');
    } catch {
      return (await this.list()).length;
    }
  }
}

class MemoryService {
  constructor(private config: ServiceConfig) {}

  async write(content: string, layer: MemoryLayer): Promise<Memory> {
    validateRequiredString(content, '记忆内容');
    const resp = await request<Record<string, unknown>>(
      '/api/v1/memories',
      { method: 'POST', body: JSON.stringify({ content, layer }) },
      this.config,
    );
    const data = extractData(resp);
    return {
      id: getString(data, 'memory_id') || getString(data, 'id') || getString(data, 'record_id'),
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
    validateRequiredString(content, '记忆内容');
    const body: Record<string, unknown> = { content, layer };
    if (metadata) body.metadata = metadata;
    const resp = await request<Record<string, unknown>>(
      '/api/v1/memories',
      { method: 'POST', body: JSON.stringify(body) },
      this.config,
    );
    const data = extractData(resp);
    return {
      id: getString(data, 'memory_id') || getString(data, 'id') || getString(data, 'record_id'),
      content,
      layer,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async get(memoryId: string): Promise<Memory> {
    validateRequiredString(memoryId, '记忆ID');
    const resp = await request<Record<string, unknown>>(
      `/api/v1/memories/${memoryId}`,
      { method: 'GET' },
      this.config,
    );
    return parseMemory(extractData(resp));
  }

  async search(query: string, topK = 10): Promise<MemorySearchResult> {
    const resp = await request<Record<string, unknown>>(
      `/api/v1/memories/search?q=${encodeURIComponent(query)}&top_k=${topK}`,
      { method: 'GET' },
      this.config,
    );
    const data = extractData(resp);
    const memories = parseList<Memory>({ data } as Record<string, unknown>, 'memories', parseMemory);
    return {
      memories,
      total: getInt64(data, 'total') || memories.length,
      query,
      topK,
    };
  }

  async searchByLayer(
    query: string,
    layer: MemoryLayer,
    topK = 10,
  ): Promise<MemorySearchResult> {
    const resp = await request<Record<string, unknown>>(
      `/api/v1/memories/search?q=${encodeURIComponent(query)}&layer=${layer}&top_k=${topK}`,
      { method: 'GET' },
      this.config,
    );
    const data = extractData(resp);
    const memories = parseList<Memory>({ data } as Record<string, unknown>, 'memories', parseMemory);
    return {
      memories,
      total: getInt64(data, 'total') || memories.length,
      query,
      topK,
    };
  }

  async update(memoryId: string, content: string): Promise<Memory> {
    validateRequiredString(memoryId, '记忆ID');
    validateRequiredString(content, '记忆内容');
    const resp = await request<Record<string, unknown>>(
      `/api/v1/memories/${memoryId}`,
      { method: 'PUT', body: JSON.stringify({ content }) },
      this.config,
    );
    return parseMemory(extractData(resp));
  }

  async delete(memoryId: string): Promise<void> {
    validateRequiredString(memoryId, '记忆ID');
    await request(`/api/v1/memories/${memoryId}`, { method: 'DELETE' }, this.config);
  }

  async list(opts?: ListOptions): Promise<Memory[]> {
    const path = buildListPath('/api/v1/memories', opts);
    const resp = await request<Record<string, unknown>>(path, { method: 'GET' }, this.config);
    return parseList<Memory>(resp, 'memories', parseMemory);
  }

  async listByLayer(layer: MemoryLayer, opts?: ListOptions): Promise<Memory[]> {
    const baseOpts: ListOptions = {
      ...opts,
      filter: opts?.filter || { key: 'layer', value: layer },
    };
    return this.list(baseOpts);
  }

  async count(): Promise<number> {
    try {
      const resp = await request<Record<string, unknown>>(
        '/api/v1/memories/count',
        { method: 'GET' },
        this.config,
      );
      const data = extractData(resp);
      return getInt64(data, 'count');
    } catch {
      return (await this.list()).length;
    }
  }

  async clear(): Promise<void> {
    await request('/api/v1/memories', { method: 'DELETE' }, this.config);
  }

  async batchWrite(items: MemoryWriteItem[]): Promise<Memory[]> {
    const memories: Memory[] = [];
    for (const item of items) {
      memories.push(await this.write(item.content, item.layer));
    }
    return memories;
  }

  async evolve(): Promise<void> {
    await request('/api/v1/memories/evolve', { method: 'POST' }, this.config);
  }

  async getStats(): Promise<Record<string, number>> {
    try {
      const resp = await request<Record<string, unknown>>(
        '/api/v1/memories/stats',
        { method: 'GET' },
        this.config,
      );
      const data = extractData(resp);
      return data as Record<string, number>;
    } catch {
      return {};
    }
  }
}

class SessionService {
  constructor(private config: ServiceConfig) {}

  async create(userId: string): Promise<Session> {
    return this.createWithOptions(userId);
  }

  async createWithOptions(
    userId: string,
    metadata?: Record<string, unknown>,
  ): Promise<Session> {
    validateRequiredString(userId, '用户ID');
    const body: Record<string, unknown> = { user_id: userId };
    if (metadata) body.metadata = metadata;
    const resp = await request<Record<string, unknown>>(
      '/api/v1/sessions',
      { method: 'POST', body: JSON.stringify(body) },
      this.config,
    );
    const data = extractData(resp);
    return {
      id: getString(data, 'session_id') || getString(data, 'id'),
      userId,
      status: SessionStatus.ACTIVE,
      context: {},
      metadata,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    };
  }

  async get(sessionId: string): Promise<Session> {
    validateRequiredString(sessionId, '会话ID');
    const resp = await request<Record<string, unknown>>(
      `/api/v1/sessions/${sessionId}`,
      { method: 'GET' },
      this.config,
    );
    return parseSession(extractData(resp));
  }

  async setContext(sessionId: string, key: string, value: unknown): Promise<void> {
    validateRequiredString(sessionId, '会话ID');
    validateRequiredString(key, '上下文键');
    await request(
      `/api/v1/sessions/${sessionId}/context`,
      { method: 'POST', body: JSON.stringify({ key, value }) },
      this.config,
    );
  }

  async getContext(sessionId: string, key: string): Promise<unknown> {
    validateRequiredString(sessionId, '会话ID');
    const resp = await request<Record<string, unknown>>(
      `/api/v1/sessions/${sessionId}/context/${key}`,
      { method: 'GET' },
      this.config,
    );
    const data = extractData(resp);
    return data ? data['value'] : undefined;
  }

  async getAllContext(sessionId: string): Promise<Record<string, unknown>> {
    validateRequiredString(sessionId, '会话ID');
    const resp = await request<Record<string, unknown>>(
      `/api/v1/sessions/${sessionId}/context`,
      { method: 'GET' },
      this.config,
    );
    const data = extractData(resp);
    return (data && getMap(data, 'context')) || {};
  }

  async deleteContext(sessionId: string, key: string): Promise<void> {
    validateRequiredString(sessionId, '会话ID');
    await request(
      `/api/v1/sessions/${sessionId}/context/${key}`,
      { method: 'DELETE' },
      this.config,
    );
  }

  async close(sessionId: string): Promise<void> {
    validateRequiredString(sessionId, '会话ID');
    await request(`/api/v1/sessions/${sessionId}`, { method: 'DELETE' }, this.config);
  }

  async list(opts?: ListOptions): Promise<Session[]> {
    const path = buildListPath('/api/v1/sessions', opts);
    const resp = await request<Record<string, unknown>>(path, { method: 'GET' }, this.config);
    return parseList<Session>(resp, 'sessions', parseSession);
  }

  async listByUser(userId: string, opts?: ListOptions): Promise<Session[]> {
    const params = new URLSearchParams({ user_id: userId });
    if (opts?.pagination) {
      params.set('page', String(opts.pagination.page));
      params.set('page_size', String(opts.pagination.pageSize));
    }
    const resp = await request<Record<string, unknown>>(
      `/api/v1/sessions?${params.toString()}`,
      { method: 'GET' },
      this.config,
    );
    return parseList<Session>(resp, 'sessions', parseSession);
  }

  async listActive(): Promise<Session[]> {
    const resp = await request<Record<string, unknown>>(
      '/api/v1/sessions?status=active',
      { method: 'GET' },
      this.config,
    );
    return parseList<Session>(resp, 'sessions', parseSession);
  }

  async update(
    sessionId: string,
    metadata: Record<string, unknown>,
  ): Promise<Session> {
    validateRequiredString(sessionId, '会话ID');
    const resp = await request<Record<string, unknown>>(
      `/api/v1/sessions/${sessionId}`,
      { method: 'PUT', body: JSON.stringify({ metadata }) },
      this.config,
    );
    return parseSession(extractData(resp));
  }

  async refresh(sessionId: string): Promise<void> {
    validateRequiredString(sessionId, '会话ID');
    await request(
      `/api/v1/sessions/${sessionId}/refresh`,
      { method: 'POST' },
      this.config,
    );
  }

  async isExpired(sessionId: string): Promise<boolean> {
    const session = await this.get(sessionId);
    return session.status === SessionStatus.EXPIRED;
  }

  async count(): Promise<number> {
    try {
      const resp = await request<Record<string, unknown>>(
        '/api/v1/sessions/count',
        { method: 'GET' },
        this.config,
      );
      const data = extractData(resp);
      return getInt64(data, 'count');
    } catch {
      return (await this.list()).length;
    }
  }

  async countActive(): Promise<number> {
    try {
      const resp = await request<Record<string, unknown>>(
        '/api/v1/sessions/count?status=active',
        { method: 'GET' },
        this.config,
      );
      const data = extractData(resp);
      return getInt64(data, 'count');
    } catch {
      return (await this.listActive()).length;
    }
  }

  async cleanExpired(): Promise<number> {
    try {
      const resp = await request<Record<string, unknown>>(
        '/api/v1/sessions/clean-expired',
        { method: 'POST' },
        this.config,
      );
      const data = extractData(resp);
      return getInt64(data, 'cleaned');
    } catch {
      return 0;
    }
  }
}

class SkillService {
  constructor(private config: ServiceConfig) {}

  async load(skillId: string): Promise<Skill> {
    validateRequiredString(skillId, '技能ID');
    const resp = await request<Record<string, unknown>>(
      `/api/v1/skills/${skillId}/load`,
      { method: 'POST' },
      this.config,
    );
    const data = extractData(resp);
    return parseSkill(data, skillId);
  }

  async get(skillId: string): Promise<Skill> {
    validateRequiredString(skillId, '技能ID');
    const resp = await request<Record<string, unknown>>(
      `/api/v1/skills/${skillId}`,
      { method: 'GET' },
      this.config,
    );
    return parseSkill(extractData(resp));
  }

  async execute(
    skillId: string,
    parameters?: Record<string, unknown>,
  ): Promise<SkillResult> {
    validateRequiredString(skillId, '技能ID');
    const body = parameters ? { parameters } : {};
    const resp = await request<Record<string, unknown>>(
      `/api/v1/skills/${skillId}/execute`,
      { method: 'POST', body: JSON.stringify(body) },
      this.config,
    );
    const data = extractData(resp);
    return {
      success: data['success'] === true || data['success'] === undefined || data['success'] === null,
      output: data['output'] || data['result'],
      error: getString(data, 'error') || undefined,
    };
  }

  async executeWithContext(
    skillId: string,
    parameters?: Record<string, unknown>,
    sessionId?: string,
  ): Promise<SkillResult> {
    validateRequiredString(skillId, '技能ID');
    const body: Record<string, unknown> = {};
    if (parameters) body.parameters = parameters;
    if (sessionId) body.session_id = sessionId;
    const resp = await request<Record<string, unknown>>(
      `/api/v1/skills/${skillId}/execute`,
      { method: 'POST', body: JSON.stringify(body) },
      this.config,
    );
    const data = extractData(resp);
    return {
      success: data['success'] === true || data['success'] === undefined || data['success'] === null,
      output: data['output'] || data['result'],
      error: getString(data, 'error') || undefined,
    };
  }

  async unload(skillId: string): Promise<void> {
    validateRequiredString(skillId, '技能ID');
    await request(
      `/api/v1/skills/${skillId}/unload`,
      { method: 'POST' },
      this.config,
    );
  }

  async list(opts?: ListOptions): Promise<Skill[]> {
    const path = buildListPath('/api/v1/skills', opts);
    const resp = await request<Record<string, unknown>>(path, { method: 'GET' }, this.config);
    return parseList<Skill>(resp, 'skills', parseSkill);
  }

  async listLoaded(): Promise<Skill[]> {
    const resp = await request<Record<string, unknown>>(
      '/api/v1/skills?status=active',
      { method: 'GET' },
      this.config,
    );
    return parseList<Skill>(resp, 'skills', parseSkill);
  }

  async register(
    name: string,
    description: string,
    parameters?: Record<string, unknown>,
  ): Promise<Skill> {
    validateRequiredString(name, '技能名称');
    const body: Record<string, unknown> = { name, description };
    if (parameters) body.parameters = parameters;
    const resp = await request<Record<string, unknown>>(
      '/api/v1/skills',
      { method: 'POST', body: JSON.stringify(body) },
      this.config,
    );
    const data = extractData(resp);
    return {
      id: getString(data, 'skill_id') || getString(data, 'id'),
      name,
      version: '1.0.0',
      description,
      status: SkillStatus.ACTIVE,
      parameters,
      createdAt: new Date().toISOString(),
    };
  }

  async update(
    skillId: string,
    description: string,
    parameters?: Record<string, unknown>,
  ): Promise<Skill> {
    validateRequiredString(skillId, '技能ID');
    const body: Record<string, unknown> = { description };
    if (parameters) body.parameters = parameters;
    const resp = await request<Record<string, unknown>>(
      `/api/v1/skills/${skillId}`,
      { method: 'PUT', body: JSON.stringify(body) },
      this.config,
    );
    return parseSkill(extractData(resp));
  }

  async delete(skillId: string): Promise<void> {
    validateRequiredString(skillId, '技能ID');
    await request(`/api/v1/skills/${skillId}`, { method: 'DELETE' }, this.config);
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

  async validate(
    skillId: string,
    parameters: Record<string, unknown>,
  ): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const resp = await request<Record<string, unknown>>(
        `/api/v1/skills/${skillId}/validate`,
        { method: 'POST', body: JSON.stringify({ parameters }) },
        this.config,
      );
      const data = extractData(resp);
      const valid = data['valid'] !== false;
      const errors = (data['errors'] as string[]) || [];
      return { valid, errors };
    } catch {
      return { valid: true, errors: [] };
    }
  }

  async count(): Promise<number> {
    try {
      const resp = await request<Record<string, unknown>>(
        '/api/v1/skills/count',
        { method: 'GET' },
        this.config,
      );
      const data = extractData(resp);
      return getInt64(data, 'count');
    } catch {
      return (await this.list()).length;
    }
  }

  async countLoaded(): Promise<number> {
    try {
      const resp = await request<Record<string, unknown>>(
        '/api/v1/skills/count?status=active',
        { method: 'GET' },
        this.config,
      );
      const data = extractData(resp);
      return getInt64(data, 'count');
    } catch {
      return (await this.listLoaded()).length;
    }
  }

  async search(query: string, topK = 10): Promise<Skill[]> {
    const resp = await request<Record<string, unknown>>(
      `/api/v1/skills/search?q=${encodeURIComponent(query)}&top_k=${topK}`,
      { method: 'GET' },
      this.config,
    );
    return parseList<Skill>(resp, 'skills', parseSkill);
  }

  async batchExecute(requests: SkillExecuteRequest[]): Promise<SkillResult[]> {
    const results: SkillResult[] = [];
    for (const req of requests) {
      results.push(await this.execute(req.skillId, req.parameters));
    }
    return results;
  }

  async getStats(skillId: string): Promise<Record<string, number>> {
    try {
      const resp = await request<Record<string, unknown>>(
        `/api/v1/skills/${skillId}/stats`,
        { method: 'GET' },
        this.config,
      );
      const data = extractData(resp);
      return data as Record<string, number>;
    } catch {
      return {};
    }
  }
}

interface AgentInfo {
  id: string;
  name: string;
  description?: string;
  status: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

class AgentService {
  constructor(private config: ServiceConfig) {}

  async list(): Promise<AgentInfo[]> {
    const resp = await request<Record<string, unknown>>(
      '/api/v1/agents',
      { method: 'GET' },
      this.config,
    );
    const data = extractData(resp);
    const agents = data['agents'] as Array<Record<string, unknown>>;
    if (Array.isArray(agents)) {
      return agents.map((a) => ({
        id: getString(a, 'id') || getString(a, 'agent_id'),
        name: getString(a, 'name'),
        description: getString(a, 'description') || undefined,
        status: getString(a, 'status') || 'unknown',
        metadata: getMap(a, 'metadata'),
        createdAt: parseTime(a['created_at'] || a['createdAt']),
      }));
    }
    return [];
  }

  async spawn(name: string, agentSpec?: Record<string, unknown>): Promise<AgentInfo> {
    const resp = await request<Record<string, unknown>>(
      '/api/v1/agents',
      { method: 'POST', body: JSON.stringify({ name, ...agentSpec }) },
      this.config,
    );
    const data = extractData(resp);
    return {
      id: getString(data, 'agent_id') || getString(data, 'id'),
      name,
      status: 'running',
      metadata: getMap(data, 'metadata'),
      createdAt: new Date().toISOString(),
    };
  }

  async terminate(agentId: string): Promise<void> {
    validateRequiredString(agentId, 'AgentID');
    await request(`/api/v1/agents/${agentId}`, { method: 'DELETE' }, this.config);
  }

  async invoke(agentId: string, input: string): Promise<string> {
    validateRequiredString(agentId, 'AgentID');
    const resp = await request<Record<string, unknown>>(
      `/api/v1/agents/${agentId}/invoke`,
      { method: 'POST', body: JSON.stringify({ input }) },
      this.config,
    );
    const data = extractData(resp);
    return getString(data, 'output');
  }

  async get(agentId: string): Promise<AgentInfo> {
    validateRequiredString(agentId, 'AgentID');
    const resp = await request<Record<string, unknown>>(
      `/api/v1/agents/${agentId}`,
      { method: 'GET' },
      this.config,
    );
    const data = extractData(resp);
    return {
      id: getString(data, 'id') || getString(data, 'agent_id'),
      name: getString(data, 'name'),
      description: getString(data, 'description') || undefined,
      status: getString(data, 'status') || 'unknown',
      metadata: getMap(data, 'metadata'),
      createdAt: parseTime(data['created_at'] || data['createdAt']),
    };
  }
}

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

  async health(): Promise<HealthStatus> {
    try {
      const resp = await request<Record<string, unknown>>(
        '/health',
        { method: 'GET' },
        this.config,
      );
      return {
        status: getString(resp, 'status') || 'unknown',
        version: getString(resp, 'version') || '',
        uptime: getInt64(resp, 'uptime'),
        checks: getMap(resp, 'checks'),
        timestamp: parseTime(resp['timestamp']),
      };
    } catch {
      return {
        status: 'unreachable',
        version: '',
        uptime: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async metrics(): Promise<Metrics> {
    try {
      const resp = await request<Record<string, unknown>>(
        '/metrics',
        { method: 'GET' },
        this.config,
      );
      const data = extractData(resp);
      return {
        tasksTotal: getInt64(data, 'tasks_total') || getInt64(data, 'tasksTotal') || 0,
        tasksCompleted: getInt64(data, 'tasks_completed') || getInt64(data, 'tasksCompleted') || 0,
        tasksFailed: getInt64(data, 'tasks_failed') || getInt64(data, 'tasksFailed') || 0,
        memoriesTotal: getInt64(data, 'memories_total') || getInt64(data, 'memoriesTotal') || 0,
        sessionsActive: getInt64(data, 'sessions_active') || getInt64(data, 'sessionsActive') || 0,
        skillsLoaded: getInt64(data, 'skills_loaded') || getInt64(data, 'skillsLoaded') || 0,
        cpuUsage: getInt64(data, 'cpu_usage') || getInt64(data, 'cpuUsage') || 0,
        memoryUsage: getInt64(data, 'memory_usage') || getInt64(data, 'memoryUsage') || 0,
        requestCount: getInt64(data, 'request_count') || getInt64(data, 'requestCount') || 0,
        averageLatencyMs: getInt64(data, 'average_latency_ms') || getInt64(data, 'averageLatencyMs') || 0,
      };
    } catch {
      return {
        tasksTotal: 0, tasksCompleted: 0, tasksFailed: 0,
        memoriesTotal: 0, sessionsActive: 0, skillsLoaded: 0,
        cpuUsage: 0, memoryUsage: 0, requestCount: 0, averageLatencyMs: 0,
      };
    }
  }

  testConnection(): Promise<HealthStatus> {
    return this.health();
  }
}
