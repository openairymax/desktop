import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click</Button>);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant styles correctly', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveStyle({ color: 'rgb(255, 255, 255)' });

    rerender(<Button variant="danger">Danger</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveStyle({ color: 'rgb(255, 255, 255)' });
  });

  it('applies size styles correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveStyle({ padding: '6px 14px' });

    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveStyle({ padding: '12px 24px' });
  });

  it('disables the button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveStyle({ opacity: '0.5' });
  });

  it('shows loading state with spinner', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText(/处理中/i)).toBeInTheDocument();
    expect(button.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows title attribute when provided', () => {
    render(<Button title="Submit form">Submit</Button>);
    expect(screen.getByTitle('Submit form')).toBeInTheDocument();
  });

  it('does not fire click event when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>,
    );
    await user.click(screen.getByRole('button'));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies custom className and style', () => {
    render(
      <Button className="custom-class" style={{ margin: '10px' }}>
        Custom
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
    expect(button).toHaveStyle({ margin: '10px' });
  });

  it('has correct default props', () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
  });
});
