'use client';

import React, { createContext, useContext, useState } from 'react';

interface TabsContextType {
  activeValue: string;
  setActiveValue: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tab component must be used within Tabs component');
  }
  return context;
};

export interface TabsProps {
  /** Initial active tab value */
  defaultValue?: string;
  /** Controlled active tab value */
  value?: string;
  /** Change handler for controlled mode */
  onChange?: (value: string) => void;
  /** Tab content */
  children: React.ReactNode;
  /** Custom className */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
}

/**
 * Tabs Component
 *
 * A tabbed interface component with keyboard navigation support.
 * Use with TabList, TabTrigger, and TabContent components.
 *
 * @example
 * ```tsx
 * <Tabs defaultValue="tab1">
 *   <TabList>
 *     <TabTrigger value="tab1">Tab 1</TabTrigger>
 *     <TabTrigger value="tab2">Tab 2</TabTrigger>
 *   </TabList>
 *   <TabContent value="tab1">Content 1</TabContent>
 *   <TabContent value="tab2">Content 2</TabContent>
 * </Tabs>
 * ```
 */
export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({
    defaultValue,
    value: controlledValue,
    onChange,
    children,
    className = '',
    style,
  }, ref) => {
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const isControlled = controlledValue !== undefined;
    const activeValue = isControlled ? controlledValue : internalValue;

    const handleSetActiveValue = (value: string) => {
      if (!isControlled) {
        setInternalValue(value);
      }
      onChange?.(value);
    };

    const contextValue: TabsContextType = {
      activeValue,
      setActiveValue: handleSetActiveValue,
    };

    return (
      <TabsContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={`tabs ${className}`}
          style={style}
        >
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);

Tabs.displayName = 'Tabs';

/**
 * TabList - Container for tab triggers
 */
export interface TabListProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const TabList = React.forwardRef<HTMLDivElement, TabListProps>(
  ({ children, className = '', style }, ref) => {
    const tabListStyle: React.CSSProperties = {
      display: 'flex',
      gap: 0,
      borderBottom: '1px solid var(--color-border)',
      ...style,
    };

    return (
      <div
        ref={ref}
        role="tablist"
        style={tabListStyle}
        className={`tab-list ${className}`}
      >
        {children}
      </div>
    );
  }
);

TabList.displayName = 'TabList';

/**
 * TabTrigger - Individual tab button
 */
export interface TabTriggerProps {
  /** Tab value */
  value: string;
  /** Tab label */
  children: React.ReactNode;
  /** Whether tab is disabled */
  disabled?: boolean;
  /** Custom className */
  className?: string;
}

export const TabTrigger = React.forwardRef<HTMLButtonElement, TabTriggerProps>(
  ({ value, children, disabled = false, className = '' }, ref) => {
    const { activeValue, setActiveValue } = useTabsContext();
    const isActive = activeValue === value;

    const triggerStyle: React.CSSProperties = {
      padding: 'var(--spacing-md) var(--spacing-lg)',
      fontSize: 'var(--font-size-md)',
      fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
      color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
      background: 'none',
      border: 'none',
      borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all var(--animation-fast)',
      opacity: disabled ? 0.6 : 1,
    };

    const handleClick = () => {
      if (!disabled) {
        setActiveValue(value);
      }
    };

    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isActive}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={handleClick}
        style={triggerStyle}
        className={`tab-trigger ${className}`}
      >
        {children}
      </button>
    );
  }
);

TabTrigger.displayName = 'TabTrigger';

/**
 * TabContent - Content for each tab
 */
export interface TabContentProps {
  /** Tab value this content corresponds to */
  value: string;
  /** Tab content */
  children: React.ReactNode;
  /** Custom className */
  className?: string;
}

export const TabContent = React.forwardRef<HTMLDivElement, TabContentProps>(
  ({ value, children, className = '' }, ref) => {
    const { activeValue } = useTabsContext();
    const isActive = activeValue === value;

    if (!isActive) return null;

    const contentStyle: React.CSSProperties = {
      padding: 'var(--spacing-lg) 0',
      animation: 'fadeIn var(--animation-fast)',
    };

    return (
      <div
        ref={ref}
        role="tabpanel"
        style={contentStyle}
        className={`tab-content ${className}`}
      >
        {children}
      </div>
    );
  }
);

TabContent.displayName = 'TabContent';
