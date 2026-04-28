import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase() || e.code.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !!e.ctrlKey === !!shortcut.ctrlKey || !!e.metaKey === !!shortcut.ctrlKey;
        const shiftMatch = !!e.shiftKey === !!shortcut.shiftKey;
        const altMatch = !!e.altKey === !!shortcut.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}

export function useNavigationShortcuts() {
  const navigate = useNavigate();

  const routes: Record<string, string> = {
    '1': '/', '2': '/agents', '3': '/tasks', '4': '/ai-chat',
    '5': '/model-config', '6': '/cognitive-loop', '7': '/memory-evolution',
    '8': '/tools', '9': '/system-monitor', '0': '/settings',
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && routes[e.key]) {
        e.preventDefault();
        navigate(routes[e.key]);
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '[') {
        e.preventDefault();
        navigate(-1);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === ']') {
        e.preventDefault();
        navigate(1);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);
}
