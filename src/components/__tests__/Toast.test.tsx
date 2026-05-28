import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../Toast';
import React from 'react';

function ToastConsumer() {
  const { addToast } = useToast();
  return (
    <div>
      <button
        data-testid="add-success"
        onClick={() =>
          addToast({ type: 'success', title: 'Success!', message: 'Operation completed' })
        }
      >
        Add Success
      </button>
      <button
        data-testid="add-error"
        onClick={() =>
          addToast({ type: 'error', title: 'Error!', message: 'Something went wrong' })
        }
      >
        Add Error
      </button>
      <button
        data-testid="add-with-action"
        onClick={() =>
          addToast({
            type: 'info',
            title: 'Update Available',
            message: 'New version available',
            action: { label: 'Install Now', onClick: () => {} },
          })
        }
      >
        Add With Action
      </button>
      <button
        data-testid="add-no-message"
        onClick={() => addToast({ type: 'warning', title: 'Warning!' })}
      >
        Add No Message
      </button>
    </div>
  );
}

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children', () => {
    render(
      <ToastProvider>
        <div>Child content</div>
      </ToastProvider>,
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('useToast throws error when used outside ToastProvider', () => {
    function BadConsumer() {
      useToast();
      return null;
    }
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<BadConsumer />)).toThrow(
      'useToast must be used within ToastProvider',
    );
    consoleError.mockRestore();
  });

  it('shows toast when addToast is called', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByTestId('add-success').click();
    });

    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('shows toast message when provided', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByTestId('add-success').click();
    });

    expect(screen.getByText('Operation completed')).toBeInTheDocument();
  });

  it('shows toast without message', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByTestId('add-no-message').click();
    });

    expect(screen.getByText('Warning!')).toBeInTheDocument();
  });

  it('shows toast with action button', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByTestId('add-with-action').click();
    });

    expect(screen.getByText('Update Available')).toBeInTheDocument();
    expect(screen.getByText('Install Now')).toBeInTheDocument();
    expect(screen.getByText('New version available')).toBeInTheDocument();
  });

  it('renders error toast', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByTestId('add-error').click();
    });

    expect(screen.getByText('Error!')).toBeInTheDocument();
  });

  it('auto-removes toast after duration', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByTestId('add-success').click();
    });

    expect(screen.getByText('Success!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByText('Success!')).not.toBeInTheDocument();
  });

  it('removes error toast after 6 seconds', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByTestId('add-error').click();
    });

    expect(screen.getByText('Error!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.queryByText('Error!')).not.toBeInTheDocument();
  });

  it('closes toast when X button is clicked', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByTestId('add-success').click();
    });

    expect(screen.getByText('Success!')).toBeInTheDocument();

    const closeButtons = document.querySelectorAll('.toast-close');
    act(() => {
      fireEvent.click(closeButtons[0]);
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByText('Success!')).not.toBeInTheDocument();
  });

  it('supports multiple toasts simultaneously', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByTestId('add-success').click();
    });

    act(() => {
      screen.getByTestId('add-error').click();
    });

    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Error!')).toBeInTheDocument();
  });

  it('removeToast works correctly', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByTestId('add-success').click();
    });

    expect(screen.getByText('Success!')).toBeInTheDocument();

    const closeButtons = document.querySelectorAll('.toast-close');
    act(() => {
      fireEvent.click(closeButtons[0]);
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByText('Success!')).not.toBeInTheDocument();
  });
});