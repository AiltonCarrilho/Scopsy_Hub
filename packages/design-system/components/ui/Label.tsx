import React from 'react';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Show required indicator */
  required?: boolean;
  /** Help text shown below label */
  helpText?: string;
}

/**
 * Label Component
 *
 * A form label with optional required indicator and help text.
 *
 * @example
 * ```tsx
 * <Label htmlFor="email" required>Email Address</Label>
 * <Input id="email" type="email" />
 *
 * <Label htmlFor="password" required helpText="At least 8 characters">
 *   Password
 * </Label>
 * <Input id="password" type="password" />
 * ```
 */
export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({
    required = false,
    helpText,
    children,
    className = '',
    style,
    ...props
  }, ref) => {
    const defaultStyle: React.CSSProperties = {
      display: 'block',
      fontFamily: 'var(--font-family)',
      fontSize: 'var(--font-size-sm)',
      fontWeight: 'var(--font-weight-semibold)',
      color: 'var(--color-text-primary)',
      marginBottom: 'var(--spacing-sm)',
    };

    return (
      <div>
        <label
          ref={ref}
          style={{ ...defaultStyle, ...style }}
          className={`label ${className}`}
          {...props}
        >
          {children}
          {required && (
            <span
              style={{
                color: 'var(--color-error)',
                marginLeft: 'var(--spacing-xs)',
              }}
              aria-label="required"
            >
              *
            </span>
          )}
        </label>

        {helpText && (
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              margin: 'var(--spacing-xs) 0 0 0',
            }}
          >
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

Label.displayName = 'Label';
