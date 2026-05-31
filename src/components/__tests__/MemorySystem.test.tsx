import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

const mockMemoryList = vi.fn();
const mockMemorySearch = vi.fn();
const mockMemoryDelete = vi.fn();
const mockMemoryClear = vi.fn();
const mockGetContextWindowStats = vi.fn();

vi.mock('../../services/agentos-sdk', () => ({
  default: {
    memoryList: () => mockMemoryList(),
    memorySearch: (q: string, limit: number) => mockMemorySearch(q, limit),
    memoryDelete: (id: string) => mockMemoryDelete(id),
    memoryClear: (type?: string) => mockMemoryClear(type),
    getContextWindowStats: () => mockGetContextWindowStats(),
  },
}));

vi.mock('lucide-react', () => {
  const createSvg = () => React.createElement('svg');
  return {
    Database: createSvg,
    Brain: createSvg,
    Clock: createSvg,
    Layers: createSvg,
    Search: createSvg,
    Trash2: createSvg,
    Zap: createSvg,
    FileText: createSvg,
    MessageSquare: createSvg,
    Cpu: createSvg,
    Shield: createSvg,
    ChevronRight: createSvg,
    TrendingUp: createSvg,
    Hash: createSvg,
    Eye: createSvg,
    RefreshCw: createSvg,
  };
});

import MemorySystem from '../MemorySystem';

const mockMemories = [
  { id: '1', type: 'conversation', content: '用户询问了天气', tokens: 120, timestamp: Date.now() },
  { id: '2', type: 'fact', content: '用户住在北京', tokens: 45, timestamp: Date.now() - 1000 },
  { id: '3', type: 'skill', content: '用户擅长Python编程', tokens: 80, timestamp: Date.now() - 2000 },
  { id: '4', type: 'error', content: '上一次文件读取失败', tokens: 60, timestamp: Date.now() - 3000 },
];

const mockContextStats = {
  totalTokens: 4500,
  maxTokens: 128000,
  usedPercent: 3.5,
  breakdown: { system: 1200, history: 2500, tools: 500, output: 300 },
};

describe('MemorySystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMemoryList.mockResolvedValue(mockMemories);
    mockGetContextWindowStats.mockResolvedValue(mockContextStats);
    mockMemorySearch.mockResolvedValue([mockMemories[0]]);
    mockMemoryDelete.mockResolvedValue(undefined);
    mockMemoryClear.mockResolvedValue(undefined);
  });

  it('shows loading state initially', () => {
    render(<MemorySystem />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('正在加载记忆系统...')).toBeInTheDocument();
  });

  it('renders header after loading', async () => {
    render(<MemorySystem />);
    await waitFor(() => {
      expect(screen.getByText('认知记忆系统')).toBeInTheDocument();
    });
  });

  it('shows connected status when memories exist', async () => {
    render(<MemorySystem />);
    await waitFor(() => {
      expect(screen.getByText('· 已连接后端')).toBeInTheDocument();
    });
  });

  it('renders tab navigation', async () => {
    render(<MemorySystem />);
    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });
    expect(screen.getByRole('tab', { name: '总览' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '记忆条目' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '上下文窗口' })).toBeInTheDocument();
  });

  it('renders TokenRing progress bars', async () => {
    render(<MemorySystem />);
    await waitFor(() => {
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBe(3);
    });
  });

  it('switches to entries tab', async () => {
    render(<MemorySystem />);
    await waitFor(() => {
      expect(screen.getByText('认知记忆系统')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('tab', { name: '记忆条目' }));
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('renders memory type filter dropdown', async () => {
    render(<MemorySystem />);
    await waitFor(() => {
      expect(screen.getByText('认知记忆系统')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('tab', { name: '记忆条目' }));
    expect(screen.getByText('全部类型')).toBeInTheDocument();
    expect(screen.getByText('对话记忆')).toBeInTheDocument();
    expect(screen.getByText('事实记忆')).toBeInTheDocument();
  });

  it('filters memories by type', async () => {
    render(<MemorySystem />);
    await waitFor(() => {
      expect(screen.getByText('认知记忆系统')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('tab', { name: '记忆条目' }));
    fireEvent.click(screen.getByText('对话记忆'));
    await waitFor(() => {
      expect(screen.getByText('用户询问了天气')).toBeInTheDocument();
    });
  });

  it('renders search input in entries tab', async () => {
    render(<MemorySystem />);
    await waitFor(() => {
      expect(screen.getByText('认知记忆系统')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('tab', { name: '记忆条目' }));
    expect(screen.getByPlaceholderText('搜索记忆内容...')).toBeInTheDocument();
  });

  it('renders memory entries in entries tab', async () => {
    render(<MemorySystem />);
    await waitFor(() => {
      expect(screen.getByText('认知记忆系统')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('tab', { name: '记忆条目' }));
    await waitFor(() => {
      expect(screen.getByText('用户询问了天气')).toBeInTheDocument();
    });
  });

  it('switches to context tab', async () => {
    render(<MemorySystem />);
    await waitFor(() => {
      expect(screen.getByText('认知记忆系统')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('tab', { name: '上下文窗口' }));
    expect(screen.getByText('上下文窗口')).toBeInTheDocument();
  });

  it('shows context window stats in context tab', async () => {
    render(<MemorySystem />);
    await waitFor(() => {
      expect(screen.getByText('认知记忆系统')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('tab', { name: '上下文窗口' }));
    expect(screen.getByText('系统提示')).toBeInTheDocument();
    expect(screen.getByText('对话历史')).toBeInTheDocument();
    expect(screen.getByText('工具定义')).toBeInTheDocument();
  });

  it('shows context usage percentage', async () => {
    render(<MemorySystem />);
    await waitFor(() => {
      expect(screen.getByText('认知记忆系统')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('tab', { name: '上下文窗口' }));
    expect(screen.getByText('3.5%')).toBeInTheDocument();
  });
});