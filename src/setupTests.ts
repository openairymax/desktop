import '@testing-library/jest-dom';
import { vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

class LocalStorageMock implements Storage {
  private store: Record<string, string> = {};
  length = 0;
  clear() {
    this.store = {};
    this.length = 0;
  }
  getItem(key: string): string | null {
    return this.store[key] || null;
  }
  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return index < keys.length ? keys[index] : null;
  }
  removeItem(key: string) {
    delete this.store[key];
    this.length = Object.keys(this.store).length;
  }
  setItem(key: string, value: string) {
    this.store[key] = value;
    this.length = Object.keys(this.store).length;
  }
}

Object.defineProperty(window, 'localStorage', {
  value: new LocalStorageMock(),
});

Object.defineProperty(window, 'sessionStorage', {
  value: new LocalStorageMock(),
});

window.__TAURI__ = undefined;
window.__TAURI_INTERNALS__ = {};

HTMLCanvasElement.prototype.getContext = vi.fn();
HTMLCanvasElement.prototype.toDataURL = vi.fn();

Element.prototype.scrollIntoView = vi.fn();

const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') || args[0].includes('act('))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
