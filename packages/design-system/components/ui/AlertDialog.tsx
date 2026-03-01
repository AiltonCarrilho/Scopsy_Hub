'use client';

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface AlertDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Dialog title */
  title: string;
  /** Dialog description */
  description?: string;
  /** Confirm button label */
  confirmLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Confirm button callback */
  onConfirm: () => void;
  /** Cancel button callback */
  onCancel?: () => void;
  /** Whether this is a destructive action */
  destructive?: boolean;
  /** Loading state for confirm button */
  isLoading?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * AlertDialog Component
 *
 * A confirmation dialog built on top of Modal.
 * Used for confirming important or destructive actions.
 *
 * @example
 * ```tsx
 * <AlertDialog
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Delete Account?"
 *   description="This action cannot be undone. All your data will be permanently deleted."
 *   confirmLabel="Delete Account"
 *   cancelLabel="Cancel"
 *   onConfirm={handleDelete}
 *   destructive
 * />
 * ```
 */
export const AlertDialog = React.forwardRef<HTMLDivElement, AlertDialogProps>(
  ({
    isOpen,
    onClose,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    destructive = false,
    isLoading = false,
    className = '',
  }, ref) => {
    const handleConfirm = () => {
      onConfirm();
    };

    const handleCancel = () => {
      onCancel?.();
      onClose();
    };

    const contentStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--spacing-lg)',
    };

    const descriptionStyle: React.CSSProperties = {
      margin: 0,
      fontSize: 'var(--font-size-md)',
      color: 'var(--color-text-secondary)',
      lineHeight: 1.6,
    };

    const actionsStyle: React.CSSProperties = {
      display: 'flex',
      gap: 'var(--spacing-md)',
      justifyContent: 'flex-end',
      marginTop: 'var(--spacing-md)',
    };

    return (
      <Modal
        ref={ref}
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        size="md"
        className={className}
      >
        <div style={contentStyle}>
          {description && <p style={descriptionStyle}>{description}</p>}

          <div style={actionsStyle}>
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>

            <Button
              variant={destructive ? 'danger' : 'primary'}
              onClick={handleConfirm}
              isLoading={isLoading}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }
);

AlertDialog.displayName = 'AlertDialog';
