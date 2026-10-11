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
      className={cn('relative overflow-hidden flex flex-col justify-between p-5', className)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-mono">
              {value}
            </span>
          </div>
        </div>
        {Icon && (
          <div className={cn('p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50', iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtext || badge || deltaText) && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/60 text-xs">
          {subtext && <span className="text-slate-400 leading-none">{subtext}</span>}
          {deltaText && (
            <span
              className={cn(
                'font-mono font-medium',
                deltaType === 'positive' && 'text-emerald-400',
                deltaType === 'negative' && 'text-red-400',
                deltaType === 'neutral' && 'text-slate-400'
              )}
            >
              {deltaText}
            </span>
          )}
          {badge && <div>{badge}</div>}
        </div>
      )}
    </Card>
  );
};
