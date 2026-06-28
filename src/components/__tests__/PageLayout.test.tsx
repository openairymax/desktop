import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageLayout } from '../PageLayout';
import React from 'react';

describe('PageLayout', () => {
  it('renders title', () => {
    render(
      <PageLayout title="Test Page">
        <div>Content</div>
      </PageLayout>,
    );
    expect(screen.getByText('Test Page')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(
      <PageLayout title="Test" subtitle="A subtitle">
        <div>Content</div>
      </PageLayout>,
    );
    expect(screen.getByText('A subtitle')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(
      <PageLayout title="Test">
        <div>Content</div>
      </PageLayout>,
    );
    expect(screen.queryByText('A subtitle')).not.toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    render(
      <PageLayout title="Test" actions={<button>Action</button>}>
        <div>Content</div>
      </PageLayout>,
    );
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <PageLayout title="Test">
        <div>Child 1</div>
        <div>Child 2</div>
      </PageLayout>,
    );
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });
});