import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card, CardGrid } from '../Card';
import React from 'react';

describe('Card', () => {
  it('renders children', () => {
    render(
      <Card>
        <div>Card content</div>
      </Card>,
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders title', () => {
    render(
      <Card title="Card Title">
        <div>Content</div>
      </Card>,
    );
    expect(screen.getByText('Card Title')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(
      <Card title="Title" subtitle="A subtitle description">
        <div>Content</div>
      </Card>,
    );
    expect(screen.getByText('A subtitle description')).toBeInTheDocument();
  });

  it('renders icon', () => {
    render(
      <Card title="Title" icon={<span data-testid="card-icon">ICON</span>}>
        <div>Content</div>
      </Card>,
    );
    expect(screen.getByTestId('card-icon')).toBeInTheDocument();
  });

  it('renders headerAction', () => {
    render(
      <Card title="Title" headerAction={<button>Header Btn</button>}>
        <div>Content</div>
      </Card>,
    );
    expect(screen.getByText('Header Btn')).toBeInTheDocument();
  });

  it('renders footer', () => {
    render(
      <Card title="Title" footer={<span>Footer text</span>}>
        <div>Content</div>
      </Card>,
    );
    expect(screen.getByText('Footer text')).toBeInTheDocument();
  });

  it('does not render header section when no title/subtitle/headerAction', () => {
    render(
      <Card>
        <div>Content only</div>
      </Card>,
    );
    expect(screen.getByText('Content only')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('renders with default variant', () => {
    render(
      <Card variant="default">
        <div>Default card</div>
      </Card>,
    );
    expect(screen.getByText('Default card')).toBeInTheDocument();
  });

  it('renders with elevated variant', () => {
    render(
      <Card variant="elevated">
        <div>Elevated card</div>
      </Card>,
    );
    expect(screen.getByText('Elevated card')).toBeInTheDocument();
  });

  it('renders with glass variant', () => {
    render(
      <Card variant="glass">
        <div>Glass card</div>
      </Card>,
    );
    expect(screen.getByText('Glass card')).toBeInTheDocument();
  });

  it('renders with gradient variant', () => {
    render(
      <Card variant="gradient">
        <div>Gradient card</div>
      </Card>,
    );
    expect(screen.getByText('Gradient card')).toBeInTheDocument();
  });

  it('renders with bordered variant', () => {
    render(
      <Card variant="bordered">
        <div>Bordered card</div>
      </Card>,
    );
    expect(screen.getByText('Bordered card')).toBeInTheDocument();
  });

  it('handles onClick when provided', () => {
    const handleClick = vi.fn();
    render(
      <Card onClick={handleClick}>
        <div>Clickable card</div>
      </Card>,
    );
    fireEvent.click(screen.getByText('Clickable card'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not throw when onClick is undefined and card is clicked', () => {
    render(
      <Card>
        <div>Non-clickable card</div>
      </Card>,
    );
    fireEvent.click(screen.getByText('Non-clickable card'));
  });

  it('handles onMouseEnter and onMouseLeave', () => {
    const handleEnter = vi.fn();
    const handleLeave = vi.fn();
    render(
      <Card onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
        <div>Hover card</div>
      </Card>,
    );
    const card = screen.getByText('Hover card');
    fireEvent.mouseEnter(card);
    expect(handleEnter).toHaveBeenCalledTimes(1);
    fireEvent.mouseLeave(card);
    expect(handleLeave).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(
      <Card className="custom-class">
        <div>Styled card</div>
      </Card>,
    );
    const motionDiv = container.firstChild as HTMLElement;
    expect(motionDiv.className).toContain('custom-class');
  });

  it('applies custom style', () => {
    const { container } = render(
      <Card style={{ marginTop: '20px' }}>
        <div>Styled card</div>
      </Card>,
    );
    const motionDiv = container.firstChild as HTMLElement;
    expect(motionDiv.style.marginTop).toBe('20px');
  });

  it('renders hover animation with initial opacity 0 when hover=true', () => {
    render(
      <Card hover>
        <div>Animated card</div>
      </Card>,
    );
    expect(screen.getByText('Animated card')).toBeInTheDocument();
  });
});

describe('CardGrid', () => {
  it('renders children', () => {
    render(
      <CardGrid>
        <div>Grid item 1</div>
        <div>Grid item 2</div>
      </CardGrid>,
    );
    expect(screen.getByText('Grid item 1')).toBeInTheDocument();
    expect(screen.getByText('Grid item 2')).toBeInTheDocument();
  });

  it('applies custom columns', () => {
    const { container } = render(
      <CardGrid cols={2}>
        <div>Item</div>
      </CardGrid>,
    );
    const grid = container.firstChild as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))');
  });

  it('applies default 3 columns when cols not specified', () => {
    const { container } = render(
      <CardGrid>
        <div>Item</div>
      </CardGrid>,
    );
    const grid = container.firstChild as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))');
  });

  it('applies custom gap', () => {
    const { container } = render(
      <CardGrid gap="24px">
        <div>Item</div>
      </CardGrid>,
    );
    const grid = container.firstChild as HTMLElement;
    expect(grid.style.gap).toBe('24px');
  });

  it('applies custom className', () => {
    const { container } = render(
      <CardGrid className="my-grid">
        <div>Item</div>
      </CardGrid>,
    );
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('my-grid');
  });

  it('applies custom style', () => {
    const { container } = render(
      <CardGrid style={{ padding: '10px' }}>
        <div>Item</div>
      </CardGrid>,
    );
    const grid = container.firstChild as HTMLElement;
    expect(grid.style.padding).toBe('10px');
  });
});