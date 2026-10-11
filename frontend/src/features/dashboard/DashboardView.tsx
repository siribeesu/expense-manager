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
  const { metrics, transactions, commitments, isSimulating, simulationProjection, addTransaction } = useFinance();

  const recentTransactions = transactions.slice(0, 5);
  const upcomingCommitments = commitments.filter((c) => !c.isPaid).slice(0, 3);

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
        {/* 1. Monthly Budget */}
        <MetricCard
          title="Starting Budget"
          value={formatINR(metrics.totalBudget)}
          subtext="30-day fixed cap"
          icon={Wallet}
        />

        {/* 2. Total Spent */}
        <MetricCard
          title="Total Spent"
          value={formatINR(metrics.totalSpent)}
          subtext={`${transactions.length} transactions`}
          icon={TrendingDown}
          iconColor="text-red-400"
          deltaText={`${Math.round((metrics.totalSpent / metrics.totalBudget) * 100)}% utilized`}
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
          subtext="Unpaid bills locked"
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
                      className="p-3 rounded-xl bg-[#0E1526] border border-slate-800 flex items-center justify-between"
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
                          {meta.label} · Due on Day {com.dueDay} ({com.dueDay - metrics.currentDay} days away)
                        </p>
                      </div>
                      <div className="text-right font-mono shrink-0 pl-3">
                        <span className="text-sm font-bold text-amber-400">
                          {formatINR(com.amount)}
                        </span>
                        <span className="block text-[10px] text-slate-400">Reserved</span>
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
