import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  ReceiptText,
  PiggyBank,
  CalendarClock,
  LineChart,
  Plus,
  FastForward,
  RotateCcw,
  Sun,
  Moon,
  Download,
  Search,
  ArrowRight,
  Command,
} from 'lucide-react';
import type { ActiveTab } from '../layout/Sidebar';
import { useFinance } from '../../context/useFinance';
import { useTheme } from '../../context/useTheme';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: ActiveTab) => void;
  onOpenAddExpense: () => void;
  onExportCsv?: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Navigation' | 'Actions' | 'Simulation' | 'Preferences';
  icon: React.ElementType;
  shortcut?: string;
  perform: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenAddExpense,
  onExportCsv,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { advanceDay, resetToDemoData, loadScenarioIntoSimulation } = useFinance();
  const { theme, toggleTheme } = useTheme();

  const commands: CommandItem[] = useMemo(
    () => [
      {
        id: 'nav-overview',
        title: 'Financial Cockpit',
        subtitle: 'View daily allowance, burn rate & gauges',
        category: 'Navigation',
        icon: LayoutDashboard,
        shortcut: '1',
        perform: () => onNavigate('overview'),
      },
      {
        id: 'nav-simulator',
        title: 'What-If Money Simulator',
        subtitle: 'Sandboxed 30-day decision engine',
        category: 'Navigation',
        icon: Sparkles,
        shortcut: '2',
        perform: () => onNavigate('simulator'),
      },
      {
        id: 'nav-transactions',
        title: 'Transaction Ledger',
        subtitle: 'Review, filter and audit all expenses',
        category: 'Navigation',
        icon: ReceiptText,
        shortcut: '3',
        perform: () => onNavigate('transactions'),
      },
      {
        id: 'nav-goals',
        title: 'Savings Goals & Vault',
        subtitle: 'Manage protected emergency & personal goals',
        category: 'Navigation',
        icon: PiggyBank,
        shortcut: '4',
        perform: () => onNavigate('goals'),
      },
      {
        id: 'nav-commitments',
        title: 'Bills & Subscriptions',
        subtitle: 'Schedule upcoming fixed non-negotiables',
        category: 'Navigation',
        icon: CalendarClock,
        shortcut: '5',
        perform: () => onNavigate('commitments'),
      },
      {
        id: 'nav-insights',
        title: 'Health & Insights',
        subtitle: 'Deterministic 0-100 resiliency score & tips',
        category: 'Navigation',
        icon: LineChart,
        shortcut: '6',
        perform: () => onNavigate('insights'),
      },
      {
        id: 'action-add-expense',
        title: 'Record New Expense',
        subtitle: 'Log an outlay with instant runway recalculation',
        category: 'Actions',
        icon: Plus,
        shortcut: 'N',
        perform: onOpenAddExpense,
      },
      {
        id: 'sim-swiggy',
        title: 'Simulate Swiggy Feast (₹450)',
        subtitle: 'Test dining outlay in What-If simulator',
        category: 'Simulation',
        icon: Sparkles,
        perform: () => {
          loadScenarioIntoSimulation({
            description: 'Swiggy Dinner Feast',
            amount: 450,
            category: 'food_groceries',
            type: 'planned',
          });
          onNavigate('simulator');
        },
      },
      {
        id: 'sim-earbuds',
        title: 'Simulate Noise ANC Earbuds (₹1,500)',
        subtitle: 'Test tech gear purchase against runway',
        category: 'Simulation',
        icon: Sparkles,
        perform: () => {
          loadScenarioIntoSimulation({
            description: 'Noise ANC Wireless Earbuds',
            amount: 1500,
            category: 'shopping',
            type: 'planned',
          });
          onNavigate('simulator');
        },
      },
      {
        id: 'action-advance-day',
        title: 'Advance Budget Cycle (+1 Day)',
        subtitle: 'Simulate calendar day progression',
        category: 'Actions',
        icon: FastForward,
        shortcut: 'D',
        perform: advanceDay,
      },
      {
        id: 'action-export-csv',
        title: 'Export Ledger to CSV',
        subtitle: 'Download complete transactions spreadsheet',
        category: 'Actions',
        icon: Download,
        perform: () => {
          if (onExportCsv) onExportCsv();
        },
      },
      {
        id: 'pref-theme',
        title: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        subtitle: `Currently using ${theme} theme appearance`,
        category: 'Preferences',
        icon: theme === 'dark' ? Sun : Moon,
        shortcut: 'T',
        perform: toggleTheme,
      },
      {
        id: 'action-reset-demo',
        title: 'Reset to Demo Baseline',
        subtitle: 'Restore Day 12 reconciled demo data',
        category: 'Preferences',
        icon: RotateCcw,
        perform: resetToDemoData,
      },
    ],
    [
      onNavigate,
      onOpenAddExpense,
      loadScenarioIntoSimulation,
      advanceDay,
      onExportCsv,
      theme,
      toggleTheme,
      resetToDemoData,
    ]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(lower) ||
        c.subtitle.toLowerCase().includes(lower) ||
        c.category.toLowerCase().includes(lower)
    );
  }, [commands, query]);

  const handleClose = useCallback(() => {
    setQuery('');
    setSelectedIndex(0);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // Keyboard navigation inside palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].perform();
          handleClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, handleClose]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector('[data-selected="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-24 px-3 sm:px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command Menu"
    >
      <div
        className="w-full max-w-xl bg-[#131B2F] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search commands, navigate views, run simulations..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
            aria-autocomplete="list"
          />
          <div className="flex items-center gap-1.5 shrink-0 pl-2">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700">
              ESC
            </kbd>
          </div>
        </div>

        {/* Command list */}
        <div ref={listRef} className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              <Command className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              No commands matching "{query}"
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  data-selected={isSelected}
                  onClick={() => {
                    item.perform();
                    handleClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#C8FF55]/15 text-[#C8FF55]'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-[#C8FF55] text-[#0B1020]'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isSelected ? 'text-[#C8FF55]' : 'text-white'
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-3">
                    {item.shortcut && (
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {item.shortcut}
                      </kbd>
                    )}
                    {isSelected && (
                      <ArrowRight className="w-3.5 h-3.5 text-[#C8FF55]" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-3 sm:px-4 py-2 bg-[#0E1526] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2 sm:gap-3">
            <span>
              <kbd className="px-1 py-0.5 rounded bg-slate-800 font-mono text-[10px]">↑↓</kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded bg-slate-800 font-mono text-[10px]">↵</kbd>{' '}
              Select
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-500 hidden sm:inline">Thriftly ⌘K Quick Navigator</span>
        </div>
      </div>
    </div>
  );
};
