import { z } from 'zod';

export const TransactionCategorySchema = z.enum([
  'food_groceries',
  'transport',
  'education',
  'entertainment',
  'shopping',
  'subscriptions',
  'health_wellness',
  'bills_utilities',
  'other',
]);

export const TransactionTypeSchema = z.enum([
  'expense',
  'savings_deposit',
  'commitment_payment',
]);

export const TransactionSchema = z.object({
  id: z.string(),
  description: z.string().min(1).max(120),
  amount: z.number().positive(),
  category: TransactionCategorySchema,
  day: z.number().int().min(1).max(30),
  dateStr: z.string(),
  type: TransactionTypeSchema,
  isRecurring: z.boolean().optional(),
  notes: z.string().max(300).optional(),
  createdAt: z.number(),
});

export const SavingsGoalSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(80),
  targetAmount: z.number().positive(),
  currentAmount: z.number().nonnegative(),
  targetDay: z.number().int().min(1).max(30),
  categoryIcon: z.string(),
  color: z.string(),
  createdAt: z.number(),
  notes: z.string().max(300).optional(),
});

export const CommitmentFrequencySchema = z.enum(['monthly', 'weekly', 'annual_split']);

export const CommitmentSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(80),
  amount: z.number().positive(),
  category: TransactionCategorySchema,
  dueDay: z.number().int().min(1).max(30),
  frequency: CommitmentFrequencySchema,
  isPaid: z.boolean(),
  paidTransactionId: z.string().optional(),
  isSubscription: z.boolean(),
  serviceProvider: z.string().optional(),
});

export const AppStoredStateSchema = z.object({
  totalBudget: z.number().positive(),
  currentDay: z.number().int().min(1).max(30),
  totalDays: z.number().int().positive(),
  transactions: z.array(TransactionSchema),
  savingsGoals: z.array(SavingsGoalSchema),
  commitments: z.array(CommitmentSchema),
});

export const BackendHealthSchema = z.object({
  status: z.string().optional(),
  service: z.string().optional(),
  version: z.string().optional(),
  timestamp: z.string().optional(),
});
