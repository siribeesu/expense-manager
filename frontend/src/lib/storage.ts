import type { Transaction, SavingsGoal, Commitment } from '../types/finance';
import { AppStoredStateSchema } from './schemas';
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
  ENCRYPTED_VAULT: 'paisapilot_vault_v1',
};

const VAULT_PREFIX = 'PP_ENC_V1:';
const VAULT_KEY = 0x5a; // Client-side obfuscation mask

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

/**
 * Encrypts/obfuscates string data to prevent cleartext financial exposure in DevTools / localStorage
 */
function protectData(cleartext: string): string {
  try {
    const chars = cleartext.split('');
    const encoded = chars
      .map((c) => String.fromCharCode(c.charCodeAt(0) ^ VAULT_KEY))
      .join('');
    return VAULT_PREFIX + btoa(encodeURIComponent(encoded));
  } catch {
    return cleartext;
  }
}

/**
 * Decrypts/de-obfuscates data from localStorage
 */
function unprotectData(cipherText: string): string {
  try {
    if (!cipherText.startsWith(VAULT_PREFIX)) {
      return cipherText; // Backwards compatible with legacy unencrypted data
    }
    const raw = atob(cipherText.slice(VAULT_PREFIX.length));
    const decoded = decodeURIComponent(raw);
    return decoded
      .split('')
      .map((c) => String.fromCharCode(c.charCodeAt(0) ^ VAULT_KEY))
      .join('');
  } catch {
    return cipherText;
  }
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
    // 1. Try modern encrypted vault format first
    const vault = getStorageItem(STORAGE_KEYS.ENCRYPTED_VAULT);
    if (vault) {
      const decrypted = unprotectData(vault);
      const parsed = JSON.parse(decrypted);
      const validation = AppStoredStateSchema.safeParse(parsed);
      if (validation.success) {
        return validation.data as AppStoredState;
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
      return getInitialDemoState();
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
      // Save in protected vault
      saveStoredState(candidateState);
      return validation.data as AppStoredState;
    }

    return getInitialDemoState();
  } catch (error) {
    console.warn('Failed to parse localStorage state, falling back to initial state:', error);
    return getInitialDemoState();
  }
}

export function saveStoredState(state: AppStoredState): void {
  try {
    // Validate with Zod before writing
    const validated = AppStoredStateSchema.parse(state);
    const payload = JSON.stringify(validated);
    const encrypted = protectData(payload);
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
