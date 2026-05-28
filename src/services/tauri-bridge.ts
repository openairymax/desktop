// ============================================================
// Tauri Compatibility Layer
// ============================================================
// Provides a unified interface that works in both Tauri and
// browser environments. Automatically initializes the AgentOS SDK.
// ============================================================

import { initSdk, isTauri } from './agentos-sdk';
import { AGENTOS_GATEWAY_URL } from '../constants/endpoints';

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
    } catch (e) {
      setupGatewayInvoke();
    }
  } else {
    void '[Browser] Running in browser mode with gateway invoke';
    setupGatewayInvoke();
  }

  initialized = true;
}

/**
 * Set up HTTP-based invoke function for browser development.
 * Attempts to connect to real AgentOS Gateway via HTTP, with fallback to simulated data.
 */
function setupGatewayInvoke(): void {
  const GATEWAY_URL = localStorage.getItem('agentos-endpoint') || AGENTOS_GATEWAY_URL;

  initSdk(async <T>(cmd: string, args?: Record<string, unknown>): Promise<T> => {
    const response = await fetch(`${GATEWAY_URL}/jsonrpc`, {
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
      throw new Error(`Gateway call '${cmd}' returned HTTP ${response.status}`);
    }

    const json = await response.json();
    if (json.error) {
      throw new Error(`Gateway call '${cmd}' error: ${json.error.message || JSON.stringify(json.error)}`);
    }
    return (json.result || json.data) as T;
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
