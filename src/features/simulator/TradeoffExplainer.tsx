import React from 'react';
import type { SimulationProjection } from '../../engine/forecast';
import { Badge } from '../../components/ui/Badge';
import { AlertCircle, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';
import { formatINR } from '../../lib/formatters';

export interface TradeoffExplainerProps {
  projection: SimulationProjection;
  expenseAmount: number;
}

export const TradeoffExplainer: React.FC<TradeoffExplainerProps> = React.memo(({
  projection,
  expenseAmount,
}) => {
  const statusConfigs = {
    affordable: {
      border: 'border-emerald-500/40 bg-emerald-950/20',
      badge: <Badge variant="emerald">Affordable Flightpath</Badge>,
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
      titleColor: 'text-emerald-400',
    },
    tight: {
      border: 'border-amber-500/40 bg-amber-950/20',
      badge: <Badge variant="amber">Tight Runway Warning</Badge>,
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
      titleColor: 'text-amber-400',
    },
    jeopardizes_goals: {
      border: 'border-orange-500/40 bg-orange-950/20',
      badge: <Badge variant="amber">Commitments Jeopardized</Badge>,
      icon: <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />,
      titleColor: 'text-orange-400',
    },
    unaffordable: {
      border: 'border-red-500/50 bg-red-950/25',
      badge: <Badge variant="red">Deficit / Unaffordable</Badge>,
      icon: <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />,
      titleColor: 'text-red-400',
    },
  };

  const current = statusConfigs[projection.affordabilityStatus];

  return (
    <div className={`p-4 rounded-2xl border ${current.border} space-y-3`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
        <div className="flex items-start gap-3">
          {current.icon}
          <div>
            <h4 className={`text-sm font-bold ${current.titleColor}`}>
              Impact & Trade-Off Analysis ({formatINR(expenseAmount)})
            </h4>
            <p className="text-xs text-slate-200 mt-1 leading-relaxed">
              {projection.tradeoffSummary}
            </p>
          </div>
        </div>
        <div className="self-start sm:self-auto shrink-0">
          {current.badge}
        </div>
      </div>

      <div className="p-3 rounded-xl bg-[#0B1020]/70 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
        <Lightbulb className="w-4 h-4 text-[#C8FF55] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#C8FF55] block">Strategic Thriftly Advice:</span>
          <span>{projection.alternativeRecommendation}</span>
        </div>
      </div>
    </div>
  );
});
TradeoffExplainer.displayName = 'TradeoffExplainer';
