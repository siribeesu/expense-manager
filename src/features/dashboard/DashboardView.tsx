import React from 'react';
import { useFinance } from '../../context/useFinance';
import { formatINR, getCategoryMeta } from '../../lib/formatters';
import { MetricCard } from '../../components/common/MetricCard';
import { AllowanceGauge } from '../../components/common/AllowanceGauge';
import { HealthGauge } from '../../components/common/HealthGauge';
import { CategoryPieChart } from './CategoryPieChart';
import { DailySpendingChart } from './DailySpendingChart';
import { QuickSimWidget } from './QuickSimWidget';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import {
  Wallet,
  Coins,
  ShieldCheck,
  CalendarDays,
  Plus,
  ArrowRight,
  TrendingDown,
  Clock,
  Sparkles,
  Receipt,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import type { ActiveTab } from '../../components/layout/Sidebar';

export interface DashboardViewProps {
  onNavigate: (tab: ActiveTab) => void;
  onOpenAddTransaction: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenAddTransaction,
}) => {
  const {
    metrics,
    transactions,
    commitments,
    isSimulating,
    simulationProjection,
    addTransaction,
    setTotalBudget,
    loadScenarioIntoSimulation,
    markCommitmentPaid,
  } = useFinance();

  const recentTransactions = transactions.slice(0, 5);
  const upcomingCommitments = commitments.filter((c) => !c.isPaid).slice(0, 3);

  // Interconnected allocation percentages across totalBudget
  const budgetBase = Math.max(metrics.totalBudget, 1);
  const spentPct = Math.min(100, Math.round((metrics.totalSpent / budgetBase) * 100));
  const commitmentsPct = Math.min(100 - spentPct, Math.round((metrics.reservedCommitments / budgetBase) * 100));
  const savingsPct = Math.min(
    100 - spentPct - commitmentsPct,
    Math.round((metrics.reservedSavings / budgetBase) * 100)
  );
  const availablePct = Math.max(0, 100 - spentPct - commitmentsPct - savingsPct);

  const handleSimulateUnexpected = (description: string, amount: number, category: 'shopping' | 'health_wellness' | 'transport') => {
    loadScenarioIntoSimulation({
      description,
      amount,
      category,
      type: 'unexpected',
    });
    onNavigate('simulator');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Simulation Banner if currently running simulation */}
      {isSimulating && (
        <div className="p-4 rounded-2xl bg-[#C8FF55]/10 border border-[#C8FF55]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#C8FF55] text-[#0B1020] font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                What-If Simulation Active: Projected Allowance ₹{simulationProjection.simulatedSafeDailyAllowance}/day
              </p>
              <p className="text-xs text-slate-300">
                Simulating {formatINR(simulationProjection.deltaAvailableCash)} change in cash. Actual records remain untouched.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('simulator')}
            className="text-xs font-bold shrink-0"
          >
            Review Simulation <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      )}

      {/* Top Hero Grid: Safe Allowance Gauge & Health Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <AllowanceGauge
            safeDailyAllowance={metrics.safeDailyAllowance}
            spentToday={metrics.spentToday}
            remainingDailyAllowanceToday={metrics.remainingDailyAllowanceToday}
            remainingDays={metrics.remainingDays}
            availableCash={metrics.availableCash}
            isPaceSustainable={metrics.isPaceSustainable}
            onQuickSpend={(amount, description, category) => {
              addTransaction({
                description,
                amount,
                category,
                day: metrics.currentDay,
                dateStr: `Day ${metrics.currentDay}`,
                type: 'expense',
              });
            }}
          />
        </div>
        <div className="lg:col-span-5">
          <HealthGauge
            health={metrics.health}
            simulatedHealthScore={isSimulating ? simulationProjection.simulatedHealthScore : undefined}
            simulatedRiskLevel={isSimulating ? simulationProjection.simulatedRiskLevel : undefined}
          />
        </div>
      </div>

      {/* Primary Financial Metric Cards (Calculated directly from single-source financial state) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Monthly Budget / Income */}
        <MetricCard
          title="Monthly Income / Cap"
          value={formatINR(metrics.totalBudget)}
          subtext="30-day survival budget"
          icon={Wallet}
        />

        {/* 2. Total Spent */}
        <MetricCard
          title="Total Spent"
          value={formatINR(metrics.totalSpent)}
          subtext={`${transactions.length} transactions`}
          icon={TrendingDown}
          iconColor="text-red-400"
          deltaText={`${Math.round((metrics.totalSpent / budgetBase) * 100)}% utilized`}
          deltaType="neutral"
        />

        {/* 3. Available Cash */}
        <MetricCard
          title="Available Cash"
          value={formatINR(metrics.availableCash)}
          subtext="Free to allocate"
          icon={Coins}
          iconColor="text-[#C8FF55]"
          highlight
          badge={<Badge variant="lime">Liquid</Badge>}
        />

        {/* 4. Reserved Commitments */}
        <MetricCard
          title="Fixed Commitments"
          value={formatINR(metrics.reservedCommitments)}
          subtext="Unpaid bills & subs"
          icon={Clock}
          iconColor="text-amber-400"
        />

        {/* 5. Reserved Savings */}
        <MetricCard
          title="Goal Savings"
          value={formatINR(metrics.reservedSavings)}
          subtext="Protected in goals"
          icon={ShieldCheck}
          iconColor="text-emerald-400"
        />

        {/* 6. Days Remaining */}
        <MetricCard
          title="Days Left"
          value={`${metrics.remainingDays}d`}
          subtext={`Day ${metrics.currentDay} of ${metrics.totalDays}`}
          icon={CalendarDays}
          iconColor="text-cyan-400"
        />
      </div>

      {/* Interconnected 30-Day Budget Flow & Income / Unexpected Shock Control Center */}
      <Card className="p-4 sm:p-5 border border-slate-800/90 bg-gradient-to-r from-[#131B2F] via-[#121A2E] to-[#162038]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="lime" size="sm">Interconnected Engine</Badge>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Live 30-Day Money Flow & Income Controls
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Every rupee is interconnected: <span className="font-mono text-slate-200">{formatINR(metrics.totalBudget)} Income</span> −{' '}
              <span className="font-mono text-red-400">{formatINR(metrics.totalSpent)} Spent</span> −{' '}
              <span className="font-mono text-amber-400">{formatINR(metrics.reservedCommitments)} Bills/Subs</span> −{' '}
              <span className="font-mono text-emerald-400">{formatINR(metrics.reservedSavings)} Savings</span> ={' '}
              <span className="font-mono font-bold text-[#C8FF55]">{formatINR(metrics.availableCash)} Liquid</span> ({formatINR(metrics.safeDailyAllowance)}/day)
            </p>
          </div>

          {/* Quick Income / Stipend Boost Controls */}
          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Income / Stipend:</span>
            <button
              type="button"
              onClick={() => setTotalBudget(metrics.totalBudget + 500)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1"
              title="Add ₹500 side-hustle or allowance top-up to monthly budget"
            >
              <Zap className="w-3 h-3" /> +₹500 Gig
            </button>
            <button
              type="button"
              onClick={() => setTotalBudget(metrics.totalBudget + 1000)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-[#C8FF55]/10 hover:bg-[#C8FF55]/20 text-[#C8FF55] border border-[#C8FF55]/30 transition-all cursor-pointer flex items-center gap-1"
              title="Add ₹1,000 freelance stipend to monthly budget"
            >
              <Plus className="w-3 h-3" /> +₹1,000 Stipend
            </button>
            {metrics.totalBudget !== 10000 && (
              <button
                type="button"
                onClick={() => setTotalBudget(10000)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer flex items-center gap-1"
                title="Reset monthly budget cap back to ₹10,000"
              >
                <RotateCcw className="w-3 h-3" /> Reset ₹10k
              </button>
            )}
          </div>
        </div>

        {/* Stacked Multi-Segment Progress Bar */}
        <div className="mt-4 space-y-2">
          <div
            className="h-3 w-full rounded-full bg-[#0B1020] border border-slate-800 overflow-hidden flex"
            role="img"
            aria-label={`Budget allocation: ${spentPct}% spent, ${commitmentsPct}% bills, ${savingsPct}% savings, ${availablePct}% liquid cash`}
          >
            <div
              style={{ width: `${spentPct}%` }}
              className="h-full bg-red-500 transition-all duration-300"
              title={`Spent: ${formatINR(metrics.totalSpent)} (${spentPct}%)`}
            />
            <div
              style={{ width: `${commitmentsPct}%` }}
              className="h-full bg-amber-400 transition-all duration-300"
              title={`Reserved Bills & Subscriptions: ${formatINR(metrics.reservedCommitments)} (${commitmentsPct}%)`}
            />
            <div
              style={{ width: `${savingsPct}%` }}
              className="h-full bg-emerald-400 transition-all duration-300"
              title={`Protected Savings Goals: ${formatINR(metrics.reservedSavings)} (${savingsPct}%)`}
            />
            <div
              style={{ width: `${availablePct}%` }}
              className="h-full bg-[#C8FF55] transition-all duration-300"
              title={`Liquid Available Cash: ${formatINR(metrics.availableCash)} (${availablePct}%)`}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-0.5">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />
                Spent ({spentPct}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
                Bills & Subs ({commitmentsPct}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
                Savings Goals ({savingsPct}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#C8FF55] inline-block" />
                Liquid Runway ({availablePct}%)
              </span>
            </div>

            {/* 1-Click Unexpected Expense Shock Triggers */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Test Shock:
              </span>
              <button
                type="button"
                onClick={() => handleSimulateUnexpected('Cracked Phone Screen Repair', 2200, 'shopping')}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer font-mono"
              >
                📱 Screen ₹2.2k
              </button>
              <button
                type="button"
                onClick={() => handleSimulateUnexpected('Emergency Clinic & Meds', 1500, 'health_wellness')}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer font-mono"
              >
                💊 Medical ₹1.5k
              </button>
              <button
                type="button"
                onClick={() => handleSimulateUnexpected('Urgent Tatkal Train Ticket', 800, 'transport')}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer font-mono"
              >
                🚆 Tatkal ₹800
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Interactive Quick Simulation Launcher */}
      <QuickSimWidget onOpenSimulator={() => onNavigate('simulator')} />

      {/* Charts Row: Category Doughnut & Daily Spending Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5">
          <CategoryPieChart
            categoryTotals={metrics.categoryTotals}
            totalSpent={metrics.totalSpent}
          />
        </div>
        <div className="lg:col-span-7">
          <DailySpendingChart
            transactions={transactions}
            currentDay={metrics.currentDay}
            totalDays={metrics.totalDays}
            safeDailyAllowance={metrics.safeDailyAllowance}
          />
        </div>
      </div>

      {/* Bottom Row: Recent Transactions Ledger Preview & Upcoming Commitments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Recent Transactions */}
        <div className="lg:col-span-7">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="mb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Latest completed expenses & debits
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onOpenAddTransaction}
                    className="text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Spend
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate('transactions')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {recentTransactions.length === 0 ? (
              <div className="py-8 px-4 text-center space-y-2.5">
                <div className="w-10 h-10 rounded-full bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-500">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">No transactions recorded yet</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-0.5">
                    Your full ₹10,000 runway is untouched. Log your first expense to begin tracking.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onOpenAddTransaction}
                  className="text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Record Expense
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {recentTransactions.map((tx) => {
                  const meta = getCategoryMeta(tx.category);
                  return (
                    <div
                      key={tx.id}
                      className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                        >
                          <span className="text-xs font-bold">{meta.label.slice(0, 2)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {tx.description}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {meta.label} · Day {tx.day}
                          </p>
                        </div>
                      </div>
                      <div className="text-right font-mono shrink-0 pl-3">
                        <span className="text-sm font-bold text-white">
                          -{formatINR(tx.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Upcoming Commitments & Subscriptions */}
        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="mb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <CardTitle>Upcoming Commitments</CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Obligations safely reserved from spending
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('commitments')}
                  className="text-xs text-slate-400 hover:text-white shrink-0 self-start sm:self-auto"
                >
                  Manage <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </CardHeader>

            {upcomingCommitments.length === 0 ? (
              <div className="py-8 px-4 text-center space-y-2.5">
                <div className="w-10 h-10 rounded-full bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-500">
                  <Clock className="w-5 h-5 text-amber-400/80" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">No fixed commitments scheduled</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-0.5">
                    Add recurring bills or subscriptions so Thriftly locks funds before you overspend.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('commitments')}
                  className="text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Fixed Bill
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingCommitments.map((com) => {
                  const meta = getCategoryMeta(com.category);
                  return (
                    <div
                      key={com.id}
                      className="p-3 rounded-xl bg-[#0E1526] border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white truncate">
                            {com.name}
                          </span>
                          {com.isSubscription && (
                            <Badge variant="slate" size="sm">OTT / Sub</Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {meta.label} · Due Day {com.dueDay} ({com.dueDay - metrics.currentDay}d left)
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0 pl-2">
                        <div className="text-right font-mono">
                          <span className="text-sm font-bold text-amber-400 block">
                            {formatINR(com.amount)}
                          </span>
                          <span className="block text-[10px] text-slate-400">Reserved</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => markCommitmentPaid(com.id)}
                          aria-label={`Mark ${com.name} as paid`}
                          title="Settle bill now (converts reserved commitment to actual expense)"
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Total reserved in bills</span>
              <span className="font-mono font-bold text-white">
                {formatINR(metrics.reservedCommitments)}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
