import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, renderHook, act, fireEvent } from '@testing-library/react';
import {
  useSpringAnimation,
  useRippleEffect,
  useParallaxEffect,
  useTypewriterEffect,
  useCountUp,
  MagneticButton,
  GlowCard,
  GradientText,
  FloatingElement,
} from '../../hooks/useAnimations';
import React from 'react';

describe('useSpringAnimation', () => {
  it('returns ref and isAnimating', () => {
    const { result } = renderHook(() => useSpringAnimation(false));
    expect(result.current.ref).toBeDefined();
    expect(result.current.isAnimating).toBe(false);
  });

  it('sets isAnimating to true when trigger is true', () => {
    const { result, rerender } = renderHook(
      ({ trigger }) => useSpringAnimation(trigger),
      { initialProps: { trigger: false } },
    );
    expect(result.current.isAnimating).toBe(false);
    rerender({ trigger: true });
  });

  it('accepts custom config', () => {
    const { result } = renderHook(() =>
      useSpringAnimation(false, { duration: 800, delay: 100, easing: 'ease-in-out' }),
    );
    expect(result.current.isAnimating).toBe(false);
  });
});

describe('useRippleEffect', () => {
  it('returns ripples array and createRipple function', () => {
    const { result } = renderHook(() => useRippleEffect());
    expect(result.current.ripples).toEqual([]);
    expect(typeof result.current.createRipple).toBe('function');
  });

  it('createRipple adds a ripple and removes it after timeout', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useRippleEffect());

    const mockEvent = {
      currentTarget: {
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 40 }),
      },
      clientX: 50,
      clientY: 20,
    } as React.MouseEvent<HTMLElement>;

    act(() => {
      result.current.createRipple(mockEvent);
    });

    expect(result.current.ripples.length).toBe(1);
    expect(result.current.ripples[0].x).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(result.current.ripples.length).toBe(0);
    vi.useRealTimers();
  });
});

describe('useParallaxEffect', () => {
  it('returns offset object', () => {
    const { result } = renderHook(() => useParallaxEffect(0.5));
    expect(result.current).toHaveProperty('x');
    expect(result.current).toHaveProperty('y');
  });

  it('updates offset on mouse move', () => {
    const { result } = renderHook(() => useParallaxEffect(1));

    act(() => {
      fireEvent.mouseMove(window, { clientX: 200, clientY: 100 });
    });

    expect(typeof result.current.x).toBe('number');
    expect(typeof result.current.y).toBe('number');
  });

  it('cleanup removes event listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const addSpy = vi.spyOn(window, 'addEventListener');

    const { unmount } = renderHook(() => useParallaxEffect(0.5));

    expect(addSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    removeSpy.mockRestore();
    addSpy.mockRestore();
  });
});

describe('useTypewriterEffect', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns displayText and isComplete', () => {
    const { result } = renderHook(() => useTypewriterEffect('Hello', 10));
    expect(result.current.displayText).toBe('');
    expect(result.current.isComplete).toBe(false);
  });

  it('types out text character by character', () => {
    const { result } = renderHook(() => useTypewriterEffect('Hi', 10));

    act(() => {
      vi.advanceTimersByTime(10);
    });
    expect(result.current.displayText).toBe('H');

    act(() => {
      vi.advanceTimersByTime(10);
    });
    expect(result.current.displayText).toBe('Hi');

    act(() => {
      vi.advanceTimersByTime(10);
    });
    expect(result.current.isComplete).toBe(true);
  });

  it('clears interval on unmount', () => {
    const { unmount } = renderHook(() => useTypewriterEffect('Hello', 10));
    unmount();
  });
});

describe('useCountUp', () => {
  it('returns current and isAnimating', () => {
    const { result } = renderHook(() =>
      useCountUp(100, 2000, false),
    );
    expect(result.current.current).toBe(0);
    expect(result.current.isAnimating).toBe(false);
  });

  it('calling animate starts the animation', () => {
    const { result } = renderHook(() =>
      useCountUp(100, 1000, false),
    );

    act(() => {
      result.current.animate(100);
    });

    expect(result.current.isAnimating).toBe(true);
  });

  it('starts on mount when startOnMount is true', () => {
    const { result } = renderHook(() =>
      useCountUp(50, 1000, true),
    );
    expect(result.current.isAnimating).toBe(true);
  });
});

describe('MagneticButton', () => {
  it('renders children', () => {
    render(<MagneticButton>Click Me</MagneticButton>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('handles click', () => {
    const handleClick = vi.fn();
    render(<MagneticButton onClick={handleClick}>Click</MagneticButton>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(
      <MagneticButton className="custom-btn">Btn</MagneticButton>,
    );
    expect(container.firstChild).toHaveClass('custom-btn');
  });

  it('updates position on mouse move', () => {
    const { container } = render(<MagneticButton>Hover</MagneticButton>);
    const el = container.firstChild as HTMLElement;
    Object.defineProperty(el, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, width: 100, height: 40 }),
    });
    fireEvent.mouseMove(el, { clientX: 50, clientY: 20 });
  });
});

describe('GlowCard', () => {
  it('renders children', () => {
    render(<GlowCard>Card Content</GlowCard>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies custom glowColor', () => {
    render(
      <GlowCard glowColor="#ff0000">Red Glow</GlowCard>,
    );
    expect(screen.getByText('Red Glow')).toBeInTheDocument();
  });

  it('renders with hoverable false', () => {
    render(
      <GlowCard hoverable={false}>Static</GlowCard>,
    );
    expect(screen.getByText('Static')).toBeInTheDocument();
  });

  it('applies custom className and style', () => {
    const { container } = render(
      <GlowCard className="custom-glow" style={{ margin: '10px' }}>
        Styled
      </GlowCard>,
    );
    expect(container.firstChild).toHaveClass('custom-glow');
  });
});

describe('GradientText', () => {
  it('renders children', () => {
    render(<GradientText>Gradient</GradientText>);
    expect(screen.getByText('Gradient')).toBeInTheDocument();
  });

  it('renders with custom colors', () => {
    render(
      <GradientText colors={['#ff0000', '#0000ff']}>Red Blue</GradientText>,
    );
    expect(screen.getByText('Red Blue')).toBeInTheDocument();
  });

  it('renders with animated false', () => {
    render(<GradientText animated={false}>Static Gradient</GradientText>);
    expect(screen.getByText('Static Gradient')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <GradientText className="my-gradient">Text</GradientText>,
    );
    expect(container.firstChild).toHaveClass('my-gradient');
  });
});

describe('FloatingElement', () => {
  it('renders children', () => {
    render(<FloatingElement>Floating</FloatingElement>);
    expect(screen.getByText('Floating')).toBeInTheDocument();
  });

  it('accepts custom amplitude and frequency', () => {
    render(
      <FloatingElement amplitude={20} frequency={5} delay={2}>
        Float
      </FloatingElement>,
    );
    expect(screen.getByText('Float')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <FloatingElement className="float-me">Up</FloatingElement>,
    );
    expect(container.firstChild).toHaveClass('float-me');
  });
});