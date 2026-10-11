import React, { useState } from 'react';
import { useFinance } from '../../context/useFinance';
import { formatINR, formatPercent } from '../../lib/formatters';
import type { SavingsGoal } from '../../types/finance';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { GoalFormModal } from './GoalFormModal';
import { ContributeModal } from './ContributeModal';
import { fireConfetti } from '../../lib/confetti';
import {
  PiggyBank,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Edit2,
  Trash2,
} from 'lucide-react';

export const GoalsView: React.FC = () => {
  const {
    savingsGoals,
    metrics,
    addGoal,
    updateGoal,
    deleteGoal,
    contributeToGoal,
    withdrawFromGoal,
  } = useFinance();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Transfer modal
  const [transferGoal, setTransferGoal] = useState<SavingsGoal | null>(null);
  const [transferMode, setTransferMode] = useState<'deposit' | 'withdraw'>('deposit');

  const totalSaved = metrics.reservedSavings;
  const totalTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const handleOpenTransfer = (goal: SavingsGoal, mode: 'deposit' | 'withdraw') => {
    setTransferGoal(goal);
    setTransferMode(mode);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Create Goal Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Savings Goals & Vault
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Safeguard your future. Funds deposited into goals are reserved and protected from your daily allowance.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setEditingGoal(null);
            setIsFormOpen(true);
          }}
          className="font-bold shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Create New Goal
        </Button>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Total Accumulated Savings
          </span>
          <span className="text-2xl font-extrabold text-emerald-400 font-mono mt-1 block">
            {formatINR(totalSaved)}
          </span>
          <span className="text-xs text-slate-400">Locked safely in piggybanks</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Aggregate Target
          </span>
          <span className="text-2xl font-extrabold text-white font-mono mt-1 block">
            {formatINR(totalTarget)}
          </span>
          <span className="text-xs text-slate-400">End-of-month target total</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Overall Completion
          </span>
          <span className="text-2xl font-extrabold text-[#C8FF55] font-mono mt-1 block">
            {formatPercent(overallProgress, 0)}
          </span>
          <span className="text-xs text-slate-400">
            {formatINR(Math.max(0, totalTarget - totalSaved))} remaining to target
          </span>
        </Card>
      </div>

      {/* Goals List */}
      {savingsGoals.length === 0 ? (
        <Card className="py-12 text-center space-y-3">
          <PiggyBank className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Savings Goals Defined</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Build resilience against unexpected shocks by starting an emergency fund goal.
          </p>
          <div className="pt-1">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingGoal(null);
                setIsFormOpen(true);
              }}
              className="font-bold text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Create First Goal
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {savingsGoals.map((goal) => {
            const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const remainingToSave = Math.max(0, goal.targetAmount - goal.currentAmount);
            const dailyNeeded = Math.ceil(remainingToSave / metrics.remainingDays);
            const isCompleted = goal.currentAmount >= goal.targetAmount;

            return (
              <Card
                key={goal.id}
                className="p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all border border-slate-800"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white leading-tight">
                          {goal.name}
                        </h4>
                        <span className="text-xs text-slate-400">
                          Target by Day {goal.targetDay} ({metrics.remainingDays} days left)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingGoal(goal);
                          setIsFormOpen(true);
                        }}
                        aria-label={`Edit ${goal.name}`}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                        title="Edit goal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(goal.id)}
                        aria-label={`Delete ${goal.name}`}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg"
                        title="Delete goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {goal.notes && (
                    <p className="text-xs text-slate-400 mt-2.5 line-clamp-1 italic">
                      "{goal.notes}"
                    </p>
                  )}

                  {/* Amounts & Progress Bar */}
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-baseline font-mono">
                      <div>
                        <span className="text-xs text-slate-400 uppercase font-sans block">
                          Current Saved
                        </span>
                        <span className="text-xl font-bold text-emerald-400">
                          {formatINR(goal.currentAmount)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 uppercase font-sans block">
                          Target Pool
                        </span>
                        <span className="text-sm font-semibold text-white">
                          {formatINR(goal.targetAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-[#C8FF55] rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-slate-400 font-mono">
                      <span>{progress}% achieved</span>
                      <span>{formatINR(remainingToSave)} still needed</span>
                    </div>
                  </div>

                  {/* Recommended daily contribution */}
                  <div className="mt-3 p-2.5 rounded-xl bg-[#0E1526] border border-slate-800/90 text-xs flex items-center justify-between">
                    <span className="text-slate-400">PaisaPilot Flight Guidance:</span>
                    {isCompleted ? (
                      <span className="text-[#C8FF55] font-bold">Goal 100% Met!</span>
                    ) : (
                      <span className="font-mono text-white font-semibold">
                        Deposit{' '}
                        <strong className="text-[#C8FF55]">{formatINR(dailyNeeded)}/day</strong> to
                        finish on time
                      </span>
                    )}
                  </div>
                </div>

                {/* Transfer Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenTransfer(goal, 'deposit')}
                    className="flex-1 font-bold text-xs"
                    disabled={metrics.availableCash <= 0}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5 mr-1" /> Deposit Cash
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenTransfer(goal, 'withdraw')}
                    className="flex-1 text-xs border-slate-700"
                    disabled={goal.currentAmount <= 0}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> Withdraw to Cash
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Goal Modal */}
      <GoalFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingGoal(null);
        }}
        onSubmit={(data) => {
          if (editingGoal) {
            updateGoal(editingGoal.id, data);
          } else {
            addGoal({
              ...data,
              currentAmount: 0,
            });
          }
        }}
        initialData={editingGoal}
        totalDays={metrics.totalDays}
      />

      {/* Deposit / Withdraw Modal */}
      <ContributeModal
        isOpen={transferGoal !== null}
        onClose={() => setTransferGoal(null)}
        goal={transferGoal}
        mode={transferMode}
        availableCash={metrics.availableCash}
        onDeposit={(goalId, amount) => {
          const ok = contributeToGoal(goalId, amount);
          if (ok) fireConfetti();
          return ok;
        }}
        onWithdraw={withdrawFromGoal}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) {
            deleteGoal(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        title="Remove Savings Goal?"
        message="This will remove the goal. Any saved amount in this goal will be released back into your available cash pool."
        confirmText="Remove Goal"
        variant="danger"
      />
    </div>
  );
};
