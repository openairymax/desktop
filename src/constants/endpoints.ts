// AgentRT Gateway 统一契约（唯一权威，不得偏离）：
// - 基础端点：http://localhost:8080
// - JSON-RPC 端点：POST {base}/api/，Content-Type: application/json
// - 请求：{"jsonrpc":"2.0","id":<number>,"method":"<ns>.<method>","params":{...}}
// - 响应：{"jsonrpc":"2.0","result":...,"id":<number>}
// - 无任何 REST 资源路径（无 /api/v1/tasks、/health、/metrics、/api/v1/config）
export const AGENTOS_GATEWAY_HOST = import.meta.env.VITE_AGENTOS_GATEWAY_HOST || 'localhost';
export const AGENTOS_GATEWAY_PORT = Number(import.meta.env.VITE_AGENTOS_GATEWAY_PORT) || 8080;
export const AGENTOS_GATEWAY_URL = `http://${AGENTOS_GATEWAY_HOST}:${AGENTOS_GATEWAY_PORT}`;
export const AGENTOS_WS_URL = `ws://${AGENTOS_GATEWAY_HOST}:${AGENTOS_GATEWAY_PORT}`;