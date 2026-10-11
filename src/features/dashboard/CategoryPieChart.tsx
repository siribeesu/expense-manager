import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import type { TransactionCategory } from '../../types/finance';
import { formatINR, formatPercent, getCategoryMeta } from '../../lib/formatters';

export interface CategoryPieChartProps {
  categoryTotals: Record<TransactionCategory, number>;
  totalSpent: number;
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ categoryTotals, totalSpent }) => {
  const chartData = (Object.keys(categoryTotals) as TransactionCategory[])
    .filter((cat) => categoryTotals[cat] > 0)
    .map((cat) => {
      const meta = getCategoryMeta(cat);
      const amount = categoryTotals[cat];
      const percentage = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
      return {
        name: meta.label,
        category: cat,
        value: amount,
        percentage,
        color: meta.color,
      };
    })
    .sort((a, b) => b.value - a.value);

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Spending by Category</CardTitle>
          <span className="text-xs font-mono text-slate-400">
            Total {formatINR(totalSpent)}
          </span>
        </div>
        <CardDescription>
          Real-time category breakdown of completed actual expenses
        </CardDescription>
      </CardHeader>

      {chartData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-700/80 flex items-center justify-center text-[#C8FF55]/60 font-mono text-sm">
            ₹0
          </div>
          <p className="text-xs font-semibold text-slate-300">No expenses recorded yet</p>
          <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
            Your full ₹10,000 runway is 100% intact. As you record transactions, your category spending breakdown will display here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Doughnut Chart */}
          <div className="md:col-span-6 h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="#0B1020"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#0B1020] border border-slate-700/80 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-white flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: data.color }}
                            />
                            {data.name}
                          </p>
                          <p className="font-mono text-[#C8FF55] text-sm">
                            {formatINR(data.value)} ({formatPercent(data.percentage, 1)})
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-xs text-slate-400 font-medium">Spent</span>
              <span className="font-mono font-bold text-white text-base">
                {formatINR(totalSpent)}
              </span>
            </div>
          </div>

          {/* Clean Readable Legend */}
          <div className="md:col-span-6 space-y-2 max-h-56 overflow-y-auto pr-1">
            {chartData.map((item) => (
              <div
                key={item.category}
                className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-300 truncate font-medium">{item.name}</span>
                </div>
                <div className="text-right font-mono shrink-0 pl-2">
                  <span className="text-white font-semibold">{formatINR(item.value)}</span>
                  <span className="text-slate-400 text-[11px] ml-1.5">
                    {formatPercent(item.percentage)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
