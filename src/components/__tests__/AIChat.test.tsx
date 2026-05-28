import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AIChat from '../AIChat';
import { AgentOSProvider } from '../../hooks/useAgentOS';
import React from 'react';

function Wrapper({ children }: { children: React.ReactNode }) {
  return <AgentOSProvider>{children}</AgentOSProvider>;
}

describe('AIChat Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'healthy', version: '1.0.0', uptime: 3600, timestamp: '2024-01-01' }),
    });
  });

  it('renders without crashing', () => {
    render(<AIChat />, { wrapper: Wrapper });
    expect(screen.getByText(/AI 助手/)).toBeInTheDocument();
  });

  it('renders chat input textarea', () => {
    render(<AIChat />, { wrapper: Wrapper });
    const textarea = screen.getByRole('textbox', { name: 'Chat input' });
    expect(textarea).toBeInTheDocument();
  });

  it('updates input value when typing', () => {
    render(<AIChat />, { wrapper: Wrapper });
    const textarea = screen.getByRole('textbox', { name: 'Chat input' });
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    expect((textarea as HTMLTextAreaElement).value).toBe('Hello');
  });

  it('does not send empty messages', () => {
    const handleSend = vi.fn();
    render(<AIChat onSendMessage={handleSend} />, { wrapper: Wrapper });
    const textarea = screen.getByRole('textbox', { name: 'Chat input' });
    fireEvent.keyDown(textarea, { key: 'Enter' });
    expect(handleSend).not.toHaveBeenCalled();
  });

  it('has placeholder text in input', () => {
    render(<AIChat />, { wrapper: Wrapper });
    const textarea = screen.getByRole('textbox', { name: 'Chat input' });
    expect(textarea).toHaveAttribute('placeholder', '输入消息，按 Enter 发送...');
  });

  it('renders in compact mode without error', () => {
    render(<AIChat compact />, { wrapper: Wrapper });
    expect(screen.getByText(/AI 助手/)).toBeInTheDocument();
  });

  it('renders clear conversation button', () => {
    render(<AIChat />, { wrapper: Wrapper });
    expect(screen.getByTitle('清空对话')).toBeInTheDocument();
  });
});