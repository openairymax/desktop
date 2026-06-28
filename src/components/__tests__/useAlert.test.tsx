import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAlert } from '../useAlert';
import React from 'react';

const mockAddToast = vi.fn();
const mockShowModal = vi.fn();

vi.mock('../Toast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../Modal', () => ({
  useModal: () => ({ showModal: mockShowModal }),
  ModalProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('useAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls addToast with success type', () => {
    const { result } = renderHook(() => useAlert());
    act(() => {
      result.current.success('Done', 'Operation completed');
    });
    expect(mockAddToast).toHaveBeenCalledWith({
      type: 'success',
      title: 'Done',
      message: 'Operation completed',
    });
  });

  it('calls addToast with error type', () => {
    const { result } = renderHook(() => useAlert());
    act(() => {
      result.current.error('Failed', 'Something went wrong');
    });
    expect(mockAddToast).toHaveBeenCalledWith({
      type: 'error',
      title: 'Failed',
      message: 'Something went wrong',
    });
  });

  it('calls addToast with warning type', () => {
    const { result } = renderHook(() => useAlert());
    act(() => {
      result.current.warning('Heads up', 'Be careful');
    });
    expect(mockAddToast).toHaveBeenCalledWith({
      type: 'warning',
      title: 'Heads up',
      message: 'Be careful',
    });
  });

  it('calls addToast with info type', () => {
    const { result } = renderHook(() => useAlert());
    act(() => {
      result.current.info('Note', 'Just so you know');
    });
    expect(mockAddToast).toHaveBeenCalledWith({
      type: 'info',
      title: 'Note',
      message: 'Just so you know',
    });
  });

  it('calls showModal for confirm', async () => {
    mockShowModal.mockResolvedValue(true);
    const { result } = renderHook(() => useAlert());
    let response = false;
    await act(async () => {
      response = await result.current.confirm({
        title: 'Confirm',
        message: 'Are you sure?',
      });
    });
    expect(mockShowModal).toHaveBeenCalledWith({
      title: 'Confirm',
      message: 'Are you sure?',
    });
    expect(response).toBe(true);
  });

  it('returns all five alert methods', () => {
    const { result } = renderHook(() => useAlert());
    expect(result.current.success).toBeDefined();
    expect(result.current.error).toBeDefined();
    expect(result.current.warning).toBeDefined();
    expect(result.current.info).toBeDefined();
    expect(result.current.confirm).toBeDefined();
  });
});