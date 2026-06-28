import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, renderHook } from '@testing-library/react';
import React from 'react';

vi.mock('lucide-react', () => ({
  CheckCircle2: (props: Record<string, unknown>) =>
    React.createElement('svg', { ...props, 'data-icon': 'check-circle' }),
  XCircle: (props: Record<string, unknown>) =>
    React.createElement('svg', { ...props, 'data-icon': 'x-circle' }),
  AlertTriangle: (props: Record<string, unknown>) =>
    React.createElement('svg', { ...props, 'data-icon': 'alert-triangle' }),
  Info: (props: Record<string, unknown>) =>
    React.createElement('svg', { ...props, 'data-icon': 'info' }),
  X: (props: Record<string, unknown>) =>
    React.createElement('svg', { ...props, 'data-icon': 'x' }),
}));

import {
  OperationFeedback,
  OperationFeedbackProvider,
  useOperationFeedback,
} from '../../components/OperationFeedback';

describe('OperationFeedback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders success feedback', () => {
    render(<OperationFeedback type="success" title="Success Title" />);
    expect(screen.getByText('Success Title')).toBeInTheDocument();
  });

  it('renders error feedback', () => {
    render(<OperationFeedback type="error" title="Error Title" />);
    expect(screen.getByText('Error Title')).toBeInTheDocument();
  });

  it('renders warning feedback', () => {
    render(<OperationFeedback type="warning" title="Warning Title" />);
    expect(screen.getByText('Warning Title')).toBeInTheDocument();
  });

  it('renders info feedback', () => {
    render(<OperationFeedback type="info" title="Info Title" />);
    expect(screen.getByText('Info Title')).toBeInTheDocument();
  });

  it('renders message when provided', () => {
    render(
      <OperationFeedback type="success" title="Title" message="This is a message" />,
    );
    expect(screen.getByText('This is a message')).toBeInTheDocument();
  });

  it('does not render message when not provided', () => {
    render(<OperationFeedback type="success" title="Title Only" />);
    expect(screen.getByText('Title Only')).toBeInTheDocument();
  });

  it('calls onClose after duration', () => {
    const onClose = vi.fn();
    render(
      <OperationFeedback
        type="info"
        title="Auto close"
        duration={2000}
        onClose={onClose}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows X button when onClose is provided', () => {
    const onClose = vi.fn();
    render(<OperationFeedback type="info" title="Closeable" onClose={onClose} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(1);
  });

  it('calls onClose when X button is clicked', () => {
    const onClose = vi.fn();
    render(<OperationFeedback type="info" title="Close me" onClose={onClose} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cleans up timer on unmount', () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <OperationFeedback type="info" title="Unmount" duration={5000} onClose={onClose} />,
    );
    unmount();
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not auto-close when duration is 0', () => {
    const onClose = vi.fn();
    render(
      <OperationFeedback type="info" title="Stay" duration={0} onClose={onClose} />,
    );
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('OperationFeedbackProvider', () => {
  it('renders children', () => {
    render(
      <OperationFeedbackProvider>
        <div>Child content</div>
      </OperationFeedbackProvider>,
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('cleans up event listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(
      <OperationFeedbackProvider>
        <div>Content</div>
      </OperationFeedbackProvider>,
    );
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('addFeedback', expect.any(Function));
    removeSpy.mockRestore();
  });
});

describe('useOperationFeedback', () => {
  it('returns success function', () => {
    const { result } = renderHook(() => useOperationFeedback());
    expect(typeof result.current.success).toBe('function');
  });

  it('returns error function', () => {
    const { result } = renderHook(() => useOperationFeedback());
    expect(typeof result.current.error).toBe('function');
  });

  it('returns warning function', () => {
    const { result } = renderHook(() => useOperationFeedback());
    expect(typeof result.current.warning).toBe('function');
  });

  it('returns info function', () => {
    const { result } = renderHook(() => useOperationFeedback());
    expect(typeof result.current.info).toBe('function');
  });

  it('dispatches custom event on success', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const { result } = renderHook(() => useOperationFeedback());

    act(() => {
      result.current.success('Success', 'Message', 3000);
    });

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
    expect(event.detail.type).toBe('success');
    expect(event.detail.title).toBe('Success');
    dispatchSpy.mockRestore();
  });

  it('dispatches custom event on error', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const { result } = renderHook(() => useOperationFeedback());

    act(() => {
      result.current.error('Error occurred');
    });

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    dispatchSpy.mockRestore();
  });
});