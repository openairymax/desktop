import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      animate: _animate,
      initial: _initial,
      exit: _exit,
      transition: _transition,
      ...rest
    }: Record<string, unknown>) =>
      React.createElement('div', rest, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('lucide-react', () => ({
  Send: () => React.createElement('svg'),
  Bot: () => React.createElement('svg'),
  User: () => React.createElement('svg'),
  Copy: () => React.createElement('svg'),
  Check: () => React.createElement('svg'),
  Sparkles: () => React.createElement('svg'),
  Trash2: () => React.createElement('svg'),
  Zap: () => React.createElement('svg'),
  Brain: () => React.createElement('svg'),
  Database: () => React.createElement('svg'),
  Clock: () => React.createElement('svg'),
  Loader2: () => React.createElement('svg'),
  MessageSquare: () => React.createElement('svg'),
  Activity: () => React.createElement('svg'),
  Gauge: () => React.createElement('svg'),
  FileText: () => React.createElement('svg'),
  CheckCircle: () => React.createElement('svg'),
}));

const mockInvokeAgent = vi.fn().mockResolvedValue(undefined);
const mockSubmitTask = vi.fn().mockResolvedValue({ id: 'task-12345678' });

vi.mock('../../hooks/useAgentOS', () => ({
  useAgents: () => ({
    agents: [],
    invokeAgent: mockInvokeAgent,
  }),
  useTasks: () => ({
    submitTask: mockSubmitTask,
  }),
}));

import AIChat from '../AIChat';

describe('AIChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /** BAN-133: 编码契约验证 - 复杂度评估 SIMPLE */
  it('shows SIMPLE complexity for short input', () => {
    render(<AIChat />);
    const input = screen.getByPlaceholderText('输入消息，按 Enter 发送...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    expect(screen.getByText('简单')).toBeInTheDocument();
    expect(screen.getByText('gpt-4o-mini')).toBeInTheDocument();
  });

  /** BAN-133: 编码契约验证 - 复杂度评估 MODERATE */
  it('shows MODERATE complexity for medium input with code and multi-step keywords', () => {
    render(<AIChat />);
    const input = screen.getByPlaceholderText('输入消息，按 Enter 发送...');
    const mediumInput = 'First, write a function to implement the quicksort algorithm. '
      + 'Then, test it with various inputs. Finally, measure the performance.';
    fireEvent.change(input, { target: { value: mediumInput } });
    expect(screen.getByText('中等')).toBeInTheDocument();
    expect(screen.getByText('gpt-4o')).toBeInTheDocument();
  });

  /** BAN-133: 编码契约验证 - 复杂度评估 COMPLEX */
  it('shows COMPLEX complexity for long input with architecture keywords', () => {
    render(<AIChat />);
    const input = screen.getByPlaceholderText('输入消息，按 Enter 发送...');
    const longInput = 'Design a distributed system architecture for handling millions of concurrent users. '
      + 'First, we need to consider the load balancer configuration. '
      + 'Then, implement the database sharding strategy. '
      + 'Finally, set up the monitoring and alerting infrastructure. '
      + 'The architecture must support horizontal scaling and fault tolerance. '
      + 'Additional considerations include cache invalidation strategies and message queue patterns.';
    fireEvent.change(input, { target: { value: longInput } });
    expect(screen.getByText('复杂')).toBeInTheDocument();
    expect(screen.getByText('claude-sonnet')).toBeInTheDocument();
  });

  /** BAN-133: 编码契约验证 - 中文输入复杂度评估 */
  it('correctly assesses Chinese input complexity', () => {
    render(<AIChat />);
    const input = screen.getByPlaceholderText('输入消息，按 Enter 发送...');
    // 架构(+1), 首先(+2), 实现(+1), len>100(+1) = 5 → COMPLEX
    // 需要输入超过100个字符以触发 len>100 加分
    const longInput = '首先分析系统架构设计，然后实现分布式缓存方案，最后编写完整的单元测试代码。'
      + '这是一个复杂的系统设计任务，需要充分考虑高可用性和微服务架构的各个方面。'
      + '重构现有代码库以支持分布式部署策略，同时考虑性能优化和安全性。';
    fireEvent.change(input, { target: { value: longInput } });
    expect(screen.getByText('复杂')).toBeInTheDocument();
  });

  /** BAN-133: 编码契约验证 - 复杂度指示器 aria-label */
  it('has correct aria-label on complexity indicator', () => {
    render(<AIChat />);
    const input = screen.getByPlaceholderText('输入消息，按 Enter 发送...');
    fireEvent.change(input, { target: { value: 'Hello world' } });
    const indicators = screen.getAllByRole('status');
    const complexityIndicator = indicators.find(el => el.getAttribute('aria-label')?.includes('模型路由复杂度'));
    expect(complexityIndicator).toBeDefined();
    expect(complexityIndicator).toHaveAttribute('aria-label', expect.stringContaining('模型路由复杂度'));
  });

  /** BAN-133: 编码契约验证 - 评分显示 */
  it('shows complexity score in the indicator', () => {
    render(<AIChat />);
    const input = screen.getByPlaceholderText('输入消息，按 Enter 发送...');
    fireEvent.change(input, { target: { value: 'Write a function' } });
    expect(screen.getByText(/分/)).toBeInTheDocument();
  });

  it('renders chat input and send button', () => {
    render(<AIChat />);
    expect(screen.getByPlaceholderText('输入消息，按 Enter 发送...')).toBeInTheDocument();
    expect(screen.getByText('AI 助手 — 连接 AgentRT')).toBeInTheDocument();
  });

  it('shows suggestions when no messages', () => {
    render(<AIChat />);
    expect(screen.getByText('启动所有服务')).toBeInTheDocument();
    expect(screen.getByText('查看智能体列表')).toBeInTheDocument();
    expect(screen.getByText('查看记忆系统状态')).toBeInTheDocument();
    expect(screen.getByText('获取系统信息')).toBeInTheDocument();
  });

  it('clicking suggestion fills input', () => {
    render(<AIChat />);
    fireEvent.click(screen.getByText('启动所有服务'));
    const input = screen.getByPlaceholderText('输入消息，按 Enter 发送...') as HTMLTextAreaElement;
    expect(input.value).toBe('列出当前运行中的智能体并检查状态');
  });

  it('sends message and shows response', async () => {
    render(<AIChat />);
    const input = screen.getByPlaceholderText('输入消息，按 Enter 发送...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    await waitFor(() => {
      expect(screen.getByLabelText('发送消息')).not.toBeDisabled();
    });
    fireEvent.click(screen.getByLabelText('发送消息'));

    await waitFor(() => {
      expect(screen.getByText(/任务已提交/)).toBeInTheDocument();
    });
  });

  it('sends message on Enter key', async () => {
    render(<AIChat />);
    const input = screen.getByPlaceholderText('输入消息，按 Enter 发送...');
    fireEvent.change(input, { target: { value: 'Test message' } });
    await waitFor(() => {
      expect(screen.getByLabelText('发送消息')).not.toBeDisabled();
    });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

    await waitFor(() => {
      expect(screen.getByText(/任务已提交/)).toBeInTheDocument();
    });
  });

  it('clears messages on clear button click', async () => {
    render(<AIChat />);
    const input = screen.getByPlaceholderText('输入消息，按 Enter 发送...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    await waitFor(() => {
      expect(screen.getByLabelText('发送消息')).not.toBeDisabled();
    });
    fireEvent.click(screen.getByLabelText('发送消息'));

    await waitFor(() => {
      expect(screen.getByText(/任务已提交/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('清空对话'));
    expect(screen.queryByText(/任务已提交/)).not.toBeInTheDocument();
  });

  it('handles error state', async () => {
    mockSubmitTask.mockRejectedValueOnce(new Error('Network error'));
    render(<AIChat />);
    const input = screen.getByPlaceholderText('输入消息，按 Enter 发送...');
    fireEvent.change(input, { target: { value: 'Error test' } });
    await waitFor(() => {
      expect(screen.getByLabelText('发送消息')).not.toBeDisabled();
    });
    fireEvent.click(screen.getByLabelText('发送消息'));

    await waitFor(() => {
      expect(screen.getByText(/错误: Network error/)).toBeInTheDocument();
    });
  });

  it('hides complexity indicator when input is empty', () => {
    render(<AIChat />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows complexity indicator when input has text', () => {
    render(<AIChat />);
    const input = screen.getByPlaceholderText('输入消息，按 Enter 发送...');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(screen.getAllByRole('status').length).toBeGreaterThanOrEqual(1);
  });

  /** BAN-133: 编码契约验证 - 推荐模型显示 */
  it('shows recommended model in complexity indicator', () => {
    render(<AIChat />);
    const input = screen.getByPlaceholderText('输入消息，按 Enter 发送...');
    fireEvent.change(input, { target: { value: '简单问候' } });
    expect(screen.getByText('推荐模型:')).toBeInTheDocument();
  });
});