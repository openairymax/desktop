import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement('div', props, children),
    button: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement('button', props, children),
    span: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement('span', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const { mockInvoke } = vi.hoisted(() => ({
  mockInvoke: vi.fn().mockResolvedValue([
    { phase: 'perception', thought: '感知输入分析完成', timestamp: '2026-04-26T10:00:00Z' },
    { phase: 'reasoning', thought: '推理链构建完成', timestamp: '2026-04-26T10:00:01Z' },
    { phase: 'action', thought: '执行操作完成', timestamp: '2026-04-26T10:00:02Z' },
    { phase: 'reflection', thought: '反思评估完成', timestamp: '2026-04-26T10:00:03Z' },
  ]),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

vi.mock('lucide-react', () => ({
  Brain: () => React.createElement('svg'),
  Play: () => React.createElement('svg'),
  Eye: () => React.createElement('svg'),
  Zap: () => React.createElement('svg'),
  CheckCircle: () => React.createElement('svg'),
  Loader2: () => React.createElement('svg'),
  ChevronRight: () => React.createElement('svg'),
  Settings2: () => React.createElement('svg'),
  Sparkles: () => React.createElement('svg'),
  Target: () => React.createElement('svg'),
  Layers: () => React.createElement('svg'),
  TrendingUp: () => React.createElement('svg'),
  Gauge: () => React.createElement('svg'),
  Lightbulb: () => React.createElement('svg'),
}));

import CognitiveLoop from '../CognitiveLoop';

describe('CognitiveLoop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the cognitive loop title', () => {
    render(<CognitiveLoop />);
    expect(screen.getByText('cognitiveLoop.title')).toBeInTheDocument();
  });

  it('renders the pipeline subtitle', () => {
    render(<CognitiveLoop />);
    expect(screen.getByText('感知 → 推理 → 行动 → 反思')).toBeInTheDocument();
  });

  it('renders the input area with placeholder', () => {
    render(<CognitiveLoop />);
    expect(screen.getByPlaceholderText('输入要处理的指令或问题...')).toBeInTheDocument();
  });

  it('renders the start button', () => {
    render(<CognitiveLoop />);
    expect(screen.getByText('common.start')).toBeInTheDocument();
  });

  it('renders thinking mode selector', () => {
    render(<CognitiveLoop />);
    expect(screen.getByText('思考模式')).toBeInTheDocument();
    expect(screen.getByText('单思考')).toBeInTheDocument();
    expect(screen.getByText('双思考')).toBeInTheDocument();
  });

  it('renders thinking mode descriptions', () => {
    render(<CognitiveLoop />);
    expect(screen.getByText('标准认知循环，快速响应')).toBeInTheDocument();
    expect(screen.getByText('并行思考，深度分析+快速直觉')).toBeInTheDocument();
  });

  it('displays loop count initially at 0', () => {
    render(<CognitiveLoop />);
    expect(screen.getByText(/已执行/)).toBeInTheDocument();
    expect(screen.getByText(/次循环/)).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('starts cognitive loop when input is filled and button clicked', async () => {
    render(<CognitiveLoop />);
    const input = screen.getByPlaceholderText('输入要处理的指令或问题...');
    fireEvent.change(input, { target: { value: '分析当前系统状态' } });
    fireEvent.click(screen.getByText('common.start'));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('run_cognitive_loop', {
        input: '分析当前系统状态',
        tools: null,
      });
    });
  });

  it('does not invoke backend with empty input', () => {
    render(<CognitiveLoop />);
    fireEvent.click(screen.getByText('common.start'));
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('renders phase configuration hint', () => {
    render(<CognitiveLoop />);
    const hints = screen.getAllByText(/感知.*推理.*行动.*反思/);
    expect(hints.length).toBeGreaterThanOrEqual(1);
  });

  it('shows perception, reasoning, action, reflection phase labels', () => {
    render(<CognitiveLoop />);
    // Thinking mode labels contain phase names
    expect(screen.getAllByText(/感知/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/推理/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/行动/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/反思/).length).toBeGreaterThanOrEqual(1);
  });

  /* BAN-175: 编码契约验证 - metacognition 五维度评分 */
  it('displays metacognition scores after cognitive loop completes', async () => {
    render(<CognitiveLoop />);
    const input = screen.getByPlaceholderText('输入要处理的指令或问题...');
    fireEvent.change(input, { target: { value: '分析当前系统状态' } });
    fireEvent.click(screen.getByText('common.start'));

    await waitFor(() => {
      expect(screen.getByText('元认知评估 (Metacognition)')).toBeInTheDocument();
    });

    // Verify all five dimensions are shown
    expect(screen.getByText('准确性')).toBeInTheDocument();
    expect(screen.getByText('完整性')).toBeInTheDocument();
    expect(screen.getByText('一致性')).toBeInTheDocument();
    expect(screen.getByText('效率')).toBeInTheDocument();
    expect(screen.getByText('创新性')).toBeInTheDocument();

    // Verify composite score is displayed
    expect(screen.getByText(/综合/)).toBeInTheDocument();

    // Verify weights are shown
    expect(screen.getByText('30%')).toBeInTheDocument();
    expect(screen.getAllByText('20%').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('15%').length).toBeGreaterThanOrEqual(2);
  });
});