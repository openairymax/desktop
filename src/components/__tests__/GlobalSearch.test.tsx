import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      animate: _animate,
      initial: _initial,
      exit: _exit,
      transition: _transition,
      ...rest
    }: Record<string, unknown>) =>
      React.createElement('div', rest, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('lucide-react', () => ({
  Search: () => React.createElement('svg'),
  ArrowRight: () => React.createElement('svg'),
  Command: () => React.createElement('svg'),
  LayoutDashboard: () => React.createElement('svg'),
  Bot: () => React.createElement('svg'),
  ListTodo: () => React.createElement('svg'),
  MessageSquare: () => React.createElement('svg'),
  Brain: () => React.createElement('svg'),
  Wrench: () => React.createElement('svg'),
  BarChart3: () => React.createElement('svg'),
  Terminal: () => React.createElement('svg'),
  Settings: () => React.createElement('svg'),
  Server: () => React.createElement('svg'),
  Eye: () => React.createElement('svg'),
  Shield: () => React.createElement('svg'),
  Database: () => React.createElement('svg'),
  Grid: () => React.createElement('svg'),
  Activity: () => React.createElement('svg'),
  Layers: () => React.createElement('svg'),
  Sparkles: () => React.createElement('svg'),
}));

import GlobalSearch from '../GlobalSearch';

describe('GlobalSearch', () => {
  const mockOnClose = vi.fn();

  const renderWithRouter = (ui: React.ReactNode) =>
    render(<MemoryRouter>{ui}</MemoryRouter>);

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnClose.mockClear();
  });

  it('does not render when open is false', () => {
    renderWithRouter(<GlobalSearch open={false} onClose={mockOnClose} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders when open is true', () => {
    renderWithRouter(<GlobalSearch open={true} onClose={mockOnClose} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows search input with placeholder', () => {
    renderWithRouter(<GlobalSearch open={true} onClose={mockOnClose} />);
    expect(screen.getByPlaceholderText('搜索页面、功能、设置...')).toBeInTheDocument();
  });

  it('shows search results by category', () => {
    renderWithRouter(<GlobalSearch open={true} onClose={mockOnClose} />);
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByText('核心')).toBeInTheDocument();
    expect(within(listbox).getByText('仪表盘')).toBeInTheDocument();
    expect(within(listbox).getByText('AI能力')).toBeInTheDocument();
  });

  it('filters results by search query', () => {
    renderWithRouter(<GlobalSearch open={true} onClose={mockOnClose} />);
    const input = screen.getByPlaceholderText('搜索页面、功能、设置...');
    fireEvent.change(input, { target: { value: '服务' } });
    expect(screen.getByText('服务网关')).toBeInTheDocument();
    expect(screen.queryByText('仪表盘')).not.toBeInTheDocument();
  });

  it('shows no results message when query matches nothing', () => {
    renderWithRouter(<GlobalSearch open={true} onClose={mockOnClose} />);
    const input = screen.getByPlaceholderText('搜索页面、功能、设置...');
    fireEvent.change(input, { target: { value: 'zzzznomatch9999' } });
    expect(screen.getByText('未找到匹配结果')).toBeInTheDocument();
  });

  it('navigates when a result is clicked', () => {
    renderWithRouter(<GlobalSearch open={true} onClose={mockOnClose} />);
    fireEvent.click(screen.getByText('仪表盘'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes on Escape key', () => {
    renderWithRouter(<GlobalSearch open={true} onClose={mockOnClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows keyboard shortcuts in footer', () => {
    renderWithRouter(<GlobalSearch open={true} onClose={mockOnClose} />);
    const footer = document.getElementById('search-hints');
    expect(footer).toBeInTheDocument();
    expect(footer!.textContent).toContain('导航');
    expect(footer!.textContent).toContain('跳转');
    expect(footer!.textContent).toContain('关闭');
  });

  it('shows shortcut badges for items with shortcuts', () => {
    renderWithRouter(<GlobalSearch open={true} onClose={mockOnClose} />);
    expect(screen.getByText('Ctrl+1')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+2')).toBeInTheDocument();
  });

  it('automatically selects the first result', () => {
    renderWithRouter(<GlobalSearch open={true} onClose={mockOnClose} />);
    const firstOption = screen.getAllByRole('option')[0];
    expect(firstOption).toHaveAttribute('aria-selected', 'true');
  });
});