import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AgentPanel from '../AgentPanel';
import { AgentOSProvider } from '../../hooks/useAgentOS';
import React from 'react';

const mockAgents = [
  { id: '1', name: 'ChatAgent', description: '聊天智能体', status: 'running', metadata: {}, createdAt: '2024-01-01' },
  { id: '2', name: 'ToolAgent', description: '工具智能体', status: 'idle', metadata: {}, createdAt: '2024-01-02' },
  { id: '3', name: 'StoppedAgent', description: '已停止智能体', status: 'stopped', metadata: {}, createdAt: '2024-01-03' },
];

describe('AgentPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy', version: '1.0.0', uptime: 3600, timestamp: '2024-01-01' }),
      })
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAgents),
      });
  });

  it('renders the agent panel container', async () => {
    render(
      <AgentOSProvider>
        <AgentPanel />
      </AgentOSProvider>,
    );

    await screen.findByRole('region', { name: 'Agent 面板' });
    expect(screen.getByRole('region', { name: 'Agent 面板' })).toBeInTheDocument();
  });

  it('renders search input with correct role', async () => {
    render(
      <AgentOSProvider>
        <AgentPanel />
      </AgentOSProvider>,
    );

    await screen.findByRole('searchbox', { name: '搜索 Agent' });
    expect(screen.getByRole('searchbox', { name: '搜索 Agent' })).toBeInTheDocument();
  });

  it('renders status filter select', async () => {
    render(
      <AgentOSProvider>
        <AgentPanel />
      </AgentOSProvider>,
    );

    await screen.findByRole('combobox', { name: '按状态过滤' });
    expect(screen.getByRole('combobox', { name: '按状态过滤' })).toBeInTheDocument();
  });

  it('renders register button with accessible name', async () => {
    render(
      <AgentOSProvider>
        <AgentPanel />
      </AgentOSProvider>,
    );

    await screen.findByRole('button', { name: '注册新 Agent' });
    expect(screen.getByRole('button', { name: '注册新 Agent' })).toBeInTheDocument();
  });

  it('renders refresh button', async () => {
    render(
      <AgentOSProvider>
        <AgentPanel />
      </AgentOSProvider>,
    );

    await screen.findByRole('button', { name: '刷新 Agent 列表' });
    expect(screen.getByRole('button', { name: '刷新 Agent 列表' })).toBeInTheDocument();
  });

  it('opens spawn modal when register button is clicked', async () => {
    render(
      <AgentOSProvider>
        <AgentPanel />
      </AgentOSProvider>,
    );

    await screen.findByRole('button', { name: '注册新 Agent' });
    const registerBtn = screen.getByRole('button', { name: '注册新 Agent' });
    fireEvent.click(registerBtn);

    expect(screen.getByRole('dialog', { name: '注册新 Agent' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Agent 名称' })).toBeInTheDocument();
  });

  it('renders agent list container', async () => {
    render(
      <AgentOSProvider>
        <AgentPanel />
      </AgentOSProvider>,
    );

    await screen.findByRole('list');
    expect(screen.getByRole('list')).toBeInTheDocument();
  });
});