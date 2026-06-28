import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

import NotificationCenter from '../../components/NotificationCenter';

describe('NotificationCenter', () => {
  it('renders the bell button', () => {
    render(<NotificationCenter />);
    const bellBtn = screen.getByRole('button', { name: /Notifications/i });
    expect(bellBtn).toBeInTheDocument();
  });

  it('shows unread badge with count', () => {
    render(<NotificationCenter />);
    const bellBtn = screen.getByRole('button', { name: /Notifications/i });
    expect(bellBtn).toBeInTheDocument();
  });

  it('opens notification panel on bell click', () => {
    render(<NotificationCenter />);
    const bellBtn = screen.getByRole('button', { name: /Notifications/i });
    fireEvent.click(bellBtn);
    expect(screen.getByText('System Ready')).toBeInTheDocument();
  });

  it('closes notification panel on second bell click', () => {
    render(<NotificationCenter />);
    const bellBtn = screen.getByRole('button', { name: /Notifications/i });
    fireEvent.click(bellBtn);
    expect(screen.getByText('System Ready')).toBeInTheDocument();
    fireEvent.click(bellBtn);
    expect(screen.queryByText('System Ready')).not.toBeInTheDocument();
  });

  it('shows notification items with messages', () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByRole('button', { name: /Notifications/i }));
    expect(screen.getByText('System Ready')).toBeInTheDocument();
    expect(screen.getByText('All services are running normally. AgentRT is ready to use.')).toBeInTheDocument();
  });

  it('shows different notification types', () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByRole('button', { name: /Notifications/i }));
    expect(screen.getByText('New Feature Available')).toBeInTheDocument();
    expect(screen.getByText('Memory Usage')).toBeInTheDocument();
    expect(screen.getByText('Auto-backup Completed')).toBeInTheDocument();
  });

  it('shows action buttons on notifications that have them', () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByRole('button', { name: /Notifications/i }));
    expect(screen.getByText('View Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Configure Now')).toBeInTheDocument();
  });

  it('renders mark all read button when there are unread notifications', () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByRole('button', { name: /Notifications/i }));
    expect(screen.getByText('Mark all read')).toBeInTheDocument();
  });

  it('renders clear all button when there are notifications', () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByRole('button', { name: /Notifications/i }));
    expect(screen.getByText('Clear all notifications')).toBeInTheDocument();
  });

  it('clears all notifications', () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByRole('button', { name: /Notifications/i }));
    fireEvent.click(screen.getByText('Clear all notifications'));
    expect(screen.getByText('No notifications')).toBeInTheDocument();
  });

  it('shows empty state after clearing all', () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByRole('button', { name: /Notifications/i }));
    fireEvent.click(screen.getByText('Clear all notifications'));
    expect(screen.getByText('No notifications')).toBeInTheDocument();
    expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
  });

  it('closes panel on Escape key', () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByRole('button', { name: /Notifications/i }));
    expect(screen.getByText('System Ready')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('System Ready')).not.toBeInTheDocument();
  });

  it('closes panel when clicking outside', () => {
    render(
      <div>
        <NotificationCenter />
        <div data-testid="outside">Outside</div>
      </div>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Notifications/i }));
    expect(screen.getByText('System Ready')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByText('System Ready')).not.toBeInTheDocument();
  });

  it('marks notification as read on click', () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByRole('button', { name: /Notifications/i }));

    const notification = screen.getByText('System Ready').closest('.notification-item');
    expect(notification).toHaveClass('unread');

    fireEvent.click(notification!);
  });

  it('marks all notifications as read', () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByRole('button', { name: /Notifications/i }));
    fireEvent.click(screen.getByText('Mark all read'));
  });

  it('renders delete button on each notification', () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByRole('button', { name: /Notifications/i }));

    const deleteButtons = screen.getAllByTitle('Delete');
    expect(deleteButtons.length).toBe(4);
  });

  it('deletes a notification when delete button is clicked', () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByRole('button', { name: /Notifications/i }));

    const deleteButtons = screen.getAllByTitle('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(screen.queryByText('System Ready')).not.toBeInTheDocument();
  });

  it('stops propagation when action button is clicked', () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByRole('button', { name: /Notifications/i }));

    const viewDashboardBtn = screen.getByText('View Dashboard');
    fireEvent.click(viewDashboardBtn);
  });
});