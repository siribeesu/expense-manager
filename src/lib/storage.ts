import type { Transaction, SavingsGoal, Commitment } from '../types/finance';
import { AppStoredStateSchema } from './schemas';
import { encryptVaultData, decryptVaultData } from './cryptoVault';
import {
  INITIAL_TOTAL_BUDGET,
  INITIAL_CURRENT_DAY,
  INITIAL_TOTAL_DAYS,
  DEMO_TRANSACTIONS,
  DEMO_SAVINGS_GOALS,
  DEMO_COMMITMENTS,
} from '../data/demoData';

const STORAGE_KEYS = {
  BUDGET: 'thriftly_total_budget',
  CURRENT_DAY: 'thriftly_current_day',
  TOTAL_DAYS: 'thriftly_total_days',
  TRANSACTIONS: 'thriftly_transactions',
  GOALS: 'thriftly_savings_goals',
  COMMITMENTS: 'thriftly_commitments',
  ENCRYPTED_VAULT: 'thriftly_vault_v1',
  LEGACY_VAULT: 'paisapilot_vault_v1',
};

// Memory storage fallback when localStorage is blocked or unavailable
const memoryStore = new Map<string, string>();

function getStorageItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch {}
  return memoryStore.get(key) ?? null;
}

function setStorageItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
  } catch {}
  memoryStore.set(key, value);
}

function removeStorageItem(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
      return;
    }
  } catch {}
  memoryStore.delete(key);
}

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
    // 1. Try modern encrypted vault format first (migrates legacy vault if present)
    const vault = getStorageItem(STORAGE_KEYS.ENCRYPTED_VAULT) || getStorageItem(STORAGE_KEYS.LEGACY_VAULT);
    if (vault) {
      const decrypted = decryptVaultData(vault);
      if (decrypted) {
        const parsed = JSON.parse(decrypted);
        const validation = AppStoredStateSchema.safeParse(parsed);
        if (validation.success) {
          const state = validation.data as AppStoredState;
          const isEmpty =
            (!state.transactions || state.transactions.length === 0) &&
            (!state.savingsGoals || state.savingsGoals.length === 0) &&
            (!state.commitments || state.commitments.length === 0);
          if (isEmpty) {
            const demo = getInitialDemoState();
            saveStoredState(demo);
            return demo;
          }
          return state;
        }
      }
    }

    // 2. Fall back to individual keys for legacy migration
    const rawBudget = getStorageItem(STORAGE_KEYS.BUDGET);
    const rawDay = getStorageItem(STORAGE_KEYS.CURRENT_DAY);
    const rawTotalDays = getStorageItem(STORAGE_KEYS.TOTAL_DAYS);
    const rawTx = getStorageItem(STORAGE_KEYS.TRANSACTIONS);
    const rawGoals = getStorageItem(STORAGE_KEYS.GOALS);
    const rawCommitments = getStorageItem(STORAGE_KEYS.COMMITMENTS);

    if (!rawTx || !rawGoals || !rawCommitments) {
      const demo = getInitialDemoState();
      saveStoredState(demo);
      return demo;
    }

    const candidateState: AppStoredState = {
      totalBudget: rawBudget ? Number(rawBudget) : INITIAL_TOTAL_BUDGET,
      currentDay: rawDay ? Number(rawDay) : INITIAL_CURRENT_DAY,
      totalDays: rawTotalDays ? Number(rawTotalDays) : INITIAL_TOTAL_DAYS,
      transactions: JSON.parse(rawTx),
      savingsGoals: JSON.parse(rawGoals),
      commitments: JSON.parse(rawCommitments),
    };

    const validation = AppStoredStateSchema.safeParse(candidateState);
    if (validation.success) {
      const state = validation.data as AppStoredState;
      const isEmpty =
        (!state.transactions || state.transactions.length === 0) &&
        (!state.savingsGoals || state.savingsGoals.length === 0) &&
        (!state.commitments || state.commitments.length === 0);
      if (isEmpty) {
        const demo = getInitialDemoState();
        saveStoredState(demo);
        return demo;
      }
      // Save in protected authenticated vault
      saveStoredState(candidateState);
      return state;
    }

    const demo = getInitialDemoState();
    saveStoredState(demo);
    return demo;
  } catch (error) {
    console.warn('Failed to parse localStorage state, falling back to initial state:', error);
    const demo = getInitialDemoState();
    saveStoredState(demo);
    return demo;
  }
}

export function saveStoredState(state: AppStoredState): void {
  try {
    // Validate with Zod before writing
    const validated = AppStoredStateSchema.parse(state);
    const payload = JSON.stringify(validated);
    const encrypted = encryptVaultData(payload);
    setStorageItem(STORAGE_KEYS.ENCRYPTED_VAULT, encrypted);
  } catch (error) {
    console.error('Failed to securely save state to storage:', error);
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
    Object.values(STORAGE_KEYS).forEach((key) => removeStorageItem(key));
  } catch (e) {
    console.error('Failed to clear storage', e);
  }
}
