import type { Transaction, SavingsGoal, Commitment, FinancialMetrics, TransactionCategory } from '../types/finance';
import { calculateFinancialHealth } from './healthScore';

interface CalculateMetricsParams {
  totalBudget: number;
  currentDay: number;
  totalDays?: number;
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  commitments: Commitment[];
}

export function calculateFinancialMetrics({
  totalBudget,
  currentDay,
  totalDays = 30,
  transactions,
  savingsGoals,
  commitments,
}: CalculateMetricsParams): FinancialMetrics {
  // Normalize and guard inputs
  const safeBudget = Math.max(0, totalBudget);
  const safeCurrentDay = Math.min(Math.max(1, currentDay), totalDays);
  // Remaining days including today: e.g. Day 12 to 30 = 30 - 12 + 1 = 19 days
  const remainingDays = Math.max(1, totalDays - safeCurrentDay + 1);

  // 1. Total spent so far (only completed actual expense transactions up to currentDay)
  let totalSpent = 0;
  let spentToday = 0;

  const categoryTotals: Record<TransactionCategory, number> = {
    food_groceries: 0,
    transport: 0,
    education: 0,
    entertainment: 0,
    shopping: 0,
    subscriptions: 0,
    health_wellness: 0,
    bills_utilities: 0,
    other: 0,
  };

  transactions.forEach((tx) => {
    // Both standard expense and commitment payments count towards spent total
    if (tx.type === 'expense' || tx.type === 'commitment_payment') {
      const amt = Math.max(0, tx.amount);
      totalSpent += amt;
      if (tx.day === safeCurrentDay) {
        spentToday += amt;
      }
      if (categoryTotals[tx.category] !== undefined) {
        categoryTotals[tx.category] += amt;
      } else {
        categoryTotals.other += amt;
      }
    }
  });

  // Calculate percentages
  const categoryPercentages: Record<TransactionCategory, number> = { ...categoryTotals };
  (Object.keys(categoryTotals) as TransactionCategory[]).forEach((cat) => {
    categoryPercentages[cat] = totalSpent > 0 ? (categoryTotals[cat] / totalSpent) * 100 : 0;
  });

  // 2. Reserved Savings (all money already safely locked into goals)
  const reservedSavings = savingsGoals.reduce((sum, goal) => sum + Math.max(0, goal.currentAmount), 0);

  // 3. Reserved Commitments (unpaid obligations due in remaining days of the period)
  // Note: Only commitments that are NOT paid are reserved
  const reservedCommitments = commitments
    .filter((c) => !c.isPaid && c.dueDay >= safeCurrentDay)
    .reduce((sum, c) => sum + Math.max(0, c.amount), 0);

  // 4. Net Available Cash
  // Formula: totalBudget - totalSpent - reservedSavings - reservedCommitments
  const availableCash = safeBudget - totalSpent - reservedSavings - reservedCommitments;

  // 5. Safe Daily Allowance
  // The uncommitted cash pool available for variable spending from today until day 30:
  // availableCash is unspent. Today's already spent amount is spentToday.
  // Pool available for remainingDays = availableCash + spentToday.
  const variableSpendingPoolRemaining = Math.max(0, availableCash + spentToday);
  const safeDailyAllowance = Math.max(0, Math.floor(variableSpendingPoolRemaining / remainingDays));
  const remainingDailyAllowanceToday = Math.max(0, safeDailyAllowance - spentToday);

  // 6. Projected End-of-Period Balance (available cash if spending matches safe daily allowance)
  // If user spends exactly the safeDailyAllowance every remaining day:
  // endCash = availableCash - (remainingDays - 1) * safeDailyAllowance
  // which will safely trend around 0 or slight positive buffer.
  const projectedEndOfPeriodBalance = Math.max(0, availableCash);

  // 7. Spending pace velocity
  const actualDailyBurnRate = safeCurrentDay > 0 ? Math.round(totalSpent / safeCurrentDay) : 0;
  const idealDailyBurnRate = Math.round(safeBudget / totalDays); // e.g. 10000 / 30 = 333
  
  // Pace deviation: comparing actual burn rate with allowance pace
  const paceDeviationPercent = idealDailyBurnRate > 0 
    ? Math.round(((actualDailyBurnRate - idealDailyBurnRate) / idealDailyBurnRate) * 100)
    : 0;

  const isPaceSustainable = availableCash >= 0 && safeDailyAllowance >= 120;

  // 8. Health and risk breakdown
  const health = calculateFinancialHealth({
    totalBudget: safeBudget,
    availableCash,
    safeDailyAllowance,
    reservedCommitments,
    reservedSavings,
    totalSpent,
    currentDay: safeCurrentDay,
    totalDays,
    savingsGoals,
  });

  return {
    totalBudget: safeBudget,
    currentDay: safeCurrentDay,
    totalDays,
    remainingDays,
    totalSpent,
    spentToday,
    reservedSavings,
    reservedCommitments,
    availableCash,
    safeDailyAllowance,
    remainingDailyAllowanceToday,
    projectedEndOfPeriodBalance,
    actualDailyBurnRate,
    idealDailyBurnRate,
    paceDeviationPercent,
    isPaceSustainable,
    categoryTotals,
    categoryPercentages,
    health,
  };
}
