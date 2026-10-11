import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import type { DayForecastPoint } from '../../types/finance';
import { formatINR } from '../../lib/formatters';
import { useTheme } from '../../context/useTheme';

export interface ForecastChartProps {
  forecastData: DayForecastPoint[];
  currentDay: number;
  totalBudget: number;
}

export const ForecastChart: React.FC<ForecastChartProps> = React.memo(({
  forecastData,
  currentDay,
  totalBudget,
}) => {
  const { theme } = useTheme();

  return (
    <Card className="flex flex-col justify-between p-4 sm:p-5">
      <CardHeader className="mb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <CardTitle>30-Day Cash Flow & Runway Forecast</CardTitle>
            <CardDescription>
              Comparing actual path with projected base trajectory & simulated decision
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono flex-wrap">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className={`w-3 h-0.5 ${theme === 'dark' ? 'bg-[#C8FF55]' : 'bg-[#16A34A]'}`} /> Current Plan
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-3 h-0.5 bg-amber-400 border-dashed" /> Simulated Trajectory
            </span>
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-3 h-0.5 bg-red-400" /> ₹10k Budget Cap
            </span>
          </div>
        </div>
      </CardHeader>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={forecastData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1E293B' : '#E2E8F0'} vertical={false} />
            <XAxis
              dataKey="day"
              stroke={theme === 'dark' ? '#64748B' : '#94A3B8'}
              fontSize={11}
              tickLine={false}
              tickFormatter={(d) => `D${d}`}
              axisLine={{ stroke: theme === 'dark' ? '#1E293B' : '#E2E8F0' }}
            />
            <YAxis
              stroke={theme === 'dark' ? '#64748B' : '#94A3B8'}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: theme === 'dark' ? '#1E293B' : '#E2E8F0' }}
              tickFormatter={(v) => `₹${v}`}
              domain={[0, totalBudget + 1000]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as DayForecastPoint;
                  return (
                    <div className="bg-[#0B1020] border border-slate-700/80 p-3 rounded-xl shadow-xl text-xs space-y-1.5 font-mono">
                      <p className="font-bold text-white text-sm">
                        Day {data.day} of 30 {data.day === currentDay ? '(Today)' : ''}
                      </p>
                      {data.actualSpent !== undefined && (
                        <p className="text-emerald-400">
                          Actual Spend: {formatINR(data.actualSpent)}
                        </p>
                      )}
                      <p className="text-[#C8FF55]">
                        Base Projected: {formatINR(data.projectedCumulativeSpent)}
                      </p>
                      {data.simulatedCumulativeSpent !== undefined && (
                        <p className="text-amber-400 font-bold">
                          Simulated Plan: {formatINR(data.simulatedCumulativeSpent)}
                        </p>
                      )}
                      <p className="text-slate-400 text-[10px]">
                        Monthly Cap: {formatINR(totalBudget)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Today Reference Line */}
            <ReferenceLine
              x={currentDay}
              stroke="#06B6D4"
              strokeDasharray="3 3"
              label={{
                value: `Today (D${currentDay})`,
                fill: '#06B6D4',
                fontSize: 10,
                position: 'insideTopLeft',
              }}
            />
            {/* ₹10,000 Budget Cap */}
            <ReferenceLine
              y={totalBudget}
              stroke="#FF5C5C"
              strokeWidth={1.5}
            />
            {/* Projected Base Spend */}
            <Line
              type="monotone"
              dataKey="projectedCumulativeSpent"
              stroke={theme === 'dark' ? '#C8FF55' : '#16A34A'}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: theme === 'dark' ? '#C8FF55' : '#16A34A' }}
            />
            {/* Simulated Spend */}
            <Line
              type="monotone"
              dataKey="simulatedCumulativeSpent"
              stroke="#F59E0B"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
});
ForecastChart.displayName = 'ForecastChart';
