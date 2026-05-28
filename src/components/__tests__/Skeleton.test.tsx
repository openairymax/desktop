import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton, Skeletons, PageLoader } from '../Skeleton';
import React from 'react';

describe('Skeleton', () => {
  it('renders a skeleton div', () => {
    const { container } = render(<Skeleton />);
    const div = container.firstChild as HTMLElement;
    expect(div).toBeInTheDocument();
    expect(div.className).toContain('skeleton');
  });

  it('has animate class by default', () => {
    const { container } = render(<Skeleton />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('skeleton-animate');
  });

  it('does not have animate class when animate=false', () => {
    const { container } = render(<Skeleton animate={false} />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).not.toContain('skeleton-animate');
  });

  it('applies width as string', () => {
    const { container } = render(<Skeleton width="50%" />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.width).toBe('50%');
  });

  it('applies width as number (px)', () => {
    const { container } = render(<Skeleton width={200} />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.width).toBe('200px');
  });

  it('applies height as string', () => {
    const { container } = render(<Skeleton height="32px" />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.height).toBe('32px');
  });

  it('applies height as number (px)', () => {
    const { container } = render(<Skeleton height={24} />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.height).toBe('24px');
  });

  it('applies default height of 16', () => {
    const { container } = render(<Skeleton />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.height).toBe('16px');
  });

  it('applies borderRadius', () => {
    const { container } = render(<Skeleton borderRadius="8px" />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.borderRadius).toBe('8px');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="my-skeleton" />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('my-skeleton');
  });

  it('applies custom style', () => {
    const { container } = render(<Skeleton style={{ marginTop: '10px' }} />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.marginTop).toBe('10px');
  });
});

describe('Skeletons.Card', () => {
  it('renders with default 3 lines', () => {
    const Card = Skeletons.Card;
    const { container } = render(<Card />);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild!.className).toContain('card');
  });

  it('renders with custom lines', () => {
    const Card = Skeletons.Card;
    const { container } = render(<Card lines={5} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('Skeletons.StatCard', () => {
  it('renders stat card skeleton', () => {
    const StatCard = Skeletons.StatCard;
    const { container } = render(<StatCard />);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild!.className).toContain('stat-card');
  });
});

describe('Skeletons.Table', () => {
  it('renders with default rows and cols', () => {
    const Table = Skeletons.Table;
    const { container } = render(<Table />);
    expect(container.querySelector('table')).toBeInTheDocument();
    expect(container.querySelectorAll('thead tr th')).toHaveLength(4);
    expect(container.querySelectorAll('tbody tr')).toHaveLength(5);
  });

  it('renders with custom rows and cols', () => {
    const Table = Skeletons.Table;
    const { container } = render(<Table rows={3} cols={6} />);
    expect(container.querySelectorAll('thead tr th')).toHaveLength(6);
    expect(container.querySelectorAll('tbody tr')).toHaveLength(3);
  });
});

describe('Skeletons.Text', () => {
  it('renders with default 4 lines', () => {
    const Text = Skeletons.Text;
    const { container } = render(<Text />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with custom lines', () => {
    const Text = Skeletons.Text;
    const { container } = render(<Text lines={2} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('PageLoader', () => {
  it('renders page loader with stat cards and skeleton cards', () => {
    const { container } = render(<PageLoader />);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild!.className).toContain('page-container');
    const statCards = container.querySelectorAll('.stat-card');
    expect(statCards.length).toBe(4);
  });
});