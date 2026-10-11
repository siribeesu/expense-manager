import React from 'react';
import type { ActiveTab } from './Sidebar';
import { useFinance } from '../../context/useFinance';
import { LayoutDashboard, Sparkles, ReceiptText, PiggyBank, CalendarClock, LineChart } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface MobileNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange }) => {
  const { isSimulating } = useFinance();

  const items = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'simulator' as const, label: 'What-If', icon: Sparkles, isHighlight: true },
    { id: 'transactions' as const, label: 'Spend', icon: ReceiptText },
    { id: 'goals' as const, label: 'Goals', icon: PiggyBank },
    { id: 'commitments' as const, label: 'Bills', icon: CalendarClock },
    { id: 'insights' as const, label: 'Insights', icon: LineChart },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B1020]/95 backdrop-blur-lg border-t border-slate-800 lg:hidden px-2 py-1.5"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all relative',
                isActive
                  ? item.isHighlight
                    ? 'text-[#C8FF55]'
                    : 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'w-5 h-5 mb-0.5',
                    isActive && item.isHighlight && 'animate-pulse text-[#C8FF55]'
                  )}
                />
                {item.isHighlight && isSimulating && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#C8FF55]" />
                )}
              </div>
              <span className="leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
