import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'glass' | 'gradient' | 'bordered';
  hover?: boolean;
  onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
  style?: React.CSSProperties;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  icon,
  variant = 'default',
  hover = false,
  onClick,
  className = '',
  style = {},
  headerAction,
  footer,
  onMouseEnter: onMouseEnterProp,
  onMouseLeave: onMouseLeaveProp,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-sm)',
    },
    elevated: {
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-lg)',
    },
    glass: {
      backgroundColor: 'var(--glass-bg)',
      border: '1px solid var(--glass-border)',
      boxShadow: 'var(--shadow-md)',
      backdropFilter: 'blur(20px)',
    },
    gradient: {
      background: 'linear-gradient(135deg, var(--bg-card), var(--bg-tertiary))',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-sm)',
    },
    bordered: {
      backgroundColor: 'transparent',
      border: '2px solid var(--border-color)',
      boxShadow: 'none',
    },
  };

  const hoverEffect = isHovered
    ? {
        transform: 'translateY(-2px)',
        boxShadow: 'var(--shadow-lg)',
        borderColor: 'var(--primary-color)',
      }
    : {};

  return (
    <motion.div
      initial={hover ? { opacity: 0, y: 8 } : undefined}
      whileHover={
        hover
          ? {
              transform: 'translateY(-4px)',
              boxShadow: 'var(--shadow-lg)',
            }
          : undefined
      }
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const }}
      className={className}
      style={{
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        transition: 'all var(--transition-base)',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        ...variantStyles[variant],
        ...(hover ? hoverEffect : {}),
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        setIsHovered(true);
        onMouseEnterProp?.(e);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        onMouseLeaveProp?.(e);
      }}
    >
      {(title || subtitle || headerAction) && (
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {icon && (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--primary-light), var(--bg-tertiary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-color)',
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h3
                  style={{
                    margin: 0,
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p
                  style={{
                    margin: '2px 0 0 0',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {headerAction && <div style={{ flexShrink: 0 }}>{headerAction}</div>}
        </div>
      )}
      <div style={{ padding: '20px' }}>{children}</div>
      {footer && (
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-tertiary)',
          }}
        >
          {footer}
        </div>
      )}
    </motion.div>
  );
};

export const CardGrid: React.FC<{
  children: React.ReactNode;
  cols?: number;
  gap?: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, cols = 3, gap = 'var(--spacing-lg)', className = '', style = {} }) => (
  <div
    className={className}
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gap,
      ...style,
    }}
  >
    {children}
  </div>
);
