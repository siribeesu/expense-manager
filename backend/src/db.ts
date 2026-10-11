import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type TransactionCategory =
  | 'food_groceries'
  | 'transport'
  | 'education'
  | 'entertainment'
  | 'shopping'
  | 'subscriptions'
  | 'health_wellness'
  | 'bills_utilities'
  | 'other';

export type TransactionType = 'expense' | 'savings_deposit' | 'commitment_payment';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: TransactionCategory;
  day: number;
  dateStr: string;
  type: TransactionType;
  isRecurring?: boolean;
  notes?: string;
  createdAt: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDay: number;
  categoryIcon: string;
  color: string;
  createdAt: number;
  notes?: string;
}

export type CommitmentFrequency = 'monthly' | 'weekly' | 'annual_split';

export interface Commitment {
  id: string;
  name: string;
  amount: number;
  category: TransactionCategory;
  dueDay: number;
  frequency: CommitmentFrequency;
  isPaid: boolean;
  paidTransactionId?: string;
  isSubscription: boolean;
  serviceProvider?: string;
}

export interface DatabaseSchema {
  totalBudget: number;
  currentDay: number;
  totalDays: number;
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  commitments: Commitment[];
  updatedAt: number;
}

const INITIAL_DEMO_DATA: DatabaseSchema = {
  totalBudget: 10000,
  currentDay: 1,
  totalDays: 30,
  transactions: [],
  savingsGoals: [],
  commitments: [],
  updatedAt: Date.now(),
};

// Database file path resolution (uses /tmp in Vercel serverless environment)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'thriftly_db.json');

export class Database {
  private inMemoryCache: DatabaseSchema;
  private dbFile: string;

  constructor(customPath?: string) {
    this.dbFile = customPath || DB_FILE;
    this.ensureDirectory();
    this.inMemoryCache = this.readFromDisk();
  }

