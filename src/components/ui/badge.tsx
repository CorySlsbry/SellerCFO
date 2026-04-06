import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors';

    const variantStyles = {
      default: 'bg-[#2a2a3d] text-[#e8e8f0]',
      success: 'bg-[#22c55e]/20 text-[#86efac] border border-[#22c55e]/30',
      warning: 'bg-[#eab308]/20 text-[#facc15] border border-[#eab308]/30',
      danger: 'bg-[#ef4444]/20 text-[#fca5a5] border border-[#ef4444]/30',
      info: 'bg-[#06b6d4]/20 text-[#a5b4fc] border border-[#06b6d4]/30',
    };

    return (
      <span
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${className || ''}`}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';
