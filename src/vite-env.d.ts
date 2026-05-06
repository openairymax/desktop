/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_TAURI_ENABLED: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_ENABLE_ANALYTICS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const AGENTOS_GATEWAY_URL: string;
declare const AGENTOS_OLLAMA_URL: string;
declare const __APP_VERSION__: string;