  private ensureDirectory(): void {
    const dir = path.dirname(this.dbFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private readFromDisk(): DatabaseSchema {
    try {
      if (fs.existsSync(this.dbFile)) {
        const raw = fs.readFileSync(this.dbFile, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not read existing database file, reinitializing demo dataset:', e);
    }
    // First time init: write default
    this.writeToDisk(INITIAL_DEMO_DATA);
    return JSON.parse(JSON.stringify(INITIAL_DEMO_DATA));
  }

  private writeToDisk(data: DatabaseSchema): void {
    this.ensureDirectory();
    try {
      fs.writeFileSync(this.dbFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Failed to persist database to disk:', e);
    }
  }

  private persist(): void {
    this.inMemoryCache.updatedAt = Date.now();
    this.writeToDisk(this.inMemoryCache);
  }

  // API Methods
  public getState(): DatabaseSchema {
    return { ...this.inMemoryCache };
  }

  public resetState(): DatabaseSchema {
    this.inMemoryCache = JSON.parse(JSON.stringify(INITIAL_DEMO_DATA));
    this.inMemoryCache.updatedAt = Date.now();
    this.writeToDisk(this.inMemoryCache);
    return { ...this.inMemoryCache };
  }

  public updateBudget(budget: number): DatabaseSchema {
    this.inMemoryCache.totalBudget = Math.max(1, budget);
    this.persist();
    return this.getState();
  }

  public advanceDay(): DatabaseSchema {
    this.inMemoryCache.currentDay = Math.min(
      this.inMemoryCache.totalDays,
      this.inMemoryCache.currentDay + 1
    );
    this.persist();
    return this.getState();
  }

  public setDay(day: number): DatabaseSchema {
    this.inMemoryCache.currentDay = Math.min(
      this.inMemoryCache.totalDays,
      Math.max(1, day)
    );
    this.persist();
    return this.getState();
  }

  // Transactions
  public addTransaction(data: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
    const newTx: Transaction = {
      ...data,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
    };
    this.inMemoryCache.transactions.unshift(newTx);
    this.persist();
    return newTx;
  }

  public updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
    const index = this.inMemoryCache.transactions.findIndex((t) => t.id === id);
    if (index === -1) return null;
    this.inMemoryCache.transactions[index] = {
      ...this.inMemoryCache.transactions[index],
      ...updates,
    };
    this.persist();
    return this.inMemoryCache.transactions[index];
  }

  public deleteTransaction(id: string): boolean {
    const initialLen = this.inMemoryCache.transactions.length;
    this.inMemoryCache.transactions = this.inMemoryCache.transactions.filter((t) => t.id !== id);
    if (this.inMemoryCache.transactions.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // Savings Goals
  public addGoal(data: Omit<SavingsGoal, 'id' | 'createdAt'>): SavingsGoal {
    const newGoal: SavingsGoal = {
      ...data,
      id: `goal-${Date.now()}`,
      createdAt: Date.now(),
    };
    this.inMemoryCache.savingsGoals.push(newGoal);
    this.persist();
    return newGoal;
  }

  public updateGoal(id: string, updates: Partial<SavingsGoal>): SavingsGoal | null {
    const index = this.inMemoryCache.savingsGoals.findIndex((g) => g.id === id);
    if (index === -1) return null;
    this.inMemoryCache.savingsGoals[index] = {
      ...this.inMemoryCache.savingsGoals[index],
      ...updates,
    };
    this.persist();
    return this.inMemoryCache.savingsGoals[index];
  }

  public deleteGoal(id: string): boolean {
    const initialLen = this.inMemoryCache.savingsGoals.length;
    this.inMemoryCache.savingsGoals = this.inMemoryCache.savingsGoals.filter((g) => g.id !== id);
    if (this.inMemoryCache.savingsGoals.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  public contributeToGoal(id: string, amount: number): SavingsGoal | null {
    const goal = this.inMemoryCache.savingsGoals.find((g) => g.id === id);
    if (!goal || amount <= 0) return null;
    goal.currentAmount += amount;
    this.persist();
    return goal;
  }

  public withdrawFromGoal(id: string, amount: number): SavingsGoal | null {
    const goal = this.inMemoryCache.savingsGoals.find((g) => g.id === id);
    if (!goal || amount <= 0 || amount > goal.currentAmount) return null;
    goal.currentAmount -= amount;
    this.persist();
    return goal;
  }

  // Commitments
  public addCommitment(data: Omit<Commitment, 'id'>): Commitment {
    const newCom: Commitment = {
      ...data,
      id: `com-${Date.now()}`,
    };
    this.inMemoryCache.commitments.push(newCom);
    this.persist();
    return newCom;
  }

  public updateCommitment(id: string, updates: Partial<Commitment>): Commitment | null {
    const index = this.inMemoryCache.commitments.findIndex((c) => c.id === id);
    if (index === -1) return null;
    this.inMemoryCache.commitments[index] = {
      ...this.inMemoryCache.commitments[index],
      ...updates,
    };
    this.persist();
    return this.inMemoryCache.commitments[index];
  }

  public deleteCommitment(id: string): boolean {
    const initialLen = this.inMemoryCache.commitments.length;
    this.inMemoryCache.commitments = this.inMemoryCache.commitments.filter((c) => c.id !== id);
    if (this.inMemoryCache.commitments.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  public payCommitment(id: string): { commitment: Commitment; transaction: Transaction } | null {
    const com = this.inMemoryCache.commitments.find((c) => c.id === id);
    if (!com || com.isPaid) return null;

    const txId = `tx-paid-com-${Date.now()}`;
    const paidTx: Transaction = {
      id: txId,
      description: `Paid Bill: ${com.name}`,
      amount: com.amount,
      category: com.category,
      day: this.inMemoryCache.currentDay,
      dateStr: `Day ${this.inMemoryCache.currentDay} (Settled)`,
      type: 'commitment_payment',
      isRecurring: com.isSubscription,
      createdAt: Date.now(),
    };

    com.isPaid = true;
    com.paidTransactionId = txId;
    this.inMemoryCache.transactions.unshift(paidTx);
    this.persist();
    return { commitment: com, transaction: paidTx };
  }

  public unpayCommitment(id: string): Commitment | null {
    const com = this.inMemoryCache.commitments.find((c) => c.id === id);
    if (!com || !com.isPaid) return null;

    const txId = com.paidTransactionId;
    com.isPaid = false;
    com.paidTransactionId = undefined;

    if (txId) {
      this.inMemoryCache.transactions = this.inMemoryCache.transactions.filter((t) => t.id !== txId);
    }
    this.persist();
    return com;
  }
}

export const db = new Database();
