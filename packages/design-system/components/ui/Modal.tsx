'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg';
  /** Close on Escape key */
  closeOnEscape?: boolean;
  /** Close on backdrop click */
  closeOnBackdropClick?: boolean;
  /** Modal content */
  children: React.ReactNode;
  /** Custom className for modal content */
  className?: string;
}

/**
 * Modal Component
 *
 * A flexible modal dialog with customizable size, content, and behavior.
 * Includes keyboard support (Escape), focus trapping, and backdrop.
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * return (
 *   <>
 *     <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
 *
 *     <Modal
 *       isOpen={isOpen}
 *       onClose={() => setIsOpen(false)}
 *       title="Confirm Action"
 *       size="md"
 *     >
 *       <p>Are you sure?</p>
 *       <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
 *         <Button variant="outline" onClick={() => setIsOpen(false)}>
 *           Cancel
 *         </Button>
 *         <Button variant="danger" onClick={handleConfirm}>
 *           Delete
 *         </Button>
 *       </div>
 *     </Modal>
 *   </>
 * );
 * ```
 */
export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({
    isOpen,
    onClose,
    title,
    size = 'md',
    closeOnEscape = true,
    closeOnBackdropClick = true,
    children,
    className = '',
  }, ref) => {
    // Handle Escape key
    useEffect(() => {
      if (!isOpen || !closeOnEscape) return;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, closeOnEscape, onClose]);

    // Focus management
    useEffect(() => {
      if (!isOpen) return;

      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeStyles = {
      sm: { maxWidth: '400px', width: '90vw' },
      md: { maxWidth: '600px', width: '90vw' },
      lg: { maxWidth: '900px', width: '90vw' },
    };

    const backdropStyle: React.CSSProperties = {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
    };

    const contentStyle: React.CSSProperties = {
      backgroundColor: 'var(--color-surface)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--spacing-lg)',
      boxShadow: 'var(--shadow-xl)',
      maxHeight: '90vh',
      overflowY: 'auto',
      ...sizeStyles[size],
    };

    const headerStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 'var(--spacing-lg)',
      paddingBottom: 'var(--spacing-md)',
      borderBottom: '1px solid var(--color-border)',
    };

    const closeButtonStyle: React.CSSProperties = {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 'var(--spacing-xs)',
      color: 'var(--color-text-secondary)',
      transition: 'color var(--animation-fast)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--radius-md)',
    };

    return (
      <div
        style={backdropStyle}
        onClick={(e) => {
          if (closeOnBackdropClick && e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          ref={ref}
          style={contentStyle}
          className={`modal modal--${size} ${className}`}
        >
          {title && (
            <div style={headerStyle}>
              <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                {title}
              </h2>
              <button
                onClick={onClose}
                style={closeButtonStyle}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
          )}

          {children}
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';
