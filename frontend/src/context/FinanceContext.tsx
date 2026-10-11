import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  Transaction,
  SavingsGoal,
  Commitment,
  SimulationParams,
} from '../types/finance';
import { calculateFinancialMetrics } from '../engine/accounting';
import { projectSimulation } from '../engine/forecast';
import { loadStoredState, saveStoredState, getInitialDemoState } from '../lib/storage';
import { FinanceContext, type ToastMessage } from './financeContextDef';
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
} from '../lib/api';

const DEFAULT_SIMULATION_PARAMS: SimulationParams = {
  description: 'Simulated Purchase / Expense',
  amount: 1500,
  category: 'shopping',
  expenseType: 'planned',
  delayDays: 0,
  isRecurring: false,
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial persistent state
  const [persisted, setPersisted] = useState(() => loadStoredState());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  // Simulation state (isolated from actual state)
  const [simulationParams, setSimulationParamsState] = useState<SimulationParams>(DEFAULT_SIMULATION_PARAMS);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Check backend health & sync state from backend on mount
  useEffect(() => {
    let isMounted = true;
    checkBackendHealth().then((health) => {
      if (!isMounted) return;
      if (health.isOnline) {
        setIsBackendConnected(true);
        fetchBackendState().then((backendState) => {
          if (backendState && isMounted) {
            setPersisted(backendState);
          }
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync to localStorage whenever actual data changes
  useEffect(() => {
    saveStoredState(persisted);
  }, [persisted]);

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Purely derived current actual metrics
  const metrics = useMemo(() => {
    return calculateFinancialMetrics({
      totalBudget: persisted.totalBudget,
      currentDay: persisted.currentDay,
      totalDays: persisted.totalDays,
      transactions: persisted.transactions,
      savingsGoals: persisted.savingsGoals,
      commitments: persisted.commitments,
    });
  }, [persisted]);

  // Purely derived simulation projections
  const simulationProjection = useMemo(() => {
    return projectSimulation(
      metrics,
      simulationParams,
      persisted.savingsGoals,
      persisted.commitments
    );
  }, [metrics, simulationParams, persisted.savingsGoals, persisted.commitments]);

  // Simulation controls
  const setSimulationParams = useCallback((params: Partial<SimulationParams>) => {
    setSimulationParamsState((prev) => ({ ...prev, ...params }));
    setIsSimulating(true);
  }, []);

  const loadScenarioIntoSimulation = useCallback((scenario: {
    description: string;
    amount: number;
    category: Transaction['category'];
    type: SimulationParams['expenseType'];
  }) => {
    setSimulationParamsState({
      description: scenario.description,
      amount: scenario.amount,
      category: scenario.category,
      expenseType: scenario.type,
      delayDays: 0,
      isRecurring: false,
    });
    setIsSimulating(true);
    showToast({
      type: 'info',
      title: 'Scenario Loaded',
      description: `Testing: ${scenario.description} (₹${scenario.amount}) in What-If Simulator.`,
    });
  }, [showToast]);

  const resetSimulation = useCallback(() => {
    setSimulationParamsState(DEFAULT_SIMULATION_PARAMS);
    setIsSimulating(false);
    showToast({
      type: 'info',
      title: 'Simulation Reset',
      description: 'Restored baseline financial plan.',
    });
  }, [showToast]);

  const commitSimulatedExpense = useCallback(() => {
    if (simulationParams.amount <= 0) {
      showToast({
        type: 'error',
        title: 'Invalid Amount',
        description: 'Simulated expense amount must be greater than zero.',
      });
      return false;
    }

    const newTx: Transaction = {
      id: `tx-sim-${Date.now()}`,
      description: simulationParams.description || 'Committed Expense',
      amount: simulationParams.amount,
      category: simulationParams.category,
      day: persisted.currentDay,
      dateStr: `Day ${persisted.currentDay} (Committed)`,
      type: 'expense',
      isRecurring: simulationParams.isRecurring,
      createdAt: Date.now(),
    };

    setPersisted((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
    }));

    // Sync with backend
    createBackendTransaction(newTx);

    showToast({
      type: 'success',
      title: 'Expense Committed to Actual Records',
      description: `Added ₹${simulationParams.amount} for "${simulationParams.description}". Metrics updated!`,
    });

    setIsSimulating(false);
    setSimulationParamsState(DEFAULT_SIMULATION_PARAMS);
    return true;
  }, [simulationParams, persisted.currentDay, showToast]);

  // Transactions CRUD
  const addTransaction = useCallback((data: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...data,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
    };

    setPersisted((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
    }));

    createBackendTransaction(newTx);

    showToast({
      type: 'success',
      title: 'Transaction Added',
      description: `${data.description} (₹${data.amount}) recorded successfully.`,
    });
  }, [showToast]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setPersisted((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));

    updateBackendTransaction(id, updates);

    showToast({
      type: 'success',
      title: 'Transaction Updated',
      description: 'Changes applied and financial health recalculated.',
    });
  }, [showToast]);

  const deleteTransaction = useCallback((id: string) => {
    setPersisted((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));

    deleteBackendTransaction(id);

    showToast({
      type: 'info',
      title: 'Transaction Deleted',
      description: 'Budget availability and daily allowance updated.',
    });
  }, [showToast]);

  // Savings Goals CRUD
  const addGoal = useCallback((data: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    const newGoal: SavingsGoal = {
      ...data,
      id: `goal-${Date.now()}`,
      createdAt: Date.now(),
    };

    setPersisted((prev) => ({
      ...prev,
      savingsGoals: [...prev.savingsGoals, newGoal],
    }));

    createBackendGoal(newGoal);

    showToast({
      type: 'success',
      title: 'Savings Goal Created',
      description: `Goal "${data.name}" set with target ₹${data.targetAmount}.`,
    });
  }, [showToast]);

  const updateGoal = useCallback((id: string, updates: Partial<SavingsGoal>) => {
    setPersisted((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }));

    updateBackendGoal(id, updates);

    showToast({
      type: 'success',
      title: 'Savings Goal Updated',
      description: 'Goal parameters revised.',
    });
  }, [showToast]);

  const deleteGoal = useCallback((id: string) => {
    setPersisted((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.filter((g) => g.id !== id),
    }));

    deleteBackendGoal(id);

    showToast({
      type: 'info',
      title: 'Savings Goal Removed',
      description: 'Goal removed. Reserved funds released back to available cash.',
    });
  }, [showToast]);

  const contributeToGoal = useCallback((goalId: string, amount: number): boolean => {
    if (amount <= 0) {
      showToast({ type: 'error', title: 'Invalid Amount', description: 'Contribution must be positive.' });
      return false;
    }

    if (amount > metrics.availableCash) {
      showToast({
        type: 'error',
        title: 'Insufficient Cash',
        description: `You only have ₹${metrics.availableCash} available cash right now.`,
      });
      return false;
    }

    setPersisted((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map((g) =>
        g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g
      ),
    }));

    depositBackendGoal(goalId, amount);

    showToast({
      type: 'success',
      title: 'Savings Boosted!',
      description: `Deposited ₹${amount} into goal. Safely reserved from daily spending.`,
    });
    return true;
  }, [metrics.availableCash, showToast]);

  const withdrawFromGoal = useCallback((goalId: string, amount: number): boolean => {
    const goal = persisted.savingsGoals.find((g) => g.id === goalId);
    if (!goal || amount <= 0 || amount > goal.currentAmount) {
      showToast({ type: 'error', title: 'Invalid Amount', description: 'Cannot withdraw more than saved balance.' });
      return false;
    }

    setPersisted((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map((g) =>
        g.id === goalId ? { ...g, currentAmount: g.currentAmount - amount } : g
      ),
    }));

    withdrawBackendGoal(goalId, amount);

    showToast({
      type: 'info',
      title: 'Funds Released to Cash',
      description: `Withdrew ₹${amount} from goal back into available cash pool.`,
    });
    return true;
  }, [persisted.savingsGoals, showToast]);

  // Commitments CRUD
  const addCommitment = useCallback((data: Omit<Commitment, 'id'>) => {
    const newCommitment: Commitment = {
      ...data,
      id: `com-${Date.now()}`,
    };

    setPersisted((prev) => ({
      ...prev,
      commitments: [...prev.commitments, newCommitment],
    }));

    createBackendCommitment(newCommitment);

    showToast({
      type: 'success',
      title: 'Commitment Added',
      description: `Added "${data.name}" (₹${data.amount}) due on Day ${data.dueDay}.`,
    });
  }, [showToast]);

  const updateCommitment = useCallback((id: string, updates: Partial<Commitment>) => {
    setPersisted((prev) => ({
      ...prev,
      commitments: prev.commitments.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));

    updateBackendCommitment(id, updates);

    showToast({
      type: 'success',
      title: 'Commitment Updated',
      description: 'Obligation details updated.',
    });
  }, [showToast]);

  const deleteCommitment = useCallback((id: string) => {
    setPersisted((prev) => ({
      ...prev,
      commitments: prev.commitments.filter((c) => c.id !== id),
    }));

    deleteBackendCommitment(id);

    showToast({
      type: 'info',
      title: 'Commitment Removed',
      description: 'Obligation deleted and reservation removed.',
    });
  }, [showToast]);

  const markCommitmentPaid = useCallback((id: string) => {
    const commitment = persisted.commitments.find((c) => c.id === id);
    if (!commitment || commitment.isPaid) return;

    const txId = `tx-paid-com-${Date.now()}`;
    const paidTx: Transaction = {
      id: txId,
      description: `Paid Bill: ${commitment.name}`,
      amount: commitment.amount,
      category: commitment.category,
      day: persisted.currentDay,
      dateStr: `Day ${persisted.currentDay} (Settled)`,
      type: 'commitment_payment',
      isRecurring: commitment.isSubscription,
      createdAt: Date.now(),
    };

    setPersisted((prev) => ({
      ...prev,
      commitments: prev.commitments.map((c) =>
        c.id === id ? { ...c, isPaid: true, paidTransactionId: txId } : c
      ),
      transactions: [paidTx, ...prev.transactions],
    }));

    payBackendCommitment(id);

    showToast({
      type: 'success',
      title: 'Bill Marked as Paid',
      description: `Recorded ₹${commitment.amount} under actual expenses. Unreserved seamlessly without double-counting.`,
    });
  }, [persisted.commitments, persisted.currentDay, showToast]);

  const unmarkCommitmentPaid = useCallback((id: string) => {
    const commitment = persisted.commitments.find((c) => c.id === id);
    if (!commitment || !commitment.isPaid) return;

    const txIdToRemove = commitment.paidTransactionId;

    setPersisted((prev) => ({
      ...prev,
      commitments: prev.commitments.map((c) =>
        c.id === id ? { ...c, isPaid: false, paidTransactionId: undefined } : c
      ),
      transactions: txIdToRemove
        ? prev.transactions.filter((t) => t.id !== txIdToRemove)
        : prev.transactions,
    }));

    unpayBackendCommitment(id);

    showToast({
      type: 'info',
      title: 'Payment Status Reverted',
      description: 'Commitment restored to upcoming unpaid status.',
    });
  }, [persisted.commitments, showToast]);

  // Day & Budget navigation
  const advanceDay = useCallback(() => {
    setPersisted((prev) => {
      const nextDay = Math.min(prev.totalDays, prev.currentDay + 1);
      return {
        ...prev,
        currentDay: nextDay,
      };
    });

    fetch('/api/state/advance-day', { method: 'POST' }).catch(() => {});

    showToast({
      type: 'info',
      title: 'Clock Advanced',
      description: `Moved forward to Day ${Math.min(persisted.totalDays, persisted.currentDay + 1)} of 30.`,
    });
  }, [persisted.totalDays, persisted.currentDay, showToast]);

  const setDay = useCallback((day: number) => {
    const clampedDay = Math.min(persisted.totalDays, Math.max(1, day));
    setPersisted((prev) => ({ ...prev, currentDay: clampedDay }));
    fetch('/api/state/day', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day: clampedDay }),
    }).catch(() => {});
  }, [persisted.totalDays]);

  const setTotalBudget = useCallback((budget: number) => {
    if (budget <= 0) return;
    setPersisted((prev) => ({ ...prev, totalBudget: budget }));
    fetch('/api/state/budget', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalBudget: budget }),
    }).catch(() => {});
    showToast({
      type: 'success',
      title: 'Budget Adjusted',
      description: `Monthly total budget set to ₹${budget}.`,
    });
  }, [showToast]);

  const resetToDemoData = useCallback(() => {
    const demo = getInitialDemoState();
    setPersisted(demo);
    setIsSimulating(false);
    setSimulationParamsState(DEFAULT_SIMULATION_PARAMS);

    resetBackendState();

    showToast({
      type: 'success',
      title: 'Demo Data Restored',
      description: 'Re-initialized ₹10,000 budget, Day 12 baseline, and clean reconciled figures.',
    });
  }, [showToast]);

  return (
    <FinanceContext.Provider
      value={{
        totalBudget: persisted.totalBudget,
        currentDay: persisted.currentDay,
        totalDays: persisted.totalDays,
        transactions: persisted.transactions,
        savingsGoals: persisted.savingsGoals,
        commitments: persisted.commitments,
        metrics,
        isBackendConnected,
        simulationParams,
        simulationProjection,
        isSimulating,
        setSimulationParams,
        loadScenarioIntoSimulation,
        resetSimulation,
        commitSimulatedExpense,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addGoal,
        updateGoal,
        deleteGoal,
        contributeToGoal,
        withdrawFromGoal,
        addCommitment,
        updateCommitment,
        deleteCommitment,
        markCommitmentPaid,
        unmarkCommitmentPaid,
        advanceDay,
        setDay,
        setTotalBudget,
        resetToDemoData,
        toasts,
        dismissToast,
        showToast,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};
