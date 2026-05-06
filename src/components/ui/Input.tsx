import React, { forwardRef } from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  helper?: string;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helper, error, prefix, suffix, className = '', style = {}, ...props }, ref) => {
    return (
      <div style={{ width: '100%' }}>
        {label && (
          <label
            style={{
              display: 'block',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--text-secondary)',
              marginBottom: '6px',
              letterSpacing: '-0.005em',
            }}
          >
            {label}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {prefix && (
            <span
              style={{
                position: 'absolute',
                left: '12px',
                color: 'var(--text-muted)',
                display: 'flex',
                pointerEvents: 'none',
              }}
            >
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            className={className}
            style={{
              width: '100%',
              padding: prefix ? '10px 12px 10px 36px' : '10px 14px',
              paddingRight: suffix ? '36px' : undefined,
              border: `1px solid ${error ? 'var(--error-color)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-size-md)',
              fontFamily: 'inherit',
              transition: 'all var(--transition-fast)',
              outline: 'none',
              ...style,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = error
                ? 'var(--error-color)'
                : 'var(--primary-color)';
              e.currentTarget.style.boxShadow = error
                ? '0 0 0 3px var(--error-light)'
                : '0 0 0 3px var(--primary-light)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error
                ? 'var(--error-color)'
                : 'var(--border-color)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            {...props}
          />
          {suffix && (
            <span
              style={{
                position: 'absolute',
                right: '12px',
                color: 'var(--text-muted)',
                display: 'flex',
                pointerEvents: 'none',
              }}
            >
              {suffix}
            </span>
          )}
        </div>
        {(helper || error) && (
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: error ? 'var(--error-color)' : 'var(--text-muted)',
              marginTop: '4px',
              marginBottom: 0,
            }}
          >
            {error || helper}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
