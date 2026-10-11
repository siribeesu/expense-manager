import React from 'react';
import { useFinance } from '../../context/useFinance';
import { formatINR } from '../../lib/formatters';
import {
  LayoutDashboard,
  Sparkles,
  ReceiptText,
  PiggyBank,
  CalendarClock,
  LineChart,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type ActiveTab = 'overview' | 'simulator' | 'transactions' | 'goals' | 'commitments' | 'insights';

export interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isOpen, onClose }) => {
  const { metrics, isSimulating } = useFinance();

  const navItems: { id: ActiveTab; label: string; icon: React.ElementType; badge?: string; isHighlight?: boolean }[] = [
    {
      id: 'overview',
      label: 'Financial Cockpit',
      icon: LayoutDashboard,
    },
    {
      id: 'simulator',
      label: 'What-If Simulator',
      icon: Sparkles,
      badge: isSimulating ? 'Active' : 'Core',
      isHighlight: true,
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: ReceiptText,
    },
    {
      id: 'goals',
      label: 'Savings Goals',
      icon: PiggyBank,
    },
    {
      id: 'commitments',
      label: 'Bills & Subscriptions',
      icon: CalendarClock,
    },
    {
      id: 'insights',
      label: 'Health & Insights',
      icon: LineChart,
      badge: `${metrics.health.totalScore}/100`,
    },
  ];

  const totalCommittedOrSpent = metrics.totalSpent + metrics.reservedSavings + metrics.reservedCommitments;
  const budgetUtilizationPercent = Math.min(100, Math.round((totalCommittedOrSpent / metrics.totalBudget) * 100));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed top-[61px] left-0 bottom-0 z-40 w-64 bg-[#0B1020] border-r border-slate-800/80 flex flex-col justify-between p-4 transition-transform duration-200 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Navigation list */}
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 block">
              Navigation
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    if (onClose) onClose();
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer text-left',
                    isActive
                      ? item.isHighlight
                        ? 'bg-[#C8FF55]/15 text-[#C8FF55] font-semibold border border-[#C8FF55]/30'
                        : 'bg-[#131B2F] text-white font-semibold border border-slate-700/60 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-transform group-hover:scale-110',
                        isActive
                          ? item.isHighlight
                            ? 'text-[#C8FF55]'
                            : 'text-white'
                          : 'text-slate-400 group-hover:text-slate-200'
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        'text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded',
                        item.isHighlight && isSimulating
                          ? 'bg-[#C8FF55] text-[#0B1020] animate-pulse'
                          : isActive
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-slate-850 text-slate-400'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          {/* Budget Allocation Widget at bottom */}
          <div className="p-3.5 rounded-2xl bg-[#131B2F] border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Monthly Allocation</span>
            <span className="font-mono font-bold text-white">
              {formatINR(totalCommittedOrSpent)} <span className="text-slate-400">/ 10k</span>
            </span>
          </div>

          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-[#C8FF55] to-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${budgetUtilizationPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>{budgetUtilizationPercent}% utilized</span>
            <span className="text-emerald-400 font-semibold">{formatINR(metrics.availableCash)} free</span>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};
