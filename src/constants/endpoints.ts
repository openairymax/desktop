export const AGENTOS_GATEWAY_HOST = import.meta.env.VITE_AGENTOS_GATEWAY_HOST || 'localhost';
export const AGENTOS_GATEWAY_PORT = Number(import.meta.env.VITE_AGENTOS_GATEWAY_PORT) || 18789;
export const AGENTOS_GATEWAY_URL = `http://${AGENTOS_GATEWAY_HOST}:${AGENTOS_GATEWAY_PORT}`;
export const AGENTOS_WS_URL = `ws://${AGENTOS_GATEWAY_HOST}:${AGENTOS_GATEWAY_PORT}`;
export const AGENTOS_OLLAMA_HOST = import.meta.env.VITE_OLLAMA_HOST || 'localhost';
export const AGENTOS_OLLAMA_PORT = Number(import.meta.env.VITE_OLLAMA_PORT) || 11434;
export const AGENTOS_OLLAMA_URL = `http://${AGENTOS_OLLAMA_HOST}:${AGENTOS_OLLAMA_PORT}/v1`;