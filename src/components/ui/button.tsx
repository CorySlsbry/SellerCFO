import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles =
      'font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
      primary:
        'bg-[#06b6d4] text-white hover:bg-[#4f46e5] active:bg-[#4338ca] shadow-lg shadow-[#06b6d4]/20 hover:shadow-[#06b6d4]/30',
      secondary:
        'bg-[#2a2a3d] text-[#e8e8f0] hover:bg-[#3a3a4d] border border-[#3a3a4d] active:bg-[#4a4a5d]',
      ghost:
        'text-[#e8e8f0] hover:bg-[#2a2a3d] active:bg-[#3a3a4d]',
      danger:
        'bg-[#ef4444] text-white hover:bg-[#dc2626] active:bg-[#991b1b] shadow-lg shadow-[#ef4444]/20',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className || ''}`}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
