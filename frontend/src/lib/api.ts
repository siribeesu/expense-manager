import type { Transaction, SavingsGoal, Commitment } from '../types/finance';
import type { AppStoredState } from './storage';

const API_BASE = '/api';

export interface BackendHealth {
  isOnline: boolean;
  service?: string;
  version?: string;
  timestamp?: string;
}

export async function checkBackendHealth(): Promise<BackendHealth> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const data = await res.json();
      return { isOnline: true, service: data.service, version: data.version, timestamp: data.timestamp };
    }
  } catch {
    // Offline or server not running
  }
  return { isOnline: false };
}

export async function fetchBackendState(): Promise<AppStoredState | null> {
  try {
    const res = await fetch(`${API_BASE}/state`, { signal: AbortSignal.timeout(2500) });
    if (res.ok) {
      const data = await res.json();
      return {
        totalBudget: data.totalBudget,
        currentDay: data.currentDay,
        totalDays: data.totalDays,
        transactions: data.transactions,
        savingsGoals: data.savingsGoals,
        commitments: data.commitments,
      };
    }
  } catch (err) {
    console.warn('[PaisaPilot API] Falling back to local persistence:', err);
  }
  return null;
}

export async function resetBackendState(): Promise<AppStoredState | null> {
  try {
    const res = await fetch(`${API_BASE}/state/reset`, { method: 'POST', signal: AbortSignal.timeout(2500) });
    if (res.ok) {
      const data = await res.json();
      return data.state;
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
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx),
    });
    if (res.ok) {
      const data = await res.json();
      return data.transaction;
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
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      return data.transaction;
    }
  } catch (err) {
    console.warn('[PaisaPilot API] Update transaction error:', err);
  }
  return null;
}

export async function deleteBackendTransaction(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function createBackendGoal(
  goal: Omit<SavingsGoal, 'id' | 'createdAt'>
): Promise<SavingsGoal | null> {
  try {
    const res = await fetch(`${API_BASE}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal),
    });
    if (res.ok) {
      const data = await res.json();
      return data.goal;
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
    const res = await fetch(`${API_BASE}/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      return data.goal;
    }
  } catch {
    return null;
  }
  return null;
}

export async function deleteBackendGoal(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/goals/${id}`, { method: 'DELETE' });
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
    });
    if (res.ok) {
      const data = await res.json();
      return data.goal;
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
    });
    if (res.ok) {
      const data = await res.json();
      return data.goal;
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
    const res = await fetch(`${API_BASE}/commitments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commitment),
    });
    if (res.ok) {
      const data = await res.json();
      return data.commitment;
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
    const res = await fetch(`${API_BASE}/commitments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      return data.commitment;
    }
  } catch {
    return null;
  }
  return null;
}

export async function deleteBackendCommitment(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/commitments/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function payBackendCommitment(
  id: string
): Promise<{ commitment: Commitment; transaction: Transaction } | null> {
  try {
    const res = await fetch(`${API_BASE}/commitments/${id}/pay`, { method: 'POST' });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    return null;
  }
  return null;
}

export async function unpayBackendCommitment(id: string): Promise<Commitment | null> {
  try {
    const res = await fetch(`${API_BASE}/commitments/${id}/unpay`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      return data.commitment;
    }
  } catch {
    return null;
  }
  return null;
}
