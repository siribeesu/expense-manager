import type { Transaction, SavingsGoal, Commitment } from '../types/finance';
import type { AppStoredState } from './storage';
import { API_TIMEOUTS } from './constants';
import {
  TransactionSchema,
  SavingsGoalSchema,
  CommitmentSchema,
  AppStoredStateSchema,
  BackendHealthSchema,
} from './schemas';
import { sanitizeText } from './sanitizer';

const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';
const AUTH_TOKEN_KEY = 'thriftly_auth_token';
export const DEFAULT_AUTH_TOKEN = 'thriftly-pilot-token-2026';

export interface BackendHealth {
  isOnline: boolean;
  service?: string;
  version?: string;
  timestamp?: string;
}

export interface ApiOperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/**
 * Retrieves the currently active authorization token
 */
export function getStoredAuthToken(): string {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(AUTH_TOKEN_KEY) || DEFAULT_AUTH_TOKEN;
    }
  } catch {}
  return DEFAULT_AUTH_TOKEN;
}

/**
 * Persists an authorization token
 */
export function setStoredAuthToken(token: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  } catch {}
}

/**
 * Builds standard authorized HTTP headers
 */
function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getStoredAuthToken();
  return {
    Authorization: `Bearer ${token}`,
    'x-thriftly-auth': token,
    ...extraHeaders,
  };
}

/**
 * Health check endpoint
 */
export async function checkBackendHealth(): Promise<BackendHealth> {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      signal: AbortSignal.timeout(API_TIMEOUTS.HEALTH_CHECK),
    });
    if (res.ok) {
      const data = await res.json();
      const validation = BackendHealthSchema.safeParse(data);
      if (validation.success) {
        return {
          isOnline: true,
          service: validation.data.service,
          version: validation.data.version,
          timestamp: validation.data.timestamp,
        };
      }
      return { isOnline: true };
    }
  } catch {
    // Offline or server not reachable
  }
  return { isOnline: false };
}

/**
 * Authenticates user with their security PIN
 */
export async function loginWithPin(pin: string): Promise<ApiOperationResult<{ token: string }>> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
      signal: AbortSignal.timeout(API_TIMEOUTS.MUTATION),
    });

    const data = await res.json();
    if (res.ok && data.token) {
      setStoredAuthToken(data.token);
      return { success: true, data: { token: data.token } };
    }
    return {
      success: false,
      error: data.message || 'Invalid security PIN',
      status: res.status,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error during PIN authentication' };
  }
}

/**
 * Verifies active session token
 */
export async function verifyAuthSession(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(API_TIMEOUTS.HEALTH_CHECK),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Fetches complete financial ledger state from backend
 */
export async function fetchBackendState(): Promise<AppStoredState | null> {
  try {
    const res = await fetch(`${API_BASE}/state`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(API_TIMEOUTS.STATE_FETCH),
    });
    if (res.ok) {
      const data = await res.json();
      const validation = AppStoredStateSchema.safeParse(data);
      if (validation.success) {
        return validation.data as AppStoredState;
      }
      console.warn('[Thriftly API] Received invalid schema from backend state:', validation.error);
    }
  } catch (err) {
    console.warn('[Thriftly API] Falling back to local persistence:', err);
  }
  return null;
}

/**
 * Resets backend database ledger to Day 1 baseline
 */
export async function resetBackendState(): Promise<AppStoredState | null> {
  try {
    const res = await fetch(`${API_BASE}/state/reset`, {
      method: 'POST',
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(API_TIMEOUTS.MUTATION),
    });
    if (res.ok) {
      const data = await res.json();
      const validation = AppStoredStateSchema.safeParse(data.state);
      if (validation.success) {
        return validation.data as AppStoredState;
      }
    }
  } catch (err) {
    console.warn('[Thriftly API] Reset error:', err);
  }
  return null;
}

/**
 * Creates a transaction on the backend
 */
export async function createBackendTransaction(
  tx: Omit<Transaction, 'id' | 'createdAt'>
): Promise<Transaction | null> {
  try {
    const sanitizedTx = {
      ...tx,
      description: sanitizeText(tx.description),
      notes: tx.notes ? sanitizeText(tx.notes) : undefined,
    };
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(sanitizedTx),
      signal: AbortSignal.timeout(API_TIMEOUTS.MUTATION),
    });
    if (res.ok) {
      const data = await res.json();
      const validation = TransactionSchema.safeParse(data.transaction);
      if (validation.success) {
        return validation.data as Transaction;
      }
    }
  } catch (err) {
    console.warn('[Thriftly API] Create transaction error:', err);
  }
  return null;
}

/**
 * Updates an existing transaction on the backend
 */
export async function updateBackendTransaction(
  id: string,
  updates: Partial<Transaction>
): Promise<Transaction | null> {
  try {
    const sanitizedUpdates = {
      ...updates,
      ...(updates.description ? { description: sanitizeText(updates.description) } : {}),
      ...(updates.notes ? { notes: sanitizeText(updates.notes) } : {}),
    };
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(sanitizedUpdates),
      signal: AbortSignal.timeout(API_TIMEOUTS.MUTATION),
    });
    if (res.ok) {
      const data = await res.json();
      const validation = TransactionSchema.safeParse(data.transaction);
      if (validation.success) {
        return validation.data as Transaction;
      }
    }
  } catch (err) {
    console.warn('[Thriftly API] Update transaction error:', err);
  }
  return null;
}

/**
 * Deletes a transaction on the backend
 */
