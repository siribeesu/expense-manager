import React from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import type { FinancialMetrics } from '../../types/finance';
import type { SimulationProjection } from '../../engine/forecast';
import { formatINR } from '../../lib/formatters';
import { ArrowRight } from 'lucide-react';

export interface ComparisonViewProps {
  metrics: FinancialMetrics;
  projection: SimulationProjection;
  expenseAmount: number;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  metrics,
  projection,
  expenseAmount,
}) => {
  const currentUtilization = Math.round(
    ((metrics.totalSpent + metrics.reservedSavings + metrics.reservedCommitments) /
      metrics.totalBudget) *
      100
  );

  const simulatedUtilization = Math.round(
    ((metrics.totalSpent +
      expenseAmount +
      metrics.reservedSavings +
      metrics.reservedCommitments) /
      metrics.totalBudget) *
      100
  );

  const comparisonRows = [
    {
      label: 'Remaining Available Cash',
      current: formatINR(metrics.availableCash),
      simulated: formatINR(projection.simulatedAvailableCash),
      delta: `${projection.deltaAvailableCash < 0 ? '-' : '+'}${formatINR(Math.abs(projection.deltaAvailableCash))}`,
      isNegativeDelta: projection.deltaAvailableCash < 0,
    },
    {
      label: 'Safe Daily Allowance',
      current: `${formatINR(metrics.safeDailyAllowance)}/day`,
      simulated: `${formatINR(projection.simulatedSafeDailyAllowance)}/day`,
      delta: `${projection.deltaDailyAllowance < 0 ? '-' : '+'}${formatINR(Math.abs(projection.deltaDailyAllowance))}/day`,
      isNegativeDelta: projection.deltaDailyAllowance < 0,
    },
    {
      label: 'Financial Health Score',
      current: `${metrics.health.totalScore} / 100`,
      simulated: `${projection.simulatedHealthScore} / 100`,
      delta: `${projection.deltaHealthScore < 0 ? '-' : '+'}${Math.abs(projection.deltaHealthScore)} pts`,
      isNegativeDelta: projection.deltaHealthScore < 0,
    },
    {
      label: 'Risk Classification',
      current: metrics.health.riskLevel.toUpperCase(),
      simulated: projection.simulatedRiskLevel.toUpperCase(),
      delta: projection.simulatedRiskLevel !== metrics.health.riskLevel ? 'Shift' : 'Stable',
      isNegativeDelta:
        projection.simulatedRiskLevel === 'critical' || projection.simulatedRiskLevel === 'high',
    },
    {
      label: '30-Day Budget Utilization',
      current: `${currentUtilization}%`,
      simulated: `${simulatedUtilization}%`,
      delta: `+${simulatedUtilization - currentUtilization}%`,
      isNegativeDelta: simulatedUtilization > 90,
    },
  ];

  return (
    <Card className="p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-white tracking-tight">
            Current Plan vs. Simulated Decision
          </h4>
          <p className="text-xs text-slate-400">
            Side-by-side delta preview for {formatINR(expenseAmount)} proposed outlay
          </p>
        </div>
        <div className="self-start sm:self-auto">
          <Badge variant={projection.deltaHealthScore < -10 ? 'amber' : 'lime'}>
            {projection.deltaDailyAllowance < 0 ? '-' : '+'}
            {formatINR(Math.abs(projection.deltaDailyAllowance))}/day impact
          </Badge>
        </div>
      </div>

      <div className="divide-y divide-slate-800/80">
        {comparisonRows.map((row) => (
          <div
            key={row.label}
            className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <span className="text-xs font-medium text-slate-300">
              {row.label}
            </span>

            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 text-xs font-mono">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block sm:hidden">Current:</span>
                <span className="text-slate-400 font-semibold">{row.current}</span>
              </div>

              <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

              <div className="text-right min-w-[65px] sm:min-w-[70px]">
                <span className="text-[10px] text-slate-400 block sm:hidden">Simulated:</span>
                <span className="text-white font-bold">{row.simulated}</span>
              </div>

              <div className="min-w-[75px] text-right">
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    row.isNegativeDelta
                      ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {row.delta}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
