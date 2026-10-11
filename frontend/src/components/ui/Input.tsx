import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  prefixElement?: React.ReactNode;
  suffixElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, prefixElement, suffixElement, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : generatedId);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefixElement && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 font-semibold select-none">
              {prefixElement}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
            className={cn(
              'w-full bg-[#0E1526] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-colors duration-150',
              'focus:border-[#C8FF55] focus:outline-none focus:ring-1 focus:ring-[#C8FF55]',
              'disabled:bg-slate-900/50 disabled:text-slate-600 disabled:cursor-not-allowed',
              prefixElement && 'pl-9',
              suffixElement && 'pr-9',
              error && 'border-red-500/80 focus:border-red-500 focus:ring-red-500',
              className
            )}
            {...props}
          />
          {suffixElement && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-slate-400 select-none">
              {suffixElement}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-red-400 font-medium">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-help`} className="text-xs text-slate-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
