import type { FinancialHealthBreakdown, SavingsGoal } from '../types/finance';

interface HealthCalculationParams {
  totalBudget: number;
  availableCash: number;
  safeDailyAllowance: number;
  reservedCommitments: number;
  reservedSavings: number;
  totalSpent: number;
  currentDay: number;
  totalDays: number;
  savingsGoals: SavingsGoal[];
}

export function calculateFinancialHealth({
  totalBudget,
  availableCash,
  safeDailyAllowance,
  reservedCommitments,
  reservedSavings,
  totalSpent = 0,
  currentDay,
  totalDays,
  savingsGoals,
}: HealthCalculationParams): FinancialHealthBreakdown {
  // Guard against deficit
  if (availableCash < 0) {
    return {
      cashRunwayScore: 0,
      commitmentCoverageScore: 0,
      savingsProgressScore: 5,
      spendingPaceScore: 0,
      emergencyBufferScore: 0,
      totalScore: 12,
      riskLevel: 'critical',
      headline: 'Severe Budget Deficit — Immediate Intervention Required',
      keyFactors: [
        {
          factor: 'Cash Deficit',
          status: 'negative',
          scoreText: '0 / 30',
          impact: 'Available funds are negative; current expenses exceed monthly allocation.',
        },
        {
          factor: 'Commitments at Risk',
          status: 'negative',
          scoreText: '0 / 25',
          impact: 'Upcoming bills and subscriptions cannot be covered with current cash.',
        },
        {
          factor: 'Daily Allowance Broken',
          status: 'negative',
          scoreText: '0 / 15',
          impact: 'Safe daily spending limit is ₹0.',
        },
      ],
      actionableTips: [
        'Halt all non-essential discretionary spending immediately.',
        'Review and pause non-critical subscriptions like OTT or gym shares.',
        'Consider pulling back emergency fund deposits temporarily to cover bills.',
      ],
    };
  }

  // 1. Cash Runway & Safe Daily Allowance (Max 30)
  // Baseline benchmarks for ₹10,000 monthly student/young-pro budget:
  // ₹220+/day is comfortable, ₹150-219/day is moderate, <₹100/day is tight, <₹50/day is severe.
  let cashRunwayScore = 0;
  if (safeDailyAllowance >= 230) {
    cashRunwayScore = 30;
  } else if (safeDailyAllowance >= 180) {
    cashRunwayScore = 25;
  } else if (safeDailyAllowance >= 130) {
    cashRunwayScore = 18;
  } else if (safeDailyAllowance >= 80) {
    cashRunwayScore = 10;
  } else {
    cashRunwayScore = Math.max(2, Math.round((safeDailyAllowance / 80) * 10));
  }

  // 2. Commitment Coverage Ratio (Max 25)
  // Can available cash comfortably absorb upcoming obligations?
  let commitmentCoverageScore = 0;
  if (reservedCommitments === 0) {
    commitmentCoverageScore = 25; // All commitments paid or none
  } else {
    const coverageRatio = availableCash / reservedCommitments;
    if (coverageRatio >= 2.5) {
      commitmentCoverageScore = 25;
    } else if (coverageRatio >= 1.5) {
      commitmentCoverageScore = 21;
    } else if (coverageRatio >= 1.0) {
      commitmentCoverageScore = 15;
    } else if (coverageRatio >= 0.5) {
      commitmentCoverageScore = 8;
    } else {
      commitmentCoverageScore = 3;
    }
  }

  // 3. Savings Target Progress (Max 20)
  // Compare savings achieved vs expected proportion based on timeline
  const totalGoalTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalGoalSaved = reservedSavings;
  let savingsProgressScore = totalGoalTarget > 0 ? 10 : 15;

  if (totalGoalTarget > 0) {
    const savingsRatio = Math.min(1.2, totalGoalSaved / totalGoalTarget);
    const expectedTimeRatio = Math.min(1, currentDay / totalDays);
    
    // If saving pace matches or exceeds the cycle's progress
    if (savingsRatio >= expectedTimeRatio * 1.1) {
      savingsProgressScore = 20;
    } else if (savingsRatio >= expectedTimeRatio * 0.8) {
      savingsProgressScore = 16;
    } else if (savingsRatio >= expectedTimeRatio * 0.5) {
      savingsProgressScore = 11;
    } else {
      savingsProgressScore = 6;
    }
  }

  // 4. Spending Pace Discipline (Max 15)
  // Theoretical allowable pace: 10,000 / 30 = ₹333/day.
  // Burn rate so far: totalSpent / currentDay.
  const idealBurnRate = totalBudget / totalDays;
  const actualBurnRate = currentDay > 0 ? (totalBudget - availableCash - reservedCommitments) / currentDay : 0;
  let spendingPaceScore = 0;

  if (actualBurnRate <= idealBurnRate * 0.9) {
    spendingPaceScore = 15; // Under-budget pace, excellent discipline
  } else if (actualBurnRate <= idealBurnRate * 1.05) {
    spendingPaceScore = 13; // On track
  } else if (actualBurnRate <= idealBurnRate * 1.25) {
    spendingPaceScore = 8; // Slightly elevated pace
  } else {
    spendingPaceScore = 3; // Burning too fast
  }

  // 5. Emergency Buffer & Cushion (Max 10)
  // Cushion = available cash + reserved savings as % of total budget
  const cushionRatio = (availableCash + reservedSavings) / totalBudget;
  let emergencyBufferScore = 0;
  if (cushionRatio >= 0.45) {
    emergencyBufferScore = 10;
  } else if (cushionRatio >= 0.3) {
    emergencyBufferScore = 8;
  } else if (cushionRatio >= 0.15) {
    emergencyBufferScore = 5;
  } else {
    emergencyBufferScore = 2;
  }

  const totalScore = Math.min(
    100,
    Math.max(0, cashRunwayScore + commitmentCoverageScore + savingsProgressScore + spendingPaceScore + emergencyBufferScore)
  );

  let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
  let headline = 'Strong Financial Flightpath';

  if (totalScore >= 78) {
    riskLevel = 'low';
    headline = totalSpent === 0 ? 'Optimal Launchpad — Full ₹10,000 Runway Ready' : 'Smooth Runway — Balanced Spending & Healthy Reserves';
  } else if (totalScore >= 60) {
    riskLevel = 'moderate';
    headline = 'Stable Orbit — Minor Adjustments Advised';
  } else if (totalScore >= 40) {
    riskLevel = 'high';
    headline = 'Elevated Turbulence — Discretionary Spending Pressure';
  } else {
    riskLevel = 'critical';
    headline = 'Critical Threat — Impending Cash Depletion';
  }

  const keyFactors = [
    {
      factor: 'Daily Spending Allowance',
      status: safeDailyAllowance >= 180 ? ('positive' as const) : safeDailyAllowance >= 120 ? ('warning' as const) : ('negative' as const),
      scoreText: `${cashRunwayScore} / 30 pts`,
      impact: `You have ₹${safeDailyAllowance}/day safely available for the next ${Math.max(1, totalDays - currentDay + 1)} days.`,
    },
    {
      factor: 'Commitment Obligations',
      status: commitmentCoverageScore >= 18 ? ('positive' as const) : commitmentCoverageScore >= 12 ? ('warning' as const) : ('negative' as const),
      scoreText: `${commitmentCoverageScore} / 25 pts`,
      impact: reservedCommitments > 0 
        ? `₹${reservedCommitments} locked for upcoming bills. Cash covers it by ${(availableCash / reservedCommitments).toFixed(1)}x.`
        : 'Zero upcoming unpaid commitments in this cycle.',
    },
    {
      factor: 'Savings Target Trajectory',
      status: savingsProgressScore >= 15 ? ('positive' as const) : savingsProgressScore >= 10 ? ('warning' as const) : ('negative' as const),
      scoreText: `${savingsProgressScore} / 20 pts`,
      impact: totalGoalTarget > 0 
        ? `₹${totalGoalSaved} accumulated towards ₹${totalGoalTarget} target (${Math.round((totalGoalSaved / totalGoalTarget) * 100)}%).`
        : 'No active savings goals defined.',
    },
    {
      factor: 'Pace & Buffer Discipline',
      status: spendingPaceScore + emergencyBufferScore >= 18 ? ('positive' as const) : ('warning' as const),
      scoreText: `${spendingPaceScore + emergencyBufferScore} / 25 pts`,
      impact: 'Burn velocity and liquid cushion relative to 30-day budget cycle.',
    },
  ];

  const actionableTips: string[] = [];
  if (safeDailyAllowance < 180) {
    actionableTips.push(`Cap discretionary food outings to stay within the ₹${safeDailyAllowance} daily ceiling.`);
  } else {
    actionableTips.push(`You can safely spend up to ₹${safeDailyAllowance} today without endangering upcoming bills.`);
  }

  if (reservedCommitments > 0 && availableCash < reservedCommitments * 1.5) {
    actionableTips.push(`Keep ₹${reservedCommitments} reserved for upcoming bills due later this month.`);
  }

  if (totalGoalTarget > totalGoalSaved) {
    const daysLeft = Math.max(1, totalDays - currentDay);
    const neededDaily = Math.round((totalGoalTarget - totalGoalSaved) / daysLeft);
    if (neededDaily > 0 && neededDaily < safeDailyAllowance) {
      actionableTips.push(`Putting aside ₹${neededDaily}/day will guarantee hitting your savings target by Day 30.`);
    }
  }

  if (actionableTips.length === 0) {
    actionableTips.push('Financial trajectory is fully on track. Continue with your disciplined allocation.');
  }

  return {
    cashRunwayScore,
    commitmentCoverageScore,
    savingsProgressScore,
    spendingPaceScore,
    emergencyBufferScore,
    totalScore,
    riskLevel,
    headline,
    keyFactors,
    actionableTips,
  };
}
