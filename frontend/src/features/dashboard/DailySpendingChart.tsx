import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import type { Transaction } from '../../types/finance';
import { formatINR } from '../../lib/formatters';
import { useTheme } from '../../context/useTheme';

export interface DailySpendingChartProps {
  transactions: Transaction[];
  currentDay: number;
  totalDays: number;
  safeDailyAllowance: number;
}

export const DailySpendingChart: React.FC<DailySpendingChartProps> = ({
  transactions,
  currentDay,
  totalDays,
  safeDailyAllowance,
}) => {
  const { theme } = useTheme();
  // Aggregate daily expenses
  const dailySpendMap: Record<number, number> = {};
  transactions.forEach((tx) => {
    if (tx.type === 'expense' || tx.type === 'commitment_payment') {
      dailySpendMap[tx.day] = (dailySpendMap[tx.day] || 0) + tx.amount;
    }
  });

  const chartData = [];
  for (let d = 1; d <= Math.min(totalDays, Math.max(currentDay, 15)); d++) {
    const amount = dailySpendMap[d] || 0;
    const isPastOrToday = d <= currentDay;
    chartData.push({
      day: `D${d}`,
      dayNum: d,
      spent: isPastOrToday ? amount : null,
      projected: !isPastOrToday ? safeDailyAllowance : null,
      isToday: d === currentDay,
    });
  }

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Daily Spending Velocity</CardTitle>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className={`w-2.5 h-2.5 rounded-sm ${theme === 'dark' ? 'bg-[#C8FF55]' : 'bg-[#16A34A]'}`} />
              Actual Spend
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-0.5 bg-amber-400" />
              Safe Daily Cap ({formatINR(safeDailyAllowance)})
            </span>
          </div>
        </div>
        <CardDescription>
          Compare actual daily transactions against your ₹{safeDailyAllowance}/day conservative limit
        </CardDescription>
      </CardHeader>

      <div className="h-60 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1E293B' : '#E2E8F0'} vertical={false} />
            <XAxis
              dataKey="day"
              stroke={theme === 'dark' ? '#64748B' : '#94A3B8'}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: theme === 'dark' ? '#1E293B' : '#E2E8F0' }}
            />
            <YAxis
              stroke={theme === 'dark' ? '#64748B' : '#94A3B8'}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: theme === 'dark' ? '#1E293B' : '#E2E8F0' }}
              tickFormatter={(v) => `₹${v}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-[#0B1020] border border-slate-700/80 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                      <p className="font-bold text-white">
                        Day {data.dayNum} {data.isToday ? '(Today)' : ''}
                      </p>
                      {data.spent !== null ? (
                        <p className="font-mono text-[#C8FF55] text-sm font-semibold">
                          Spent: {formatINR(data.spent)}
                        </p>
                      ) : (
                        <p className="font-mono text-slate-400 text-sm">
                          Safe Plan: {formatINR(data.projected)}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400">
                        Daily Cap: {formatINR(safeDailyAllowance)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine
              y={safeDailyAllowance}
              stroke="#F59E0B"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <Bar
              dataKey="spent"
              fill={theme === 'dark' ? '#C8FF55' : '#16A34A'}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
