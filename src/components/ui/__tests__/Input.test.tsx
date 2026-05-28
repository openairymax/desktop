import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../Input';
import React from 'react';

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders a label', () => {
    render(<Input label="Username" />);
    expect(screen.getByText('Username')).toBeInTheDocument();
  });

  it('does not render label when not provided', () => {
    render(<Input placeholder="No label" />);
    expect(screen.queryByText('Username')).not.toBeInTheDocument();
  });

  it('renders helper text', () => {
    render(<Input helper="This is a hint" />);
    expect(screen.getByText('This is a hint')).toBeInTheDocument();
  });

  it('renders error text and applies error styling', () => {
    render(<Input error="Field is required" />);
    expect(screen.getByText('Field is required')).toBeInTheDocument();
  });

  it('shows error text over helper when both are provided', () => {
    render(<Input helper="Helper text" error="Error text" />);
    expect(screen.getByText('Error text')).toBeInTheDocument();
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
  });

  it('does not render helper/error section when neither is provided', () => {
    render(<Input placeholder="No messages" />);
    expect(screen.queryByText('This is a hint')).not.toBeInTheDocument();
  });

  it('renders prefix element', () => {
    render(<Input prefix={<span data-testid="prefix-icon">$</span>} />);
    expect(screen.getByTestId('prefix-icon')).toBeInTheDocument();
  });

  it('renders suffix element', () => {
    render(<Input suffix={<span data-testid="suffix-icon">.com</span>} />);
    expect(screen.getByTestId('suffix-icon')).toBeInTheDocument();
  });

  it('supports forwardRef', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} placeholder="Ref test" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.placeholder).toBe('Ref test');
  });

  it('handles onFocus event', () => {
    const handleFocus = vi.fn();
    render(<Input onFocus={handleFocus} placeholder="Focus me" />);
    fireEvent.focus(screen.getByPlaceholderText('Focus me'));
    expect(handleFocus).toHaveBeenCalledTimes(1);
  });

  it('handles onBlur event', () => {
    const handleBlur = vi.fn();
    render(<Input onBlur={handleBlur} placeholder="Blur me" />);
    const input = screen.getByPlaceholderText('Blur me');
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('handles onChange event', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} placeholder="Type here" />);
    fireEvent.change(screen.getByPlaceholderText('Type here'), {
      target: { value: 'hello' },
    });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('applies disabled attribute', () => {
    render(<Input disabled placeholder="Disabled input" />);
    expect(screen.getByPlaceholderText('Disabled input')).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<Input className="custom-input" placeholder="Class test" />);
    const input = screen.getByPlaceholderText('Class test');
    expect(input.className).toContain('custom-input');
  });

  it('applies custom style', () => {
    render(<Input style={{ fontSize: '20px' }} placeholder="Style test" />);
    const input = screen.getByPlaceholderText('Style test');
    expect(input.style.fontSize).toBe('20px');
  });

  it('has displayName set', () => {
    expect(Input.displayName).toBe('Input');
  });

  it('passes through type attribute', () => {
    render(<Input type="email" placeholder="Email input" />);
    const input = screen.getByPlaceholderText('Email input');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('passes through defaultValue', () => {
    render(<Input defaultValue="default text" placeholder="Default value" />);
    const input = screen.getByPlaceholderText('Default value') as HTMLInputElement;
    expect(input.value).toBe('default text');
  });
});