type InvokeFn = {
  <T = unknown>(cmd: string, args?: Record<string, unknown>): Promise<T>;
};

const GATEWAY_URL = () => localStorage.getItem('agentos-endpoint') || 'http://localhost:18789';

async function gatewayInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const url = `${GATEWAY_URL()}/jsonrpc`;
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
    throw new Error(json.error.message || json.error.toString());
  }
  return (json.result ?? json.data) as T;
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
      console.warn(`[Tauri invoke failed for ${cmd}, trying gateway]:`, e);
    }
  }

  try {
    return await gatewayInvoke<T>(cmd, args);
  } catch (e) {
    console.warn(`[Gateway invoke failed for ${cmd}, using fallback]:`, e);
  }

  return fallbackInvoke<T>(cmd, args);
};

export { invoke };
