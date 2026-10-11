import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { SavingsGoal } from '../../types/finance';
import { formatINR } from '../../lib/formatters';

export interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  mode: 'deposit' | 'withdraw';
  availableCash: number;
  onDeposit: (goalId: string, amount: number) => boolean;
  onWithdraw: (goalId: string, amount: number) => boolean;
}

export const ContributeModal: React.FC<ContributeModalProps> = ({
  isOpen,
  onClose,
  goal,
  mode,
  availableCash,
  onDeposit,
  onWithdraw,
}) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!goal) return null;

  const isDeposit = mode === 'deposit';
  const maxAvailable = isDeposit ? availableCash : goal.currentAmount;

  const handleQuickFill = (pct: number) => {
    const val = Math.floor(maxAvailable * pct);
    setAmount(String(val));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than ₹0');
      return;
    }

    if (numAmount > maxAvailable) {
      setError(
        isDeposit
          ? `You only have ₹${maxAvailable} available cash to deposit.`
          : `You only have ₹${maxAvailable} saved in this goal to withdraw.`
      );
      return;
    }

    const success = isDeposit
      ? onDeposit(goal.id, numAmount)
      : onWithdraw(goal.id, numAmount);

    if (success) {
      setAmount('');
      setError(null);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isDeposit ? `Deposit into ${goal.name}` : `Withdraw from ${goal.name}`}
      description={
        isDeposit
          ? 'Transfer liquid cash into this protected savings reserve.'
          : 'Release saved funds back into your liquid cash pool for urgent spending.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-xl bg-[#0E1526] border border-slate-800 text-xs flex justify-between items-center">
          <span className="text-slate-400">
            {isDeposit ? 'Current Available Cash:' : 'Currently Saved in Goal:'}
          </span>
          <span className="font-mono font-bold text-white text-sm">
            {formatINR(maxAvailable)}
          </span>
        </div>

        <Input
          label="Transfer Amount (₹)"
          type="number"
          min="1"
          max={maxAvailable}
          step="50"
          placeholder="e.g. 500"
          prefixElement="₹"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setError(null);
          }}
          error={error || undefined}
          autoFocus
        />

        {/* Quick Percent Pills */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[11px] text-slate-400">Quick set:</span>
          {[0.25, 0.5, 1.0].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => handleQuickFill(pct)}
              className="text-[11px] font-mono px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              {pct === 1.0 ? 'Max' : `${pct * 100}%`}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={isDeposit ? 'primary' : 'secondary'}
            size="sm"
            className="font-bold"
          >
            {isDeposit ? 'Confirm Deposit' : 'Confirm Withdrawal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
