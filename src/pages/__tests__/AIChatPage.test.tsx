import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'aiChat.subtitle') return 'Interact with AI agents';
      return key;
    },
  }),
}));

vi.mock('../../components/AIChat', () => ({
  default: () => <div data-testid="ai-chat-mock">AI Chat Component</div>,
}));

import AIChatPage from '../AIChatPage';

describe('AIChatPage', () => {
  it('renders the title', () => {
    render(<AIChatPage />);
    expect(screen.getByText('AI 助手')).toBeInTheDocument();
  });

  it('renders the subtitle from i18n', () => {
    render(<AIChatPage />);
    expect(screen.getByText('Interact with AI agents')).toBeInTheDocument();
  });

  it('renders the AIChat component', () => {
    render(<AIChatPage />);
    expect(screen.getByTestId('ai-chat-mock')).toBeInTheDocument();
  });

  it('has correct aria attributes', () => {
    render(<AIChatPage />);
    const region = screen.getByRole('region');
    expect(region).toHaveAttribute('aria-label', 'AI Chat');
  });

  it('renders the MessageSquare icon container', () => {
    const { container } = render(<AIChatPage />);
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });
});