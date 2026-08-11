import { logger } from './logger';

type InvokeFn = {
  <T = unknown>(cmd: string, args?: Record<string, unknown>): Promise<T>;
};

const GATEWAY_URL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) return envUrl;
  return localStorage.getItem('agentos-endpoint') || '';
};

async function gatewayInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  // AgentRT Gateway 统一 JSON-RPC 端点：POST {base}/api/
  const url = `${GATEWAY_URL()}/api/`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: cmd,
      params: args || {},
      id: Date.now(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Gateway HTTP ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();
  if (json.error) {
    throw new Error(
      typeof json.error === 'object'
        ? json.error.message || JSON.stringify(json.error)
        : String(json.error),
    );
  }
  // JSON-RPC 2.0：统一取 result 字段，不做多层猜测解析
  return json.result as T;
}

const fallbackInvoke = async <T = unknown>(
  cmd: string,
  _args?: Record<string, unknown>,
): Promise<T> => {
  throw new Error(`Tauri API unavailable: cannot invoke '${cmd}'. Ensure the app is running in Tauri or Gateway is accessible.`);
};

let tauriInvoke: InvokeFn | null = null;

import('@tauri-apps/api/core')
  .then((mod) => {
    tauriInvoke = mod.invoke as InvokeFn;
  })
  .catch(() => {
    tauriInvoke = null;
  });

const invoke: InvokeFn = async <T = unknown>(
  cmd: string,
  args?: Record<string, unknown>,
): Promise<T> => {
  if (tauriInvoke) {
    try {
      return await tauriInvoke<T>(cmd, args);
    } catch (e) {
      logger.warn(`Tauri invoke '${cmd}' 失败，回退到 Gateway`, e);
    }
  }

  try {
    return await gatewayInvoke<T>(cmd, args);
  } catch (e) {
    logger.warn(`Gateway JSON-RPC '${cmd}' 调用失败`, e);
  }

  return fallbackInvoke<T>(cmd, args);
};

export { invoke };
