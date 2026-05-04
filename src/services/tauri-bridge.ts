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
 * Set up HTTP-based invoke function for browser development.
 * Attempts to connect to real AgentOS Gateway via HTTP, with fallback to simulated data.
 */
function setupMockInvoke(): void {
  const GATEWAY_URL = localStorage.getItem('agentos-endpoint') || 'http://localhost:18789';

  initSdk(async <T>(cmd: string, args?: Record<string, unknown>): Promise<T> => {
    try {
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

      if (response.ok) {
        const json = await response.json();
        return (json.result || json.data) as T;
      }
    } catch (e) {
      console.warn(`[Browser] Gateway call failed for ${cmd}, using fallback:`, e);
    }

    const now = new Date().toISOString();
    const fallbacks: Record<string, unknown> = {
      get_health_status: { healthy: true, version: '0.2.0' },
      get_system_info: { os: 'Linux', cpuCores: 8, totalMemoryGb: 16.0 },
      list_agents: [],
      list_tasks: [],
      memory_list: [],
      list_tools: [],
      runtime_metrics: { cycleCount: 0, memoryEntriesCount: 0 },
    };

    if (fallbacks[cmd]) return fallbacks[cmd] as T;
    if (cmd.includes('list') || cmd.includes('search')) return [] as T;
    if (cmd.includes('get') && cmd.includes('status')) return { healthy: false } as T;
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
