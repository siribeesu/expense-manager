import { describe, it, expect } from 'vitest';
import { calculateFinancialMetrics } from '../engine/accounting';
import { projectSimulation } from '../engine/forecast';
import {
  SAMPLE_TEST_TRANSACTIONS,
  SAMPLE_TEST_GOALS,
  SAMPLE_TEST_COMMITMENTS,
} from '../data/demoData';

describe('Thriftly What-If Simulator Engine', () => {
  const baseMetrics = calculateFinancialMetrics({
    totalBudget: 10000,
    currentDay: 12,
    totalDays: 30,
    transactions: SAMPLE_TEST_TRANSACTIONS,
    savingsGoals: SAMPLE_TEST_GOALS,
    commitments: SAMPLE_TEST_COMMITMENTS,
  });

  it('calculates simulation deltas without mutating baseline state', () => {
    const originalAvailableCash = baseMetrics.availableCash;
    const originalDailyAllowance = baseMetrics.safeDailyAllowance;

    const projection = projectSimulation(
      baseMetrics,
      {
        description: 'Wireless Headphones',
        amount: 1500,
        category: 'shopping',
        expenseType: 'planned',
        delayDays: 0,
        isRecurring: false,
      },
      SAMPLE_TEST_GOALS,
      SAMPLE_TEST_COMMITMENTS
    );

    // Baseline metrics must be completely untouched
    expect(baseMetrics.availableCash).toBe(originalAvailableCash);
    expect(baseMetrics.safeDailyAllowance).toBe(originalDailyAllowance);

    // Simulated available cash must reflect -1500
    expect(projection.simulatedAvailableCash).toBe(originalAvailableCash - 1500);
    expect(projection.deltaAvailableCash).toBe(-1500);

    // Daily allowance must drop accordingly
    expect(projection.deltaDailyAllowance).toBeLessThan(0);
    expect(projection.simulatedSafeDailyAllowance).toBeLessThan(originalDailyAllowance);
  });

  it('flags an unaffordable expense when simulated amount exceeds available cash', () => {
    const excessiveAmount = baseMetrics.availableCash + 1000; // Definitely unaffordable

    const projection = projectSimulation(
      baseMetrics,
      {
        description: 'High-end Smartphone',
        amount: excessiveAmount,
        category: 'shopping',
        expenseType: 'planned',
        delayDays: 0,
        isRecurring: false,
      },
      SAMPLE_TEST_GOALS,
      SAMPLE_TEST_COMMITMENTS
    );

    expect(projection.affordabilityStatus).toBe('unaffordable');
    expect(projection.simulatedAvailableCash).toBeLessThan(0);
    expect(projection.tradeoffSummary).toContain('exceeds your available cash');
  });

  it('accurately identifies tight runway when expense severely cuts daily limit', () => {
    // Expense that leaves little variable cash (e.g. daily allowance drops below 100)
    const largeAmount = Math.max(100, baseMetrics.availableCash - 1200);

    const projection = projectSimulation(
      baseMetrics,
      {
        description: 'Weekend Trip',
        amount: largeAmount,
        category: 'transport',
        expenseType: 'planned',
        delayDays: 0,
        isRecurring: false,
      },
      SAMPLE_TEST_GOALS,
      SAMPLE_TEST_COMMITMENTS
    );

    expect(projection.affordabilityStatus).toBe('tight');
    expect(projection.simulatedSafeDailyAllowance).toBeLessThan(100);
  });
});
