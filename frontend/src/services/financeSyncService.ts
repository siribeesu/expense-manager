/**
 * Dedicated Synchronization Service for Thriftly Financial Ledger
 * 
 * Decouples domain accounting calculations and React context from the
 * network transport layer. Handles optimistic mutations, structured sync
 * responses, and failure feedback for reliable persistence.
 */

import type { Transaction, SavingsGoal, Commitment } from '../types/finance';
import type { AppStoredState } from '../lib/storage';
import {
  checkBackendHealth,
  fetchBackendState,
  resetBackendState,
  createBackendTransaction,
  updateBackendTransaction,
  deleteBackendTransaction,
  createBackendGoal,
  updateBackendGoal,
  deleteBackendGoal,
  depositBackendGoal,
  withdrawBackendGoal,
  createBackendCommitment,
  updateBackendCommitment,
  deleteBackendCommitment,
  payBackendCommitment,
  unpayBackendCommitment,
  getStoredAuthToken,
} from '../lib/api';

export interface SyncResponse<T = void> {
  success: boolean;
  syncedToBackend: boolean;
  data?: T;
  error?: string;
}

const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';

export class FinanceSyncService {
  private isOnline = false;

  public async checkHealth(): Promise<boolean> {
    const health = await checkBackendHealth();
    this.isOnline = health.isOnline;
    return this.isOnline;
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  public setOnlineStatus(online: boolean): void {
    this.isOnline = online;
  }

  public async pullInitialState(): Promise<AppStoredState | null> {
    if (!this.isOnline) return null;
    return await fetchBackendState();
  }

  public async resetState(): Promise<SyncResponse<AppStoredState>> {
    if (!this.isOnline) {
      return { success: true, syncedToBackend: false };
    }
    const state = await resetBackendState();
    if (state) {
      return { success: true, syncedToBackend: true, data: state };
    }
    return {
      success: false,
      syncedToBackend: false,
      error: 'Backend reset failed. State was reset in local vault only.',
    };
  }

  public async syncTransactionCreate(
    tx: Omit<Transaction, 'id' | 'createdAt'>
  ): Promise<SyncResponse<Transaction>> {
    if (!this.isOnline) {
      return { success: true, syncedToBackend: false };
    }
    const res = await createBackendTransaction(tx);
    if (res) {
      return { success: true, syncedToBackend: true, data: res };
    }
    return {
      success: false,
      syncedToBackend: false,
      error: 'Could not sync transaction with remote database. Saved in local secure vault.',
    };
  }

  public async syncTransactionUpdate(
    id: string,
    updates: Partial<Transaction>
  ): Promise<SyncResponse<Transaction>> {
    if (!this.isOnline) {
      return { success: true, syncedToBackend: false };
    }
    const res = await updateBackendTransaction(id, updates);
    if (res) {
      return { success: true, syncedToBackend: true, data: res };
    }
    return {
      success: false,
      syncedToBackend: false,
      error: 'Could not sync transaction updates with remote database. Updated locally.',
    };
  }

  public async syncTransactionDelete(id: string): Promise<SyncResponse> {
    if (!this.isOnline) {
      return { success: true, syncedToBackend: false };
    }
    const ok = await deleteBackendTransaction(id);
    if (ok) {
      return { success: true, syncedToBackend: true };
    }
    return {
      success: false,
      syncedToBackend: false,
      error: 'Could not delete transaction on remote server. Deleted locally.',
    };
  }

  public async syncGoalCreate(
    goal: Omit<SavingsGoal, 'id' | 'createdAt'>
  ): Promise<SyncResponse<SavingsGoal>> {
    if (!this.isOnline) {
      return { success: true, syncedToBackend: false };
    }
    const res = await createBackendGoal(goal);
    if (res) {
      return { success: true, syncedToBackend: true, data: res };
    }
    return {
      success: false,
      syncedToBackend: false,
      error: 'Could not sync savings goal with remote database. Saved locally.',
    };
  }

  public async syncGoalUpdate(
    id: string,
    updates: Partial<SavingsGoal>
  ): Promise<SyncResponse<SavingsGoal>> {
    if (!this.isOnline) {
      return { success: true, syncedToBackend: false };
    }
    const res = await updateBackendGoal(id, updates);
    if (res) {
      return { success: true, syncedToBackend: true, data: res };
    }
    return {
      success: false,
      syncedToBackend: false,
      error: 'Could not sync goal changes with remote database. Updated locally.',
    };
  }

  public async syncGoalDelete(id: string): Promise<SyncResponse> {
    if (!this.isOnline) {
      return { success: true, syncedToBackend: false };
    }
    const ok = await deleteBackendGoal(id);
    if (ok) {
      return { success: true, syncedToBackend: true };
    }
    return {
      success: false,
      syncedToBackend: false,
      error: 'Could not delete goal on remote server. Deleted locally.',
    };
  }

  public async syncGoalDeposit(id: string, amount: number): Promise<SyncResponse<SavingsGoal>> {
    if (!this.isOnline) {
      return { success: true, syncedToBackend: false };
    }
    const res = await depositBackendGoal(id, amount);
    if (res) {
      return { success: true, syncedToBackend: true, data: res };
    }
    return {
      success: false,
      syncedToBackend: false,
      error: 'Could not sync goal deposit with remote server. Recorded locally.',
    };
  }

  public async syncGoalWithdraw(id: string, amount: number): Promise<SyncResponse<SavingsGoal>> {
    if (!this.isOnline) {
      return { success: true, syncedToBackend: false };
    }
    const res = await withdrawBackendGoal(id, amount);
    if (res) {
      return { success: true, syncedToBackend: true, data: res };
    }
    return {
      success: false,
      syncedToBackend: false,
      error: 'Could not sync goal withdrawal with remote server. Recorded locally.',
    };
  }

  public async syncCommitmentCreate(
    com: Omit<Commitment, 'id'>
  ): Promise<SyncResponse<Commitment>> {
    if (!this.isOnline) {
      return { success: true, syncedToBackend: false };
    }
    const res = await createBackendCommitment(com);
    if (res) {
      return { success: true, syncedToBackend: true, data: res };
    }
    return {
      success: false,
      syncedToBackend: false,
      error: 'Could not sync commitment with remote database. Saved locally.',
    };
  }

  public async syncCommitmentUpdate(
    id: string,
    updates: Partial<Commitment>
  ): Promise<SyncResponse<Commitment>> {
    if (!this.isOnline) {
      return { success: true, syncedToBackend: false };
    }
    const res = await updateBackendCommitment(id, updates);
    if (res) {
      return { success: true, syncedToBackend: true, data: res };
    }
    return {
      success: false,
      syncedToBackend: false,
      error: 'Could not sync commitment updates with remote database. Saved locally.',
    };
  }

  public async syncCommitmentDelete(id: string): Promise<SyncResponse> {
    if (!this.isOnline) {
      return { success: true, syncedToBackend: false };
    }
    const ok = await deleteBackendCommitment(id);
    if (ok) {
      return { success: true, syncedToBackend: true };
    }
    return {
      success: false,
      syncedToBackend: false,
      error: 'Could not delete commitment on remote server. Deleted locally.',
    };
  }

  public async syncCommitmentPay(
    id: string
  ): Promise<SyncResponse<{ commitment: Commitment; transaction: Transaction }>> {
    if (!this.isOnline) {
      return { success: true, syncedToBackend: false };
    }
    const res = await payBackendCommitment(id);
    if (res) {
      return { success: true, syncedToBackend: true, data: res };
    }
    return {
      success: false,
      syncedToBackend: false,
      error: 'Could not sync bill payment atomically on remote database. Settled locally.',
    };
  }

  public async syncCommitmentUnpay(id: string): Promise<SyncResponse<Commitment>> {
    if (!this.isOnline) {
      return { success: true, syncedToBackend: false };
    }
    const res = await unpayBackendCommitment(id);
    if (res) {
      return { success: true, syncedToBackend: true, data: res };
    }
    return {
      success: false,
      syncedToBackend: false,
      error: 'Could not revert payment on remote database. Reverted locally.',
    };
  }

  public async syncAdvanceDay(): Promise<SyncResponse> {
    if (!this.isOnline) {
      return { success: true, syncedToBackend: false };
    }
    try {
      const res = await fetch(`${API_BASE}/state/advance-day`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getStoredAuthToken()}`,
          'x-thriftly-auth': getStoredAuthToken(),
        },
      });
      return { success: res.ok, syncedToBackend: res.ok };
    } catch {
      return { success: false, syncedToBackend: false, error: 'Could not advance clock on remote server.' };
    }
  }

  public async syncSetDay(day: number): Promise<SyncResponse> {
    if (!this.isOnline) {
      return { success: true, syncedToBackend: false };
    }
    try {
      const res = await fetch(`${API_BASE}/state/day`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getStoredAuthToken()}`,
          'x-thriftly-auth': getStoredAuthToken(),
        },
        body: JSON.stringify({ day }),
      });
      return { success: res.ok, syncedToBackend: res.ok };
    } catch {
      return { success: false, syncedToBackend: false, error: 'Could not sync day on remote server.' };
    }
  }

  public async syncUpdateBudget(totalBudget: number): Promise<SyncResponse> {
    if (!this.isOnline) {
      return { success: true, syncedToBackend: false };
    }
    try {
      const res = await fetch(`${API_BASE}/state/budget`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getStoredAuthToken()}`,
          'x-thriftly-auth': getStoredAuthToken(),
        },
        body: JSON.stringify({ totalBudget }),
      });
      return { success: res.ok, syncedToBackend: res.ok };
    } catch {
      return { success: false, syncedToBackend: false, error: 'Could not sync budget on remote server.' };
    }
  }
}

export const financeSyncService = new FinanceSyncService();
