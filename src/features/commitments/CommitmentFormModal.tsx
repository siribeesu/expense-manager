import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import type { Commitment, TransactionCategory, CommitmentFrequency } from '../../types/finance';

export interface CommitmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    amount: number;
    category: TransactionCategory;
    dueDay: number;
    frequency: CommitmentFrequency;
    isSubscription: boolean;
    serviceProvider?: string;
  }) => void;
  initialData?: Commitment | null;
  totalDays: number;
}

export const CommitmentFormModal: React.FC<CommitmentFormModalProps> = ({
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
      title={initialData ? 'Edit Commitment' : 'Add Bill / Subscription'}
      description="Scheduled payments are reserved in your financial runway so you never accidentally overspend."
    >
      {isOpen && (
        <CommitmentFormContent
          key={initialData?.id || 'new-com'}
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
  onSubmit: CommitmentFormModalProps['onSubmit'];
  initialData?: Commitment | null;
  totalDays: number;
}

const CommitmentFormContent: React.FC<FormContentProps> = ({
  onClose,
  onSubmit,
  initialData,
  totalDays,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [amount, setAmount] = useState(initialData ? String(initialData.amount) : '');
  const [category, setCategory] = useState<TransactionCategory>(initialData?.category || 'bills_utilities');
  const [dueDay, setDueDay] = useState(initialData ? initialData.dueDay : 15);
  const [isSubscription, setIsSubscription] = useState(!!initialData?.isSubscription);
  const [serviceProvider, setServiceProvider] = useState(initialData?.serviceProvider || '');
  const [errors, setErrors] = useState<{ name?: string; amount?: string; dueDay?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; amount?: string; dueDay?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Obligation name is required';
    }

    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Amount must be greater than ₹0';
    }

    if (dueDay < 1 || dueDay > totalDays) {
      newErrors.dueDay = `Due day must be between 1 and ${totalDays}`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      name: name.trim(),
      amount: numAmount,
      category,
      dueDay,
      frequency: 'monthly',
      isSubscription,
      serviceProvider: serviceProvider.trim() || undefined,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Bill / Service Name"
        placeholder="e.g. WiFi Bill, Netflix Duo, College Tuition Fee"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        autoFocus
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Amount (₹)"
          type="number"
          min="1"
          step="10"
          placeholder="e.g. 450"
          prefixElement="₹"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
        />

        <Input
          label="Due Day of Month"
          type="number"
          min="1"
          max={totalDays}
          value={dueDay}
          onChange={(e) => setDueDay(Number(e.target.value))}
          error={errors.dueDay}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value as TransactionCategory)}
        >
          <option value="bills_utilities">Bills & WiFi</option>
          <option value="subscriptions">OTT & Subscriptions</option>
          <option value="health_wellness">Health & Fitness Pass</option>
          <option value="education">Education & Course</option>
          <option value="transport">Transit Pass</option>
          <option value="other">Other Obligation</option>
        </Select>

        <Input
          label="Provider (Optional)"
          placeholder="e.g. Airtel, Spotify, Cult.fit"
          value={serviceProvider}
          onChange={(e) => setServiceProvider(e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer pt-1">
        <input
          type="checkbox"
          checked={isSubscription}
          onChange={(e) => setIsSubscription(e.target.checked)}
          className="rounded border-slate-700 bg-slate-900 text-[#C8FF55] focus:ring-[#C8FF55] w-4 h-4"
        />
        <span>This is an auto-renewing digital subscription</span>
      </label>

      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm" className="font-bold">
          {initialData ? 'Save Commitment' : 'Add Commitment'}
        </Button>
      </div>
    </form>
  );
};
