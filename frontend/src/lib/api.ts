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

export interface BackendHealth {
  isOnline: boolean;
  service?: string;
  version?: string;
  timestamp?: string;
}

export async function checkBackendHealth(): Promise<BackendHealth> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(API_TIMEOUTS.HEALTH_CHECK) });
    if (res.ok) {
      const data = await res.json();
      const validation = BackendHealthSchema.safeParse(data);
      if (validation.success) {
        return { isOnline: true, service: validation.data.service, version: validation.data.version, timestamp: validation.data.timestamp };
      }
      return { isOnline: true };
    }
  } catch {
    // Offline or server not running
  }
  return { isOnline: false };
}

export async function fetchBackendState(): Promise<AppStoredState | null> {
  try {
    const res = await fetch(`${API_BASE}/state`, { signal: AbortSignal.timeout(API_TIMEOUTS.STATE_FETCH) });
    if (res.ok) {
      const data = await res.json();
      const validation = AppStoredStateSchema.safeParse(data);
      if (validation.success) {
        return validation.data as AppStoredState;
      }
      console.warn('[PaisaPilot API] Received invalid schema from backend state:', validation.error);
    }
  } catch (err) {
    console.warn('[PaisaPilot API] Falling back to local persistence:', err);
  }
  return null;
}

export async function resetBackendState(): Promise<AppStoredState | null> {
  try {
    const res = await fetch(`${API_BASE}/state/reset`, {
      method: 'POST',
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
    console.warn('[PaisaPilot API] Reset error:', err);
  }
  return null;
}

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
      headers: { 'Content-Type': 'application/json' },
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
    console.warn('[PaisaPilot API] Create transaction error:', err);
  }
  return null;
}

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
      headers: { 'Content-Type': 'application/json' },
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
    console.warn('[PaisaPilot API] Update transaction error:', err);
  }
  return null;
}

export async function deleteBackendTransaction(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(API_TIMEOUTS.MUTATION),
    });
    return res.ok;
  } catch {
    return false;
  }
}

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
      headers: { 'Content-Type': 'application/json' },
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
    console.warn('[PaisaPilot API] Create goal error:', err);
  }
  return null;
}

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
      headers: { 'Content-Type': 'application/json' },
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

export async function deleteBackendGoal(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/goals/${id}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(API_TIMEOUTS.MUTATION),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function depositBackendGoal(id: string, amount: number): Promise<SavingsGoal | null> {
  try {
    const res = await fetch(`${API_BASE}/goals/${id}/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

export async function withdrawBackendGoal(id: string, amount: number): Promise<SavingsGoal | null> {
  try {
    const res = await fetch(`${API_BASE}/goals/${id}/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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

export async function deleteBackendCommitment(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/commitments/${id}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(API_TIMEOUTS.MUTATION),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function payBackendCommitment(
  id: string
): Promise<{ commitment: Commitment; transaction: Transaction } | null> {
  try {
    const res = await fetch(`${API_BASE}/commitments/${id}/pay`, {
      method: 'POST',
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

export async function unpayBackendCommitment(id: string): Promise<Commitment | null> {
  try {
    const res = await fetch(`${API_BASE}/commitments/${id}/unpay`, {
      method: 'POST',
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
