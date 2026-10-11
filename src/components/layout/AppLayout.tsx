import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { type ActiveTab, Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { MobileNav } from './MobileNav';
import { ToastContainer } from '../common/ToastContainer';
import { CommandPalette } from '../common/CommandPalette';
import { KeyboardShortcutsModal } from '../common/KeyboardShortcutsModal';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { ViewSkeleton } from '../common/ViewSkeleton';
import { TransactionFormModal } from '../../features/transactions/TransactionFormModal';
import { useFinance } from '../../context/useFinance';
import { useTheme } from '../../context/useTheme';
import { exportTransactionsToCsv } from '../../lib/exportCsv';
import { fireConfetti } from '../../lib/confetti';

// Route-based Code Splitting with React.lazy
const DashboardView = lazy(() =>
  import('../../features/dashboard/DashboardView').then((m) => ({ default: m.DashboardView }))
);
const SimulatorView = lazy(() =>
  import('../../features/simulator/SimulatorView').then((m) => ({ default: m.SimulatorView }))
);
const TransactionsView = lazy(() =>
  import('../../features/transactions/TransactionsView').then((m) => ({ default: m.TransactionsView }))
);
const GoalsView = lazy(() =>
  import('../../features/goals/GoalsView').then((m) => ({ default: m.GoalsView }))
);
const CommitmentsView = lazy(() =>
  import('../../features/commitments/CommitmentsView').then((m) => ({ default: m.CommitmentsView }))
);
const InsightsView = lazy(() =>
  import('../../features/insights/InsightsView').then((m) => ({ default: m.InsightsView }))
);

export const AppLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const { currentDay, totalDays, addTransaction, advanceDay, transactions, showToast } = useFinance();
  const { toggleTheme } = useTheme();

  const handleNavigate = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
    try {
      window.scrollTo(0, 0);
    } catch {
      // Cross-browser fallback
    }
    if (typeof document !== 'undefined') {
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    }
  }, []);

  // Global Keyboard Shortcuts (Pro-user power navigation)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or select
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isInputFocused =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        activeTag === 'select' ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      // 1. Command Palette: Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // If user is actively typing in a form field, don't hijack single keys
      if (isInputFocused) return;

      // 2. Help modal: ?
      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // 3. New Expense: N
      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsQuickAddOpen(true);
        return;
      }

      // 4. Advance Day: D
      if (e.key.toLowerCase() === 'd' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        advanceDay();
        return;
      }

      // 5. Toggle Theme: T
      if (e.key.toLowerCase() === 't' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        toggleTheme();
        return;
      }

      // 6. Number keys 1-6 for quick tab jumping
      const tabMap: Record<string, ActiveTab> = {
        '1': 'overview',
        '2': 'simulator',
        '3': 'transactions',
        '4': 'goals',
        '5': 'commitments',
        '6': 'insights',
      };
      if (tabMap[e.key] && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleNavigate(tabMap[e.key]);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleNavigate, advanceDay, toggleTheme]);

  return (
    <div className="min-h-screen bg-[#0B1020] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#C8FF55]/30 selection:text-[#C8FF55] relative">
      {/* Accessible Keyboard Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#C8FF55] focus:text-[#0B1020] focus:font-bold focus:rounded-xl focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Subtle Ambient Background Mesh / Radial Glows */}
      <div
        className="fixed top-0 left-1/4 w-[600px] h-[400px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="fixed top-1/3 right-10 w-[500px] h-[400px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* Top Navbar */}
      <TopNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      <div className="flex-1 flex w-full">
        {/* Desktop Sidebar & Mobile Drawer */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleNavigate}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main
          id="main-content"
          role="main"
          tabIndex={-1}
          aria-label="Financial Flightpath Workspace"
          className="flex-1 lg:pl-64 w-full transition-all duration-150 focus:outline-none flex flex-col justify-between"
        >
          <div className="w-full px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 max-w-[1720px] mx-auto animate-in fade-in duration-200 flex-1">
            <ErrorBoundary level="view">
              <Suspense fallback={<ViewSkeleton />}>
                {activeTab === 'overview' && (
                  <DashboardView
                    onNavigate={handleNavigate}
                    onOpenAddTransaction={() => setIsQuickAddOpen(true)}
                  />
                )}

                {activeTab === 'simulator' && <SimulatorView />}

                {activeTab === 'transactions' && <TransactionsView />}

                {activeTab === 'goals' && <GoalsView />}

                {activeTab === 'commitments' && <CommitmentsView />}

                {activeTab === 'insights' && (
                  <InsightsView
                    onNavigate={handleNavigate}
                  />
                )}
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* Semantic Footer Landmark */}
          <footer
            role="contentinfo"
            className="w-full px-3 sm:px-6 lg:px-8 py-4 pb-24 lg:pb-6 border-t border-slate-800/60 text-xs text-slate-400 max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2"
          >
            <p className="font-medium">
              <strong className="text-white">Thriftly</strong> — Gen Z 30-Day Personal Finance & What-If Decision Simulator
            </p>
            <p className="font-mono text-[11px] text-slate-400">
              Single-Source Accounting Engine · Zero-Knowledge Local Vault
            </p>
          </footer>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        onTabChange={handleNavigate}
      />

      {/* Accessible Notifications / Toasts */}
      <ToastContainer />

      {/* Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
        onOpenAddExpense={() => setIsQuickAddOpen(true)}
        onExportCsv={() =>
          exportTransactionsToCsv(transactions, (res) => {
            showToast({
              title: res.success ? 'Export Complete' : 'Export Notice',
              description: res.message,
              type: res.success ? 'success' : 'warning',
            });
          })
        }
      />

      {/* Keyboard Shortcuts Helper Modal (?) */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Quick Add Expense Modal */}
      <TransactionFormModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSubmit={(data) => {
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
        }}
        currentDay={currentDay}
        totalDays={totalDays}
      />
    </div>
  );
};
