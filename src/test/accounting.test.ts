import { describe, it, expect } from 'vitest';
import { calculateFinancialMetrics } from '../engine/accounting';
import {
  INITIAL_TOTAL_BUDGET,
  INITIAL_CURRENT_DAY,
  DEMO_TRANSACTIONS,
  DEMO_SAVINGS_GOALS,
  DEMO_COMMITMENTS,
  SAMPLE_TEST_TRANSACTIONS,
  SAMPLE_TEST_GOALS,
  SAMPLE_TEST_COMMITMENTS,
} from '../data/demoData';

describe('PaisaPilot Financial Accounting Engine', () => {
  it('correctly initializes the pristine Day 1 ready-to-use production baseline', () => {
    const metrics = calculateFinancialMetrics({
      totalBudget: INITIAL_TOTAL_BUDGET,
      currentDay: INITIAL_CURRENT_DAY,
      totalDays: 30,
      transactions: DEMO_TRANSACTIONS,
      savingsGoals: DEMO_SAVINGS_GOALS,
      commitments: DEMO_COMMITMENTS,
    });

    // Pristine day 1 values
    expect(metrics.totalBudget).toBe(10000);
    expect(metrics.currentDay).toBe(1);
    expect(metrics.remainingDays).toBe(30);
    expect(metrics.totalSpent).toBe(0);
    expect(metrics.spentToday).toBe(0);
    expect(metrics.reservedSavings).toBe(0);
    expect(metrics.reservedCommitments).toBe(0);
    expect(metrics.availableCash).toBe(10000);
    expect(metrics.safeDailyAllowance).toBe(333); // Math.floor(10000 / 30) = 333
    expect(metrics.remainingDailyAllowanceToday).toBe(333);
    expect(metrics.health.totalScore).toBeGreaterThanOrEqual(90);
  });

  it('correctly reconciles realistic financial state with test fixture data', () => {
    const metrics = calculateFinancialMetrics({
      totalBudget: 10000,
      currentDay: 12,
      totalDays: 30,
      transactions: SAMPLE_TEST_TRANSACTIONS,
      savingsGoals: SAMPLE_TEST_GOALS,
      commitments: SAMPLE_TEST_COMMITMENTS,
    });

    // 1. Budget reconciliation
    expect(metrics.totalBudget).toBe(10000);
    expect(metrics.currentDay).toBe(12);
    expect(metrics.remainingDays).toBe(19); // Days 12..30 inclusive

    // 2. Spending totals: 850 + 400 + 620 + 450 + 299 + 240 + 180 + 160 = 3199
    expect(metrics.totalSpent).toBe(3199);
    expect(metrics.spentToday).toBe(160);

    // 3. Goal reserves: Goal 1 (1200) + Goal 2 (300) = 1500
    const expectedReservedSavings = SAMPLE_TEST_GOALS.reduce((s, g) => s + g.currentAmount, 0);
    expect(metrics.reservedSavings).toBe(expectedReservedSavings);

    // 4. Commitment reserves: Unpaid future commitments
    const expectedCommitments = SAMPLE_TEST_COMMITMENTS
      .filter((c) => !c.isPaid && c.dueDay >= 12)
      .reduce((s, c) => s + c.amount, 0);
    expect(metrics.reservedCommitments).toBe(expectedCommitments);

    // 5. Net Available Cash formula: Budget - Spent - Savings - Commitments
    const expectedAvailableCash =
      10000 - metrics.totalSpent - metrics.reservedSavings - metrics.reservedCommitments;
    expect(metrics.availableCash).toBe(expectedAvailableCash);

    // 6. Safe Daily Spending Allowance: Math.floor((availableCash + spentToday) / remainingDays)
    const expectedPool = metrics.availableCash + metrics.spentToday;
    const expectedAllowance = Math.floor(expectedPool / metrics.remainingDays);
    expect(metrics.safeDailyAllowance).toBe(expectedAllowance);
    expect(metrics.remainingDailyAllowanceToday).toBe(
      Math.max(0, expectedAllowance - metrics.spentToday)
    );
  });

  it('prevents double-counting when a commitment is marked as paid', () => {
    // When a commitment (e.g. WiFi ₹450) transitions to paid:
    // It should NO LONGER be in reservedCommitments, and instead is in totalSpent
    const unpaidCommitments = [...SAMPLE_TEST_COMMITMENTS];
    const target = unpaidCommitments[0]; // com-sample-1, amount: 450

    const beforeMetrics = calculateFinancialMetrics({
      totalBudget: 10000,
      currentDay: 12,
      totalDays: 30,
      transactions: SAMPLE_TEST_TRANSACTIONS,
      savingsGoals: SAMPLE_TEST_GOALS,
      commitments: unpaidCommitments,
    });

    const paidTx = {
      id: 'tx-paid-test',
      description: `Paid Bill: ${target.name}`,
      amount: target.amount,
      category: target.category,
      day: 12,
      dateStr: 'Day 12',
      type: 'commitment_payment' as const,
      createdAt: Date.now(),
    };

    const updatedCommitments = unpaidCommitments.map((c) =>
      c.id === target.id ? { ...c, isPaid: true } : c
    );

    const afterMetrics = calculateFinancialMetrics({
      totalBudget: 10000,
      currentDay: 12,
      totalDays: 30,
      transactions: [paidTx, ...SAMPLE_TEST_TRANSACTIONS],
      savingsGoals: SAMPLE_TEST_GOALS,
      commitments: updatedCommitments,
    });

    // Net available cash remains EXACTLY identical because funds were simply transferred
    // from "reserved commitment" bucket to "completed spend" bucket!
    expect(afterMetrics.availableCash).toBe(beforeMetrics.availableCash);
    expect(afterMetrics.reservedCommitments).toBe(beforeMetrics.reservedCommitments - target.amount);
    expect(afterMetrics.totalSpent).toBe(beforeMetrics.totalSpent + target.amount);
  });

  it('safely handles extreme zero and overflow scenarios without NaN or infinite values', () => {
    const metrics = calculateFinancialMetrics({
      totalBudget: 0,
      currentDay: 30,
      totalDays: 30,
      transactions: [],
      savingsGoals: [],
      commitments: [],
    });

    expect(metrics.totalSpent).toBe(0);
    expect(metrics.availableCash).toBe(0);
    expect(metrics.safeDailyAllowance).toBe(0);
    expect(isNaN(metrics.safeDailyAllowance)).toBe(false);
    expect(isFinite(metrics.safeDailyAllowance)).toBe(true);
  });
});
