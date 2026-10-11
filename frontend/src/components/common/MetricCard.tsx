import React from 'react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: string;
  subtext?: string;
  icon?: LucideIcon;
  iconColor?: string;
  badge?: React.ReactNode;
  deltaText?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  className?: string;
  highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor = 'text-[#C8FF55]',
  badge,
  deltaText,
  deltaType = 'neutral',
  className,
  highlight = false,
}) => {
  return (
    <Card
      variant={highlight ? 'highlight' : 'default'}
      className={cn(
        'relative overflow-hidden flex flex-col justify-between p-3.5 sm:p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-700/80 group',
        className
      )}
    >
      <div className="flex items-start justify-between gap-1.5 sm:gap-2">
        <div className="space-y-0.5 sm:space-y-1 min-w-0">
          <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">{title}</p>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-mono truncate">
              {value}
            </span>
          </div>
        </div>
        {Icon && (
          <div className={cn('p-1.5 sm:p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 shrink-0', iconColor)}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )}
      </div>

      {(subtext || badge || deltaText) && (
        <div className="flex items-center justify-between mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-800/60 text-[10px] sm:text-xs gap-1">
          {subtext && <span className="text-slate-400 leading-none truncate">{subtext}</span>}
          {deltaText && (
            <span
              className={cn(
                'font-mono font-medium shrink-0',
                deltaType === 'positive' && 'text-emerald-400',
                deltaType === 'negative' && 'text-red-400',
                deltaType === 'neutral' && 'text-slate-400'
              )}
            >
              {deltaText}
            </span>
          )}
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
      )}
    </Card>
  );
};
