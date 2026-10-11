import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatINR } from '../../lib/formatters';

export interface AllowanceGaugeProps {
  safeDailyAllowance: number;
  spentToday: number;
  remainingDailyAllowanceToday: number;
  remainingDays: number;
  availableCash: number;
  isPaceSustainable: boolean;
}

export const AllowanceGauge: React.FC<AllowanceGaugeProps> = ({
  safeDailyAllowance,
  spentToday,
  remainingDailyAllowanceToday,
  remainingDays,
  availableCash,
  isPaceSustainable,
}) => {
  const percentSpentToday =
    safeDailyAllowance > 0 ? Math.min(100, Math.round((spentToday / safeDailyAllowance) * 100)) : 100;

  const isOverspentToday = spentToday > safeDailyAllowance;

  return (
    <Card className="flex flex-col justify-between p-5 relative overflow-hidden bg-gradient-to-br from-[#131B2F] via-[#131B2F] to-[#1A2542] border border-slate-700/60 shadow-xl">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#C8FF55] uppercase tracking-wider">
              Smart Runway Engine
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF55] animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Safe Daily Spending Limit</h2>
        </div>
        <Badge variant={isPaceSustainable ? 'lime' : 'amber'}>
          {isPaceSustainable ? 'Runway Sustainable' : 'Pace Warning'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-4 p-4 rounded-xl bg-[#0E1526]/80 border border-slate-800">
        <div>
          <span className="text-[11px] uppercase font-semibold text-slate-400 block">
            Suggested Limit Today
          </span>
          <span className="text-2xl font-extrabold text-white font-mono mt-0.5 block">
            {formatINR(safeDailyAllowance)}
          </span>
          <span className="text-[11px] text-slate-400">Total allowance/day</span>
        </div>

        <div>
          <span className="text-[11px] uppercase font-semibold text-slate-400 block">
            Spent So Far Today
          </span>
          <span className="text-2xl font-extrabold text-white font-mono mt-0.5 block">
            {formatINR(spentToday)}
          </span>
          <span className="text-[11px] text-slate-400">{percentSpentToday}% consumed</span>
        </div>

        <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
          <span className="text-[11px] uppercase font-semibold text-slate-400 block">
            Remaining Today
          </span>
          <span
            className={`text-2xl font-extrabold font-mono mt-0.5 block ${
              isOverspentToday ? 'text-red-400' : 'text-[#C8FF55]'
            }`}
          >
            {formatINR(remainingDailyAllowanceToday)}
          </span>
          <span className="text-[11px] text-slate-400">
            {isOverspentToday ? 'Over daily target' : 'Safe to spend right now'}
          </span>
        </div>
      </div>

      {/* Daily Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">
            Daily Budget Utilization ({percentSpentToday}%)
          </span>
          <span className="text-slate-300 font-mono text-[11px]">
            {formatINR(availableCash)} liquid across {remainingDays} days
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isOverspentToday
                ? 'bg-red-500'
                : percentSpentToday > 75
                ? 'bg-amber-400'
                : 'bg-[#C8FF55]'
            }`}
            style={{ width: `${Math.min(100, percentSpentToday)}%` }}
          />
        </div>
      </div>
    </Card>
  );
};
