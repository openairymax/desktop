import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import KeyboardShortcutsModal, { useKeyboardShortcuts } from '../../components/KeyboardShortcuts';
import { renderHook, act } from '@testing-library/react';

describe('KeyboardShortcutsModal', () => {
  it('returns null when isOpen is false', () => {
    const { container } = render(
      <KeyboardShortcutsModal isOpen={false} onClose={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal when isOpen is true', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('renders all category tabs', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
  });

  it('filters shortcuts by category', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Navigation'));
    expect(screen.getByText('Global Search')).toBeInTheDocument();
    expect(screen.queryByText('Undo')).not.toBeInTheDocument();
  });

  it('shows all shortcuts when All is selected', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('System'));
    fireEvent.click(screen.getByText('All'));
    expect(screen.getByText('Global Search')).toBeInTheDocument();
    expect(screen.getByText('Undo')).toBeInTheDocument();
  });

  it('calls onClose when X button is clicked', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);
    fireEvent.click(document.querySelector('.modal-overlay')!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on ? key', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: '?' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cleans up event listener on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = render(
      <KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />,
    );
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeSpy.mockRestore();
  });

  it('renders footer help text', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/Press/)).toBeInTheDocument();
    expect(screen.getByText(/anytime to show this dialog/)).toBeInTheDocument();
  });

  it('does not close when clicking modal content', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Keyboard Shortcuts'));
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns showShortcuts false by default', () => {
    const { result } = renderHook(() => useKeyboardShortcuts());
    expect(result.current.showShortcuts).toBe(false);
  });

  it('toggles showShortcuts on ? key press', () => {
    const { result } = renderHook(() => useKeyboardShortcuts());

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: '?', cancelable: true }),
      );
    });

    expect(result.current.showShortcuts).toBe(true);

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: '?', cancelable: true }),
      );
    });

    expect(result.current.showShortcuts).toBe(false);
  });

  it('does not toggle when input is focused', () => {
    const { result } = renderHook(() => useKeyboardShortcuts());

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: '?', cancelable: true }),
      );
    });

    expect(result.current.showShortcuts).toBe(false);
    document.body.removeChild(input);
  });

  it('cleans up on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useKeyboardShortcuts());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeSpy.mockRestore();
  });

  it('setShowShortcuts allows direct control', () => {
    const { result } = renderHook(() => useKeyboardShortcuts());

    act(() => {
      result.current.setShowShortcuts(true);
    });

    expect(result.current.showShortcuts).toBe(true);
  });
});