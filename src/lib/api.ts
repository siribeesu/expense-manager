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

export interface ApiErrorInfo {
  status?: number;
  message?: string;
}

let lastApiError: ApiErrorInfo | null = null;

export function getLastApiError(): ApiErrorInfo | null {
  return lastApiError;
}

export function recordApiError(status?: number, message?: string): void {
  lastApiError = { status, message };
}

export function clearLastApiError(): void {
  lastApiError = null;
}

export async function recordHttpFailure(res: Response): Promise<void> {
  let message = res.statusText || `HTTP ${res.status}`;
  try {
    const json = await res.json();
    if (json && (json.message || json.error)) {
      message = json.message || json.error;
    }
  } catch {}
  recordApiError(res.status, message);
}

export function recordNetworkFailure(err: any): void {
  const isTimeout = err?.name === 'TimeoutError' || (err?.message && String(err.message).toLowerCase().includes('timeout'));
  const msg = isTimeout ? 'Request timed out' : (err?.message || 'Network offline or unreachable');
  recordApiError(0, msg);
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
 * Core authenticated API request dispatcher with timeout and error tracking
 */
async function authApiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data?: any; error?: string }> {
  try {
    const headers = getAuthHeaders((options.headers as Record<string, string>) || {});
    const timeoutMs = options.method === 'GET' ? API_TIMEOUTS.STATE_FETCH : API_TIMEOUTS.MUTATION;
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: options.signal || AbortSignal.timeout(timeoutMs),
    });

    if (res.ok) {
      clearLastApiError();
      const data = await res.json().catch(() => null);
      return { ok: true, status: res.status, data };
    }

    await recordHttpFailure(res);
    return { ok: false, status: res.status, error: lastApiError?.message };
  } catch (err: any) {
    recordNetworkFailure(err);
    console.warn(`[Thriftly API] Request error for ${endpoint}:`, err);
    return { ok: false, status: 0, error: lastApiError?.message };
  }
}

/**
 * Fetches complete financial ledger state from backend
 */
export async function fetchBackendState(): Promise<AppStoredState | null> {
  const res = await authApiFetch('/state', { method: 'GET' });
  if (res.ok && res.data) {
    const validation = AppStoredStateSchema.safeParse(res.data);
    if (validation.success) {
      return validation.data as AppStoredState;
    }
    console.warn('[Thriftly API] Received invalid schema from backend state:', validation.error);
  }
  return null;
}

/**
 * Resets backend database ledger to Day 1 baseline
 */
export async function resetBackendState(): Promise<AppStoredState | null> {
  const res = await authApiFetch('/state/reset', { method: 'POST' });
  if (res.ok && res.data?.state) {
    const validation = AppStoredStateSchema.safeParse(res.data.state);
    if (validation.success) {
      return validation.data as AppStoredState;
    }
  }
  return null;
}

/**
 * Creates a transaction on the backend
 */
export async function createBackendTransaction(
  tx: Omit<Transaction, 'id' | 'createdAt'>
): Promise<Transaction | null> {
  const sanitizedTx = {
    ...tx,
    description: sanitizeText(tx.description),
    notes: tx.notes ? sanitizeText(tx.notes) : undefined,
  };
  const res = await authApiFetch('/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sanitizedTx),
  });
  if (res.ok && res.data?.transaction) {
    const validation = TransactionSchema.safeParse(res.data.transaction);
    if (validation.success) {
      return validation.data as Transaction;
    }
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
  const sanitizedUpdates = {
    ...updates,
    ...(updates.description ? { description: sanitizeText(updates.description) } : {}),
    ...(updates.notes ? { notes: sanitizeText(updates.notes) } : {}),
  };
  const res = await authApiFetch(`/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sanitizedUpdates),
  });
  if (res.ok && res.data?.transaction) {
    const validation = TransactionSchema.safeParse(res.data.transaction);
    if (validation.success) {
      return validation.data as Transaction;
    }
  }
  return null;
}

/**
 * Deletes a transaction on the backend
 */
export async function deleteBackendTransaction(id: string): Promise<boolean> {
  const res = await authApiFetch(`/transactions/${id}`, {
    method: 'DELETE',
  });
  return res.ok;
}

/**
 * Creates a savings goal on the backend
 */
export async function createBackendGoal(
  goal: Omit<SavingsGoal, 'id' | 'createdAt'>
): Promise<SavingsGoal | null> {
  const sanitizedGoal = {
    ...goal,
    name: sanitizeText(goal.name),
    notes: goal.notes ? sanitizeText(goal.notes) : undefined,
  };
  const res = await authApiFetch('/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sanitizedGoal),
  });
  if (res.ok && res.data?.goal) {
    const validation = SavingsGoalSchema.safeParse(res.data.goal);
    if (validation.success) {
      return validation.data as SavingsGoal;
    }
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
  const sanitizedUpdates = {
    ...updates,
    ...(updates.name ? { name: sanitizeText(updates.name) } : {}),
    ...(updates.notes ? { notes: sanitizeText(updates.notes) } : {}),
  };
  const res = await authApiFetch(`/goals/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sanitizedUpdates),
  });
  if (res.ok && res.data?.goal) {
    const validation = SavingsGoalSchema.safeParse(res.data.goal);
    if (validation.success) {
      return validation.data as SavingsGoal;
    }
  }
  return null;
}

