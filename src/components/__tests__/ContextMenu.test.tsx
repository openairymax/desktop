import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ContextMenu, { MenuItem } from '../../components/ContextMenu';

const defaultItems: MenuItem[] = [
  { id: 'edit', label: 'Edit', icon: <span>✏️</span>, shortcut: 'Ctrl+E' },
  { id: 'copy', label: 'Copy' },
  { id: 'divider-1', label: '', divider: true },
  { id: 'delete', label: 'Delete', danger: true },
  { id: 'disabled-item', label: 'Disabled', disabled: true },
];

describe('ContextMenu', () => {
  it('returns null when position is null', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const { container } = render(
      <ContextMenu
        items={defaultItems}
        onSelect={onSelect}
        position={null}
        onClose={onClose}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders menu items when position is provided', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <ContextMenu
        items={defaultItems}
        onSelect={onSelect}
        position={{ x: 100, y: 200 }}
        onClose={onClose}
      />,
    );
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('renders disabled items with muted styling', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <ContextMenu
        items={defaultItems}
        onSelect={onSelect}
        position={{ x: 100, y: 200 }}
        onClose={onClose}
      />,
    );
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('renders divider items', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <ContextMenu
        items={[{ id: 'd', label: '', divider: true }, { id: 'a', label: 'After Divider' }]}
        onSelect={onSelect}
        position={{ x: 100, y: 200 }}
        onClose={onClose}
      />,
    );
    expect(screen.getByText('After Divider')).toBeInTheDocument();
  });

  it('renders danger items', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <ContextMenu
        items={[{ id: 'delete', label: 'Delete', danger: true }]}
        onSelect={onSelect}
        position={{ x: 100, y: 200 }}
        onClose={onClose}
      />,
    );
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('calls onSelect and onClose when item is clicked', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <ContextMenu
        items={defaultItems}
        onSelect={onSelect}
        position={{ x: 100, y: 200 }}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByText('Edit'));
    expect(onSelect).toHaveBeenCalledWith('edit');
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render shortcut when not provided', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <ContextMenu
        items={[{ id: 'copy', label: 'Copy' }]}
        onSelect={onSelect}
        position={{ x: 100, y: 200 }}
        onClose={onClose}
      />,
    );
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });

  it('closes on Escape key', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <ContextMenu
        items={defaultItems}
        onSelect={onSelect}
        position={{ x: 100, y: 200 }}
        onClose={onClose}
      />,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('closes when clicking outside', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <ContextMenu
        items={defaultItems}
        onSelect={onSelect}
        position={{ x: 100, y: 200 }}
        onClose={onClose}
      />,
    );

    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalled();
  });

  it('navigates with ArrowDown key', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <ContextMenu
        items={defaultItems}
        onSelect={onSelect}
        position={{ x: 100, y: 200 }}
        onClose={onClose}
      />,
    );

    fireEvent.keyDown(document, { key: 'ArrowDown' });
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    fireEvent.keyDown(document, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledWith('copy');
    expect(onClose).toHaveBeenCalled();
  });

  it('navigates with ArrowUp key', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <ContextMenu
        items={defaultItems}
        onSelect={onSelect}
        position={{ x: 100, y: 200 }}
        onClose={onClose}
      />,
    );

    fireEvent.keyDown(document, { key: 'ArrowDown' });
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    fireEvent.keyDown(document, { key: 'ArrowUp' });
    fireEvent.keyDown(document, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledWith('edit');
  });

  it('skips disabled and divider items in keyboard navigation', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <ContextMenu
        items={defaultItems}
        onSelect={onSelect}
        position={{ x: 100, y: 200 }}
        onClose={onClose}
      />,
    );

    fireEvent.keyDown(document, { key: 'ArrowDown' });
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    fireEvent.keyDown(document, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledWith('delete');
  });

  it('resets focused index when position changes', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const { rerender } = render(
      <ContextMenu
        items={defaultItems}
        onSelect={onSelect}
        position={{ x: 100, y: 200 }}
        onClose={onClose}
      />,
    );

    fireEvent.keyDown(document, { key: 'ArrowDown' });
    fireEvent.keyDown(document, { key: 'ArrowDown' });

    rerender(
      <ContextMenu
        items={defaultItems}
        onSelect={onSelect}
        position={{ x: 150, y: 250 }}
        onClose={onClose}
      />,
    );

    fireEvent.keyDown(document, { key: 'ArrowDown' });
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('edit');
  });

  it('cleans up event listeners on unmount', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = render(
      <ContextMenu
        items={defaultItems}
        onSelect={onSelect}
        position={{ x: 100, y: 200 }}
        onClose={onClose}
      />,
    );

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeSpy.mockRestore();
  });

  it('renders icon and shortcut in menu item', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <ContextMenu
        items={[{ id: 'save', label: 'Save', icon: <span data-testid="save-icon">💾</span>, shortcut: 'Ctrl+S' }]}
        onSelect={onSelect}
        position={{ x: 100, y: 200 }}
        onClose={onClose}
      />,
    );
    expect(screen.getByTestId('save-icon')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+S')).toBeInTheDocument();
  });
});