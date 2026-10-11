import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useFinance } from '../../context/useFinance';
import { formatINR } from '../../lib/formatters';

export interface QuickSimWidgetProps {
  onOpenSimulator: () => void;
}

export const QuickSimWidget: React.FC<QuickSimWidgetProps> = ({ onOpenSimulator }) => {
  const { loadScenarioIntoSimulation, metrics } = useFinance();

  const presets = [
    { label: 'Swiggy Feast', amount: 450, desc: 'Dinner party treat', category: 'food_groceries' as const },
    { label: 'Noise Earbuds', amount: 1500, desc: 'Noise ANC earbuds', category: 'shopping' as const },
    { label: 'Weekend Getaway', amount: 2000, desc: 'Short road trip', category: 'transport' as const },
  ];

  const handleLaunch = () => {
    loadScenarioIntoSimulation({
      description: 'Noise ANC Wireless Earbuds',
      amount: 1500,
      category: 'shopping',
      type: 'planned',
    });
    onOpenSimulator();
  };

  return (
    <Card className="p-5 bg-gradient-to-r from-[#131B2F] via-[#16203B] to-[#121B30] border border-[#C8FF55]/25 relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[#C8FF55]/20 text-[#C8FF55]">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold text-[#C8FF55] uppercase tracking-wider">
              What-If Money Simulator
            </span>
          </div>
          <h3 className="text-base font-bold text-white">
            Wondering: "Can I afford this purchase right now?"
          </h3>
          <p className="text-xs text-slate-400">
            Preview the exact impact on your daily allowance (₹{metrics.safeDailyAllowance}/day) without affecting your actual records.
          </p>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-2 flex-wrap">
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                loadScenarioIntoSimulation({
                  description: preset.desc,
                  amount: preset.amount,
                  category: preset.category,
                  type: 'planned',
                });
                onOpenSimulator();
              }}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-all font-medium"
            >
              {preset.label} ({formatINR(preset.amount)})
            </button>
          ))}
          <Button
            variant="primary"
            size="sm"
            onClick={handleLaunch}
            className="text-xs font-bold"
          >
            Open Simulator <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
