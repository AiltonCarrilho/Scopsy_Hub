import React from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input size */
  size?: 'sm' | 'md' | 'lg';
  /** Show error state */
  hasError?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Left icon/addon */
  leftIcon?: React.ReactNode;
  /** Right icon/addon */
  rightIcon?: React.ReactNode;
}

/**
 * Input Component
 *
 * A flexible text input field with support for icons, error states, and different sizes.
 *
 * @example
 * ```tsx
 * <Input placeholder="Enter your email" type="email" />
 * <Input leftIcon={<Mail />} placeholder="Email address" />
 * <Input hasError errorMessage="Invalid email" />
 * ```
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    size = 'md',
    hasError = false,
    errorMessage,
    leftIcon,
    rightIcon,
    className = '',
    style,
    disabled,
    ...props
  }, ref) => {
    const sizeStyles = {
      sm: {
        padding: 'var(--spacing-sm) var(--spacing-md)',
        fontSize: 'var(--font-size-sm)',
      },
      md: {
        padding: 'var(--spacing-md) var(--spacing-lg)',
        fontSize: 'var(--font-size-md)',
      },
      lg: {
        padding: 'var(--spacing-lg) var(--spacing-xl)',
        fontSize: 'var(--font-size-lg)',
      },
    };

    const baseStyle: React.CSSProperties = {
      fontFamily: 'var(--font-family)',
      border: `2px solid ${hasError ? 'var(--color-error)' : 'var(--color-border)'}`,
      borderRadius: 'var(--radius-md)',
      backgroundColor: disabled ? 'var(--color-border)' : 'var(--color-surface)',
      color: 'var(--color-text-primary)',
      transition: 'all var(--animation-fast) var(--animation-curve)',
      outline: 'none',
      ...sizeStyles[size],
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
      paddingLeft: leftIcon ? 'calc(var(--spacing-xl) * 2 + 8px)' : undefined,
      paddingRight: rightIcon ? 'calc(var(--spacing-xl) * 2 + 8px)' : undefined,
    };

    return (
      <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
        {leftIcon && (
          <span
            style={{
              position: 'absolute',
              left: 'var(--spacing-md)',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-text-secondary)',
              pointerEvents: 'none',
            }}
          >
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          disabled={disabled}
          style={{ ...baseStyle, ...style }}
          className={`input input--${size}${hasError ? ' input--error' : ''} ${className}`}
          {...props}
        />

        {rightIcon && (
          <span
            style={{
              position: 'absolute',
              right: 'var(--spacing-md)',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-text-secondary)',
              pointerEvents: 'none',
            }}
          >
            {rightIcon}
          </span>
        )}

        {hasError && errorMessage && (
          <p
            style={{
              margin: 'var(--spacing-xs) 0 0 0',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-error)',
            }}
          >
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
