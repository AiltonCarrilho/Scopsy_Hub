import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card variant/shadow */
  variant?: 'default' | 'elevated' | 'outlined';
  /** Padding inside card */
  padding?: 'sm' | 'md' | 'lg';
}

/**
 * Card Component
 *
 * A container for grouping related content with consistent styling.
 *
 * @example
 * ```tsx
 * <Card variant="elevated" padding="lg">
 *   <h2>Card Title</h2>
 *   <p>Card content goes here</p>
 * </Card>
 * ```
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({
    variant = 'default',
    padding = 'md',
    children,
    className = '',
    style,
    ...props
  }, ref) => {
    const variantStyles = {
      default: {
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      },
      elevated: {
        backgroundColor: 'var(--color-surface)',
        boxShadow: 'var(--shadow-lg)',
      },
      outlined: {
        backgroundColor: 'transparent',
        border: '2px solid var(--color-border)',
      },
    };

    const paddingStyles = {
      sm: 'var(--spacing-sm)',
      md: 'var(--spacing-md)',
      lg: 'var(--spacing-lg)',
    };

    const defaultStyle: React.CSSProperties = {
      borderRadius: 'var(--radius-lg)',
      padding: paddingStyles[padding],
      transition: `all var(--animation-fast) var(--animation-curve)`,
      ...variantStyles[variant],
    };

    return (
      <div
        ref={ref}
        style={{ ...defaultStyle, ...style }}
        className={`card card--${variant} card--padding-${padding} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
