import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import Skeleton, {
  SkeletonCard,
  SkeletonTable,
  SkeletonDashboard,
  SkeletonList,
} from '../../components/SkeletonEnhanced';

describe('Skeleton', () => {
  it('renders a div', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });

  it('has skeleton class', () => {
    const { container } = render(<Skeleton />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('skeleton');
  });

  it('has animate class by default', () => {
    const { container } = render(<Skeleton />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('skeleton-animate');
  });

  it('no animate class when animation is none', () => {
    const { container } = render(<Skeleton animation="none" />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).not.toContain('skeleton-animate');
  });

  it('renders text variant', () => {
    const { container } = render(<Skeleton variant="text" />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });

  it('renders circular variant', () => {
    const { container } = render(<Skeleton variant="circular" />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.width).toBe('40px');
    expect(div.style.height).toBe('40px');
    expect(div.style.borderRadius).toBe('50%');
  });

  it('renders rectangular variant', () => {
    const { container } = render(<Skeleton variant="rectangular" />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });

  it('applies custom width and height as numbers', () => {
    const { container } = render(<Skeleton width={100} height={30} />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.width).toBe('100px');
    expect(div.style.height).toBe('30px');
  });

  it('applies custom width and height as strings', () => {
    const { container } = render(<Skeleton width="50%" height="20px" />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.width).toBe('50%');
    expect(div.style.height).toBe('20px');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="my-skeleton" />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('my-skeleton');
  });

  it('applies custom style', () => {
    const { container } = render(<Skeleton style={{ marginTop: '8px' }} />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.marginTop).toBe('8px');
  });

  it('renders with pulse animation', () => {
    const { container } = render(<Skeleton animation="pulse" />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('skeleton-animate');
  });

  it('renders with wave animation', () => {
    const { container } = render(<Skeleton animation="wave" />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('skeleton-animate');
  });
});

describe('SkeletonCard', () => {
  it('renders with default avatar and lines', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });

  it('renders without avatar', () => {
    const { container } = render(<SkeletonCard showAvatar={false} />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });

  it('renders with custom lines', () => {
    const { container } = render(<SkeletonCard lines={5} />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });

  it('renders without button', () => {
    const { container } = render(<SkeletonCard showButton={false} />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });
});

describe('SkeletonTable', () => {
  it('renders with default rows and columns', () => {
    const { container } = render(<SkeletonTable />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });

  it('renders with custom rows and columns', () => {
    const { container } = render(<SkeletonTable rows={3} columns={6} />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });

  it('renders without header', () => {
    const { container } = render(<SkeletonTable showHeader={false} />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });
});

describe('SkeletonDashboard', () => {
  it('renders dashboard skeleton', () => {
    const { container } = render(<SkeletonDashboard />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });

  it('contains 4 stat card wrappers', () => {
    const { container } = render(<SkeletonDashboard />);
    const children = container.firstChild?.childNodes;
    expect(children?.length).toBe(4);
  });
});

describe('SkeletonList', () => {
  it('renders with default items', () => {
    const { container } = render(<SkeletonList />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });

  it('renders with custom items', () => {
    const { container } = render(<SkeletonList items={3} />);
    const children = container.firstChild?.childNodes;
    expect(children?.length).toBe(3);
  });

  it('renders without icons', () => {
    const { container } = render(<SkeletonList showIcon={false} />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });
});