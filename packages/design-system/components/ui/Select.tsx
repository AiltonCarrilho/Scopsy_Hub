'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Select options */
  options: SelectOption[];
  /** Selected value(s) */
  value?: string | string[];
  /** Change handler */
  onChange?: (value: string | string[]) => void;
  /** Multiple selection support */
  multiple?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Select size */
  size?: 'sm' | 'md' | 'lg';
  /** Placeholder text */
  placeholder?: string;
  /** Show error state */
  hasError?: boolean;
  /** Error message */
  errorMessage?: string;
}

/**
 * Select Component
 *
 * A dropdown select component supporting single and multiple selection.
 * Keyboard accessible with arrow keys, Enter, and Escape support.
 *
 * @example
 * ```tsx
 * const [selected, setSelected] = useState('option1');
 *
 * return (
 *   <Select
 *     options={[
 *       { value: 'option1', label: 'Option 1' },
 *       { value: 'option2', label: 'Option 2' },
 *     ]}
 *     value={selected}
 *     onChange={setSelected}
 *     placeholder="Select an option"
 *   />
 * );
 * ```
 */
export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({
    options,
    value,
    onChange,
    multiple = false,
    disabled = false,
    size = 'md',
    placeholder = 'Select...',
    hasError = false,
    errorMessage,
    className = '',
    style,
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Convert single value to array for easier handling
    const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

    // Get selected labels
    const getSelectedLabel = () => {
      if (selectedValues.length === 0) return placeholder;
      if (selectedValues.length === 1) {
        return options.find((o) => o.value === selectedValues[0])?.label || placeholder;
      }
      return `${selectedValues.length} selected`;
    };

    // Handle selection
    const handleSelect = (optionValue: string) => {
      if (multiple) {
        const newValues = selectedValues.includes(optionValue)
          ? selectedValues.filter((v) => v !== optionValue)
          : [...selectedValues, optionValue];
        onChange?.(newValues);
      } else {
        onChange?.(optionValue);
        setIsOpen(false);
      }
    };

    // Handle keyboard navigation
    useEffect(() => {
      if (!isOpen) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setHighlightedIndex((prev) => (prev + 1) % options.length);
            break;
          case 'ArrowUp':
            e.preventDefault();
            setHighlightedIndex((prev) => (prev - 1 + options.length) % options.length);
            break;
          case 'Enter':
            e.preventDefault();
            handleSelect(options[highlightedIndex].value);
            break;
          case 'Escape':
            e.preventDefault();
            setIsOpen(false);
            break;
          default:
            break;
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, highlightedIndex, options]);

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const sizeStyles = {
      sm: { padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: 'var(--font-size-sm)' },
      md: { padding: 'var(--spacing-md) var(--spacing-lg)', fontSize: 'var(--font-size-md)' },
      lg: { padding: 'var(--spacing-lg) var(--spacing-xl)', fontSize: 'var(--font-size-lg)' },
    };

    const triggerStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--spacing-md)',
      width: '100%',
      padding: sizeStyles[size].padding,
      fontSize: sizeStyles[size].fontSize,
      border: `2px solid ${hasError ? 'var(--color-error)' : 'var(--color-border)'}`,
      borderRadius: 'var(--radius-md)',
      backgroundColor: disabled ? 'var(--color-border)' : 'var(--color-surface)',
      color: 'var(--color-text-primary)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all var(--animation-fast)',
      opacity: disabled ? 0.6 : 1,
    };

    const dropdownStyle: React.CSSProperties = {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      marginTop: 'var(--spacing-xs)',
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 10,
      maxHeight: '300px',
      overflowY: 'auto',
    };

    const optionStyle = (isHighlighted: boolean, isSelected: boolean): React.CSSProperties => ({
      padding: 'var(--spacing-md) var(--spacing-lg)',
      cursor: 'pointer',
      backgroundColor: isHighlighted ? 'var(--color-border)' : isSelected ? 'rgba(0, 140, 226, 0.1)' : 'transparent',
      color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)',
      fontWeight: isSelected ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
      transition: 'all var(--animation-fast)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--spacing-md)',
    });

    return (
      <div
        ref={ref}
        style={{ position: 'relative', display: 'inline-block', width: '100%', ...style }}
        className={`select ${className}`}
        {...props}
      >
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          style={triggerStyle}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span>{getSelectedLabel()}</span>
          <ChevronDown
            size={20}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform var(--animation-fast)',
            }}
          />
        </button>

        {isOpen && (
          <div style={dropdownStyle}>
            {options.map((option, index) => (
              <div
                key={option.value}
                onClick={() => !option.disabled && handleSelect(option.value)}
                style={{
                  ...optionStyle(highlightedIndex === index, selectedValues.includes(option.value)),
                  opacity: option.disabled ? 0.5 : 1,
                  cursor: option.disabled ? 'not-allowed' : 'pointer',
                }}
              >
                {multiple && (
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => {}}
                    disabled={option.disabled}
                    style={{ cursor: option.disabled ? 'not-allowed' : 'pointer' }}
                  />
                )}
                {option.label}
              </div>
            ))}
          </div>
        )}

        {hasError && errorMessage && (
          <p style={{ margin: 'var(--spacing-xs) 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-error)' }}>
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
