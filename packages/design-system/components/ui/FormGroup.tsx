'use client';

import React from 'react';

export interface FormGroupProps {
  /** Label text */
  label?: string;
  /** Input ID for label association */
  htmlFor?: string;
  /** Whether field is required */
  required?: boolean;
  /** Help text shown below input */
  helpText?: string;
  /** Error message */
  errorMessage?: string;
  /** Show error state */
  hasError?: boolean;
  /** Form input or component */
  children: React.ReactNode;
  /** Custom wrapper className */
  className?: string;
  /** Custom wrapper style */
  style?: React.CSSProperties;
}

/**
 * FormGroup Component
 *
 * A composite component that wraps form inputs with label, error, and help text.
 * Provides consistent styling and layout for form fields.
 *
 * @example
 * ```tsx
 * <FormGroup
 *   label="Email"
 *   htmlFor="email"
 *   required
 *   helpText="We'll never share your email"
 * >
 *   <Input id="email" type="email" placeholder="your@email.com" />
 * </FormGroup>
 *
 * <FormGroup
 *   label="Password"
 *   htmlFor="password"
 *   required
 *   hasError={!!passwordError}
 *   errorMessage={passwordError}
 * >
 *   <Input id="password" type="password" />
 * </FormGroup>
 * ```
 */
export const FormGroup = React.forwardRef<HTMLDivElement, FormGroupProps>(
  ({
    label,
    htmlFor,
    required = false,
    helpText,
    errorMessage,
    hasError = false,
    children,
    className = '',
    style,
  }, ref) => {
    const wrapperStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--spacing-xs)',
      ...style,
    };

    const labelStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'baseline',
      gap: 'var(--spacing-xs)',
      fontSize: 'var(--font-size-sm)',
      fontWeight: 'var(--font-weight-semibold)',
      color: 'var(--color-text-primary)',
    };

    const requiredStyle: React.CSSProperties = {
      color: 'var(--color-error)',
    };

    const helpStyle: React.CSSProperties = {
      margin: 0,
      fontSize: 'var(--font-size-sm)',
      color: 'var(--color-text-secondary)',
    };

    const errorStyle: React.CSSProperties = {
      margin: 0,
      fontSize: 'var(--font-size-sm)',
      color: 'var(--color-error)',
    };

    return (
      <div
        ref={ref}
        style={wrapperStyle}
        className={`form-group ${className}`}
      >
        {label && (
          <label style={labelStyle} htmlFor={htmlFor}>
            <span>{label}</span>
            {required && <span style={requiredStyle}>*</span>}
          </label>
        )}

        {children}

        {hasError && errorMessage ? (
          <p style={errorStyle} role="alert">
            {errorMessage}
          </p>
        ) : (
          helpText && <p style={helpStyle}>{helpText}</p>
        )}
      </div>
    );
  }
);

FormGroup.displayName = 'FormGroup';
