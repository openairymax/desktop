// ============================================================
// Tauri 兼容层
// ============================================================
// 提供 Tauri 与浏览器双环境统一的 invoke 接口，并自动初始化 AgentOS SDK。
// ============================================================

import { initSdk, isTauri } from './agentos-sdk';
import { AGENTOS_GATEWAY_URL } from '../constants/endpoints';
import { logger } from '../utils/logger';

let initialized = false;

/**
 * 初始化全部依赖 Tauri 的服务，应用启动时调用一次。
 * Tauri 环境走原生 invoke；浏览器环境走 HTTP JSON-RPC（真实 Gateway）。
 */
export async function initializeTauri(): Promise<void> {
  if (initialized) return;

  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      initSdk(invoke);
    } catch (e) {
      logger.warn('Tauri invoke 初始化失败，改用 Gateway invoke', e);
      setupGatewayInvoke();
    }
  } else {
    // 浏览器模式：走 HTTP Gateway invoke（JSON-RPC 2.0）
    setupGatewayInvoke();
  }

  initialized = true;
}

/**
 * 建立基于 HTTP 的 Gateway invoke（浏览器开发环境）。
 * 通过 HTTP 连接真实 AgentRT Gateway（JSON-RPC 2.0），Gateway 不可达时抛错。
 */
function setupGatewayInvoke(): void {
  const GATEWAY_URL = localStorage.getItem('agentos-endpoint') || AGENTOS_GATEWAY_URL;

  initSdk(async <T>(cmd: string, args?: Record<string, unknown>): Promise<T> => {
    const response = await fetch(`${GATEWAY_URL}/api/`, {
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
      throw new Error(
        `Gateway call '${cmd}' error: ${
          typeof json.error === 'object'
            ? json.error.message || JSON.stringify(json.error)
            : String(json.error)
        }`,
      );
    }
    // JSON-RPC 2.0：统一取 result 字段，不做多层猜测解析
    return json.result as T;
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
