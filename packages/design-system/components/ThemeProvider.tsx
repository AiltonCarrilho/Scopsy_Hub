'use client';

import { useEffect } from 'react';

/**
 * ThemeProvider Component
 *
 * Wraps the application to handle theme initialization and switching.
 * Should be placed near the root of the app.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize theme on client mount
    const stored = localStorage.getItem('scopsy-theme') || 'auto';
    const html = document.documentElement;

    if (stored !== 'auto') {
      html.setAttribute('data-theme', stored);
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (localStorage.getItem('scopsy-theme') === 'auto') {
        // Let prefers-color-scheme work
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return <>{children}</>;
}
