import type {
  Transaction,
  Commitment,
  SavingsGoal,
  FinancialMetrics,
  SimulationParams,
  DayForecastPoint,
} from '../types/finance';
import { calculateFinancialHealth } from './healthScore';

export interface SimulationProjection {
  simulatedAvailableCash: number;
  simulatedSafeDailyAllowance: number;
  simulatedHealthScore: number;
  simulatedRiskLevel: 'low' | 'moderate' | 'high' | 'critical';
  simulatedSavingsProgress: number; // percentage
  
  // Deltas (simulated - current)
  deltaAvailableCash: number;
  deltaDailyAllowance: number;
  deltaHealthScore: number;
  
  // Status & Explanations
  affordabilityStatus: 'affordable' | 'tight' | 'jeopardizes_goals' | 'unaffordable';
  tradeoffSummary: string;
  alternativeRecommendation: string;
}

export function projectSimulation(
  baseMetrics: FinancialMetrics,
  params: SimulationParams,
  savingsGoals: SavingsGoal[],
  _commitments?: Commitment[]
): SimulationProjection {
  const expenseAmount = Math.max(0, params.amount);
  const remainingDays = baseMetrics.remainingDays;

  // Calculate simulated available cash
  const simulatedAvailableCash = baseMetrics.availableCash - expenseAmount;
  
  // Calculate simulated daily allowance
  // New pool for remaining days: Math.max(0, simulatedAvailableCash + baseMetrics.spentToday)
  const newVariablePool = Math.max(0, simulatedAvailableCash + baseMetrics.spentToday);
  const simulatedSafeDailyAllowance = Math.max(0, Math.floor(newVariablePool / remainingDays));

  // Savings progress: does it necessitate dipping into savings or missing goal?
  const totalGoalTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const currentSaved = baseMetrics.reservedSavings;
  const simulatedSavingsProgress = totalGoalTarget > 0 ? (currentSaved / totalGoalTarget) * 100 : 100;

  // Simulated health score
  const simulatedHealth = calculateFinancialHealth({
    totalBudget: baseMetrics.totalBudget,
    availableCash: simulatedAvailableCash,
    safeDailyAllowance: simulatedSafeDailyAllowance,
    reservedCommitments: baseMetrics.reservedCommitments,
    reservedSavings: baseMetrics.reservedSavings,
    totalSpent: baseMetrics.totalSpent + expenseAmount,
    currentDay: baseMetrics.currentDay,
    totalDays: baseMetrics.totalDays,
    savingsGoals,
  });

  const deltaAvailableCash = simulatedAvailableCash - baseMetrics.availableCash; // negative number
  const deltaDailyAllowance = simulatedSafeDailyAllowance - baseMetrics.safeDailyAllowance; // negative number
  const deltaHealthScore = simulatedHealth.totalScore - baseMetrics.health.totalScore;

  // Affordability assessment
  let affordabilityStatus: SimulationProjection['affordabilityStatus'] = 'affordable';
  let tradeoffSummary = '';
  let alternativeRecommendation = '';

  if (simulatedAvailableCash < 0) {
    affordabilityStatus = 'unaffordable';
    tradeoffSummary = `This purchase exceeds your available cash by ₹${Math.abs(simulatedAvailableCash)}. Committing this will create a cash deficit and breach your ₹10,000 budget.`;
    alternativeRecommendation = `Decline or defer this purchase until next month's fresh ₹10,000 budget reset.`;
  } else if (simulatedSafeDailyAllowance < 100) {
    affordabilityStatus = 'tight';
    const dailyDropPercent = baseMetrics.safeDailyAllowance > 0
      ? Math.round((Math.abs(deltaDailyAllowance) / baseMetrics.safeDailyAllowance) * 100)
      : 0;
    tradeoffSummary = `Spending ₹${expenseAmount} cuts your daily allowance by ${dailyDropPercent}% (from ₹${baseMetrics.safeDailyAllowance} to ₹${simulatedSafeDailyAllowance}/day) for the next ${remainingDays} days.`;
    alternativeRecommendation = `Consider splitting this purchase or delaying it to Day ${Math.min(30, baseMetrics.currentDay + 10)} to soften the daily pinch.`;
  } else if (simulatedAvailableCash < baseMetrics.reservedCommitments) {
    affordabilityStatus = 'jeopardizes_goals';
    tradeoffSummary = `You will have ₹${simulatedAvailableCash} left, which is less than your ₹${baseMetrics.reservedCommitments} in upcoming commitments. You may struggle to pay bills due later.`;
    alternativeRecommendation = `Wait until Day 26 once high-priority bills are cleared before committing to this discretionary item.`;
  } else {
    affordabilityStatus = 'affordable';
    tradeoffSummary = `Easily affordable within current cash flow. Your daily allowance reduces modestly by ₹${Math.abs(deltaDailyAllowance)}/day, remaining at a healthy ₹${simulatedSafeDailyAllowance}/day.`;
    alternativeRecommendation = `Green light! You can safely proceed without jeopardizing your savings goal or upcoming bills.`;
  }

  return {
    simulatedAvailableCash,
    simulatedSafeDailyAllowance,
    simulatedHealthScore: simulatedHealth.totalScore,
    simulatedRiskLevel: simulatedHealth.riskLevel,
    simulatedSavingsProgress,
    deltaAvailableCash,
    deltaDailyAllowance,
    deltaHealthScore,
    affordabilityStatus,
    tradeoffSummary,
    alternativeRecommendation,
  };
}

