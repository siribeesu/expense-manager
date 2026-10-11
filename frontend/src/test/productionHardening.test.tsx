import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { saveStoredState, loadStoredState, type AppStoredState } from '../lib/storage';
import { encryptVaultData, decryptVaultData, VAULT_PREFIX_V2 } from '../lib/cryptoVault';
import { Modal } from '../components/ui/Modal';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { FinanceSyncService } from '../services/financeSyncService';

describe('Thriftly Production Hardening & Reliability Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. Cryptographic Storage Vault & Zero Plaintext Exposure', () => {
    const sampleState: AppStoredState = {
      totalBudget: 15000,
      currentDay: 7,
      totalDays: 30,
      transactions: [
        {
          id: 'tx-sec-1',
          description: 'Secret High End Dinner',
          amount: 2450,
          category: 'food_groceries',
          day: 7,
          dateStr: 'Day 7',
          type: 'expense',
          createdAt: 1710000000,
        },
      ],
      savingsGoals: [
        {
          id: 'goal-sec-1',
          name: 'Classified Goa Vacation',
          targetAmount: 5000,
          currentAmount: 1200,
          targetDay: 25,
          categoryIcon: 'ShieldCheck',
          color: '#10B981',
          createdAt: 1710000000,
        },
      ],
      commitments: [
        {
          id: 'com-sec-1',
          name: 'Private Gym Membership',
          amount: 800,
          category: 'health_wellness',
          dueDay: 10,
          frequency: 'monthly',
          isPaid: false,
          isSubscription: true,
        },
      ],
    };

    it('encrypts sensitive financial data so no plaintext strings or amounts appear in localStorage', () => {
      saveStoredState(sampleState);

      const rawVault = localStorage.getItem('thriftly_vault_v1');
      expect(rawVault).toBeDefined();
      expect(rawVault).not.toBeNull();
      expect(rawVault!.startsWith(VAULT_PREFIX_V2)).toBe(true);

      // Verify that sensitive merchant names, amounts, and goal names CANNOT be found as plain text
      expect(rawVault).not.toContain('Secret High End Dinner');
      expect(rawVault).not.toContain('Classified Goa Vacation');
      expect(rawVault).not.toContain('Private Gym Membership');
      expect(rawVault).not.toContain('"amount":2450');
      expect(rawVault).not.toContain('"totalBudget":15000');
    });

    it('accurately decrypts and reconstructs complete financial state with 100% fidelity', () => {
      saveStoredState(sampleState);
      const restored = loadStoredState();

      expect(restored.totalBudget).toBe(15000);
      expect(restored.currentDay).toBe(7);
      expect(restored.transactions[0].description).toBe('Secret High End Dinner');
      expect(restored.transactions[0].amount).toBe(2450);
      expect(restored.savingsGoals[0].name).toBe('Classified Goa Vacation');
      expect(restored.commitments[0].name).toBe('Private Gym Membership');
    });

    it('gracefully rejects corrupted or tampered ciphertext payloads without crashing', () => {
      saveStoredState(sampleState);
      const rawVault = localStorage.getItem('thriftly_vault_v1')!;

      // Tamper with the raw payload
      const tampered = rawVault.replace(/a/g, 'z');
      localStorage.setItem('thriftly_vault_v1', tampered);

      // Loading should safely fall back to baseline demo state rather than throwing
      const recovered = loadStoredState();
      expect(recovered).toBeDefined();
      expect(recovered.totalBudget).toBe(10000); // Demo fallback
    });

    it('encryptVaultData and decryptVaultData roundtrip correctly', () => {
      const sensitiveCleartext = JSON.stringify({ secretKey: 'rupee-1234', balance: 99999 });
      const encrypted = encryptVaultData(sensitiveCleartext);
      expect(encrypted).not.toContain('rupee-1234');

      const decrypted = decryptVaultData(encrypted);
      expect(decrypted).toBe(sensitiveCleartext);
    });
  });

  describe('2. Modal Accessibility & Unique Instance IDs', () => {
    it('assigns unique aria-labelledby IDs to separate modal instances avoiding screen reader collision', () => {
      render(
        <div>
          <Modal isOpen={true} onClose={() => {}} title="First Transaction Modal">
            <p>First Content</p>
          </Modal>
          <Modal isOpen={true} onClose={() => {}} title="Second Commitment Modal">
            <p>Second Content</p>
          </Modal>
        </div>
      );

      const dialogs = screen.getAllByRole('dialog');
      expect(dialogs.length).toBe(2);

      const id1 = dialogs[0].getAttribute('aria-labelledby');
      const id2 = dialogs[1].getAttribute('aria-labelledby');

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      // Crucial requirement: Must NOT be a hardcoded static 'modal-title'
      expect(id1).not.toBe('modal-title');
      expect(id2).not.toBe('modal-title');
      // Must be unique from each other
      expect(id1).not.toBe(id2);
    });

    it('handles Escape key down to trigger onClose callback', () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Escape Test Modal">
          <p>Modal body</p>
        </Modal>
      );

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('3. Scoped Error Boundaries', () => {
    const ProblemChild: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
      if (shouldThrow) {
        throw new Error('Simulation calculation fault');
      }
      return <div>Healthy Widget Content</div>;
    };

    it('renders view-level scoped recovery card when level="view" without crashing whole app', () => {
      // Suppress console.error output for expected error boundary test
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary level="view">
          <ProblemChild shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('View Temporarily Unavailable')).toBeInTheDocument();
      expect(screen.getByText('Simulation calculation fault')).toBeInTheDocument();
      expect(screen.getByText('Retry View')).toBeInTheDocument();

      spy.mockRestore();
    });
  });

  describe('4. Decoupled FinanceSyncService & Explicit Failure Notifications', () => {
    it('returns structured offline failure response when remote sync fails', async () => {
      const syncService = new FinanceSyncService();
      syncService.setOnlineStatus(false);

      const result = await syncService.syncTransactionCreate({
        description: 'Coffee',
        amount: 80,
        category: 'food_groceries',
        day: 2,
        dateStr: 'Day 2',
        type: 'expense',
      });

      // When offline, it cleanly notes syncedToBackend: false without throwing
      expect(result.success).toBe(true);
      expect(result.syncedToBackend).toBe(false);
    });

    it('reports explicit error message on failed remote mutation', async () => {
      const syncService = new FinanceSyncService();
      syncService.setOnlineStatus(true);

      // Mock fetch failure
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('503 Service Unavailable'));

      const result = await syncService.syncTransactionDelete('tx-unknown');
      expect(result.success).toBe(false);
      expect(result.syncedToBackend).toBe(false);
      expect(result.error).toContain('Could not delete transaction');

      global.fetch = originalFetch;
    });
  });
});
