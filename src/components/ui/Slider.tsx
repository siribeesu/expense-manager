import React from 'react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/useTheme';

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  displayValue?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  step = 50,
  onChange,
  label,
  displayValue,
  className,
  id,
}) => {
  const { theme } = useTheme();
  const sliderId = id || (label ? `slider-${label.toLowerCase().replace(/\s+/g, '-')}` : 'fin-slider');
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const trackActive = theme === 'dark' ? '#C8FF55' : '#16A34A';
  const trackInactive = theme === 'dark' ? '#1E293B' : '#E2E8F0';

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center text-xs">
        {label && (
          <label htmlFor={sliderId} className="font-semibold text-slate-300 uppercase tracking-wider">
            {label}
          </label>
        )}
        {displayValue && (
          <span className="font-mono font-bold text-[#C8FF55] text-sm">
            {displayValue}
          </span>
        )}
      </div>
      <div className="relative flex items-center h-6">
        <input
          id={sliderId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn(
            'w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none',
            theme === 'dark' ? 'accent-[#C8FF55]' : 'accent-[#16A34A]',
            className
          )}
          style={{
            background: `linear-gradient(to right, ${trackActive} ${percentage}%, ${trackInactive} ${percentage}%)`,
          }}
        />
      </div>
      <div className="flex justify-between text-[11px] font-mono text-slate-400">
        <span>₹{min}</span>
        <span>₹{Math.round((max + min) / 2)}</span>
        <span>₹{max}+</span>
      </div>
    </div>
  );
};
