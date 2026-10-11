import React from 'react';
import { cn } from '../../lib/utils';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
}) => {
  return (
    <label
      className={cn(
        'flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-800 bg-[#0E1526]/70 cursor-pointer select-none transition-all',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="min-w-0">
        {label && <span className="text-xs font-semibold text-white block">{label}</span>}
        {description && <span className="text-[11px] text-slate-400 block mt-0.5">{description}</span>}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          if (!disabled) onChange(!checked);
        }}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8FF55]',
          checked ? 'bg-[#C8FF55]' : 'bg-slate-700'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-4 w-4 transform rounded-full shadow-lg ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-4 bg-[#0B1020]' : 'translate-x-0 bg-white'
          )}
        />
      </button>
    </label>
  );
};
