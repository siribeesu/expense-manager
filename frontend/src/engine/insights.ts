import type { FinancialMetrics, Commitment, SavingsGoal, InsightItem } from '../types/finance';
import { formatINR, formatPercent, getCategoryMeta } from '../lib/formatters';

export function generateFinancialInsights(
  metrics: FinancialMetrics,
  commitments: Commitment[],
  savingsGoals: SavingsGoal[]
): InsightItem[] {
  const insights: InsightItem[] = [];

  // 1. Spending Pace insight
  if (metrics.paceDeviationPercent < -10) {
    insights.push({
      id: 'pace-disciplined',
      type: 'success',
      title: 'Spending Under Paced Budget',
      message: `Your current burn rate (₹${metrics.actualDailyBurnRate}/day) is ${Math.abs(metrics.paceDeviationPercent)}% below the planned pace (₹${metrics.idealDailyBurnRate}/day). You're conserving cash nicely!`,
      metric: `${Math.abs(metrics.paceDeviationPercent)}% Under`,
      actionText: 'Deposit Savings',
      actionRoute: '/goals',
      priority: 2,
    });
  } else if (metrics.paceDeviationPercent > 15) {
    insights.push({
      id: 'pace-accelerated',
      type: 'alert',
      title: 'Spending Ahead of Schedule',
      message: `Your daily burn rate is ${metrics.paceDeviationPercent}% higher than planned. Slow down discretionary spending to preserve your end-of-month runway.`,
      metric: `+${metrics.paceDeviationPercent}% Burn`,
      actionText: 'Simulate Cutbacks',
      actionRoute: '/simulator',
      priority: 1,
    });
  }

  // 2. Commitments & Bills insight
  const upcomingCommitments = commitments.filter((c) => !c.isPaid && c.dueDay >= metrics.currentDay);
  const totalUpcoming = upcomingCommitments.reduce((sum, c) => sum + c.amount, 0);
  if (upcomingCommitments.length > 0) {
    insights.push({
      id: 'commitments-due',
      type: 'opportunity',
      title: `${upcomingCommitments.length} Upcoming Obligations Locked`,
      message: `You have ${upcomingCommitments.length} upcoming commitments totaling ${formatINR(totalUpcoming)} safely earmarked before Day 30.`,
      metric: formatINR(totalUpcoming),
      actionText: 'View Commitments',
      actionRoute: '/commitments',
      priority: 2,
    });
  }

  // 3. Subscriptions Footprint
  const subscriptions = commitments.filter((c) => c.isSubscription);
  const subscriptionTotal = subscriptions.reduce((sum, c) => sum + c.amount, 0);
  const subPercentOfBudget = metrics.totalBudget > 0 ? (subscriptionTotal / metrics.totalBudget) * 100 : 0;
  if (subPercentOfBudget > 0) {
    insights.push({
      id: 'subscription-weight',
      type: 'tip',
      title: 'Recurring Subscription Footprint',
      message: `Your recurring OTT and digital services total ${formatINR(subscriptionTotal)}/month (${formatPercent(subPercentOfBudget)} of your total ₹10k budget).`,
      metric: `${formatPercent(subPercentOfBudget)} of Budget`,
      actionText: 'Manage Subscriptions',
      actionRoute: '/commitments',
      priority: 3,
    });
  }

  // 4. Category Dominance Insight
  let dominantCategory = null;
  let maxSpend = 0;
  for (const [cat, amt] of Object.entries(metrics.categoryTotals)) {
    if (amt > maxSpend) {
      maxSpend = amt;
      dominantCategory = cat;
    }
  }

  if (dominantCategory && metrics.totalSpent > 0) {
    const meta = getCategoryMeta(dominantCategory as any);
    const dominantPercent = (maxSpend / metrics.totalSpent) * 100;
    if (dominantPercent >= 30) {
      insights.push({
        id: 'category-dominance',
        type: 'tip',
        title: `Heavy Spend in ${meta.label}`,
        message: `${meta.label} accounts for ${formatPercent(dominantPercent)} (${formatINR(maxSpend)}) of your completed spending so far.`,
        metric: formatPercent(dominantPercent),
        actionText: 'View Transactions',
        actionRoute: '/transactions',
        priority: 2,
      });
    }
  }

  // 5. Savings Goal Trajectory
  const primaryGoal = savingsGoals[0];
  if (primaryGoal) {
    const remainingToSave = Math.max(0, primaryGoal.targetAmount - primaryGoal.currentAmount);
    if (remainingToSave > 0) {
      const dailyNeeded = Math.ceil(remainingToSave / metrics.remainingDays);
      insights.push({
        id: 'savings-trajectory',
        type: dailyNeeded <= metrics.safeDailyAllowance ? 'success' : 'alert',
        title: `Goal Pace: ${primaryGoal.name}`,
        message: `To reach your ${formatINR(primaryGoal.targetAmount)} goal, save ${formatINR(dailyNeeded)}/day over the remaining ${metrics.remainingDays} days.`,
        metric: `${formatINR(dailyNeeded)}/day`,
        actionText: 'Boost Goal',
        actionRoute: '/goals',
        priority: 1,
      });
    } else {
      insights.push({
        id: 'goal-achieved',
        type: 'success',
        title: `Goal Met: ${primaryGoal.name}!`,
        message: `Congratulations! You've successfully locked away ${formatINR(primaryGoal.targetAmount)} towards your target.`,
        metric: '100% Done',
        actionText: 'Create New Goal',
        actionRoute: '/goals',
        priority: 3,
      });
    }
  }

  // 6. Safe Max Purchase Cushion
  const safeOneTimeCap = Math.max(0, Math.floor(metrics.availableCash - (metrics.remainingDays * 120)));
  if (safeOneTimeCap > 0) {
    insights.push({
      id: 'max-safe-purchase',
      type: 'opportunity',
      title: 'Safe One-Time Purchase Capacity',
      message: `You can make a one-time purchase of up to ${formatINR(safeOneTimeCap)} today and still maintain a viable ₹120/day allowance until Day 30.`,
      metric: formatINR(safeOneTimeCap),
      actionText: 'Test in Simulator',
      actionRoute: '/simulator',
      priority: 2,
    });
  }

  return insights.sort((a, b) => a.priority - b.priority);
}
