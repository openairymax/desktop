import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../agentos-sdk', () => ({
  initSdk: vi.fn(),
  isTauri: vi.fn(() => false),
}));

import { initializeTauri, isTauri } from '../tauri-bridge';
import { initSdk as mockInitSdk } from '../agentos-sdk';

describe('initializeTauri', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('exposes isTauri function', () => {
    expect(typeof isTauri).toBe('function');
  });

  it('calls initSdk when not in tauri environment', async () => {
    await initializeTauri();
    expect(mockInitSdk).toHaveBeenCalledTimes(1);
    expect(mockInitSdk).toHaveBeenCalledWith(expect.any(Function));
  });

  it('does not re-initialize when already initialized', async () => {
    await initializeTauri();
    const callCount = mockInitSdk.mock.calls.length;
    await initializeTauri();
    expect(mockInitSdk).toHaveBeenCalledTimes(callCount);
  });
});