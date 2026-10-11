export type TransactionCategory =
  | 'food_groceries'
  | 'transport'
  | 'education'
  | 'entertainment'
  | 'shopping'
  | 'subscriptions'
  | 'health_wellness'
  | 'bills_utilities'
  | 'other';

export interface CategoryMeta {
  id: TransactionCategory;
  label: string;
  color: string;
  icon: string;
}

export type TransactionType = 'expense' | 'savings_deposit' | 'commitment_payment';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: TransactionCategory;
  day: number; // Day in 1..30 cycle
  dateStr: string; // ISO format or formatted string
  type: TransactionType;
  isRecurring?: boolean;
  notes?: string;
  createdAt: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDay: number; // Day 30 by default
  categoryIcon: string;
  color: string;
  createdAt: number;
  notes?: string;
}

export type CommitmentFrequency = 'monthly' | 'weekly' | 'annual_split';

export interface Commitment {
  id: string;
  name: string;
  amount: number;
  category: TransactionCategory;
  dueDay: number; // Day of month (1..30)
  frequency: CommitmentFrequency;
  isPaid: boolean;
  paidTransactionId?: string;
  isSubscription: boolean;
  serviceProvider?: string;
}

export type ExpenseType = 'planned' | 'essential' | 'unexpected';

export interface SimulationParams {
  description: string;
  amount: number;
  category: TransactionCategory;
  expenseType: ExpenseType;
  delayDays: number; // 0 for today
  isRecurring: boolean;
  recurringFrequency?: 'weekly' | 'monthly';
}

export interface FinancialHealthBreakdown {
  cashRunwayScore: number; // 0-30
  commitmentCoverageScore: number; // 0-25
  savingsProgressScore: number; // 0-20
  spendingPaceScore: number; // 0-15
  emergencyBufferScore: number; // 0-10
  totalScore: number; // 0-100
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  headline: string;
  keyFactors: {
    factor: string;
    status: 'positive' | 'warning' | 'negative';
    scoreText: string;
    impact: string;
  }[];
  actionableTips: string[];
}

export interface FinancialMetrics {
  totalBudget: number;
  currentDay: number;
  totalDays: number;
  remainingDays: number;
  
  // Accounting buckets
  totalSpent: number;
  spentToday: number;
  reservedSavings: number;
  reservedCommitments: number;
  availableCash: number;
  
  // Safe spending limits
  safeDailyAllowance: number;
  remainingDailyAllowanceToday: number;
  projectedEndOfPeriodBalance: number;
  
  // Spending velocity
  actualDailyBurnRate: number;
  idealDailyBurnRate: number;
  paceDeviationPercent: number; // positive = spending faster than budget
  isPaceSustainable: boolean;

  // Breakdown by category
  categoryTotals: Record<TransactionCategory, number>;
  categoryPercentages: Record<TransactionCategory, number>;

  // Health
  health: FinancialHealthBreakdown;
}

export interface InsightItem {
  id: string;
  type: 'alert' | 'tip' | 'success' | 'opportunity';
  title: string;
  message: string;
  metric?: string;
  actionText?: string;
  actionRoute?: string;
  priority: 1 | 2 | 3; // 1 = highest
}

export interface DayForecastPoint {
  day: number;
  actualSpent?: number;
  projectedCumulativeSpent: number;
  simulatedCumulativeSpent?: number;
  budgetCap: number;
  safeSpendCeiling: number;
}
