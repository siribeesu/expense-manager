import { createContext } from 'react';
import type {
  Transaction,
  SavingsGoal,
  Commitment,
  FinancialMetrics,
  SimulationParams,
} from '../types/finance';
import type { SimulationProjection } from '../engine/forecast';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
}

export interface FinanceContextType {
  // State
  totalBudget: number;
  currentDay: number;
  totalDays: number;
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  commitments: Commitment[];
  metrics: FinancialMetrics;
  isBackendConnected: boolean;

  // Simulation
  simulationParams: SimulationParams;
  simulationProjection: SimulationProjection;
  isSimulating: boolean;
  setSimulationParams: (params: Partial<SimulationParams>) => void;
  loadScenarioIntoSimulation: (scenario: {
    description: string;
    amount: number;
    category: Transaction['category'];
    type: SimulationParams['expenseType'];
  }) => void;
  resetSimulation: () => void;
  commitSimulatedExpense: () => boolean;

  // Transactions CRUD
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Goals CRUD
  addGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (goalId: string, amount: number) => boolean;
  withdrawFromGoal: (goalId: string, amount: number) => boolean;

  // Commitments CRUD
  addCommitment: (commitment: Omit<Commitment, 'id'>) => void;
  updateCommitment: (id: string, updates: Partial<Commitment>) => void;
  deleteCommitment: (id: string) => void;
  markCommitmentPaid: (id: string) => void;
  unmarkCommitmentPaid: (id: string) => void;

  // Cycle navigation & reset
  advanceDay: () => void;
  setDay: (day: number) => void;
  setTotalBudget: (budget: number) => void;
  resetToDemoData: () => void;

  // Notifications
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const FinanceContext = createContext<FinanceContextType | undefined>(undefined);