/**
 * Deletes a savings goal on the backend
 */
export async function deleteBackendGoal(id: string): Promise<boolean> {
  const res = await authApiFetch(`/goals/${id}`, {
    method: 'DELETE',
  });
  return res.ok;
}

/**
 * Deposits cash into a savings goal on the backend
 */
export async function depositBackendGoal(id: string, amount: number): Promise<SavingsGoal | null> {
  const res = await authApiFetch(`/goals/${id}/deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  if (res.ok && res.data?.goal) {
    const validation = SavingsGoalSchema.safeParse(res.data.goal);
    if (validation.success) {
      return validation.data as SavingsGoal;
    }
  }
  return null;
}

/**
 * Withdraws cash from a savings goal on the backend
 */
export async function withdrawBackendGoal(id: string, amount: number): Promise<SavingsGoal | null> {
  const res = await authApiFetch(`/goals/${id}/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  if (res.ok && res.data?.goal) {
    const validation = SavingsGoalSchema.safeParse(res.data.goal);
    if (validation.success) {
      return validation.data as SavingsGoal;
    }
  }
  return null;
}

/**
 * Registers a commitment/bill on the backend
 */
export async function createBackendCommitment(
  commitment: Omit<Commitment, 'id'>
): Promise<Commitment | null> {
  const sanitizedCommitment = {
    ...commitment,
    name: sanitizeText(commitment.name),
    serviceProvider: commitment.serviceProvider ? sanitizeText(commitment.serviceProvider) : undefined,
  };
  const res = await authApiFetch('/commitments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sanitizedCommitment),
  });
  if (res.ok && res.data?.commitment) {
    const validation = CommitmentSchema.safeParse(res.data.commitment);
    if (validation.success) {
      return validation.data as Commitment;
    }
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
  const sanitizedUpdates = {
    ...updates,
    ...(updates.name ? { name: sanitizeText(updates.name) } : {}),
    ...(updates.serviceProvider ? { serviceProvider: sanitizeText(updates.serviceProvider) } : {}),
  };
  const res = await authApiFetch(`/commitments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sanitizedUpdates),
  });
  if (res.ok && res.data?.commitment) {
    const validation = CommitmentSchema.safeParse(res.data.commitment);
    if (validation.success) {
      return validation.data as Commitment;
    }
  }
  return null;
}

/**
 * Deletes a commitment on the backend
 */
export async function deleteBackendCommitment(id: string): Promise<boolean> {
  const res = await authApiFetch(`/commitments/${id}`, {
    method: 'DELETE',
  });
  return res.ok;
}

/**
 * Settles a commitment and records an expense atomically on the backend
 */
export async function payBackendCommitment(
  id: string
): Promise<{ commitment: Commitment; transaction: Transaction } | null> {
  const res = await authApiFetch(`/commitments/${id}/pay`, {
    method: 'POST',
  });
  if (res.ok && res.data) {
    const validCommitment = CommitmentSchema.safeParse(res.data.commitment);
    const validTransaction = TransactionSchema.safeParse(res.data.transaction);
    if (validCommitment.success && validTransaction.success) {
      return {
        commitment: validCommitment.data as Commitment,
        transaction: validTransaction.data as Transaction,
      };
    }
  }
  return null;
}

/**
 * Reverts a settled commitment back to unpaid on the backend
 */
export async function unpayBackendCommitment(id: string): Promise<Commitment | null> {
  const res = await authApiFetch(`/commitments/${id}/unpay`, {
    method: 'POST',
  });
  if (res.ok && res.data?.commitment) {
    const validation = CommitmentSchema.safeParse(res.data.commitment);
    if (validation.success) {
      return validation.data as Commitment;
    }
  }
  return null;
}
