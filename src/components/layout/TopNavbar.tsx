import React, { useState } from 'react';
import { useFinance } from '../../context/useFinance';
import { formatINR } from '../../lib/formatters';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Compass,
  RotateCcw,
  FastForward,
  Wallet,
  Menu,
  X,
} from 'lucide-react';

export interface TopNavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { currentDay, totalDays, metrics, advanceDay, resetToDemoData, isBackendConnected } = useFinance();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#0B1020]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#C8FF55] flex items-center justify-center text-[#0B1020] shadow-[0_0_15px_rgba(200,255,85,0.3)] font-black text-lg">
                <Compass className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base lg:text-lg tracking-tight text-white">
                    Paisa<span className="text-[#C8FF55]">Pilot</span>
                  </span>
                  <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Gen Z Beta
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
                  Every rupee has a plan · ₹10k / 30 Days
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Backend Connection Indicator */}
            <div
              title={isBackendConnected ? 'Connected to Node.js Express REST Backend on port 3001' : 'Running on client-side persistent storage'}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono select-none"
            >
              <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className={isBackendConnected ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                {isBackendConnected ? 'API :3001' : 'Local DB'}
              </span>
            </div>
            {/* Day Indicator with Advance Button */}
            <div className="flex items-center bg-[#131B2F] border border-slate-700/60 rounded-xl p-1 px-2.5 gap-2">
              <div className="text-left">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block leading-tight">
                  Budget Cycle
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  Day {currentDay} <span className="text-slate-400">/ {totalDays}</span>
                </span>
              </div>
              <button
                onClick={advanceDay}
                disabled={currentDay >= totalDays}
                title="Advance to next day (simulate calendar progression)"
                aria-label="Advance budget day"
                className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-[#C8FF55] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <FastForward className="w-4 h-4" />
              </button>
            </div>

            {/* Available Cash Pill */}
            <div className="hidden md:flex items-center gap-2 bg-[#131B2F] border border-[#C8FF55]/30 rounded-xl px-3 py-1.5 shadow-[0_0_12px_rgba(200,255,85,0.06)]">
              <Wallet className="w-4 h-4 text-[#C8FF55]" />
              <div className="text-left">
                <span className="text-[10px] text-slate-400 block leading-none">Available Cash</span>
                <span className="text-xs font-mono font-bold text-white">
                  {formatINR(metrics.availableCash)}
                </span>
              </div>
            </div>

            {/* Reset Demo State Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
              className="text-xs text-slate-300 border-slate-700 hover:border-slate-500"
              title="Reset application to original demo state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Demo</span>
            </Button>

            {/* Avatar Pill */}
            <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-semibold text-xs">
                AP
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Confirmation modal for Demo Reset */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={resetToDemoData}
        title="Restore Initial Demo Data?"
        message="This will reset your transactions, upcoming commitments, and savings goals back to the pristine Day 12 reconciled demo baseline (₹10,000 total budget, ₹4,203 available cash)."
        confirmText="Reset to Demo"
        cancelText="Keep Current Data"
        variant="primary"
      />
    </>
  );
};
