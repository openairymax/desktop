import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { I18nProvider, useI18n, useTranslation } from '../index';
import React from 'react';

function TestConsumer() {
  const { language, t, setLanguage, availableLanguages } = useI18n();
  return (
    <div>
      <span data-testid="language">{language}</span>
      <span data-testid="greeting">{t.common?.loading || ''}</span>
      <span data-testid="available-count">{availableLanguages.length}</span>
      <button data-testid="switch-en" onClick={() => setLanguage('en')}>
        Switch to EN
      </button>
      <button data-testid="switch-zh" onClick={() => setLanguage('zh')}>
        Switch to ZH
      </button>
    </div>
  );
}

function TranslationConsumer() {
  const t = useTranslation();
  return <span data-testid="translated">{t.common?.loading || ''}</span>;
}

describe('I18nProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders children', () => {
    render(
      <I18nProvider>
        <div>Child content</div>
      </I18nProvider>,
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('useI18n throws error when used outside I18nProvider', () => {
    function BadConsumer() {
      useI18n();
      return null;
    }
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<BadConsumer />)).toThrow(
      'useI18n must be used within an I18nProvider',
    );
    consoleError.mockRestore();
  });

  it('defaults to zh when no localStorage and no navigator match', () => {
    render(
      <I18nProvider>
        <TestConsumer />
      </I18nProvider>,
    );
    expect(screen.getByTestId('language').textContent).toBe('zh');
  });

  it('uses localStorage stored language', () => {
    localStorage.setItem('agentos-language', 'en');

    render(
      <I18nProvider>
        <TestConsumer />
      </I18nProvider>,
    );
    expect(screen.getByTestId('language').textContent).toBe('en');
  });

  it('switches language with setLanguage', () => {
    render(
      <I18nProvider>
        <TestConsumer />
      </I18nProvider>,
    );

    expect(screen.getByTestId('language').textContent).toBe('zh');

    act(() => {
      screen.getByTestId('switch-en').click();
    });

    expect(screen.getByTestId('language').textContent).toBe('en');

    act(() => {
      screen.getByTestId('switch-zh').click();
    });

    expect(screen.getByTestId('language').textContent).toBe('zh');
  });

  it('persists language to localStorage on switch', () => {
    render(
      <I18nProvider>
        <TestConsumer />
      </I18nProvider>,
    );

    act(() => {
      screen.getByTestId('switch-en').click();
    });

    expect(localStorage.getItem('agentos-language')).toBe('en');

    act(() => {
      screen.getByTestId('switch-zh').click();
    });

    expect(localStorage.getItem('agentos-language')).toBe('zh');
  });

  it('availableLanguages has 2 entries', () => {
    render(
      <I18nProvider>
        <TestConsumer />
      </I18nProvider>,
    );
    expect(screen.getByTestId('available-count').textContent).toBe('2');
  });

  it('useTranslation returns translation object', () => {
    render(
      <I18nProvider>
        <TranslationConsumer />
      </I18nProvider>,
    );
    expect(screen.getByTestId('translated')).toBeInTheDocument();
  });

  it('translations contain common namespace', () => {
    render(
      <I18nProvider>
        <TranslationConsumer />
      </I18nProvider>,
    );
    const element = screen.getByTestId('translated');
    expect(element.textContent).toBeTruthy();
  });
});