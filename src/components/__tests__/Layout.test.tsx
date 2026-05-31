import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      animate: _animate,
      initial: _initial,
      exit: _exit,
      ...rest
    }: Record<string, unknown>) =>
      React.createElement('div', rest, children),
    nav: ({
      children,
      animate: _animate,
      initial: _initial,
      ...rest
    }: Record<string, unknown>) =>
      React.createElement('nav', rest, children),
    aside: ({
      children,
      animate: _animate,
      initial: _initial,
      transition: _transition,
      ...rest
    }: Record<string, unknown>) =>
      React.createElement('aside', rest, children),
    span: ({
      children,
      ...rest
    }: Record<string, unknown>) =>
      React.createElement('span', rest, children),
    button: ({ children, ...rest }: Record<string, unknown>) =>
      React.createElement('button', rest, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../hooks/useKeyboardShortcuts', () => ({
  useNavigationShortcuts: vi.fn(),
}));

vi.mock('../ErrorBoundary', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../GlobalSearch', () => ({
  default: ({ open, _onClose }: { open: boolean; onClose: () => void }) =>
    open ? React.createElement('div', { 'data-testid': 'global-search' }, 'GlobalSearch') : null,
}));

vi.mock('../ConnectionIndicator', () => ({
  default: () => React.createElement('div', { 'data-testid': 'connection-indicator' }, 'ConnectionIndicator'),
}));

vi.mock('../NotificationCenter', () => ({
  default: () => React.createElement('div', { 'data-testid': 'notification-center' }, 'NotificationCenter'),
}));

vi.mock('lucide-react', () => {
  const createSvg = () => React.createElement('svg');
  return {
    LayoutDashboard: createSvg,
    Server: createSvg,
    Bot: createSvg,
    ListTodo: createSvg,
    Settings: createSvg,
    Terminal: createSvg,
    Brain: createSvg,
    Wrench: createSvg,
    MessageSquare: createSvg,
    Menu: createSvg,
    X: createSvg,
    ChevronLeft: createSvg,
    ChevronRight: createSvg,
    Sun: createSvg,
    Moon: createSvg,
    Sparkles: createSvg,
    Eye: createSvg,
    BarChart3: createSvg,
    Search: createSvg,
    Minus: createSvg,
    Square: createSvg,
    Maximize2: createSvg,
    Shield: createSvg,
    Database: createSvg,
    Grid: createSvg,
    Activity: createSvg,
    Layers: createSvg,
  };
});

import Layout from '../Layout';

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderLayout = (route = '/') =>
    render(
      <MemoryRouter initialEntries={[route]}>
        <Layout>
          <div data-testid="page-content">Page Content</div>
        </Layout>
      </MemoryRouter>,
    );

  it('renders children content', () => {
    renderLayout();
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
  });

  it('renders navigation items', () => {
    renderLayout();
    expect(screen.getByTitle('仪表盘')).toBeInTheDocument();
    expect(screen.getByTitle('智能体')).toBeInTheDocument();
    expect(screen.getByTitle('任务')).toBeInTheDocument();
    expect(screen.getByTitle('系统设置')).toBeInTheDocument();
  });

  it('renders sidebar category headers', () => {
    renderLayout();
    expect(screen.getByText('核心功能')).toBeInTheDocument();
    expect(screen.getByText('AI 能力')).toBeInTheDocument();
    expect(screen.getByText('系统工具')).toBeInTheDocument();
  });

  it('highlights the active navigation item based on route', () => {
    renderLayout('/agents');
    const agentsLink = screen.getByTitle('智能体');
    expect(agentsLink.style.color).toBe('var(--primary-color)');
  });

  it('does not highlight inactive navigation items', () => {
    renderLayout('/agents');
    const dashboardLink = screen.getByTitle('仪表盘');
    expect(dashboardLink.style.color).toBe('var(--text-secondary)');
  });

  it('shows dark mode toggle button', () => {
    renderLayout();
    expect(screen.getByText('浅色模式')).toBeInTheDocument();
  });

  it('toggles dark mode on button click', () => {
    renderLayout();
    const toggleBtn = screen.getByText('浅色模式');
    fireEvent.click(toggleBtn);
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('toggles back to dark mode on second click', () => {
    renderLayout();
    const toggleBtn = screen.getByText('浅色模式');
    fireEvent.click(toggleBtn);
    fireEvent.click(screen.getByText('深色模式'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('renders connection indicator', () => {
    renderLayout();
    expect(screen.getByTestId('connection-indicator')).toBeInTheDocument();
  });

  it('renders notification center', () => {
    renderLayout();
    expect(screen.getByTestId('notification-center')).toBeInTheDocument();
  });

  it('renders sidebar collapse toggle button', () => {
    renderLayout();
    const aside = screen.getByRole('complementary');
    const buttons = aside.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('collapses and expands sidebar when toggle is clicked', () => {
    renderLayout();
    expect(screen.getByText('核心功能')).toBeInTheDocument();
    const aside = screen.getByRole('complementary');
    const collapseBtn = aside.querySelector('button') as HTMLButtonElement;
    fireEvent.click(collapseBtn);
    expect(screen.queryByText('核心功能')).not.toBeInTheDocument();
    fireEvent.click(collapseBtn);
    expect(screen.getByText('核心功能')).toBeInTheDocument();
  });

  it('opens global search on Ctrl+K', () => {
    renderLayout();
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.getByTestId('global-search')).toBeInTheDocument();
  });

  it('closes global search on second Ctrl+K', () => {
    renderLayout();
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.getByTestId('global-search')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.queryByTestId('global-search')).not.toBeInTheDocument();
  });

  it('renders content area', () => {
    renderLayout();
    const contentArea = screen.getByTestId('page-content');
    expect(contentArea).toBeInTheDocument();
    expect(contentArea.textContent).toBe('Page Content');
  });

  it('renders the navigation and header', () => {
    renderLayout();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('renders the search trigger button', () => {
    renderLayout();
    expect(screen.getByTitle('全局搜索 (Ctrl+K)')).toBeInTheDocument();
  });

  it('shows current page title in header', () => {
    renderLayout('/agents');
    expect(screen.getByRole('heading', { name: '智能体' })).toBeInTheDocument();
  });
});