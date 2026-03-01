import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant style */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether button is loading */
  isLoading?: boolean;
  /** Button icon (left side) */
  icon?: React.ReactNode;
  /** Make button full width */
  fullWidth?: boolean;
}

/**
 * Button Component
 *
 * A versatile button component with multiple variants and sizes.
 * Supports icons, loading state, and different visual styles.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md">Click me</Button>
 * <Button variant="outline" icon={<ChevronRight />}>Continue</Button>
 * <Button isLoading>Saving...</Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    icon,
    fullWidth = false,
    disabled,
    children,
    className = '',
    ...props
  }, ref) => {
    // Base styles
    const baseStyles = `
      font-family: var(--font-family);
      font-weight: var(--font-weight-semibold);
      border-radius: var(--radius-md);
      border: none;
      cursor: pointer;
      transition: all var(--animation-fast) var(--animation-curve);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      font-size: var(--font-size-md);
      line-height: 1.5;
      ${fullWidth ? 'width: 100%;' : ''}
      ${disabled || isLoading ? 'opacity: 0.6; cursor: not-allowed;' : ''}
    `;

    // Variant styles
    const variantStyles = {
      primary: `
        background: linear-gradient(135deg, var(--color-primary-start), var(--color-primary-end));
        color: white;
        box-shadow: var(--shadow-md);

        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        &:active:not(:disabled) {
          transform: translateY(0);
        }
      `,
      secondary: `
        background-color: var(--color-text-secondary);
        color: white;

        &:hover:not(:disabled) {
          background-color: var(--color-text-secondary);
          opacity: 0.9;
        }
      `,
      outline: `
        background-color: transparent;
        color: var(--color-primary);
        border: 2px solid var(--color-primary);

        &:hover:not(:disabled) {
          background-color: var(--color-primary);
          color: white;
        }
      `,
      ghost: `
        background-color: transparent;
        color: var(--color-text-primary);

        &:hover:not(:disabled) {
          background-color: var(--color-border);
        }
      `,
      danger: `
        background-color: var(--color-error);
        color: white;

        &:hover:not(:disabled) {
          opacity: 0.9;
        }
      `,
    };

    // Size styles
    const sizeStyles = {
      sm: 'padding: var(--spacing-sm) var(--spacing-md); font-size: var(--font-size-sm);',
      md: 'padding: var(--spacing-md) var(--spacing-lg); font-size: var(--font-size-md);',
      lg: 'padding: var(--spacing-lg) var(--spacing-xl); font-size: var(--font-size-lg);',
    };

    const combinedStyle = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${className}
    `;

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        style={{
          whiteSpace: 'nowrap',
        } as React.CSSProperties}
        className={`button button--${variant} button--${size}${fullWidth ? ' button--full-width' : ''}`}
        {...props}
      >
        {icon && !isLoading && <span className="button-icon">{icon}</span>}
        {isLoading && (
          <span className="button-loader" style={{
            display: 'inline-block',
            width: '1em',
            height: '1em',
            border: '2px solid currentColor',
            borderRightColor: 'transparent',
            borderRadius: 'var(--radius-full)',
            animation: 'spin var(--animation-slow) linear infinite',
          }} />
        )}
        {children}
        <style jsx>{`
          .button {
            ${combinedStyle}
          }
        `}</style>
      </button>
    );
  }
);

Button.displayName = 'Button';
