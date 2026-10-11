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
  currentDay: 12,
  totalDays: 30,
  transactions: [
    {
      id: 'tx-sample-1',
      description: 'Instamart Groceries & Breakfast',
      amount: 850,
      category: 'food_groceries',
      day: 1,
      dateStr: 'Day 1',
      type: 'expense',
      createdAt: Date.now() - 11 * 86400000,
    },
    {
      id: 'tx-sample-2',
      description: 'Metro SmartCard Top-up',
      amount: 400,
      category: 'transport',
      day: 3,
      dateStr: 'Day 3',
      type: 'expense',
      createdAt: Date.now() - 9 * 86400000,
    },
    {
      id: 'tx-sample-3',
      description: 'Semester Reference Book & Notes',
      amount: 620,
      category: 'education',
      day: 5,
      dateStr: 'Day 5',
      type: 'expense',
      createdAt: Date.now() - 7 * 86400000,
    },
    {
      id: 'tx-sample-4',
      description: 'Weekend Biryani with Roommates',
      amount: 450,
      category: 'food_groceries',
      day: 7,
      dateStr: 'Day 7',
      type: 'expense',
      createdAt: Date.now() - 5 * 86400000,
    },
    {
      id: 'tx-sample-5',
      description: 'Jio 5G Unlimited 1.5GB/day Plan',
      amount: 299,
      category: 'bills_utilities',
      day: 9,
      dateStr: 'Day 9',
      type: 'expense',
      isRecurring: true,
      createdAt: Date.now() - 3 * 86400000,
    },
    {
      id: 'tx-sample-6',
      description: 'Cold Brew & Cafe Study Jam',
      amount: 240,
      category: 'food_groceries',
      day: 10,
      dateStr: 'Day 10',
      type: 'expense',
      createdAt: Date.now() - 2 * 86400000,
    },
    {
      id: 'tx-sample-7',
      description: 'Apollo Pharmacy First Aid & ORS',
      amount: 180,
      category: 'health_wellness',
      day: 11,
      dateStr: 'Day 11',
      type: 'expense',
      createdAt: Date.now() - 1 * 86400000,
    },
    {
      id: 'tx-sample-8',
      description: 'Quick Kathi Roll Lunch & Chai',
      amount: 160,
      category: 'food_groceries',
      day: 12,
      dateStr: 'Day 12',
      type: 'expense',
      createdAt: Date.now(),
    },
  ],
  savingsGoals: [
    {
      id: 'goal-sample-1',
      name: 'Emergency Cushion / Tech Fund',
      targetAmount: 3000,
      currentAmount: 1200,
      targetDay: 30,
      categoryIcon: 'ShieldCheck',
      color: '#10B981',
      createdAt: Date.now() - 12 * 86400000,
      notes: 'Safe emergency buffer against surprise device repairs.',
    },
    {
      id: 'goal-sample-2',
      name: 'Diwali Gifts & Homecoming',
      targetAmount: 1500,
      currentAmount: 300,
      targetDay: 30,
      categoryIcon: 'Gift',
      color: '#C8FF55',
      createdAt: Date.now() - 10 * 86400000,
      notes: 'Train ticket reservation and gifts for family.',
    },
  ],
  commitments: [
    {
      id: 'com-sample-1',
      name: 'PG High-Speed WiFi Share',
      amount: 450,
      category: 'bills_utilities',
      dueDay: 15,
      frequency: 'monthly',
      isPaid: false,
      isSubscription: false,
      serviceProvider: 'Airtel Xstream',
    },
    {
      id: 'com-sample-2',
      name: 'Spotify Premium Duo',
      amount: 149,
      category: 'subscriptions',
      dueDay: 18,
      frequency: 'monthly',
      isPaid: false,
      isSubscription: true,
      serviceProvider: 'Spotify India',
    },
    {
      id: 'com-sample-3',
      name: 'Gym & Fitness Pass Share',
      amount: 600,
      category: 'health_wellness',
      dueDay: 22,
      frequency: 'monthly',
      isPaid: false,
      isSubscription: false,
      serviceProvider: 'Local Fitness Club',
    },
    {
      id: 'com-sample-4',
      name: 'Google One 100GB Storage',
      amount: 199,
      category: 'subscriptions',
      dueDay: 25,
      frequency: 'monthly',
      isPaid: false,
      isSubscription: true,
      serviceProvider: 'Google Services',
    },
  ],
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
