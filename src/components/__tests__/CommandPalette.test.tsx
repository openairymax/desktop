import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockAddToast = vi.fn();

vi.mock('../Toast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

vi.mock('lucide-react', () => ({
  Terminal: () => React.createElement('svg'),
  Search: () => React.createElement('svg'),
  Settings: () => React.createElement('svg'),
  LayoutDashboard: () => React.createElement('svg'),
  Server: () => React.createElement('svg'),
  Users: () => React.createElement('svg'),
  ClipboardList: () => React.createElement('svg'),
  Brain: () => React.createElement('svg'),
  FileText: () => React.createElement('svg'),
  ArrowRight: () => React.createElement('svg'),
  Command: () => React.createElement('svg'),
  Trash2: () => React.createElement('svg'),
  RefreshCw: () => React.createElement('svg'),
  X: () => React.createElement('svg'),
  CheckCircle2: () => React.createElement('svg'),
  XCircle: () => React.createElement('svg'),
  AlertTriangle: () => React.createElement('svg'),
  Info: () => React.createElement('svg'),
}));

import CommandPalette from '../CommandPalette';

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockAddToast.mockClear();
  });

  it('renders the command palette trigger button', () => {
    render(<CommandPalette />);
    const btn = screen.getByTitle('Command Palette (Ctrl+Shift+P)');
    expect(btn).toBeInTheDocument();
  });

  it('opens the palette when trigger button is clicked', () => {
    render(<CommandPalette />);
    const btn = screen.getByTitle('Command Palette (Ctrl+Shift+P)');
    fireEvent.click(btn);
    expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
  });

  it('shows search input in the palette', () => {
    render(<CommandPalette />);
    fireEvent.click(screen.getByTitle('Command Palette (Ctrl+Shift+P)'));
    const input = screen.getByPlaceholderText('Type a command or search...');
    expect(input).toBeInTheDocument();
  });

  it('shows category tabs: All, Navigation, Actions, Settings, Tools', () => {
    render(<CommandPalette />);
    fireEvent.click(screen.getByTitle('Command Palette (Ctrl+Shift+P)'));
    expect(screen.getByText('All Commands')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Tools')).toBeInTheDocument();
  });

  it('shows command results in the list', () => {
    render(<CommandPalette />);
    fireEvent.click(screen.getByTitle('Command Palette (Ctrl+Shift+P)'));
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByText('Go to Dashboard')).toBeInTheDocument();
    expect(within(listbox).getByText('Go to Services')).toBeInTheDocument();
  });

  it('filters commands by search query', () => {
    render(<CommandPalette />);
    fireEvent.click(screen.getByTitle('Command Palette (Ctrl+Shift+P)'));
    const input = screen.getByPlaceholderText('Type a command or search...');
    fireEvent.change(input, { target: { value: 'dashboard' } });
    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Go to Services')).not.toBeInTheDocument();
  });

  it('shows no commands found for non-matching query', () => {
    render(<CommandPalette />);
    fireEvent.click(screen.getByTitle('Command Palette (Ctrl+Shift+P)'));
    const input = screen.getByPlaceholderText('Type a command or search...');
    fireEvent.change(input, { target: { value: 'zzzzzznomatch9999' } });
    expect(screen.getByText('No commands found for "zzzzzznomatch9999"')).toBeInTheDocument();
  });

  it('closes palette when Escape is pressed', () => {
    render(<CommandPalette />);
    fireEvent.click(screen.getByTitle('Command Palette (Ctrl+Shift+P)'));
    expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByPlaceholderText('Type a command or search...')).not.toBeInTheDocument();
  });

  it('closes palette when overlay is clicked', () => {
    render(<CommandPalette />);
    fireEvent.click(screen.getByTitle('Command Palette (Ctrl+Shift+P)'));
    expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
    const overlay = document.querySelector('.modal-overlay') as HTMLElement;
    fireEvent.click(overlay);
    expect(screen.queryByPlaceholderText('Type a command or search...')).not.toBeInTheDocument();
  });

  it('navigates when a navigation command is clicked', () => {
    render(<CommandPalette />);
    fireEvent.click(screen.getByTitle('Command Palette (Ctrl+Shift+P)'));
    const dashCmd = screen.getByText('Go to Dashboard');
    fireEvent.click(dashCmd);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('closes palette after executing a command', () => {
    render(<CommandPalette />);
    fireEvent.click(screen.getByTitle('Command Palette (Ctrl+Shift+P)'));
    fireEvent.click(screen.getByText('Go to Dashboard'));
    expect(screen.queryByPlaceholderText('Type a command or search...')).not.toBeInTheDocument();
  });

  it('shows toast after executing a command', () => {
    render(<CommandPalette />);
    fireEvent.click(screen.getByTitle('Command Palette (Ctrl+Shift+P)'));
    fireEvent.click(screen.getByText('Go to Dashboard'));
    expect(mockAddToast).toHaveBeenCalledWith({
      type: 'info',
      title: 'Command executed: Go to Dashboard',
      duration: 2500,
    });
  });

  it('clears query text when X button is clicked', () => {
    render(<CommandPalette />);
    fireEvent.click(screen.getByTitle('Command Palette (Ctrl+Shift+P)'));
    const input = screen.getByPlaceholderText('Type a command or search...');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(input).toHaveValue('test');
    const xButtons = screen.getAllByRole('button');
    const clearBtn = xButtons.find(
      (b) => b.className === 'icon-btn' && b.closest('[class*="search-modal"]'),
    );
    expect(clearBtn).toBeDefined();
    fireEvent.click(clearBtn!);
    expect(screen.getByPlaceholderText('Type a command or search...')).toHaveValue('');
  });

  it('filters commands by category', () => {
    render(<CommandPalette />);
    fireEvent.click(screen.getByTitle('Command Palette (Ctrl+Shift+P)'));
    fireEvent.click(screen.getByText('Navigation'));
    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Toggle Sidebar')).not.toBeInTheDocument();
  });

  it('shows keyboard shortcut hints in footer', () => {
    render(<CommandPalette />);
    fireEvent.click(screen.getByTitle('Command Palette (Ctrl+Shift+P)'));
    const footer = document.querySelector('.global-search-footer') as HTMLElement;
    expect(footer).toBeInTheDocument();
    expect(within(footer).getByText('Navigate')).toBeInTheDocument();
    expect(within(footer).getByText('Execute')).toBeInTheDocument();
    expect(within(footer).getByText('Close')).toBeInTheDocument();
  });
});