import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      animate: _animate,
      initial: _initial,
      exit: _exit,
      whileHover: _whileHover,
      whileTap: _whileTap,
      variants: _variants,
      transition: _transition,
      layout: _layout,
      layoutId: _layoutId,
      ...rest
    }: Record<string, unknown>) =>
      React.createElement('div', rest, children),
    button: ({
      children,
      animate: _animate,
      initial: _initial,
      exit: _exit,
      whileHover: _whileHover,
      whileTap: _whileTap,
      variants: _variants,
      transition: _transition,
      layout: _layout,
      layoutId: _layoutId,
      ...rest
    }: Record<string, unknown>) =>
      React.createElement('button', rest, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('lucide-react', () => ({
  Sparkles: () => React.createElement('svg'),
  Download: () => React.createElement('svg'),
  Star: () => React.createElement('svg'),
  Search: () => React.createElement('svg'),
  CheckCircle: () => React.createElement('svg'),
  RefreshCw: () => React.createElement('svg'),
  Package: () => React.createElement('svg'),
  Tag: () => React.createElement('svg'),
}));

import OpenLab from '../OpenLab';

describe('OpenLab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the OpenLab page', () => {
    render(<OpenLab />);
    expect(screen.getByText('应用市场')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<OpenLab />);
    const input = screen.getByPlaceholderText('搜索应用...');
    expect(input).toBeInTheDocument();
  });

  it('renders category filter buttons', () => {
    render(<OpenLab />);
    const filterBar = screen.getByRole('searchbox').parentElement!.nextElementSibling!;
    expect(within(filterBar).getByText('全部')).toBeInTheDocument();
    expect(within(filterBar).getByText('生产力')).toBeInTheDocument();
    expect(within(filterBar).getByText('商业')).toBeInTheDocument();
    expect(within(filterBar).getByText('开发')).toBeInTheDocument();
  });

  it('renders default app cards', () => {
    render(<OpenLab />);
    expect(screen.getByText('文档生成器')).toBeInTheDocument();
    expect(screen.getByText('电商助手')).toBeInTheDocument();
    expect(screen.getByText('代码审查')).toBeInTheDocument();
  });

  it('renders install button', () => {
    render(<OpenLab />);
    const installButtons = screen.getAllByText('安装');
    expect(installButtons.length).toBeGreaterThan(0);
  });

  it('renders rating for apps', () => {
    render(<OpenLab />);
    expect(screen.getByText('4.8')).toBeInTheDocument();
  });

  it('renders download count', () => {
    render(<OpenLab />);
    expect(screen.getByText('12,540')).toBeInTheDocument();
  });

  it('filters apps by search text', () => {
    render(<OpenLab />);
    const input = screen.getByPlaceholderText('搜索应用...');
    fireEvent.change(input, { target: { value: '文档' } });
    expect(screen.getByText('文档生成器')).toBeInTheDocument();
    expect(screen.queryByText('电商助手')).not.toBeInTheDocument();
  });

  it('shows no results when search matches nothing', () => {
    render(<OpenLab />);
    const input = screen.getByPlaceholderText('搜索应用...');
    fireEvent.change(input, { target: { value: 'zzzznomatch9999' } });
    expect(screen.getByText('未找到匹配的应用')).toBeInTheDocument();
  });

  it('opens detail dialog when app card is clicked', () => {
    render(<OpenLab />);
    const appCards = screen.getAllByRole('listitem');
    fireEvent.click(appCards[0]);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/v2\.1\.0/)).toBeInTheDocument();
    expect(within(dialog).getByText(/AgentRT Team/)).toBeInTheDocument();
  });

  it('shows tag chips in detail dialog', () => {
    render(<OpenLab />);
    const appCards = screen.getAllByRole('listitem');
    fireEvent.click(appCards[0]);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('文档')).toBeInTheDocument();
    expect(within(dialog).getByText('自动化')).toBeInTheDocument();
  });

  it('closes detail dialog when clicking backdrop', () => {
    render(<OpenLab />);
    const appCards = screen.getAllByRole('listitem');
    fireEvent.click(appCards[0]);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    fireEvent.click(dialog);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders installed state correctly', () => {
    render(<OpenLab />);
    const installedButtons = screen.getAllByText('已安装');
    expect(installedButtons.length).toBeGreaterThan(0);
  });

  it('filters by category', () => {
    render(<OpenLab />);
    const devButton = screen.getByRole('button', { name: '筛选分类: 开发' });
    fireEvent.click(devButton);
    expect(screen.getByText('代码审查')).toBeInTheDocument();
    expect(screen.queryByText('文档生成器')).not.toBeInTheDocument();
  });

  it('renders version info in detail dialog', () => {
    render(<OpenLab />);
    const appCards = screen.getAllByRole('listitem');
    fireEvent.click(appCards[0]);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('settings.version')).toBeInTheDocument();
  });
});