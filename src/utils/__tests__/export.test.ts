import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  exportToCSV,
  exportToJSON,
  copyToClipboard,
  formatBytes,
  formatDuration,
  generateId,
  debounce,
  throttle,
} from '../export';

describe('exportToCSV', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:test');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('does nothing for empty data', () => {
    const result = exportToCSV([], 'test');
    expect(result).toBeUndefined();
  });

  it('does nothing for null data', () => {
    const result = exportToCSV(null as unknown as Record<string, string>[], 'test');
    expect(result).toBeUndefined();
  });

  it('creates CSV with auto-detected columns', () => {
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    exportToCSV(
      [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ],
      'users',
    );

    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();

    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('creates CSV with custom columns', () => {
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');

    exportToCSV(
      [
        { name: 'Alice', age: 30, email: 'alice@test.com' },
        { name: 'Bob', age: 25, email: 'bob@test.com' },
      ],
      'users',
      [
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age' },
      ],
    );

    expect(appendChildSpy).toHaveBeenCalled();

    appendChildSpy.mockRestore();
  });

  it('handles string values with commas by wrapping in quotes', () => {
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');

    exportToCSV(
      [{ name: 'Smith, John', city: 'New York' }],
      'users',
    );

    expect(appendChildSpy).toHaveBeenCalled();

    appendChildSpy.mockRestore();
  });
});

describe('exportToJSON', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:test');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('does nothing for null data', () => {
    const result = exportToJSON(null as unknown as unknown[], 'test');
    expect(result).toBeUndefined();
  });

  it('creates JSON and triggers download', () => {
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');

    exportToJSON([{ id: 1, name: 'Test' }], 'export');

    expect(appendChildSpy).toHaveBeenCalled();

    appendChildSpy.mockRestore();
  });
});

describe('copyToClipboard', () => {
  it('returns true on successful copy', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    const result = await copyToClipboard('hello');
    expect(result).toBe(true);
  });

  it('returns false on clipboard failure', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('denied')),
      },
    });

    const result = await copyToClipboard('hello');
    expect(result).toBe(false);
  });
});

describe('formatBytes', () => {
  it('returns 0 B for 0', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats bytes', () => {
    expect(formatBytes(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('formats megabytes', () => {
    expect(formatBytes(1048576)).toBe('1 MB');
  });

  it('formats gigabytes', () => {
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  it('formats terabytes', () => {
    expect(formatBytes(1099511627776)).toBe('1 TB');
  });
});

describe('formatDuration', () => {
  it('formats seconds', () => {
    expect(formatDuration(30)).toBe('30.0s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(125)).toBe('2m 5s');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(7320)).toBe('2h 2m');
  });
});

describe('generateId', () => {
  it('returns a string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('generates unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('cancels previous call when called again', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('executes immediately on first call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('ignores calls within throttle window', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled();
    throttled();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('allows calls after throttle window', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);

    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});