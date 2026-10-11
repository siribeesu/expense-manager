import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { FinancialHealthBreakdown } from '../../types/finance';
import { useTheme } from '../../context/useTheme';

export interface HealthGaugeProps {
  health: FinancialHealthBreakdown;
  simulatedHealthScore?: number;
  simulatedRiskLevel?: 'low' | 'moderate' | 'high' | 'critical';
  compact?: boolean;
}

export const HealthGauge: React.FC<HealthGaugeProps> = ({
  health,
  simulatedHealthScore,
  simulatedRiskLevel,
}) => {
  const { theme } = useTheme();
  const isComparing = simulatedHealthScore !== undefined && simulatedHealthScore !== health.totalScore;
  const activeScore = isComparing ? simulatedHealthScore : health.totalScore;
  const activeRisk = isComparing && simulatedRiskLevel ? simulatedRiskLevel : health.riskLevel;

  const riskBadges = {
    low: <Badge variant="emerald">Low Risk · Resilient</Badge>,
    moderate: <Badge variant="lime">Moderate · Steady</Badge>,
    high: <Badge variant="amber">High Risk · Watchlist</Badge>,
    critical: <Badge variant="red">Critical · Deficit Risk</Badge>,
  };

  const riskColors = {
    low: '#10B981',
    moderate: theme === 'dark' ? '#C8FF55' : '#16A34A',
    high: '#F59E0B',
    critical: '#FF5C5C',
  };

  const currentColor = riskColors[activeRisk];

  return (
    <Card className="flex flex-col justify-between p-5 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Financial Health Flightpath
          </span>
          <span className="text-xs text-slate-300 font-medium">
            {isComparing ? 'Simulated Impact Projection' : 'Deterministic 0–100 Score'}
          </span>
        </div>
        {riskBadges[activeRisk]}
      </div>

      <div className="my-4 flex items-center gap-5">
        {/* Score Ring Display */}
        <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
          <svg
            role="img"
            aria-label={`Financial health score: ${activeScore} out of 100, risk level: ${activeRisk}`}
            className="w-full h-full -rotate-90 transform"
            viewBox="0 0 36 36"
          >
            <path
              className="text-slate-800"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              strokeWidth="3.5"
              strokeDasharray={`${activeScore}, 100`}
              strokeLinecap="round"
              stroke={currentColor}
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono text-xl font-extrabold text-white leading-none">
              {activeScore}
            </span>
            <span className="text-[9px] text-slate-400 font-medium uppercase mt-0.5">/100</span>
          </div>
        </div>

        {/* Breakdown Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-snug line-clamp-2">
            {health.headline}
          </p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {health.actionableTips[0] || 'Runway and commitments are in check.'}
          </p>
        </div>
      </div>

      {isComparing && (
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Baseline Score: {health.totalScore}</span>
          <span
            className={
              simulatedHealthScore > health.totalScore
                ? 'text-emerald-400'
                : simulatedHealthScore < health.totalScore
                ? 'text-red-400 font-bold'
                : 'text-slate-400'
            }
          >
            {simulatedHealthScore - health.totalScore > 0 ? '+' : ''}
            {simulatedHealthScore - health.totalScore} pts simulated
          </span>
        </div>
      )}
    </Card>
  );
};
