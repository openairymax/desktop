import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, _params?: Record<string, string>) =>
      _params?.defaultValue || key,
    i18n: { language: 'zh' },
  }),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../constants/endpoints', () => ({
  AGENTOS_GATEWAY_URL: 'http://localhost:18789',
}));

vi.mock('lucide-react', () => ({
  Settings: () => React.createElement('svg'),
  Globe: () => React.createElement('svg'),
  Palette: () => React.createElement('svg'),
  Database: () => React.createElement('svg'),
  Shield: () => React.createElement('svg'),
  Save: () => React.createElement('svg'),
  Loader2: () => React.createElement('svg'),
  Trash2: () => React.createElement('svg'),
  Download: () => React.createElement('svg'),
  CheckCircle2: () => React.createElement('svg'),
}));

declare let __APP_VERSION__: string;
(globalThis as Record<string, unknown>).__APP_VERSION__ = '0.1.0';

import Settings from '../Settings';

describe('Settings', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the settings page title', () => {
    render(<Settings />);
    expect(screen.getByText('settingsExtended.title')).toBeInTheDocument();
  });

  it('renders the settings page subtitle', () => {
    render(<Settings />);
    expect(screen.getByText('settingsExtended.subtitle')).toBeInTheDocument();
  });

  it('renders tab navigation: appearance, gateway, data, about', () => {
    render(<Settings />);
    expect(screen.getByText('settingsExtended.appearanceTab')).toBeInTheDocument();
    expect(screen.getByText('settingsExtended.gatewayTab')).toBeInTheDocument();
    expect(screen.getByText('settingsExtended.dataTab')).toBeInTheDocument();
    expect(screen.getByText('settingsExtended.aboutTab')).toBeInTheDocument();
  });

  it('defaults to appearance tab with theme settings', () => {
    render(<Settings />);
    expect(screen.getByText('settingsExtended.appearanceTitle')).toBeInTheDocument();
    expect(screen.getByText('settingsExtended.themeMode')).toBeInTheDocument();
  });

  it('shows gateway tab when clicked', () => {
    render(<Settings />);
    fireEvent.click(screen.getByText('settingsExtended.gatewayTab'));
    expect(screen.getByText('settingsExtended.gatewayTitle')).toBeInTheDocument();
  });

  it('shows data tab when clicked', () => {
    render(<Settings />);
    fireEvent.click(screen.getByText('settingsExtended.dataTab'));
    expect(screen.getByText('settingsExtended.dataManagementTitle')).toBeInTheDocument();
  });

  it('shows about tab when clicked', () => {
    render(<Settings />);
    fireEvent.click(screen.getByText('settingsExtended.aboutTab'));
    expect(screen.getByText('settingsExtended.versionInfo')).toBeInTheDocument();
  });

  it('renders save button', () => {
    render(<Settings />);
    expect(screen.getByText('settingsExtended.saveSettings')).toBeInTheDocument();
  });

  it('shows export button on data tab', () => {
    render(<Settings />);
    fireEvent.click(screen.getByText('settingsExtended.dataTab'));
    expect(screen.getByText('settingsExtended.exportAllData')).toBeInTheDocument();
  });

  it('shows clear button on data tab', () => {
    render(<Settings />);
    fireEvent.click(screen.getByText('settingsExtended.dataTab'));
    expect(screen.getByText('settingsExtended.clearAllData')).toBeInTheDocument();
  });

  it('shows version on about tab', () => {
    render(<Settings />);
    fireEvent.click(screen.getByText('settingsExtended.aboutTab'));
    expect(screen.getByText('settingsExtended.versionInfo')).toBeInTheDocument();
  });
});