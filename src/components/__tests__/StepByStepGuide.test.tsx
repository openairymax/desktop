import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { StepByStepGuide } from '../../components/StepByStepGuide';

vi.mock('lucide-react', () => ({
  ArrowRight: (props: Record<string, unknown>) => React.createElement('svg', { ...props, 'data-icon': 'arrow-right' }),
  CheckCircle2: (props: Record<string, unknown>) => React.createElement('svg', { ...props, 'data-icon': 'check-circle' }),
  LayoutDashboard: (props: Record<string, unknown>) => React.createElement('svg', { ...props, 'data-icon': 'layout-dashboard' }),
  Users: (props: Record<string, unknown>) => React.createElement('svg', { ...props, 'data-icon': 'users' }),
  ClipboardList: (props: Record<string, unknown>) => React.createElement('svg', { ...props, 'data-icon': 'clipboard-list' }),
  Activity: (props: Record<string, unknown>) => React.createElement('svg', { ...props, 'data-icon': 'activity' }),
  MessageCircle: (props: Record<string, unknown>) => React.createElement('svg', { ...props, 'data-icon': 'message-circle' }),
  Terminal: (props: Record<string, unknown>) => React.createElement('svg', { ...props, 'data-icon': 'terminal' }),
  Sparkles: (props: Record<string, unknown>) => React.createElement('svg', { ...props, 'data-icon': 'sparkles' }),
}));

describe('StepByStepGuide', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the first step by default', () => {
    render(<StepByStepGuide onComplete={vi.fn()} />);
    expect(screen.getByText('欢迎使用 AgentOS')).toBeInTheDocument();
    expect(screen.getByText('步骤 1 / 8')).toBeInTheDocument();
  });

  it('renders skip button', () => {
    render(<StepByStepGuide onComplete={vi.fn()} />);
    expect(screen.getByText('跳过')).toBeInTheDocument();
  });

  it('renders previous button disabled on first step', () => {
    render(<StepByStepGuide onComplete={vi.fn()} />);
    expect(screen.getByText('上一步')).toBeDisabled();
  });

  it('renders next button on first step', () => {
    render(<StepByStepGuide onComplete={vi.fn()} />);
    expect(screen.getByText('下一步')).toBeInTheDocument();
  });

  it('advances to next step when next is clicked', () => {
    render(<StepByStepGuide onComplete={vi.fn()} />);
    fireEvent.click(screen.getByText('下一步'));
    expect(screen.getByText('导航栏')).toBeInTheDocument();
    expect(screen.getByText('步骤 2 / 8')).toBeInTheDocument();
  });

  it('goes back to previous step when previous is clicked', () => {
    render(<StepByStepGuide onComplete={vi.fn()} />);
    fireEvent.click(screen.getByText('下一步'));
    fireEvent.click(screen.getByText('上一步'));
    expect(screen.getByText('欢迎使用 AgentOS')).toBeInTheDocument();
    expect(screen.getByText('步骤 1 / 8')).toBeInTheDocument();
  });

  it('calls onComplete when skip is clicked', () => {
    const onComplete = vi.fn();
    render(<StepByStepGuide onComplete={onComplete} />);
    fireEvent.click(screen.getByText('跳过'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('stores guide-completed in localStorage on skip', () => {
    render(<StepByStepGuide onComplete={vi.fn()} />);
    fireEvent.click(screen.getByText('跳过'));
    expect(localStorage.getItem('agentos-guide-completed')).toBe('true');
  });

  it('shows finish button on last step', () => {
    render(<StepByStepGuide onComplete={vi.fn()} />);
    for (let i = 0; i < 7; i++) {
      fireEvent.click(screen.getByText('下一步'));
    }
    expect(screen.getByText('完成')).toBeInTheDocument();
  });

  it('calls onComplete when finish is clicked on last step', () => {
    const onComplete = vi.fn();
    render(<StepByStepGuide onComplete={onComplete} />);
    for (let i = 0; i < 7; i++) {
      fireEvent.click(screen.getByText('下一步'));
    }
    fireEvent.click(screen.getByText('完成'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('returns null when guide was already completed', () => {
    localStorage.setItem('agentos-guide-completed', 'true');
    const { container } = render(<StepByStepGuide onComplete={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls onComplete immediately when previously completed', () => {
    localStorage.setItem('agentos-guide-completed', 'true');
    const onComplete = vi.fn();
    render(<StepByStepGuide onComplete={onComplete} />);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('renders description for current step', () => {
    render(<StepByStepGuide onComplete={vi.fn()} />);
    expect(
      screen.getByText(/AgentOS 是一个工业级/),
    ).toBeInTheDocument();
  });
});