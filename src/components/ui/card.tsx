'use client';

import React from 'react';
import { useChartTheme } from '@/components/chart-theme-provider';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'metric' | 'highlighted';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', style, ...props }, ref) => {
    let ds: any;
    let tc: any;
    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { theme } = useChartTheme();
      ds = theme.dashboard;
      tc = theme.colors;
    } catch {
      // Fallback if outside provider (e.g. admin pages)
      ds = {
        cardBg: '#12121a',
        cardBorder: '#2a2a3d',
        cardShadow: 'none',
        cardBlur: undefined,
        cardGradient: undefined,
        borderRadius: '0.5rem',
      };
      tc = { primary: '#06b6d4' };
    }

    const baseStyle: React.CSSProperties = {
      backgroundColor: ds.cardBg,
      border: `1px solid ${ds.cardBorder}`,
      borderRadius: ds.borderRadius,
      boxShadow: ds.cardShadow !== 'none' ? ds.cardShadow : undefined,
      backdropFilter: ds.cardBlur,
      backgroundImage: ds.cardGradient,
      transition: 'all 0.2s ease',
      ...style,
    };

    if (variant === 'metric') {
      baseStyle.boxShadow = ds.cardShadow !== 'none' ? ds.cardShadow : undefined;
    }

    if (variant === 'highlighted') {
      baseStyle.borderColor = `${tc.primary}4d`;
      baseStyle.boxShadow = `0 4px 16px ${tc.primary}15`;
    }

    return (
      <div
        ref={ref}
        className={`rounded-lg ${className || ''}`}
        style={baseStyle}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
