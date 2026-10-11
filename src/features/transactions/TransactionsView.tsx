import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/useFinance';
import { useDebounce } from '../../hooks/useDebounce';
import { formatINR, getCategoryMeta } from '../../lib/formatters';
import type { Transaction, TransactionCategory } from '../../types/finance';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { TransactionFormModal } from './TransactionFormModal';
import { exportTransactionsToCsv } from '../../lib/exportCsv';
import { fireConfetti } from '../../lib/confetti';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Receipt,
  Repeat,
  Calendar,
  Download,
  Filter,
} from 'lucide-react';

const CATEGORY_CHIPS: { id: string; label: string }[] = [
  { id: 'all', label: 'All Items' },
  { id: 'food_groceries', label: '🍔 Food' },
  { id: 'transport', label: '🚇 Travel' },
  { id: 'shopping', label: '🛍️ Shopping' },
  { id: 'subscriptions', label: '📱 OTT/Apps' },
  { id: 'bills_utilities', label: '⚡ Bills' },
  { id: 'entertainment', label: '🎟️ Outings' },
  { id: 'education', label: '📚 Study' },
  { id: 'health_wellness', label: '💊 Health' },
];

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    currentDay,
    totalDays,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    showToast,
  } = useFinance();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 150);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'day_desc' | 'day_asc' | 'amount_desc' | 'amount_asc'>('day_desc');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Filtered and Sorted list
  const filteredTransactions = useMemo(() => {
    const query = debouncedSearchQuery.toLowerCase();
    return transactions
      .filter((tx) => {
        const matchesSearch = tx.description.toLowerCase().includes(query);
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
  }, [transactions, debouncedSearchQuery, selectedCategory, sortBy]);

  const filteredTotal = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  }, [filteredTransactions]);

  const largestTransaction = useMemo(() => {
    if (filteredTransactions.length === 0) return 0;
    return Math.max(...filteredTransactions.map((t) => t.amount));
  }, [filteredTransactions]);

  const avgTransaction = useMemo(() => {
    if (filteredTransactions.length === 0) return 0;
    return Math.round(filteredTotal / filteredTransactions.length);
  }, [filteredTransactions, filteredTotal]);

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
      fireConfetti();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Transaction Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit, filter, and analyze every single rupee spent in your ₹10,000 runway cycle.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={() =>
              exportTransactionsToCsv(filteredTransactions, (res) => {
                showToast({
                  title: res.success ? 'Export Complete' : 'Export Notice',
                  description: res.message,
                  type: res.success ? 'success' : 'warning',
                });
              })
            }
            disabled={filteredTransactions.length === 0}
            className="text-xs border-slate-700"
            title="Download CSV report of current records"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setEditingTransaction(null);
              setIsModalOpen(true);
            }}
            className="font-bold shrink-0 text-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Record Expense
          </Button>
        </div>
      </div>

      {/* Ledger Analytics Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
        <Card className="p-3 sm:p-3.5 flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Filtered Outlay
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-white font-mono mt-1 truncate">
            {formatINR(filteredTotal)}
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Across current selection</span>
        </Card>

        <Card className="p-3 sm:p-3.5 flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Records
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-[#C8FF55] font-mono mt-1 truncate">
            {filteredTransactions.length}
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">of {transactions.length} total logged</span>
        </Card>

        <Card className="p-3 sm:p-3.5 flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Average Spend
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-cyan-400 font-mono mt-1 truncate">
            {formatINR(avgTransaction)}
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Per recorded transaction</span>
        </Card>

        <Card className="p-3 sm:p-3.5 flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Largest Outlay
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-amber-400 font-mono mt-1 truncate">
            {formatINR(largestTransaction)}
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Peak single purchase</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="sm:col-span-8">
            <Input
              placeholder="Search by description or merchant (e.g. Swiggy, Uber, Noise)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              prefixElement={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Sort Dropdown */}
          <div className="sm:col-span-4">
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

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
          {CATEGORY_CHIPS.map((chip) => {
            const isSelected = selectedCategory === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setSelectedCategory(chip.id)}
                className={`text-xs px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#C8FF55] text-[#0B1020] font-bold border-[#C8FF55] shadow-sm'
                    : 'bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 border-slate-700'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
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
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
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
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Edit transaction"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(tx.id)}
                      aria-label={`Delete ${tx.description}`}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
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