export async function deleteBackendTransaction(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(API_TIMEOUTS.MUTATION),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Creates a savings goal on the backend
 */
export async function createBackendGoal(
  goal: Omit<SavingsGoal, 'id' | 'createdAt'>
): Promise<SavingsGoal | null> {
  try {
    const sanitizedGoal = {
      ...goal,
      name: sanitizeText(goal.name),
      notes: goal.notes ? sanitizeText(goal.notes) : undefined,
    };
    const res = await fetch(`${API_BASE}/goals`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(sanitizedGoal),
      signal: AbortSignal.timeout(API_TIMEOUTS.MUTATION),
    });
    if (res.ok) {
      const data = await res.json();
      const validation = SavingsGoalSchema.safeParse(data.goal);
      if (validation.success) {
        return validation.data as SavingsGoal;
      }
    }
  } catch (err) {
    console.warn('[Thriftly API] Create goal error:', err);
  }
  return null;
}

/**
 * Updates a savings goal on the backend
 */
export async function updateBackendGoal(
  id: string,
  updates: Partial<SavingsGoal>
): Promise<SavingsGoal | null> {
  try {
    const sanitizedUpdates = {
      ...updates,
      ...(updates.name ? { name: sanitizeText(updates.name) } : {}),
      ...(updates.notes ? { notes: sanitizeText(updates.notes) } : {}),
    };
    const res = await fetch(`${API_BASE}/goals/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(sanitizedUpdates),
      signal: AbortSignal.timeout(API_TIMEOUTS.MUTATION),
    });
    if (res.ok) {
      const data = await res.json();
      const validation = SavingsGoalSchema.safeParse(data.goal);
      if (validation.success) {
        return validation.data as SavingsGoal;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Deletes a savings goal on the backend
 */
export async function deleteBackendGoal(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/goals/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(API_TIMEOUTS.MUTATION),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Deposits cash into a savings goal on the backend
 */
export async function depositBackendGoal(id: string, amount: number): Promise<SavingsGoal | null> {
  try {
    const res = await fetch(`${API_BASE}/goals/${id}/deposit`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ amount }),
      signal: AbortSignal.timeout(API_TIMEOUTS.MUTATION),
    });
    if (res.ok) {
      const data = await res.json();
      const validation = SavingsGoalSchema.safeParse(data.goal);
      if (validation.success) {
        return validation.data as SavingsGoal;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Withdraws cash from a savings goal on the backend
 */
export async function withdrawBackendGoal(id: string, amount: number): Promise<SavingsGoal | null> {
  try {
    const res = await fetch(`${API_BASE}/goals/${id}/withdraw`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ amount }),
      signal: AbortSignal.timeout(API_TIMEOUTS.MUTATION),
    });
    if (res.ok) {
      const data = await res.json();
      const validation = SavingsGoalSchema.safeParse(data.goal);
      if (validation.success) {
        return validation.data as SavingsGoal;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Registers a commitment/bill on the backend
 */
export async function createBackendCommitment(
  commitment: Omit<Commitment, 'id'>
): Promise<Commitment | null> {
  try {
    const sanitizedCommitment = {
      ...commitment,
      name: sanitizeText(commitment.name),
      serviceProvider: commitment.serviceProvider ? sanitizeText(commitment.serviceProvider) : undefined,
    };
    const res = await fetch(`${API_BASE}/commitments`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(sanitizedCommitment),
      signal: AbortSignal.timeout(API_TIMEOUTS.MUTATION),
    });
    if (res.ok) {
      const data = await res.json();
      const validation = CommitmentSchema.safeParse(data.commitment);
      if (validation.success) {
        return validation.data as Commitment;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Updates a commitment on the backend
 */
export async function updateBackendCommitment(
  id: string,
  updates: Partial<Commitment>
): Promise<Commitment | null> {
  try {
    const sanitizedUpdates = {
      ...updates,
      ...(updates.name ? { name: sanitizeText(updates.name) } : {}),
      ...(updates.serviceProvider ? { serviceProvider: sanitizeText(updates.serviceProvider) } : {}),
    };
    const res = await fetch(`${API_BASE}/commitments/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(sanitizedUpdates),
      signal: AbortSignal.timeout(API_TIMEOUTS.MUTATION),
    });
    if (res.ok) {
      const data = await res.json();
      const validation = CommitmentSchema.safeParse(data.commitment);
      if (validation.success) {
        return validation.data as Commitment;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Deletes a commitment on the backend
 */
export async function deleteBackendCommitment(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/commitments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(API_TIMEOUTS.MUTATION),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Settles a commitment and records an expense atomically on the backend
 */
export async function payBackendCommitment(
  id: string
): Promise<{ commitment: Commitment; transaction: Transaction } | null> {
  try {
    const res = await fetch(`${API_BASE}/commitments/${id}/pay`, {
      method: 'POST',
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(API_TIMEOUTS.MUTATION),
    });
    if (res.ok) {
      const data = await res.json();
      const validCommitment = CommitmentSchema.safeParse(data.commitment);
      const validTransaction = TransactionSchema.safeParse(data.transaction);
      if (validCommitment.success && validTransaction.success) {
        return {
          commitment: validCommitment.data as Commitment,
          transaction: validTransaction.data as Transaction,
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Reverts a settled commitment back to unpaid on the backend
 */
export async function unpayBackendCommitment(id: string): Promise<Commitment | null> {
  try {
    const res = await fetch(`${API_BASE}/commitments/${id}/unpay`, {
      method: 'POST',
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(API_TIMEOUTS.MUTATION),
    });
    if (res.ok) {
      const data = await res.json();
      const validation = CommitmentSchema.safeParse(data.commitment);
      if (validation.success) {
        return validation.data as Commitment;
      }
    }
  } catch {
    return null;
  }
  return null;
}
