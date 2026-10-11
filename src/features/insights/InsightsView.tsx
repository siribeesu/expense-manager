import React from 'react';
import { useFinance } from '../../context/useFinance';
import { generateFinancialInsights } from '../../engine/insights';
import { formatINR } from '../../lib/formatters';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { HealthGauge } from '../../components/common/HealthGauge';
import type { ActiveTab } from '../../components/layout/Sidebar';
import {
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export interface InsightsViewProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ onNavigate }) => {
  const { metrics, commitments, savingsGoals, isSimulating, simulationProjection } = useFinance();

  const insights = generateFinancialInsights(metrics, commitments, savingsGoals);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Financial Health & Smart Insights
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent, deterministic scoring engine and actionable financial recommendations tailored to your ₹10,000 monthly cycle.
          </p>
        </div>

        {isSimulating && (
          <Badge variant="lime" size="md">
            Simulated Health: {simulationProjection.simulatedHealthScore}/100
          </Badge>
        )}
      </div>

      {/* Top Section: Health Flightpath Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-5 flex flex-col justify-between">
          <HealthGauge
            health={metrics.health}
            simulatedHealthScore={isSimulating ? simulationProjection.simulatedHealthScore : undefined}
            simulatedRiskLevel={isSimulating ? simulationProjection.simulatedRiskLevel : undefined}
          />
        </div>

        <div className="lg:col-span-7">
          <Card className="h-full flex flex-col justify-between p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-[#C8FF55]" />
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Deterministic Scoring Methodology
                  </h3>
                </div>
                <Badge variant="slate" size="sm">5 Weighted Factors</Badge>
              </div>
              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                PaisaPilot evaluates your financial resiliency on an objective 0–100 scale using 5 key pillars: Cash Runway (30%), Bill Coverage (25%), Savings Progress (20%), Spending Velocity (15%), and Emergency Buffer (10%).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0E1526] border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-[#C8FF55] block">
                Top Immediate Recommendation:
              </span>
              <p className="text-xs text-white leading-relaxed">
                {metrics.health.actionableTips[0]}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Factor Breakdown Grid (5 Pillars) */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white tracking-tight">
          Transparent Pillar Breakdown (0–100 Score)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Pillar 1 */}
          <Card className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                1. Cash Runway (30%)
              </span>
              <span className="font-mono font-bold text-sm text-[#C8FF55]">
                {metrics.health.cashRunwayScore} / 30
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Safe Daily Spending Allowance of {formatINR(metrics.safeDailyAllowance)}/day across {metrics.remainingDays} remaining days.
            </p>
          </Card>

          {/* Pillar 2 */}
          <Card className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                2. Bill Coverage (25%)
              </span>
              <span className="font-mono font-bold text-sm text-[#C8FF55]">
                {metrics.health.commitmentCoverageScore} / 25
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {metrics.reservedCommitments > 0
                ? `Available cash covers ₹${metrics.reservedCommitments} upcoming commitments by ${(metrics.availableCash / metrics.reservedCommitments).toFixed(1)}x.`
                : 'All commitments settled.'}
            </p>
          </Card>

          {/* Pillar 3 */}
          <Card className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                3. Savings Progress (20%)
              </span>
              <span className="font-mono font-bold text-sm text-[#C8FF55]">
                {metrics.health.savingsProgressScore} / 20
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Accumulated {formatINR(metrics.reservedSavings)} in protected goals relative to the elapsed 30-day timeline.
            </p>
          </Card>

          {/* Pillar 4 & 5 */}
          <Card className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                4 & 5. Pace & Buffer (25%)
              </span>
              <span className="font-mono font-bold text-sm text-[#C8FF55]">
                {metrics.health.spendingPaceScore + metrics.health.emergencyBufferScore} / 25
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Current burn pace is ₹{metrics.actualDailyBurnRate}/day against ₹{metrics.idealDailyBurnRate}/day ideal pace with buffer intact.
            </p>
          </Card>
        </div>
      </div>

      {/* Dynamic Prioritized Insights List */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-tight">
            Prioritized Real-Time Money Insights
          </h3>
          <span className="text-xs text-slate-400">
            Calculated directly from live state records
          </span>
        </div>

        <div className="space-y-3">
          {insights.map((item) => {
            const typeStyles = {
              alert: 'border-amber-500/30 bg-amber-950/15',
              success: 'border-emerald-500/30 bg-emerald-950/15',
              tip: 'border-cyan-500/30 bg-cyan-950/15',
              opportunity: 'border-[#C8FF55]/30 bg-[#C8FF55]/5',
            };

            const typeIcons = {
              alert: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
              success: <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />,
              tip: <Lightbulb className="w-5 h-5 text-cyan-400 shrink-0" />,
              opportunity: <Sparkles className="w-5 h-5 text-[#C8FF55] shrink-0" />,
            };

            return (
              <Card
                key={item.id}
                className={`p-4 border ${typeStyles[item.type]} flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5">{typeIcons[item.type]}</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">
                        {item.title}
                      </h4>
                      {item.metric && (
                        <span className="font-mono text-xs font-bold text-[#C8FF55] px-1.5 py-0.5 rounded bg-slate-800">
                          {item.metric}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>

                {item.actionRoute && item.actionText && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const tab = item.actionRoute?.replace('/', '') as ActiveTab;
                      if (tab) onNavigate(tab);
                    }}
                    className="text-xs font-semibold shrink-0 border-slate-700 hover:border-slate-500 self-start sm:self-center"
                  >
                    {item.actionText} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
