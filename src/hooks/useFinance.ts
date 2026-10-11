import { useContext } from 'react';
import { FinanceContext } from '../context/financeContextDef';

/**
 * Custom hook providing access to the single-source-of-truth financial state,
 * deterministic accounting metrics, and sandboxed What-If simulation engine.
 */
export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}

export type { ToastMessage } from '../context/financeContextDef';