export function generate30DayForecast(
  transactions: Transaction[],
  commitments: Commitment[],
  currentDay: number,
  totalBudget: number,
  safeDailyAllowance: number,
  simulatedExpense?: { amount: number; day: number }
): DayForecastPoint[] {
  const points: DayForecastPoint[] = [];
  const totalDays = 30;

  // Pre-calculate actual cumulative spending by day
  const actualSpentByDay: Record<number, number> = {};
  transactions.forEach((tx) => {
    actualSpentByDay[tx.day] = (actualSpentByDay[tx.day] || 0) + tx.amount;
  });

  // Commitments by due day
  const commitmentsByDay: Record<number, number> = {};
  commitments.forEach((c) => {
    // Only future commitments count towards future projected trajectory
    if (!c.isPaid && c.dueDay > currentDay) {
      commitmentsByDay[c.dueDay] = (commitmentsByDay[c.dueDay] || 0) + c.amount;
    }
  });

  let runningActual = 0;
  let runningProjected = 0;
  let runningSimulated = 0;

  for (let d = 1; d <= totalDays; d++) {
    const dayActual = actualSpentByDay[d] || 0;
    
    if (d <= currentDay) {
      runningActual += dayActual;
      runningProjected = runningActual;
      runningSimulated = runningActual;
      
      points.push({
        day: d,
        actualSpent: runningActual,
        projectedCumulativeSpent: runningProjected,
        simulatedCumulativeSpent: simulatedExpense && simulatedExpense.day <= d ? runningSimulated + (simulatedExpense.day === d ? simulatedExpense.amount : 0) : undefined,
        budgetCap: totalBudget,
        safeSpendCeiling: Math.round((totalBudget / totalDays) * d),
      });
    } else {
      // Future days: project spending at safeDailyAllowance plus any scheduled commitments
      const scheduledCommitment = commitmentsByDay[d] || 0;
      runningProjected += safeDailyAllowance + scheduledCommitment;
      
      let simDeltaToday = 0;
      if (simulatedExpense && simulatedExpense.day === d) {
        simDeltaToday = simulatedExpense.amount;
      }
      
      // simulated safe daily allowance might be slightly lower
      const simulatedDaily = simulatedExpense 
        ? Math.max(0, safeDailyAllowance - Math.round(simulatedExpense.amount / (totalDays - currentDay + 1)))
        : safeDailyAllowance;
        
      runningSimulated += simulatedDaily + scheduledCommitment + simDeltaToday;

      points.push({
        day: d,
        actualSpent: undefined, // no actual future data
        projectedCumulativeSpent: Math.min(totalBudget + 2000, runningProjected),
        simulatedCumulativeSpent: simulatedExpense ? Math.min(totalBudget + 2000, runningSimulated) : undefined,
        budgetCap: totalBudget,
        safeSpendCeiling: Math.round((totalBudget / totalDays) * d),
      });
    }
  }

  return points;
}
