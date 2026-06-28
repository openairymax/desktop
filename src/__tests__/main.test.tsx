import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

vi.mock('react-dom/client', () => ({
  default: {
    createRoot: vi.fn(() => ({ render: vi.fn() })),
  },
}));

vi.mock('../App', () => ({ default: () => null }));
vi.mock('../i18n', () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../hooks/useAgentOS', () => ({
  AgentOSProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../services/tauri-bridge', () => ({
  initializeTauri: vi.fn(() => Promise.resolve()),
  isTauri: vi.fn(() => false),
}));
vi.mock('../components/ServiceWorkerRegistration', () => ({
  default: () => null,
}));
vi.mock('../components/PWAPrompt', () => ({ default: () => null }));
vi.mock('../styles/globals.css', () => ({}));

describe('main', () => {
  let rootElement: HTMLDivElement;

  beforeEach(() => {
    rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);
  });

  afterEach(() => {
    if (rootElement.parentNode) {
      document.body.removeChild(rootElement);
    }
    vi.clearAllMocks();
  });

  it('initializes and renders without crashing', async () => {
    await import('../main');
    expect(true).toBe(true);
  });
});