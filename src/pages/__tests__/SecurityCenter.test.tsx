import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('lucide-react', () => ({
  Shield: () => React.createElement('svg'),
  AlertTriangle: () => React.createElement('svg'),
  CheckCircle: () => React.createElement('svg'),
  XCircle: () => React.createElement('svg'),
  Lock: () => React.createElement('svg'),
  FileText: () => React.createElement('svg'),
  Search: () => React.createElement('svg'),
  Settings: () => React.createElement('svg'),
  Eye: () => React.createElement('svg'),
  User: () => React.createElement('svg'),
  Clock: () => React.createElement('svg'),
  Activity: () => React.createElement('svg'),
  Key: () => React.createElement('svg'),
  Database: () => React.createElement('svg'),
  Hash: () => React.createElement('svg'),
  Link: () => React.createElement('svg'),
}));

import SecurityCenter from '../SecurityCenter';

describe('SecurityCenter', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders the security center title', () => {
    render(<SecurityCenter />);
    expect(screen.getByText('security.title')).toBeInTheDocument();
  });

  it('renders the security center subtitle', () => {
    render(<SecurityCenter />);
    expect(screen.getByText('安全策略管理与审计日志查看')).toBeInTheDocument();
  });

  it('renders policies and audit logs tabs', () => {
    render(<SecurityCenter />);
    expect(screen.getByText('security.securityPolicies')).toBeInTheDocument();
    const auditElements = screen.getAllByText('审计日志');
    expect(auditElements.length).toBeGreaterThanOrEqual(2); // both tab and policy name
  });

  it('displays default security policies with names', () => {
    render(<SecurityCenter />);
    expect(screen.getByText('权限控制')).toBeInTheDocument();
    expect(screen.getByText('数据清洗')).toBeInTheDocument();
    expect(screen.getByText('访问控制')).toBeInTheDocument();
  });

  it('displays policy status labels', () => {
    render(<SecurityCenter />);
    const enabledLabels = screen.getAllByText('已启用');
    expect(enabledLabels.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('警告')).toBeInTheDocument();
  });

  const clickLogsTab = () => {
    const logsTab = screen.getAllByText('审计日志')[0]; // first is the tab button
    fireEvent.click(logsTab);
  };

  it('switches to audit logs tab when clicked', () => {
    render(<SecurityCenter />);
    clickLogsTab();
    expect(screen.getAllByText('admin').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('agent-devops')).toBeInTheDocument();
    expect(screen.getByText('system')).toBeInTheDocument();
  });

  it('displays audit log actions', () => {
    render(<SecurityCenter />);
    clickLogsTab();
    expect(screen.getByText('修改权限策略')).toBeInTheDocument();
    expect(screen.getByText('访问受限资源')).toBeInTheDocument();
    expect(screen.getByText('自动数据清洗')).toBeInTheDocument();
  });

  it('displays audit log result badges', () => {
    render(<SecurityCenter />);
    clickLogsTab();
    const successBadges = screen.getAllByText('成功');
    expect(successBadges.length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('拒绝').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('错误').length).toBeGreaterThanOrEqual(1);
  });

  it('displays policy descriptions', () => {
    render(<SecurityCenter />);
    expect(screen.getByText('管理智能体和工具的访问权限，包括读写权限和执行权限')).toBeInTheDocument();
    expect(screen.getByText('对输入输出数据进行安全清洗，防止注入攻击和数据泄露')).toBeInTheDocument();
  });

  it('switches back to policies tab', () => {
    render(<SecurityCenter />);
    clickLogsTab();
    fireEvent.click(screen.getByText('security.securityPolicies'));
    expect(screen.getByText('权限控制')).toBeInTheDocument();
  });

  it('has toggle buttons for policies', () => {
    render(<SecurityCenter />);
    const toggleButtons = screen.getAllByText('禁用');
    expect(toggleButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('has audit log filter controls on logs tab', () => {
    render(<SecurityCenter />);
    clickLogsTab();
    expect(screen.getByPlaceholderText('搜索日志...')).toBeInTheDocument();
  });

  /* BAN-129: 编码契约验证 - SHA-256 审计哈希链完整性 */
  it('displays SHA-256 audit hash chain integrity indicator on logs tab', () => {
    render(<SecurityCenter />);
    clickLogsTab();
    expect(screen.getByText('SHA-256 审计哈希链')).toBeInTheDocument();
    expect(screen.getByText(/条完整性验证通过/)).toBeInTheDocument();
    expect(screen.getByText(/genesis:/)).toBeInTheDocument();
  });
});