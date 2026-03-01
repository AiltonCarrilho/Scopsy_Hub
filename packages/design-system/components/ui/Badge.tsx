import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Badge color variant */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'primary';
  /** Badge size */
  size?: 'sm' | 'md';
}

/**
 * Badge Component
 *
 * A small label for highlighting key information or status.
 * Used for tags, status indicators, and achievement markers.
 *
 * @example
 * ```tsx
 * <Badge variant="success">Completed</Badge>
 * <Badge variant="warning" size="sm">In Progress</Badge>
 * <Badge variant="primary">TCC Mastery</Badge>
 * ```
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({
    variant = 'default',
    size = 'md',
    children,
    className = '',
    style,
    ...props
  }, ref) => {
    const variantStyles = {
      default: {
        backgroundColor: 'var(--color-border)',
        color: 'var(--color-text-secondary)',
      },
      success: {
        backgroundColor: 'rgba(45, 212, 191, 0.1)',
        color: 'var(--color-success)',
      },
      warning: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        color: 'var(--color-warning)',
      },
      error: {
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        color: 'var(--color-error)',
      },
      primary: {
        backgroundColor: 'rgba(0, 140, 226, 0.1)',
        color: 'var(--color-primary)',
      },
    };

    const sizeStyles = {
      sm: {
        padding: 'var(--spacing-xs) var(--spacing-sm)',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 'var(--font-weight-semibold)',
      },
      md: {
        padding: 'var(--spacing-sm) var(--spacing-md)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-semibold)',
      },
    };

    const defaultStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: 'var(--radius-full)',
      whiteSpace: 'nowrap',
      ...variantStyles[variant],
      ...sizeStyles[size],
    };

    return (
      <span
        ref={ref}
        style={{ ...defaultStyle, ...style }}
        className={`badge badge--${variant} badge--${size} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
