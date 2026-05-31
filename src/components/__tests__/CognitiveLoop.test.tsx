import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

const mockListAvailableTools = vi.fn();
const mockRunCognitiveLoop = vi.fn();

vi.mock('../../services/agentos-sdk', () => ({
  default: {
    listAvailableTools: () => mockListAvailableTools(),
    runCognitiveLoop: (input: string) => mockRunCognitiveLoop(input),
  },
}));

vi.mock('lucide-react', () => {
  const createSvg = () => React.createElement('svg');
  return {
    Eye: createSvg,
    Brain: createSvg,
    Zap: createSvg,
    RefreshCw: createSvg,
    Play: createSvg,
    Pause: createSvg,
    RotateCcw: createSvg,
    ArrowRight: createSvg,
    CheckCircle2: createSvg,
    AlertCircle: createSvg,
    Clock: createSvg,
    Lightbulb: createSvg,
    MessageSquare: createSvg,
    Wrench: createSvg,
    FileText: createSvg,
    Sparkles: createSvg,
  };
});

import CognitiveLoop from '../CognitiveLoop';

describe('CognitiveLoop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListAvailableTools.mockResolvedValue([
      { name: 'read_file', description: 'Read a file' },
      { name: 'write_file', description: 'Write a file' },
    ]);
  });

  it('renders the cognitive loop component', () => {
    render(<CognitiveLoop />);
    expect(screen.getByText('认知循环引擎')).toBeInTheDocument();
  });

  it('renders the input field', () => {
    render(<CognitiveLoop />);
    expect(screen.getByPlaceholderText(/输入任务描述/)).toBeInTheDocument();
  });

  it('renders the run button', () => {
    render(<CognitiveLoop />);
    expect(screen.getByText('运行循环')).toBeInTheDocument();
  });

  it('renders the demo button', () => {
    render(<CognitiveLoop />);
    expect(screen.getByText('演示模式')).toBeInTheDocument();
  });

  it('shows idle state initially', () => {
    render(<CognitiveLoop />);
    expect(screen.getByText('待机中')).toBeInTheDocument();
  });

  it('renders phase labels in the cycle diagram', () => {
    render(<CognitiveLoop />);
    expect(screen.getByText('感知')).toBeInTheDocument();
    expect(screen.getByText('推理')).toBeInTheDocument();
    expect(screen.getByText('行动')).toBeInTheDocument();
    expect(screen.getByText('反思')).toBeInTheDocument();
  });

  it('loads available tools on mount', async () => {
    render(<CognitiveLoop />);
    await waitFor(() => {
      expect(mockListAvailableTools).toHaveBeenCalled();
    });
  });

  it('renders the thinking chain area', () => {
    render(<CognitiveLoop />);
    expect(screen.getByText('思维链追踪')).toBeInTheDocument();
  });

  it('renders the tool call chain area', () => {
    render(<CognitiveLoop />);
    expect(screen.getByText('工具调用链')).toBeInTheDocument();
  });

  it('renders the run button disabled when no input', () => {
    render(<CognitiveLoop />);
    const runBtn = screen.getByText('运行循环');
    expect(runBtn.closest('button')).toBeDisabled();
  });

  it('shows the architecture description', () => {
    render(<CognitiveLoop />);
    expect(screen.getByText(/AgentOS 核心推理循环/)).toBeInTheDocument();
  });
});