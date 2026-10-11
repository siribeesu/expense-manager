import React, { useState } from 'react';
import { useFinance } from '../../context/useFinance';
import { generate30DayForecast } from '../../engine/forecast';
import { formatINR } from '../../lib/formatters';
import type { TransactionCategory, ExpenseType } from '../../types/finance';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Slider } from '../../components/ui/Slider';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { ScenarioCards } from './ScenarioCards';
import { TradeoffExplainer } from './TradeoffExplainer';
import { ComparisonView } from './ComparisonView';
import { ForecastChart } from './ForecastChart';
import {
  Sparkles,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

export const SimulatorView: React.FC = () => {
  const {
    metrics,
    transactions,
    commitments,
    simulationParams,
    simulationProjection,
    setSimulationParams,
    resetSimulation,
    commitSimulatedExpense,
    loadScenarioIntoSimulation,
  } = useFinance();

  const [inputError, setInputError] = useState<string | null>(null);
  const [isCommitting, setIsCommitting] = useState<boolean>(false);

  // Generate 30-day forecast points with simulation
  const forecastData = generate30DayForecast(
    transactions,
    commitments,
    metrics.currentDay,
    metrics.totalBudget,
    metrics.safeDailyAllowance,
    {
      amount: simulationParams.amount,
      day: metrics.currentDay + simulationParams.delayDays,
    }
  );

  const handleAmountChange = (newAmount: number) => {
    if (isNaN(newAmount) || newAmount < 0) {
      setInputError('Amount must be a positive number');
      return;
    }
    setInputError(null);
    setSimulationParams({ amount: newAmount });
  };

  const handleCommit = () => {
    if (simulationParams.amount <= 0) {
      setInputError('Please enter an expense amount greater than zero.');
      return;
    }
    if (simulationParams.amount > metrics.availableCash) {
      setInputError('Cannot commit an expense that exceeds available cash!');
      return;
    }

    setIsCommitting(true);
    const success = commitSimulatedExpense();
    setIsCommitting(false);
    if (success) {
      setInputError(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Title and Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[#C8FF55]/20 text-[#C8FF55]">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-[#C8FF55] uppercase tracking-wider">
              Signature Feature
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            What-If Money Simulator
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive decision sandboxing. Test any purchase against your ₹10,000 budget before committing a single rupee.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetSimulation}
            className="text-xs border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset Scenario
          </Button>
        </div>
      </div>

      {/* Main Interactive Controls & Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Simulation Inputs Panel */}
        <div className="lg:col-span-5 space-y-5">
          <Card className="p-5 space-y-4 border border-[#C8FF55]/30 shadow-xl shadow-black/30">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Simulated Purchase Parameters
              </h3>
              <Badge variant="lime">Live Sandbox</Badge>
            </div>

            {/* Expense Description */}
            <Input
              label="Purchase Description"
              value={simulationParams.description}
              onChange={(e) => setSimulationParams({ description: e.target.value })}
              placeholder="e.g. Sony WH-1000XM4, Concert Ticket, Weekend Feast"
            />

            {/* Expense Amount with number input & slider */}
            <div className="space-y-3">
              <Input
                label="Proposed Amount (₹)"
                type="number"
                min="0"
                max="10000"
                step="50"
                value={simulationParams.amount}
                onChange={(e) => handleAmountChange(Number(e.target.value))}
                prefixElement="₹"
                error={inputError || undefined}
              />

              <Slider
                label="Adjust Amount Slider"
                min={100}
                max={5000}
                step={50}
                value={simulationParams.amount}
                onChange={handleAmountChange}
                displayValue={formatINR(simulationParams.amount)}
              />
            </div>

            {/* Category & Expense Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Category"
                value={simulationParams.category}
                onChange={(e) =>
                  setSimulationParams({ category: e.target.value as TransactionCategory })
                }
              >
                <option value="shopping">Shopping & Gear</option>
                <option value="food_groceries">Food & Dining</option>
                <option value="entertainment">Outings & Entertainment</option>
                <option value="transport">Travel & Metro</option>
                <option value="education">Study & Books</option>
                <option value="health_wellness">Health & Pharmacy</option>
                <option value="subscriptions">Subscriptions & Apps</option>
                <option value="bills_utilities">Bills & Utilities</option>
                <option value="other">Other Miscellaneous</option>
              </Select>

              <Select
                label="Expense Urgency"
                value={simulationParams.expenseType}
                onChange={(e) =>
                  setSimulationParams({ expenseType: e.target.value as ExpenseType })
                }
              >
                <option value="planned">Planned Purchase</option>
                <option value="essential">Essential Expense</option>
                <option value="unexpected">Unexpected Emergency</option>
              </Select>
            </div>

            {/* Timing Option: Buy Today vs Delay */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Purchase Timing Strategy
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Buy Today', days: 0 },
                  { label: '+7 Days', days: 7 },
                  { label: '+14 Days', days: 14 },
                ].map((opt) => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setSimulationParams({ delayDays: opt.days })}
                    className={`py-2 px-2 text-xs font-medium rounded-xl border transition-all ${
                      simulationParams.delayDays === opt.days
                        ? 'bg-[#C8FF55]/20 text-[#C8FF55] border-[#C8FF55]'
                        : 'bg-[#0E1526] text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions: Commit Expense or Reset */}
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <Button
                variant="primary"
                size="lg"
                onClick={handleCommit}
                isLoading={isCommitting}
                disabled={simulationProjection.affordabilityStatus === 'unaffordable'}
                className="w-full font-bold"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Commit Expense to Actual Records
              </Button>
              <p className="text-[11px] text-center text-slate-400">
                Simulations are 100% risk-free. Clicking Commit applies this purchase to actual records exactly once.
              </p>
            </div>
          </Card>

          {/* Trade-off Explainer Component */}
          <TradeoffExplainer
            projection={simulationProjection}
            expenseAmount={simulationParams.amount}
          />
        </div>

        {/* Right Column: Comparison Cards and 30-Day Forecast */}
        <div className="lg:col-span-7 space-y-5">
          {/* Side-by-side comparison with deltas */}
          <ComparisonView
            metrics={metrics}
            projection={simulationProjection}
            expenseAmount={simulationParams.amount}
          />

          {/* 30-Day Cash Flow Forecast Chart */}
          <ForecastChart
            forecastData={forecastData}
            currentDay={metrics.currentDay}
            totalBudget={metrics.totalBudget}
          />
        </div>
      </div>

      {/* Real-World One-Click Scenarios Grid */}
      <ScenarioCards
        onSelectScenario={(s) =>
          loadScenarioIntoSimulation({
            description: s.description,
            amount: s.amount,
            category: s.category,
            type: s.type,
          })
        }
        selectedAmount={simulationParams.amount}
      />
    </div>
  );
};
