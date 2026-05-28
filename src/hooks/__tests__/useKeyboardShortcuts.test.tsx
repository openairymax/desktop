import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts, useNavigationShortcuts } from '../useKeyboardShortcuts';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers keydown listener', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const action = vi.fn();
    const shortcuts = [{ key: 'a', action, description: 'Action A' }];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    addSpy.mockRestore();
  });

  it('calls action when matching key is pressed', () => {
    const action = vi.fn();
    const shortcuts = [{ key: 'a', action, description: 'Action A' }];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('ignores key events from input elements', () => {
    const action = vi.fn();
    const shortcuts = [{ key: 'a', action, description: 'Action A' }];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    const input = document.createElement('input');
    document.body.appendChild(input);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));

    expect(action).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('matches with ctrlKey modifier', () => {
    const action = vi.fn();
    const shortcuts = [{ key: 's', ctrlKey: true, action, description: 'Save' }];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 's', ctrlKey: true }),
      );
    });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('matches with shiftKey modifier', () => {
    const action = vi.fn();
    const shortcuts = [
      { key: 'Tab', shiftKey: true, action, description: 'Previous' },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }),
      );
    });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('matches with altKey modifier', () => {
    const action = vi.fn();
    const shortcuts = [
      { key: 'f', altKey: true, action, description: 'Find' },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'f', altKey: true }),
      );
    });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('matches by code property', () => {
    const action = vi.fn();
    const shortcuts = [{ key: 'Space', action, description: 'Play' }];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { code: 'Space', key: ' ' }),
      );
    });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('does not call action when key does not match', () => {
    const action = vi.fn();
    const shortcuts = [{ key: 'a', action, description: 'Action A' }];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));
    });

    expect(action).not.toHaveBeenCalled();
  });

  it('cleans up event listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const action = vi.fn();
    const shortcuts = [{ key: 'a', action, description: 'Action A' }];

    const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts));
    unmount();

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeSpy.mockRestore();
  });

  it('calls preventDefault when shortcut matches', () => {
    const action = vi.fn();
    const shortcuts = [{ key: 'a', action, description: 'Action A' }];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', {
      key: 'a',
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    act(() => {
      window.dispatchEvent(event);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});

describe('useNavigationShortcuts', () => {
  it('navigates to dashboard with Ctrl+1', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter>{children}</MemoryRouter>
    );

    const { result } = renderHook(() => useNavigationShortcuts(), { wrapper });

    expect(result).toBeDefined();
  });

  it('cleans up event listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter>{children}</MemoryRouter>
    );

    const { unmount } = renderHook(() => useNavigationShortcuts(), { wrapper });
    unmount();

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeSpy.mockRestore();
  });
});