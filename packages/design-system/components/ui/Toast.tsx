'use client';

import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

export interface ToastProps {
  /** Toast type/variant */
  type?: 'success' | 'warning' | 'error' | 'info';
  /** Toast title/message */
  title: string;
  /** Optional description */
  description?: string;
  /** Show action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Auto-dismiss duration (ms), 0 = persistent */
  duration?: number;
  /** Callback when toast closes */
  onClose?: () => void;
  /** Whether toast is visible */
  isOpen?: boolean;
}

/**
 * Toast Component
 *
 * A notification message that appears temporarily or persistently.
 * Used for success, error, warning, and info messages.
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(true);
 *
 * return (
 *   <Toast
 *     type="success"
 *     title="Success!"
 *     description="Your changes have been saved."
 *     duration={3000}
 *     onClose={() => setIsOpen(false)}
 *     isOpen={isOpen}
 *   />
 * );
 * ```
 */
export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({
    type = 'info',
    title,
    description,
    action,
    duration = 3000,
    onClose,
    isOpen = true,
  }, ref) => {
    // Auto-dismiss logic
    useEffect(() => {
      if (!isOpen || duration === 0) return;

      const timer = setTimeout(() => {
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }, [isOpen, duration, onClose]);

    if (!isOpen) return null;

    const typeStyles = {
      success: {
        background: 'rgba(45, 212, 191, 0.1)',
        color: 'var(--color-success)',
        icon: <CheckCircle size={20} />,
      },
      warning: {
        background: 'rgba(245, 158, 11, 0.1)',
        color: 'var(--color-warning)',
        icon: <AlertCircle size={20} />,
      },
      error: {
        background: 'rgba(220, 38, 38, 0.1)',
        color: 'var(--color-error)',
        icon: <XCircle size={20} />,
      },
      info: {
        background: 'rgba(0, 140, 226, 0.1)',
        color: 'var(--color-primary)',
        icon: <Info size={20} />,
      },
    };

    const toastStyle: React.CSSProperties = {
      display: 'flex',
      gap: 'var(--spacing-md)',
      padding: 'var(--spacing-md) var(--spacing-lg)',
      borderRadius: 'var(--radius-md)',
      backgroundColor: typeStyles[type].background,
      color: typeStyles[type].color,
      border: `1px solid ${typeStyles[type].color}`,
      boxShadow: 'var(--shadow-lg)',
      maxWidth: '400px',
      animation: 'slideDown var(--animation-fast)',
    };

    const contentStyle: React.CSSProperties = {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--spacing-xs)',
    };

    const titleStyle: React.CSSProperties = {
      fontWeight: 'var(--font-weight-semibold)',
      fontSize: 'var(--font-size-md)',
      margin: 0,
    };

    const descriptionStyle: React.CSSProperties = {
      fontSize: 'var(--font-size-sm)',
      margin: 0,
      opacity: 0.9,
    };

    const actionStyle: React.CSSProperties = {
      whiteSpace: 'nowrap',
      cursor: 'pointer',
      fontWeight: 'var(--font-weight-semibold)',
      textDecoration: 'underline',
      padding: 'var(--spacing-xs)',
      marginRight: 'var(--spacing-sm)',
    };

    const closeButtonStyle: React.CSSProperties = {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 0,
      color: 'inherit',
      display: 'flex',
      alignItems: 'center',
    };

    return (
      <div ref={ref} style={toastStyle} className={`toast toast--${type}`}>
        <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: '2px' }}>
          {typeStyles[type].icon}
        </div>

        <div style={contentStyle}>
          <h3 style={titleStyle}>{title}</h3>
          {description && <p style={descriptionStyle}>{description}</p>}
          {action && (
            <button
              onClick={action.onClick}
              style={actionStyle}
              aria-label={action.label}
            >
              {action.label}
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          style={closeButtonStyle}
          aria-label="Close toast"
        >
          <X size={18} />
        </button>
      </div>
    );
  }
);

Toast.displayName = 'Toast';
