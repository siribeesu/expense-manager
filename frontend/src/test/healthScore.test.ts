import { describe, it, expect } from 'vitest';
import { calculateFinancialHealth } from '../engine/healthScore';
import { DEMO_SAVINGS_GOALS } from '../data/demoData';

describe('PaisaPilot Financial Health Scoring Engine', () => {
  it('returns a robust baseline score for balanced finances', () => {
    const health = calculateFinancialHealth({
      totalBudget: 10000,
      availableCash: 4203,
      safeDailyAllowance: 229,
      reservedCommitments: 1398,
      reservedSavings: 1500,
      totalSpent: 3199,
      currentDay: 12,
      totalDays: 30,
      savingsGoals: DEMO_SAVINGS_GOALS,
    });

    expect(health.totalScore).toBeGreaterThanOrEqual(65);
    expect(health.totalScore).toBeLessThanOrEqual(100);
    expect(health.riskLevel).toMatch(/low|moderate/);
    expect(health.keyFactors.length).toBe(4);
    expect(health.actionableTips.length).toBeGreaterThan(0);
  });

  it('triggers critical risk classification when available cash enters deficit', () => {
    const health = calculateFinancialHealth({
      totalBudget: 10000,
      availableCash: -500, // Deficit condition
      safeDailyAllowance: 0,
      reservedCommitments: 1500,
      reservedSavings: 0,
      totalSpent: 10500,
      currentDay: 15,
      totalDays: 30,
      savingsGoals: [],
    });

    expect(health.riskLevel).toBe('critical');
    expect(health.totalScore).toBeLessThanOrEqual(30);
    expect(health.headline).toContain('Deficit');
  });
});
