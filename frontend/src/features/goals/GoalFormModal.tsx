import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { SavingsGoal } from '../../types/finance';

export interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    targetAmount: number;
    targetDay: number;
    categoryIcon: string;
    color: string;
    notes?: string;
  }) => void;
  initialData?: SavingsGoal | null;
  totalDays: number;
}

export const GoalFormModal: React.FC<GoalFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  totalDays,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Savings Goal' : 'Create New Savings Goal'}
      description="Lock away funds for your emergency cushion, tech purchase, or holiday travel."
    >
      {isOpen && (
        <GoalFormContent
          key={initialData?.id || 'new-goal'}
          onClose={onClose}
          onSubmit={onSubmit}
          initialData={initialData}
          totalDays={totalDays}
        />
      )}
    </Modal>
  );
};

interface FormContentProps {
  onClose: () => void;
  onSubmit: GoalFormModalProps['onSubmit'];
  initialData?: SavingsGoal | null;
  totalDays: number;
}

const GoalFormContent: React.FC<FormContentProps> = ({
  onClose,
  onSubmit,
  initialData,
  totalDays,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [targetAmount, setTargetAmount] = useState(initialData ? String(initialData.targetAmount) : '2000');
  const [targetDay, setTargetDay] = useState(initialData ? initialData.targetDay : totalDays);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [errors, setErrors] = useState<{ name?: string; targetAmount?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; targetAmount?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Goal name is required';
    }

    const numTarget = Number(targetAmount);
    if (!targetAmount || isNaN(numTarget) || numTarget <= 0) {
      newErrors.targetAmount = 'Target amount must be greater than ₹0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      name: name.trim(),
      targetAmount: numTarget,
      targetDay,
      categoryIcon: 'ShieldCheck',
      color: '#10B981',
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Goal Name"
        placeholder="e.g. Rainy Day Fund, Concert Ticket, Tech Upgrade"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        autoFocus
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Target Amount (₹)"
          type="number"
          min="100"
          step="100"
          placeholder="e.g. 3000"
          prefixElement="₹"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          error={errors.targetAmount}
        />

        <Input
          label="Target Day"
          type="number"
          min="1"
          max={totalDays}
          value={targetDay}
          onChange={(e) => setTargetDay(Number(e.target.value))}
        />
      </div>

      <Input
        label="Purpose / Notes (Optional)"
        placeholder="Why are you saving for this?"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm" className="font-bold">
          {initialData ? 'Save Goal' : 'Create Goal'}
        </Button>
      </div>
    </form>
  );
};
