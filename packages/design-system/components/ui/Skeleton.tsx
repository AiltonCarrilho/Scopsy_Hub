'use client';

import React from 'react';

export interface SkeletonProps {
  /** Skeleton width (px or %) */
  width?: string | number;
  /** Skeleton height */
  height?: string | number;
  /** Make skeleton rounded (circle, pill, etc) */
  variant?: 'text' | 'circular' | 'rectangular';
  /** Add animation */
  animation?: 'pulse' | 'wave' | 'none';
  /** Custom className */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
}

/**
 * Skeleton Component
 *
 * A placeholder component for loading states.
 * Shows animated skeleton while content is loading.
 *
 * @example
 * ```tsx
 * // Text skeleton
 * <Skeleton variant="text" width="100%" height="20px" />
 *
 * // Avatar skeleton
 * <Skeleton variant="circular" width="40px" height="40px" />
 *
 * // Card skeleton
 * <Skeleton variant="rectangular" width="300px" height="200px" />
 * ```
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({
    width = '100%',
    height = '20px',
    variant = 'text',
    animation = 'pulse',
    className = '',
    style,
  }, ref) => {
    const variantStyles = {
      text: {
        borderRadius: 'var(--radius-sm)',
      },
      circular: {
        borderRadius: 'var(--radius-full)',
      },
      rectangular: {
        borderRadius: 'var(--radius-md)',
      },
    };

    const animationStyles = {
      pulse: {
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      wave: {
        background: 'linear-gradient(90deg, var(--color-border) 25%, var(--color-bg) 50%, var(--color-border) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite',
      },
      none: {},
    };

    const skeletonStyle: React.CSSProperties = {
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      backgroundColor: 'var(--color-border)',
      display: 'inline-block',
      ...variantStyles[variant],
      ...animationStyles[animation],
      ...style,
    };

    return (
      <div
        ref={ref}
        style={skeletonStyle}
        className={`skeleton skeleton--${variant} skeleton--${animation} ${className}`}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

/**
 * SkeletonGroup Component
 *
 * A wrapper for multiple skeleton components.
 * Useful for loading card or list placeholders.
 *
 * @example
 * ```tsx
 * <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
 *   <Skeleton variant="text" width="80px" height="20px" />
 *   <Skeleton variant="text" width="100%" height="16px" />
 *   <Skeleton variant="text" width="100%" height="16px" />
 *   <Skeleton variant="rectangular" width="100%" height="100px" />
 * </div>
 * ```
 */
export interface SkeletonGroupProps {
  /** Number of skeleton items */
  count?: number;
  /** Variant for each skeleton */
  variant?: 'text' | 'circular' | 'rectangular';
  /** Gap between skeletons */
  gap?: string;
  /** Custom className */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
}

export const SkeletonGroup = React.forwardRef<HTMLDivElement, SkeletonGroupProps>(
  ({
    count = 3,
    variant = 'text',
    gap = 'var(--spacing-md)',
    className = '',
    style,
  }, ref) => {
    const groupStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap,
      ...style,
    };

    return (
      <div
        ref={ref}
        style={groupStyle}
        className={`skeleton-group ${className}`}
      >
        {Array.from({ length: count }).map((_, index) => (
          <Skeleton
            key={index}
            variant={variant}
            width="100%"
            height={variant === 'text' ? '16px' : '100px'}
          />
        ))}
      </div>
    );
  }
);

SkeletonGroup.displayName = 'SkeletonGroup';

// Add CSS for shimmer animation
const SKELETON_STYLES = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

// Inject styles if in browser
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = SKELETON_STYLES;
  document.head.appendChild(style);
}
