import React, { useState } from 'react';
import { useFinance } from '../../context/useFinance';
import { formatINR, getCategoryMeta } from '../../lib/formatters';
import type { Commitment } from '../../types/finance';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { CommitmentFormModal } from './CommitmentFormModal';
import {
  Plus,
  CheckCircle2,
  Clock,
  RotateCcw,
  Edit2,
  Trash2,
  Tv,
  Zap,
} from 'lucide-react';

export const CommitmentsView: React.FC = () => {
  const {
    commitments,
    currentDay,
    totalDays,
    metrics,
    addCommitment,
    updateCommitment,
    deleteCommitment,
    markCommitmentPaid,
    unmarkCommitmentPaid,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Subscriptions vs general commitments
  const unpaidCommitments = commitments.filter((c) => !c.isPaid);
  const paidCommitments = commitments.filter((c) => c.isPaid);

  const totalOutstanding = metrics.reservedCommitments;
  const subscriptions = commitments.filter((c) => c.isSubscription);
  const monthlySubscriptionTotal = subscriptions.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Fixed Commitments & Subscriptions
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Keep track of non-negotiable bills, OTT apps, and subscriptions before they hit your bank balance.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setEditingCommitment(null);
            setIsModalOpen(true);
          }}
          className="font-bold shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Bill / Subscription
        </Button>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Outstanding Unpaid Bills
          </span>
          <span className="text-2xl font-extrabold text-amber-400 font-mono mt-1 block">
            {formatINR(totalOutstanding)}
          </span>
          <span className="text-xs text-slate-400">
            {unpaidCommitments.length} pending obligations locked in forecast
          </span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Monthly Subscription Burn
          </span>
          <span className="text-2xl font-extrabold text-indigo-400 font-mono mt-1 block">
            {formatINR(monthlySubscriptionTotal)}
          </span>
          <span className="text-xs text-slate-400">
            {subscriptions.length} active digital services
          </span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Settled This Month
          </span>
          <span className="text-2xl font-extrabold text-emerald-400 font-mono mt-1 block">
            {paidCommitments.length} Paid
          </span>
          <span className="text-xs text-slate-400">
            Converted to actual expenses without double-counting
          </span>
        </Card>
      </div>

      {/* Section 1: Upcoming Unpaid Commitments */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Upcoming & Pending Bills ({unpaidCommitments.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Due between Day {currentDay} and Day {totalDays}
          </span>
        </div>

        {unpaidCommitments.length === 0 ? (
          <Card className="p-6 text-center text-slate-400 text-xs">
            No pending commitments left for this 30-day budget period!
          </Card>
        ) : (
          <div className="space-y-2.5">
            {unpaidCommitments.map((com) => {
              const meta = getCategoryMeta(com.category);
              const daysAway = com.dueDay - currentDay;

              return (
                <Card
                  key={com.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-amber-500/20 hover:border-amber-500/40 transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                    >
                      <Zap className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white truncate">
                          {com.name}
                        </h4>
                        {com.isSubscription && (
                          <Badge variant="slate" size="sm">
                            <Tv className="w-3 h-3 mr-1" /> Recurring
                          </Badge>
                        )}
                        <Badge variant="amber" size="sm">Unpaid</Badge>
                      </div>

                      <p className="text-xs text-slate-400 mt-1">
                        Due on <strong className="text-slate-200">Day {com.dueDay}</strong> (
                        {daysAway > 0
                          ? `in ${daysAway} days`
                          : daysAway === 0
                          ? 'Due today!'
                          : `${Math.abs(daysAway)} days overdue`}
                        ) {com.serviceProvider && `· ${com.serviceProvider}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="text-left sm:text-right font-mono">
                      <span className="text-base font-extrabold text-amber-400 block">
                        {formatINR(com.amount)}
                      </span>
                      <span className="text-[10px] text-slate-400">Reserved in runway</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => markCommitmentPaid(com.id)}
                        className="text-xs font-bold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Paid
                      </Button>
                      <button
                        onClick={() => {
                          setEditingCommitment(com);
                          setIsModalOpen(true);
                        }}
                        aria-label={`Edit ${com.name}`}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                        title="Edit commitment"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(com.id)}
                        aria-label={`Delete ${com.name}`}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg"
                        title="Delete commitment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Paid / Settled Commitments */}
      {paidCommitments.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Settled Commitments This Month ({paidCommitments.length})
            </h3>
          </div>

          <div className="space-y-2">
            {paidCommitments.map((com) => (
              <Card
                key={com.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0B1020]/60 border-slate-800/80"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-300">
                        {com.name}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Paid and recorded into actual expense transactions
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {formatINR(com.amount)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unmarkCommitmentPaid(com.id)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" /> Revert
                    </Button>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Add / Edit Commitment Modal */}
      <CommitmentFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCommitment(null);
        }}
        onSubmit={(data) => {
          if (editingCommitment) {
            updateCommitment(editingCommitment.id, data);
          } else {
            addCommitment({
              ...data,
              isPaid: false,
            });
          }
        }}
        initialData={editingCommitment}
        totalDays={totalDays}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) {
            deleteCommitment(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        title="Remove Commitment?"
        message="This will remove this obligation from your schedule. It will no longer be reserved in your runway."
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
};
