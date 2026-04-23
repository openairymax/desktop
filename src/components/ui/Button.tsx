import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  style = {},
  title,
}) => {
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: {
      padding: '6px 14px',
      fontSize: 'var(--font-size-sm)',
      gap: '4px',
    },
    md: {
      padding: '8px 16px',
      fontSize: 'var(--font-size-md)',
    },
    lg: {
      padding: '12px 24px',
      fontSize: 'var(--font-size-lg)',
    },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, var(--primary-color), var(--info-color))',
      color: 'white',
      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3), 0 0 0 1px rgba(99, 102, 241, 0.1) inset',
    },
    secondary: {
      backgroundColor: 'var(--bg-tertiary)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-color)',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent',
    },
    danger: {
      background: 'linear-gradient(135deg, var(--error-color), #f87171)',
      color: 'white',
      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
    },
    success: {
      background: 'linear-gradient(135deg, var(--success-color), #4ade80)',
      color: 'white',
      boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
    },
  };

  const hoverStyles: Record<string, React.CSSProperties> = {
    primary: {
      boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.2) inset',
      transform: 'translateY(-1px)',
    },
    secondary: {
      backgroundColor: 'var(--border-color)',
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    ghost: {
      backgroundColor: 'var(--bg-tertiary)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-color)',
      transform: 'translateY(-1px)',
    },
    danger: {
      boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
      transform: 'translateY(-1px)',
    },
    success: {
      boxShadow: '0 4px 16px rgba(34, 197, 94, 0.4)',
      transform: 'translateY(-1px)',
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        border: variant === 'secondary' ? '1px solid var(--border-color)' : 'none',
        borderRadius: 'var(--radius-md)',
        fontWeight: 'var(--font-weight-normal)',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'all var(--transition-base)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'inherit',
        letterSpacing: 'var(--letter-spacing-normal)',
        whiteSpace: 'nowrap',
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
        opacity: disabled || loading ? 0.5 : 1,
      }}
      title={title}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, hoverStyles[variant]);
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, variantStyles[variant]);
          e.currentTarget.style.transform = 'none';
        }
      }}
      onMouseDown={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'scale(0.97)';
        }
      }}
      onMouseUp={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = hoverStyles[variant].transform || 'none';
        }
      }}
    >
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div className="animate-spin" style={{
            width: size === 'sm' ? '12px' : size === 'md' ? '14px' : '16px',
            height: size === 'sm' ? '12px' : size === 'md' ? '14px' : '16px',
            border: `2px solid ${variant === 'primary' || variant === 'danger' || variant === 'success' ? 'rgba(255, 255, 255, 0.3)' : 'var(--border-color)'}`,
            borderTopColor: variant === 'primary' || variant === 'danger' || variant === 'success' ? 'white' : 'var(--text-primary)',
            borderRadius: '50%',
          }} />
          <span>处理中...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};
