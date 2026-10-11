import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import type { Transaction, TransactionCategory } from '../../types/finance';

export interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    description: string;
    amount: number;
    category: TransactionCategory;
    day: number;
    isRecurring?: boolean;
  }) => void;
  initialData?: Transaction | null;
  currentDay: number;
  totalDays: number;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  currentDay,
  totalDays,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Transaction' : 'Record New Expense'}
      description="Add an actual debit to your monthly ledger and update your safe daily runway."
    >
      {isOpen && (
        <TransactionFormContent
          key={initialData?.id || 'new-tx'}
          onClose={onClose}
          onSubmit={onSubmit}
          initialData={initialData}
          currentDay={currentDay}
          totalDays={totalDays}
        />
      )}
    </Modal>
  );
};

interface FormContentProps {
  onClose: () => void;
  onSubmit: TransactionFormModalProps['onSubmit'];
  initialData?: Transaction | null;
  currentDay: number;
  totalDays: number;
}

const TransactionFormContent: React.FC<FormContentProps> = ({
  onClose,
  onSubmit,
  initialData,
  currentDay,
  totalDays,
}) => {
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData ? String(initialData.amount) : '');
  const [category, setCategory] = useState<TransactionCategory>(initialData?.category || 'food_groceries');
  const [day, setDay] = useState(initialData ? initialData.day : currentDay);
  const [isRecurring, setIsRecurring] = useState(!!initialData?.isRecurring);
  const [errors, setErrors] = useState<{ description?: string; amount?: string; day?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { description?: string; amount?: string; day?: string } = {};

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than ₹0';
    }

    if (day < 1 || day > totalDays) {
      newErrors.day = `Day must be between 1 and ${totalDays}`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      description: description.trim(),
      amount: numAmount,
      category,
      day,
      isRecurring,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Description / Merchant"
        placeholder="e.g. Swiggy Lunch, Metro Recharge, Stationery"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={errors.description}
        autoFocus
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Amount (₹)"
          type="number"
          min="1"
          step="1"
          placeholder="e.g. 250"
          prefixElement="₹"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
        />

        <Input
          label="Cycle Day (1..30)"
          type="number"
          min="1"
          max={totalDays}
          value={day}
          onChange={(e) => setDay(Number(e.target.value))}
          error={errors.day}
        />
      </div>

      <Select
        label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value as TransactionCategory)}
      >
        <option value="food_groceries">Food & Groceries</option>
        <option value="transport">Travel & Metro</option>
        <option value="education">Study & Courses</option>
        <option value="entertainment">Outings & Entertainment</option>
        <option value="shopping">Shopping & Gear</option>
        <option value="subscriptions">OTT & Subscriptions</option>
        <option value="health_wellness">Health & Pharmacy</option>
        <option value="bills_utilities">Bills & WiFi</option>
        <option value="other">Miscellaneous</option>
      </Select>

      <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer pt-1">
        <input
          type="checkbox"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
          className="rounded border-slate-700 bg-slate-900 text-[#C8FF55] focus:ring-[#C8FF55] w-4 h-4"
        />
        <span>Mark as repeating / recurring expense</span>
      </label>

      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm" className="font-bold">
          {initialData ? 'Save Changes' : 'Record Transaction'}
        </Button>
      </div>
    </form>
  );
};
