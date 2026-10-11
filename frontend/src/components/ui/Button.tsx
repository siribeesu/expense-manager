import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'lime-outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center font-medium rounded-xl',
      'transition-all duration-150',
      'focus-visible:outline-2 focus-visible:outline-[#C8FF55] focus-visible:outline-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'cursor-pointer active:scale-[0.98] select-none'
    );

    const variants = {
      primary:
        'bg-[#C8FF55] text-[#0B1020] font-semibold hover:bg-[#bbf04a] shadow-[0_0_20px_rgba(200,255,85,0.2)] hover:shadow-[0_0_25px_rgba(200,255,85,0.35)]',
      secondary:
        'bg-[#1E293B] text-[#F8FAFC] hover:bg-[#334155] border border-slate-700/60 shadow-sm',
      outline:
        'bg-transparent text-slate-200 border border-slate-700 hover:bg-slate-800/80 hover:text-white',
      'lime-outline':
        'bg-[#C8FF55]/10 text-[#C8FF55] border border-[#C8FF55]/40 hover:bg-[#C8FF55]/20 hover:border-[#C8FF55]',
      danger:
        'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 hover:border-red-500/50 hover:text-red-300',
      ghost:
        'bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/60',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-base px-5 py-3 gap-2.5 font-semibold',
      icon: 'p-2 w-10 h-10',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
