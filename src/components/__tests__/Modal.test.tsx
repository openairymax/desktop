import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModalProvider, useModal } from '../Modal';
import React from 'react';

function TestConsumer() {
  const { showModal } = useModal();
  return (
    <div>
      <button
        data-testid="trigger-confirm"
        onClick={() => showModal({ title: 'Confirm', message: 'Are you sure?' })}
      >
        Trigger Confirm
      </button>
      <button
        data-testid="trigger-danger"
        onClick={() =>
          showModal({
            type: 'danger',
            title: 'Delete',
            message: 'Delete this item?',
            confirmText: 'Yes, delete',
            variant: 'danger',
          })
        }
      >
        Trigger Danger
      </button>
      <button
        data-testid="trigger-custom"
        onClick={() =>
          showModal({
            title: 'Custom',
            message: 'Custom message',
            confirmText: 'OK',
            cancelText: 'No',
          })
        }
      >
        Trigger Custom
      </button>
    </div>
  );
}

describe('ModalProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children', () => {
    render(
      <ModalProvider>
        <div>Child content</div>
      </ModalProvider>,
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('useModal throws error when used outside ModalProvider', () => {
    function BadConsumer() {
      useModal();
      return null;
    }
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<BadConsumer />)).toThrow(
      'useModal must be used within ModalProvider',
    );
    consoleError.mockRestore();
  });

  it('shows modal and resolves true on confirm', async () => {
    const onResolve = vi.fn();
    function ConsumerWithCallback() {
      const { showModal } = useModal();
      return (
        <button
          data-testid="trigger"
          onClick={async () => {
            const result = await showModal({ title: 'Test', message: 'Hello' });
            onResolve(result);
          }}
        >
          Open
        </button>
      );
    }

    render(
      <ModalProvider>
        <ConsumerWithCallback />
      </ModalProvider>,
    );

    fireEvent.click(screen.getByTestId('trigger'));

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(onResolve).toHaveBeenCalledWith(true);
    });
  });

  it('shows modal and resolves false on cancel', async () => {
    const onResolve = vi.fn();
    function ConsumerWithCallback() {
      const { showModal } = useModal();
      return (
        <button
          data-testid="trigger"
          onClick={async () => {
            const result = await showModal({ title: 'Cancel Test', message: 'Message' });
            onResolve(result);
          }}
        >
          Open
        </button>
      );
    }

    render(
      <ModalProvider>
        <ConsumerWithCallback />
      </ModalProvider>,
    );

    fireEvent.click(screen.getByTestId('trigger'));

    await waitFor(() => {
      expect(screen.getByText('Cancel Test')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(onResolve).toHaveBeenCalledWith(false);
    });
  });

  it('shows modal and resolves false on Escape key', async () => {
    const onResolve = vi.fn();
    function ConsumerWithCallback() {
      const { showModal } = useModal();
      return (
        <button
          data-testid="trigger"
          onClick={async () => {
            const result = await showModal({ title: 'Esc Test', message: 'Press Esc' });
            onResolve(result);
          }}
        >
          Open
        </button>
      );
    }

    render(
      <ModalProvider>
        <ConsumerWithCallback />
      </ModalProvider>,
    );

    fireEvent.click(screen.getByTestId('trigger'));

    await waitFor(() => {
      expect(screen.getByText('Esc Test')).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(onResolve).toHaveBeenCalledWith(false);
    });
  });

  it('shows modal and resolves false on overlay click', async () => {
    const onResolve = vi.fn();
    function ConsumerWithCallback() {
      const { showModal } = useModal();
      return (
        <button
          data-testid="trigger"
          onClick={async () => {
            const result = await showModal({ title: 'Overlay', message: 'Click outside' });
            onResolve(result);
          }}
        >
          Open
        </button>
      );
    }

    render(
      <ModalProvider>
        <ConsumerWithCallback />
      </ModalProvider>,
    );

    fireEvent.click(screen.getByTestId('trigger'));

    await waitFor(() => {
      expect(screen.getByText('Overlay')).toBeInTheDocument();
    });

    fireEvent.click(document.querySelector('.modal-overlay')!);

    await waitFor(() => {
      expect(onResolve).toHaveBeenCalledWith(false);
    });
  });

  it('does not close when clicking modal content', async () => {
    const onResolve = vi.fn();
    function ConsumerWithCallback() {
      const { showModal } = useModal();
      return (
        <button
          data-testid="trigger"
          onClick={async () => {
            const result = await showModal({ title: 'Stay Open', message: 'Click on me' });
            onResolve(result);
          }}
        >
          Open
        </button>
      );
    }

    render(
      <ModalProvider>
        <ConsumerWithCallback />
      </ModalProvider>,
    );

    fireEvent.click(screen.getByTestId('trigger'));

    await waitFor(() => {
      expect(screen.getByText('Stay Open')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Stay Open'));

    expect(onResolve).not.toHaveBeenCalled();
  });

  it('renders default type as confirm', async () => {
    render(
      <ModalProvider>
        <TestConsumer />
      </ModalProvider>,
    );

    fireEvent.click(screen.getByTestId('trigger-confirm'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Confirm' })).toBeInTheDocument();
    });
  });

  it('renders danger modal with delete text', async () => {
    render(
      <ModalProvider>
        <TestConsumer />
      </ModalProvider>,
    );

    fireEvent.click(screen.getByTestId('trigger-danger'));

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Yes, delete')).toBeInTheDocument();
      expect(screen.getByText('Delete this item?')).toBeInTheDocument();
    });
  });

  it('renders custom confirmText and cancelText', async () => {
    render(
      <ModalProvider>
        <TestConsumer />
      </ModalProvider>,
    );

    fireEvent.click(screen.getByTestId('trigger-custom'));

    await waitFor(() => {
      expect(screen.getByText('OK')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });
  });

  it('hides modal after confirm', async () => {
    render(
      <ModalProvider>
        <TestConsumer />
      </ModalProvider>,
    );

    fireEvent.click(screen.getByTestId('trigger-confirm'));

    await waitFor(() => {
      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument();
    });
  });

  it('hides modal after cancel', async () => {
    render(
      <ModalProvider>
        <TestConsumer />
      </ModalProvider>,
    );

    fireEvent.click(screen.getByTestId('trigger-confirm'));

    await waitFor(() => {
      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument();
    });
  });
});