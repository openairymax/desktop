import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';
import React from 'react';

const ToggleError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test explosion');
  }
  return <div>All good</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('renders error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ToggleError shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('页面渲染错误')).toBeInTheDocument();
    expect(screen.getByText('Test explosion')).toBeInTheDocument();
  });

  it('renders retry button in error state', () => {
    render(
      <ErrorBoundary>
        <ToggleError shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('重试')).toBeInTheDocument();
    expect(screen.getByText('复制错误')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ToggleError shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
  });

  it('handles componentDidCatch lifecycle', () => {
    render(
      <ErrorBoundary>
        <ToggleError shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('页面渲染错误')).toBeInTheDocument();
  });
});