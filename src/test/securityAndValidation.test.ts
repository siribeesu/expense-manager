import { describe, it, expect } from 'vitest';
import { sanitizeText, sanitizeObject } from '../lib/sanitizer';
import {
  TransactionSchema,
  SavingsGoalSchema,
  CommitmentSchema,
  AppStoredStateSchema,
} from '../lib/schemas';
import { loadStoredState, saveStoredState, getInitialDemoState, clearLocalStorage } from '../lib/storage';

describe('Security: XSS Input Sanitization', () => {
  it('strips malicious script tags from descriptions', () => {
    const dirty = '<script>alert("hack")</script>Coffee & Croissant';
    const clean = sanitizeText(dirty);
    expect(clean).toBe('Coffee & Croissant');
    expect(clean).not.toContain('<script>');
  });

  it('strips img onerror and javascript vectors', () => {
    const dirty = '<img src="x" onerror="alert(1)">Dinner';
    const clean = sanitizeText(dirty);
    expect(clean).toBe('Dinner');
  });

  it('handles empty, null, or undefined values safely', () => {
    expect(sanitizeText('')).toBe('');
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
  });

  it('sanitizes object string properties recursively', () => {
    const obj = {
      description: '<b>Cinema</b>',
      amount: 450,
      notes: '<script>evil()</script>Movie night',
    };
    const sanitized = sanitizeObject(obj);
    expect(sanitized.description).toBe('Cinema');
    expect(sanitized.notes).toBe('Movie night');
    expect(sanitized.amount).toBe(450);
  });
});

describe('Validation: Zod Runtime Schemas', () => {
  it('validates a compliant transaction', () => {
    const validTx = {
      id: 'tx-123',
      description: 'Metro fare',
      amount: 40,
      category: 'transport',
      day: 5,
      dateStr: 'Day 5',
      type: 'expense',
      createdAt: Date.now(),
    };
    const result = TransactionSchema.safeParse(validTx);
    expect(result.success).toBe(true);
  });

  it('rejects negative or zero transaction amounts', () => {
    const invalidTx = {
      id: 'tx-bad',
      description: 'Zero money',
      amount: -100,
      category: 'other',
      day: 1,
      dateStr: 'Day 1',
      type: 'expense',
      createdAt: Date.now(),
    };
    const result = TransactionSchema.safeParse(invalidTx);
    expect(result.success).toBe(false);
  });

  it('validates a compliant savings goal', () => {
    const validGoal = {
      id: 'goal-1',
      name: 'Emergency Cushion',
      targetAmount: 3000,
      currentAmount: 1000,
      targetDay: 30,
      categoryIcon: 'ShieldCheck',
      color: '#10B981',
      createdAt: Date.now(),
    };
    expect(SavingsGoalSchema.safeParse(validGoal).success).toBe(true);
  });

  it('validates a compliant commitment obligation', () => {
    const validCommitment = {
      id: 'com-1',
      name: 'WiFi Broadband',
      amount: 999,
      category: 'bills_utilities',
      dueDay: 10,
      frequency: 'monthly',
      isPaid: false,
      isSubscription: true,
      serviceProvider: 'Airtel Fiber',
    };
    expect(CommitmentSchema.safeParse(validCommitment).success).toBe(true);
  });

  it('validates a complete application storage state', () => {
    const demo = getInitialDemoState();
    const result = AppStoredStateSchema.safeParse(demo);
    expect(result.success).toBe(true);
  });
});

describe('Reliability: Secure Storage Vault', () => {
  it('saves and loads encrypted state roundtrip', () => {
    clearLocalStorage();
    const initialState = getInitialDemoState();
    initialState.totalBudget = 15000;
    saveStoredState(initialState);

    const loaded = loadStoredState();
    expect(loaded.totalBudget).toBe(15000);
    expect(loaded.transactions.length).toBe(initialState.transactions.length);
  });
});
