import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('tauriCompat invoke', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    localStorage.setItem('agentos-endpoint', 'http://localhost:18789');
    vi.doMock('@tauri-apps/api/core', () => ({
      invoke: vi.fn().mockRejectedValue(new Error('Tauri not available in test')),
    }));
  });

  it('falls back to gateway when tauri is unavailable', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: { data: 'test-result' } }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { invoke } = await import('../tauriCompat');
    const result = await invoke('test.command', { key: 'value' });

    expect(result).toEqual({ data: 'test-result' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain('/jsonrpc');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.method).toBe('test.command');
    expect(body.params).toEqual({ key: 'value' });
  });

  it('returns json result data when result field exists', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: { status: 'ok' } }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { invoke } = await import('../tauriCompat');
    const result = await invoke('status.command');
    expect(result).toEqual({ status: 'ok' });
  });

  it('falls back to fallbackInvoke when gateway fails', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', mockFetch);

    const { invoke } = await import('../tauriCompat');
    await expect(invoke('failing.command')).rejects.toThrow('Tauri API unavailable');
  });

  it('falls back to fallbackInvoke when gateway returns error response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ error: { message: 'Backend Error' } }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { invoke } = await import('../tauriCompat');
    await expect(invoke('failing.command')).rejects.toThrow('Tauri API unavailable');
  });
});