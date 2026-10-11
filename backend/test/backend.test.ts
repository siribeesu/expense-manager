import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Database } from '../src/db';
import type { Transaction } from '../src/db';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB_FILE = path.join(__dirname, 'test_db.json');

describe('Thriftly Backend Database Engine', () => {
  let db: Database;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_FILE)) {
      try { fs.unlinkSync(TEST_DB_FILE); } catch {}
    }
    db = new Database(TEST_DB_FILE);
    db.resetState();
  });

  afterAll(() => {
    if (fs.existsSync(TEST_DB_FILE)) {
      try { fs.unlinkSync(TEST_DB_FILE); } catch {}
    }
  });

  it('initializes with sample financial data ready for user', () => {
    const state = db.getState();
    expect(state.totalBudget).toBe(10000);
    expect(state.currentDay).toBe(12);
    expect(state.totalDays).toBe(30);
    expect(state.transactions.length).toBe(8);
    expect(state.savingsGoals.length).toBe(2);
    expect(state.commitments.length).toBe(4);
  });

  it('adds, updates, and deletes transactions in persistent database', () => {
    const newTx = db.addTransaction({
      description: 'Hostel Night Snacks',
      amount: 140,
      category: 'food_groceries',
      day: 1,
      dateStr: 'Day 1',
      type: 'expense',
    });

    expect(newTx.id).toBeDefined();
    expect(db.getState().transactions[0].id).toBe(newTx.id);
    expect(db.getState().transactions[0].amount).toBe(140);

    // Update
    const updated = db.updateTransaction(newTx.id, { amount: 160 });
    expect(updated?.amount).toBe(160);

    // Delete
    const deleted = db.deleteTransaction(newTx.id);
    expect(deleted).toBe(true);
    expect(db.getState().transactions.find((t: Transaction) => t.id === newTx.id)).toBeUndefined();
  });

  it('atomically marks commitments as paid and creates linked expense transaction', () => {
    // Add commitment first
    const com = db.addCommitment({
      name: 'Hostel WiFi',
      amount: 450,
      category: 'bills_utilities',
      dueDay: 5,
      frequency: 'monthly',
      isPaid: false,
      isSubscription: false,
    });

    const result = db.payCommitment(com.id);
    expect(result).not.toBeNull();
    expect(result?.commitment.isPaid).toBe(true);
    expect(result?.transaction.amount).toBe(450);
    expect(result?.transaction.type).toBe('commitment_payment');

    // Verify linked transaction is present in transactions list
    const linkedTx = db.getState().transactions.find((t: Transaction) => t.id === result?.transaction.id);
    expect(linkedTx).toBeDefined();

    // Revert / unpay
    const reverted = db.unpayCommitment(com.id);
    expect(reverted?.isPaid).toBe(false);
    expect(db.getState().transactions.find((t: Transaction) => t.id === result?.transaction.id)).toBeUndefined();
  });

  it('manages goal deposits and withdrawals safely', () => {
    // Add goal first
    const createdGoal = db.addGoal({
      name: 'Emergency Fund',
      targetAmount: 2000,
      currentAmount: 500,
      targetDay: 30,
      categoryIcon: 'ShieldCheck',
      color: '#10B981',
    });

    const initialAmount = createdGoal.currentAmount;

    // Deposit 500
    const deposited = db.contributeToGoal(createdGoal.id, 500);
    expect(deposited?.currentAmount).toBe(initialAmount + 500);

    // Withdraw 200
    const withdrawn = db.withdrawFromGoal(createdGoal.id, 200);
    expect(withdrawn?.currentAmount).toBe(initialAmount + 300);

    // Reject withdrawing more than balance
    const invalid = db.withdrawFromGoal(createdGoal.id, 999999);
    expect(invalid).toBeNull();
  });

  it('enforces authentication and authorization headers via authMiddleware', async () => {
    const { authMiddleware, DEFAULT_AUTH_TOKEN } = await import('../src/middleware/auth');
    
    // 1. Should block unauthorized requests to /state
    let statusSet = 0;
    let jsonSent: any = null;
    let nextCalled = false;

    const mockReq = {
      path: '/state',
      headers: {},
    } as any;

    const mockRes = {
      status: (code: number) => {
        statusSet = code;
        return {
          json: (data: any) => { jsonSent = data; },
        };
      },
    } as any;

    authMiddleware(mockReq, mockRes, () => { nextCalled = true; });

    expect(statusSet).toBe(401);
    expect(jsonSent?.error).toBe('Unauthorized');
    expect(nextCalled).toBe(false);

    // 2. Should permit request with valid Bearer token
    let authorizedNext = false;
    const authReq = {
      path: '/state',
      headers: { authorization: `Bearer ${DEFAULT_AUTH_TOKEN}` },
    } as any;

    authMiddleware(authReq, mockRes, () => { authorizedNext = true; });
    expect(authorizedNext).toBe(true);

    // 3. Should allow whitelisted public endpoints without token
    let healthNext = false;
    const healthReq = { path: '/health', headers: {} } as any;
    authMiddleware(healthReq, mockRes, () => { healthNext = true; });
    expect(healthNext).toBe(true);
  });
});
