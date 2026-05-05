import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
  plugins: [react()],

  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:18789',
        changeOrigin: true,
      },
      '/health': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:18789',
        changeOrigin: true,
        rewrite: (path) => '/api/v1/health',
      },
      '/metrics': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:18789',
        changeOrigin: true,
        rewrite: (path) => '/api/v1/metrics',
      },
      '/ws': {
        target: process.env.VITE_WS_URL || 'ws://localhost:18789',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.0.5'),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'i18n': ['i18next', 'react-i18next'],
          'ui-vendor': ['lucide-react', 'framer-motion'],
        },
      },
    },
  },
}));
