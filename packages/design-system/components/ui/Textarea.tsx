'use client';

import React from 'react';

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  /** Textarea size */
  size?: 'sm' | 'md' | 'lg';
  /** Show error state */
  hasError?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Show character count */
  showCharCount?: boolean;
  /** Auto-grow height based on content */
  autoGrow?: boolean;
}

/**
 * Textarea Component
 *
 * A multi-line text input field with optional auto-grow, character count, and error states.
 *
 * @example
 * ```tsx
 * <Textarea
 *   placeholder="Enter your message..."
 *   maxLength={500}
 *   showCharCount
 *   autoGrow
 * />
 * ```
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    size = 'md',
    hasError = false,
    errorMessage,
    showCharCount = false,
    autoGrow = false,
    maxLength,
    value,
    onChange,
    className = '',
    style,
    ...props
  }, ref) => {
    const [charCount, setCharCount] = React.useState(
      typeof value === 'string' ? value.length : 0
    );

    const sizeStyles = {
      sm: {
        padding: 'var(--spacing-sm) var(--spacing-md)',
        fontSize: 'var(--font-size-sm)',
        minHeight: '80px',
      },
      md: {
        padding: 'var(--spacing-md) var(--spacing-lg)',
        fontSize: 'var(--font-size-md)',
        minHeight: '120px',
      },
      lg: {
        padding: 'var(--spacing-lg) var(--spacing-xl)',
        fontSize: 'var(--font-size-lg)',
        minHeight: '160px',
      },
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);

      if (autoGrow) {
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
      }

      onChange?.(e);
    };

    const baseStyle: React.CSSProperties = {
      fontFamily: 'var(--font-family)',
      border: `2px solid ${hasError ? 'var(--color-error)' : 'var(--color-border)'}`,
      borderRadius: 'var(--radius-md)',
      backgroundColor: 'var(--color-surface)',
      color: 'var(--color-text-primary)',
      transition: 'all var(--animation-fast)',
      outline: 'none',
      fontWeight: 'var(--font-weight-regular)',
      resize: autoGrow ? 'none' : 'vertical',
      ...sizeStyles[size],
      ...style,
    };

    return (
      <div>
        <textarea
          ref={ref}
          value={value}
          onChange={handleChange}
          maxLength={maxLength}
          style={baseStyle}
          className={`textarea textarea--${size}${hasError ? ' textarea--error' : ''} ${className}`}
          {...props}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-xs)', gap: 'var(--spacing-md)' }}>
          {hasError && errorMessage && (
            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-error)' }}>
              {errorMessage}
            </p>
          )}

          {showCharCount && (
            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>
              {charCount}
              {maxLength ? ` / ${maxLength}` : ''} characters
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
