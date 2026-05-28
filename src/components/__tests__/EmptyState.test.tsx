import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '../EmptyState';
import React from 'react';

describe('EmptyState', () => {
  it('renders title text', () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="Empty" description="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders action button and handles click', () => {
    const onClick = vi.fn();
    render(
      <EmptyState title="Empty" actionLabel="Add item" onAction={onClick} />,
    );
    const btn = screen.getByText('Add item');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders secondary action button', () => {
    const onSecondary = vi.fn();
    render(
      <EmptyState
        title="Empty"
        secondaryLabel="Refresh"
        onSecondaryAction={onSecondary}
      />,
    );
    const btn = screen.getByText('Refresh');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });

  it('renders in compact mode', () => {
    render(<EmptyState title="Compact" compact />);
    expect(screen.getByText('Compact')).toBeInTheDocument();
  });

  it('renders custom icon', () => {
    render(
      <EmptyState title="Custom" icon={<span data-testid="custom-icon" />} />,
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders different types correctly', () => {
    const types: Array<'no-data' | 'search-empty' | 'offline' | 'error' | 'success'> = [
      'no-data',
      'search-empty',
      'offline',
      'error',
      'success',
    ];
    types.forEach((type) => {
      const { container } = render(<EmptyState type={type} title={type} />);
      expect(container.querySelector('.empty-state')).toBeInTheDocument();
    });
  });
});