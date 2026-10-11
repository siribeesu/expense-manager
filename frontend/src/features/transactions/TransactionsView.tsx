import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/useFinance';
import { formatINR, getCategoryMeta } from '../../lib/formatters';
import type { Transaction, TransactionCategory } from '../../types/finance';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { TransactionFormModal } from './TransactionFormModal';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Receipt,
  Repeat,
  Calendar,
} from 'lucide-react';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    currentDay,
    totalDays,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useFinance();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'day_desc' | 'day_asc' | 'amount_desc' | 'amount_asc'>('day_desc');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Filtered and Sorted list
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || tx.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'day_desc') return b.day - a.day || b.createdAt - a.createdAt;
        if (sortBy === 'day_asc') return a.day - b.day || a.createdAt - b.createdAt;
        if (sortBy === 'amount_desc') return b.amount - a.amount;
        if (sortBy === 'amount_asc') return a.amount - b.amount;
        return 0;
      });
  }, [transactions, searchQuery, selectedCategory, sortBy]);

  const filteredTotal = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  }, [filteredTransactions]);

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (data: {
    description: string;
    amount: number;
    category: TransactionCategory;
    day: number;
    isRecurring?: boolean;
  }) => {
    if (editingTransaction) {
      updateTransaction(editingTransaction.id, {
        description: data.description,
        amount: data.amount,
        category: data.category,
        day: data.day,
        dateStr: `Day ${data.day}`,
        isRecurring: data.isRecurring,
      });
    } else {
      addTransaction({
        description: data.description,
        amount: data.amount,
        category: data.category,
        day: data.day,
        dateStr: `Day ${data.day}`,
        type: 'expense',
        isRecurring: data.isRecurring,
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Transaction Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track, filter, and audit every single rupee spent in your 30-day budget period.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setEditingTransaction(null);
            setIsModalOpen(true);
          }}
          className="font-bold shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Record Expense
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="sm:col-span-5">
            <Input
              placeholder="Search by description or merchant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              prefixElement={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-4">
            <select
              aria-label="Filter transactions by category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#0E1526] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-[#C8FF55] focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="food_groceries">Food & Groceries</option>
              <option value="transport">Travel & Metro</option>
              <option value="education">Study & Books</option>
              <option value="entertainment">Outings & Entertainment</option>
              <option value="shopping">Shopping & Gear</option>
              <option value="subscriptions">OTT & Subscriptions</option>
              <option value="health_wellness">Health & Pharmacy</option>
              <option value="bills_utilities">Bills & WiFi</option>
              <option value="other">Miscellaneous</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="sm:col-span-3">
            <select
              aria-label="Sort transactions"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-[#0E1526] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-[#C8FF55] focus:outline-none"
            >
              <option value="day_desc">Day (Newest First)</option>
              <option value="day_asc">Day (Oldest First)</option>
              <option value="amount_desc">Amount (Highest First)</option>
              <option value="amount_asc">Amount (Lowest First)</option>
            </select>
          </div>
        </div>

        {/* Filter stats count */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
          <span>
            Showing <strong className="text-white">{filteredTransactions.length}</strong> of{' '}
            {transactions.length} records
          </span>
          <span>
            Filtered Total:{' '}
            <strong className="text-[#C8FF55] font-mono">{formatINR(filteredTotal)}</strong>
          </span>
        </div>
      </Card>

      {/* Transaction List Cards */}
      {filteredTransactions.length === 0 ? (
        <Card className="py-12 text-center space-y-3">
          <Receipt className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">
            {transactions.length === 0 ? 'No expenses recorded yet' : 'No matching transactions'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {transactions.length === 0
              ? 'Your full ₹10,000 budget is ready. Record your first spend to begin tracking your flightpath.'
              : 'Try adjusting your search query or category filters, or record a new expense.'}
          </p>
          {transactions.length === 0 && (
            <div className="pt-1">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingTransaction(null);
                  setIsModalOpen(true);
                }}
                className="font-bold text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Record First Expense
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filteredTransactions.map((tx) => {
            const meta = getCategoryMeta(tx.category);
            const isToday = tx.day === currentDay;

            return (
              <Card
                key={tx.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all"
              >
                {/* Left: Icon, Description & Meta */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                  >
                    <span className="text-xs font-bold">{meta.label.slice(0, 2)}</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">
                        {tx.description}
                      </h4>
                      {tx.isRecurring && (
                        <span
                          title="Recurring expense"
                          className="text-[10px] text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-1.5 py-0.5 rounded flex items-center gap-1"
                        >
                          <Repeat className="w-2.5 h-2.5" /> Recurring
                        </span>
                      )}
                      {isToday && (
                        <Badge variant="lime" size="sm">Today</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <span
                        className="font-medium"
                        style={{ color: meta.color }}
                      >
                        {meta.label}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" /> Day {tx.day} of {totalDays}
                      </span>
                      {tx.type === 'commitment_payment' && (
                        <>
                          <span>·</span>
                          <span className="text-amber-400 text-[11px]">Bill Payment</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount and Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <div className="text-left sm:text-right font-mono">
                    <span className="text-base font-extrabold text-white block">
                      -{formatINR(tx.amount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(tx)}
                      aria-label={`Edit ${tx.description}`}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit transaction"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(tx.id)}
                      aria-label={`Delete ${tx.description}`}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                      title="Delete transaction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Transaction Form Modal */}
      <TransactionFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleModalSubmit}
        initialData={editingTransaction}
        currentDay={currentDay}
        totalDays={totalDays}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) {
            deleteTransaction(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        title="Delete Transaction?"
        message="This will permanently remove this record from your ledger. Your available cash and safe daily allowance will update automatically."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
