import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
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

// OpenLab 数据来自 AgentRT Gateway 市场（market.search_agents / market.search_skills），
// 测试中 mock tauriCompat 的 invoke 返回真实市场数据结构。
// 注意：测试文件位于 src/pages/__tests__/，到 src/utils/ 需上溯两级。
vi.mock('../../utils/tauriCompat', () => ({
  invoke: vi.fn(async (cmd: string) => {
    if (cmd === 'market.search_agents') {
      return {
        agents: [
          {
            id: 'doc-gen',
            name: '文档生成器',
            category: '生产力',
            description: '自动生成 Markdown 文档',
            version: '2.1.0',
            rating: 4.8,
            downloads: 12540,
            author: 'AgentRT Team',
            tags: ['文档', '自动化'],
            last_updated: '2026-01-01',
          },
          {
            id: 'ecommerce',
            name: '电商助手',
            category: '商业',
            description: '电商运营自动化',
            version: '1.3.0',
            rating: 4.5,
            downloads: 8200,
            author: 'AgentRT Team',
            tags: ['电商'],
            last_updated: '2026-01-01',
          },
          {
            id: 'code-review',
            name: '代码审查',
            category: '开发',
            description: 'AI 代码审查',
            version: '2.0.0',
            rating: 4.9,
            downloads: 15600,
            author: 'AgentRT Team',
            tags: ['代码'],
            last_updated: '2026-01-01',
          },
        ],
      };
    }
    if (cmd === 'market.search_skills') {
      return { skills: [] };
    }
    if (cmd === 'call_tool') {
      return undefined;
    }
    return undefined;
  }),
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

  // 市场数据为异步加载（market.search_agents / market.search_skills），依赖数据的测试需等待
  it('renders default app cards', async () => {
    render(<OpenLab />);
    await waitFor(() => expect(screen.getByText('文档生成器')).toBeInTheDocument());
    expect(screen.getByText('电商助手')).toBeInTheDocument();
    expect(screen.getByText('代码审查')).toBeInTheDocument();
  });

  it('renders install button', async () => {
    render(<OpenLab />);
    const installButtons = await screen.findAllByText('安装');
    expect(installButtons.length).toBeGreaterThan(0);
  });

  it('renders rating for apps', async () => {
    render(<OpenLab />);
    await screen.findByText('文档生成器');
    expect(screen.getByText('4.8')).toBeInTheDocument();
  });

  it('renders download count', async () => {
    render(<OpenLab />);
    await screen.findByText('文档生成器');
    expect(screen.getByText('12,540')).toBeInTheDocument();
  });

  it('filters apps by search text', async () => {
    render(<OpenLab />);
    await screen.findByText('文档生成器');
    const input = screen.getByPlaceholderText('搜索应用...');
    fireEvent.change(input, { target: { value: '文档' } });
    expect(screen.getByText('文档生成器')).toBeInTheDocument();
    expect(screen.queryByText('电商助手')).not.toBeInTheDocument();
  });

  it('shows no results when search matches nothing', async () => {
    render(<OpenLab />);
    await screen.findByText('文档生成器');
    const input = screen.getByPlaceholderText('搜索应用...');
    fireEvent.change(input, { target: { value: 'zzzznomatch9999' } });
    expect(screen.getByText('未找到匹配的应用')).toBeInTheDocument();
  });

  it('opens detail dialog when app card is clicked', async () => {
    render(<OpenLab />);
    await waitFor(() => expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0));
    const appCards = screen.getAllByRole('listitem');
    fireEvent.click(appCards[0]);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/v2\.1\.0/)).toBeInTheDocument();
    expect(within(dialog).getByText(/AgentRT Team/)).toBeInTheDocument();
  });

  it('shows tag chips in detail dialog', async () => {
    render(<OpenLab />);
    await waitFor(() => expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0));
    const appCards = screen.getAllByRole('listitem');
    fireEvent.click(appCards[0]);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('文档')).toBeInTheDocument();
    expect(within(dialog).getByText('自动化')).toBeInTheDocument();
  });

  it('closes detail dialog when clicking backdrop', async () => {
    render(<OpenLab />);
    await waitFor(() => expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0));
    const appCards = screen.getAllByRole('listitem');
    fireEvent.click(appCards[0]);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    fireEvent.click(dialog);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders install buttons for market apps', async () => {
    render(<OpenLab />);
    const installButtons = await screen.findAllByText('安装');
    expect(installButtons.length).toBeGreaterThan(0);
  });

  it('filters by category', async () => {
    render(<OpenLab />);
    await screen.findByText('文档生成器');
    const devButton = screen.getByRole('button', { name: '筛选分类: 开发' });
    fireEvent.click(devButton);
    expect(screen.getByText('代码审查')).toBeInTheDocument();
    expect(screen.queryByText('文档生成器')).not.toBeInTheDocument();
  });

  it('renders version info in detail dialog', async () => {
    render(<OpenLab />);
    await waitFor(() => expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0));
    const appCards = screen.getAllByRole('listitem');
    fireEvent.click(appCards[0]);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('settings.version')).toBeInTheDocument();
  });
});