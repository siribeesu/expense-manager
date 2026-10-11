import type { Transaction, SavingsGoal, Commitment } from '../types/finance';
import {
  INITIAL_TOTAL_BUDGET,
  INITIAL_CURRENT_DAY,
  INITIAL_TOTAL_DAYS,
  DEMO_TRANSACTIONS,
  DEMO_SAVINGS_GOALS,
  DEMO_COMMITMENTS,
} from '../data/demoData';

const STORAGE_KEYS = {
  BUDGET: 'paisapilot_total_budget',
  CURRENT_DAY: 'paisapilot_current_day',
  TOTAL_DAYS: 'paisapilot_total_days',
  TRANSACTIONS: 'paisapilot_transactions',
  GOALS: 'paisapilot_savings_goals',
  COMMITMENTS: 'paisapilot_commitments',
};

export interface AppStoredState {
  totalBudget: number;
  currentDay: number;
  totalDays: number;
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  commitments: Commitment[];
}

export function loadStoredState(): AppStoredState {
  try {
    const rawBudget = localStorage.getItem(STORAGE_KEYS.BUDGET);
    const rawDay = localStorage.getItem(STORAGE_KEYS.CURRENT_DAY);
    const rawTotalDays = localStorage.getItem(STORAGE_KEYS.TOTAL_DAYS);
    const rawTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const rawGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
    const rawCommitments = localStorage.getItem(STORAGE_KEYS.COMMITMENTS);

    if (!rawTx || !rawGoals || !rawCommitments) {
      // First time initialization with demo data
      return getInitialDemoState();
    }

    const transactions = JSON.parse(rawTx);
    const savingsGoals = JSON.parse(rawGoals);
    const commitments = JSON.parse(rawCommitments);

    return {
      totalBudget: rawBudget ? Number(rawBudget) : INITIAL_TOTAL_BUDGET,
      currentDay: rawDay ? Number(rawDay) : INITIAL_CURRENT_DAY,
      totalDays: rawTotalDays ? Number(rawTotalDays) : INITIAL_TOTAL_DAYS,
      transactions: Array.isArray(transactions) ? transactions : DEMO_TRANSACTIONS,
      savingsGoals: Array.isArray(savingsGoals) ? savingsGoals : DEMO_SAVINGS_GOALS,
      commitments: Array.isArray(commitments) ? commitments : DEMO_COMMITMENTS,
    };
  } catch (error) {
    console.warn('Failed to parse localStorage state, falling back to demo state:', error);
    return getInitialDemoState();
  }
}

export function saveStoredState(state: AppStoredState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BUDGET, String(state.totalBudget));
    localStorage.setItem(STORAGE_KEYS.CURRENT_DAY, String(state.currentDay));
    localStorage.setItem(STORAGE_KEYS.TOTAL_DAYS, String(state.totalDays));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(state.savingsGoals));
    localStorage.setItem(STORAGE_KEYS.COMMITMENTS, JSON.stringify(state.commitments));
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }
}

export function getInitialDemoState(): AppStoredState {
  return {
    totalBudget: INITIAL_TOTAL_BUDGET,
    currentDay: INITIAL_CURRENT_DAY,
    totalDays: INITIAL_TOTAL_DAYS,
    transactions: [...DEMO_TRANSACTIONS],
    savingsGoals: [...DEMO_SAVINGS_GOALS],
    commitments: [...DEMO_COMMITMENTS],
  };
}

export function clearLocalStorage(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  } catch (e) {
    console.error('Failed to clear localStorage', e);
  }
}
