'use client';

import React from 'react';
import { Check, Minus } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Checkbox label */
  label?: string;
  /** Indeterminate state (for parent checkboxes) */
  indeterminate?: boolean;
  /** Checkbox size */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Checkbox Component
 *
 * A checkbox input with optional label and support for indeterminate state.
 *
 * @example
 * ```tsx
 * const [checked, setChecked] = useState(false);
 *
 * return (
 *   <Checkbox
 *     checked={checked}
 *     onChange={(e) => setChecked(e.target.checked)}
 *     label="I agree to the terms"
 *   />
 * );
 * ```
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({
    label,
    indeterminate = false,
    size = 'md',
    disabled = false,
    className = '',
    style,
    ...props
  }, ref) => {
    const sizeStyles = {
      sm: { width: '16px', height: '16px' },
      md: { width: '20px', height: '20px' },
      lg: { width: '24px', height: '24px' },
    };

    const checkboxStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...sizeStyles[size],
      borderRadius: 'var(--radius-sm)',
      border: '2px solid var(--color-border)',
      backgroundColor: 'var(--color-surface)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all var(--animation-fast)',
      opacity: disabled ? 0.6 : 1,
    };

    const isChecked = props.checked;

    const containerStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--spacing-sm)',
      cursor: disabled ? 'not-allowed' : 'pointer',
    };

    const labelStyle: React.CSSProperties = {
      fontSize: 'var(--font-size-md)',
      color: 'var(--color-text-primary)',
      userSelect: 'none',
      fontWeight: 'var(--font-weight-regular)',
    };

    return (
      <label style={{ ...containerStyle, ...style }} className={`checkbox ${className}`}>
        <div
          style={{
            ...checkboxStyle,
            backgroundColor: isChecked ? 'var(--color-primary)' : 'var(--color-surface)',
            borderColor: isChecked ? 'var(--color-primary)' : 'var(--color-border)',
          }}
        >
          {isChecked && (
            indeterminate ? (
              <Minus size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} color="white" />
            ) : (
              <Check size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} color="white" />
            )
          )}
        </div>

        <input
          ref={ref}
          type="checkbox"
          disabled={disabled}
          style={{ display: 'none' }}
          {...props}
        />

        {label && <span style={labelStyle}>{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

/**
 * Radio Component
 *
 * A radio input with optional label.
 * Should be grouped using RadioGroup component.
 */
export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Radio label */
  label?: string;
  /** Radio size */
  size?: 'sm' | 'md' | 'lg';
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({
    label,
    size = 'md',
    disabled = false,
    className = '',
    style,
    ...props
  }, ref) => {
    const sizeStyles = {
      sm: { width: '16px', height: '16px' },
      md: { width: '20px', height: '20px' },
      lg: { width: '24px', height: '24px' },
    };

    const radioStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...sizeStyles[size],
      borderRadius: 'var(--radius-full)',
      border: '2px solid var(--color-border)',
      backgroundColor: 'var(--color-surface)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all var(--animation-fast)',
      opacity: disabled ? 0.6 : 1,
    };

    const isChecked = props.checked;

    const containerStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--spacing-sm)',
      cursor: disabled ? 'not-allowed' : 'pointer',
    };

    const labelStyle: React.CSSProperties = {
      fontSize: 'var(--font-size-md)',
      color: 'var(--color-text-primary)',
      userSelect: 'none',
      fontWeight: 'var(--font-weight-regular)',
    };

    return (
      <label style={{ ...containerStyle, ...style }} className={`radio ${className}`}>
        <div
          style={{
            ...radioStyle,
            borderColor: isChecked ? 'var(--color-primary)' : 'var(--color-border)',
          }}
        >
          {isChecked && (
            <div
              style={{
                width: size === 'sm' ? '6px' : size === 'md' ? '8px' : '10px',
                height: size === 'sm' ? '6px' : size === 'md' ? '8px' : '10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary)',
              }}
            />
          )}
        </div>

        <input
          ref={ref}
          type="radio"
          disabled={disabled}
          style={{ display: 'none' }}
          {...props}
        />

        {label && <span style={labelStyle}>{label}</span>}
      </label>
    );
  }
);

Radio.displayName = 'Radio';
