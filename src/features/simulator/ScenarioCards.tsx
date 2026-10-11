import React from 'react';
import { Badge } from '../../components/ui/Badge';
import { PRESET_UNEXPECTED_SCENARIOS } from '../../data/demoData';
import { formatINR } from '../../lib/formatters';
import { Stethoscope, Smartphone, Train, Zap, Cake, AlertCircle } from 'lucide-react';
import type { TransactionCategory, ExpenseType } from '../../types/finance';

export interface ScenarioCardsProps {
  onSelectScenario: (scenario: {
    description: string;
    amount: number;
    category: TransactionCategory;
    type: ExpenseType;
  }) => void;
  selectedAmount?: number;
}

export const ScenarioCards: React.FC<ScenarioCardsProps> = React.memo(({
  onSelectScenario,
  selectedAmount,
}) => {
  const iconMap: Record<string, React.ElementType> = {
    Stethoscope,
    Smartphone,
    Train,
    Zap,
    Cake,
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white tracking-tight">
            One-Click Real-World Scenarios
          </h4>
          <p className="text-xs text-slate-400">
            Stress-test your ₹10,000 budget against common Gen Z financial surprises
          </p>
        </div>
        <Badge variant="slate" size="sm">5 Scenarios</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {PRESET_UNEXPECTED_SCENARIOS.map((scenario) => {
          const Icon = iconMap[scenario.icon] || AlertCircle;
          const isSelected = selectedAmount === scenario.amount;

          return (
            <button
              type="button"
              key={scenario.id}
              onClick={() =>
                onSelectScenario({
                  description: scenario.name,
                  amount: scenario.amount,
                  category: scenario.category,
                  type: scenario.type,
                })
              }
              aria-pressed={isSelected}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 ${
                isSelected
                  ? 'bg-[#C8FF55]/15 border-[#C8FF55] shadow-[0_0_15px_rgba(200,255,85,0.15)]'
                  : 'bg-[#0E1526] border-slate-800 hover:border-slate-700 hover:bg-[#131B2F]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected
                        ? 'bg-[#C8FF55] text-[#0B1020]'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white leading-tight">
                      {scenario.name}
                    </h5>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {scenario.type}
                    </span>
                  </div>
                </div>
                <span className="font-mono font-bold text-sm text-[#C8FF55]">
                  {formatINR(scenario.amount)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                {scenario.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
});
ScenarioCards.displayName = 'ScenarioCards';
