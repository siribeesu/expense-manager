import React, { useState } from 'react';
import { type ActiveTab, Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { MobileNav } from './MobileNav';
import { ToastContainer } from '../common/ToastContainer';
import { DashboardView } from '../../features/dashboard/DashboardView';
import { SimulatorView } from '../../features/simulator/SimulatorView';
import { TransactionsView } from '../../features/transactions/TransactionsView';
import { GoalsView } from '../../features/goals/GoalsView';
import { CommitmentsView } from '../../features/commitments/CommitmentsView';
import { InsightsView } from '../../features/insights/InsightsView';
import { TransactionFormModal } from '../../features/transactions/TransactionFormModal';
import { useFinance } from '../../context/useFinance';

export const AppLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const { currentDay, totalDays, addTransaction } = useFinance();

  return (
    <div className="min-h-screen bg-[#0B1020] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#C8FF55]/30 selection:text-[#C8FF55]">
      {/* Top Navbar */}
      <TopNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar & Mobile Drawer */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setIsSidebarOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main
          id="main-content"
          className="flex-1 lg:pl-64 px-4 sm:px-6 lg:px-8 pt-6 pb-20 lg:pb-12 w-full transition-all duration-150"
        >
          {activeTab === 'overview' && (
            <DashboardView
              onNavigate={(tab) => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenAddTransaction={() => setIsQuickAddOpen(true)}
            />
          )}

          {activeTab === 'simulator' && <SimulatorView />}

          {activeTab === 'transactions' && <TransactionsView />}

          {activeTab === 'goals' && <GoalsView />}

          {activeTab === 'commitments' && <CommitmentsView />}

          {activeTab === 'insights' && (
            <InsightsView
              onNavigate={(tab) => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Accessible Notifications / Toasts */}
      <ToastContainer />

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
        }}
        currentDay={currentDay}
        totalDays={totalDays}
      />
    </div>
  );
};
