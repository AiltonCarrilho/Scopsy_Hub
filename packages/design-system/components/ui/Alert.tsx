'use client';

import React from 'react';
import { AlertCircle, CheckCircle, XCircle, Info, X } from 'lucide-react';

export interface AlertProps {
  /** Alert type/variant */
  variant?: 'info' | 'success' | 'warning' | 'error';
  /** Alert title */
  title?: string;
  /** Alert description */
  description?: string;
  /** Show close button */
  dismissible?: boolean;
  /** Callback when closed */
  onClose?: () => void;
  /** Custom content instead of description */
  children?: React.ReactNode;
  /** Custom className */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
}

/**
 * Alert Component
 *
 * A flexible alert box for displaying messages, warnings, errors, and info.
 * Supports dismissible alerts with optional close button.
 *
 * @example
 * ```tsx
 * <Alert variant="success" title="Success!" description="Your action completed." />
 *
 * <Alert
 *   variant="error"
 *   title="Error"
 *   description="Something went wrong"
 *   dismissible
 *   onClose={handleClose}
 * />
 *
 * <Alert variant="warning">
 *   <strong>Warning:</strong> This action cannot be undone.
 * </Alert>
 * ```
 */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({
    variant = 'info',
    title,
    description,
    dismissible = false,
    onClose,
    children,
    className = '',
    style,
  }, ref) => {
    const variantStyles = {
      info: {
        backgroundColor: 'rgba(0, 140, 226, 0.1)',
        borderColor: 'var(--color-primary)',
        color: 'var(--color-primary)',
        icon: <Info size={20} />,
      },
      success: {
        backgroundColor: 'rgba(45, 212, 191, 0.1)',
        borderColor: 'var(--color-success)',
        color: 'var(--color-success)',
        icon: <CheckCircle size={20} />,
      },
      warning: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: 'var(--color-warning)',
        color: 'var(--color-warning)',
        icon: <AlertCircle size={20} />,
      },
      error: {
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        borderColor: 'var(--color-error)',
        color: 'var(--color-error)',
        icon: <XCircle size={20} />,
      },
    };

    const variantStyle = variantStyles[variant];

    const alertStyle: React.CSSProperties = {
      display: 'flex',
      gap: 'var(--spacing-md)',
      padding: 'var(--spacing-md) var(--spacing-lg)',
      borderRadius: 'var(--radius-md)',
      border: `1px solid ${variantStyle.borderColor}`,
      backgroundColor: variantStyle.backgroundColor,
      color: variantStyle.color,
      ...style,
    };

    const iconStyle: React.CSSProperties = {
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      marginTop: '2px',
    };

    const contentStyle: React.CSSProperties = {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--spacing-xs)',
    };

    const titleStyle: React.CSSProperties = {
      margin: 0,
      fontWeight: 'var(--font-weight-semibold)',
      fontSize: 'var(--font-size-md)',
    };

    const descriptionStyle: React.CSSProperties = {
      margin: 0,
      fontSize: 'var(--font-size-sm)',
      opacity: 0.9,
    };

    const closeButtonStyle: React.CSSProperties = {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 0,
      color: 'inherit',
      display: 'flex',
      alignItems: 'center',
      alignSelf: 'flex-start',
      transition: 'opacity var(--animation-fast)',
    };

    return (
      <div
        ref={ref}
        style={alertStyle}
        className={`alert alert--${variant} ${className}`}
        role="alert"
      >
        <div style={iconStyle}>{variantStyle.icon}</div>

        <div style={contentStyle}>
          {title && <h3 style={titleStyle}>{title}</h3>}
          {description && <p style={descriptionStyle}>{description}</p>}
          {children && !description && <div>{children}</div>}
        </div>

        {dismissible && (
          <button
            onClick={onClose}
            style={closeButtonStyle}
            aria-label="Close alert"
          >
            <X size={18} />
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';
