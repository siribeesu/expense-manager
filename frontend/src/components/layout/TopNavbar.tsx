import React from 'react';
import { useFinance } from '../../context/useFinance';
import { formatINR } from '../../lib/formatters';
import {
  Compass,
  FastForward,
  Wallet,
  Menu,
  X,
  Sun,
  Moon,
  Search,
  Keyboard,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../context/useTheme';

import { cn } from '../../lib/utils';

export interface TopNavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onOpenCommandPalette?: () => void;
  onOpenShortcuts?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  onOpenCommandPalette,
  onOpenShortcuts,
}) => {
  const { currentDay, totalDays, metrics, advanceDay, resetToDemoData, isBackendConnected } = useFinance();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B1020]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2.5 transition-colors duration-200">
      <div className="flex items-center justify-between gap-3 w-full max-w-[1720px] mx-auto">
        {/* Brand Logo */}
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
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base lg:text-lg tracking-tight text-white">
                Thrift<span className="text-[#C8FF55]">ly</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Gen Z Beta
              </span>
            </div>
          </div>
        </div>

        {/* Center: Command Palette Trigger */}
        {onOpenCommandPalette && (
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#131B2F] hover:bg-[#162038] border border-slate-700/60 text-xs text-slate-400 hover:text-white transition-all shadow-sm cursor-pointer group"
            title="Open Command Palette (⌘K / Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#C8FF55] transition-colors" />
            <span>Search actions or navigate...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono border border-slate-700">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Sync / Offline Vault Status Badge */}
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
            isBackendConnected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          )}
          title={
            isBackendConnected
              ? 'Live Cloud Synchronization Active · Remote Database Connected'
              : 'Offline Mode · Financial records encrypted in local vault'
          }
        >
          <span
            className={cn(
              'w-2 h-2 rounded-full shrink-0',
              isBackendConnected
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse'
                : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
            )}
            aria-hidden="true"
          />
          <span>{isBackendConnected ? 'Cloud Synced' : 'Offline · Encrypted Vault'}</span>
          <span className="sr-only">
            {isBackendConnected ? 'Cloud synchronization is active' : 'Offline mode, ledger saved to encrypted vault'}
          </span>
        </div>

        {/* Quick Stats & Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
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
              className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-[#C8FF55] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <FastForward className="w-4 h-4" />
            </button>
          </div>

          {/* Available Cash Pill */}
          <div className="hidden sm:flex items-center gap-2 bg-[#131B2F] border border-[#C8FF55]/30 rounded-xl px-3 py-1.5 shadow-[0_0_12px_rgba(200,255,85,0.06)]">
            <Wallet className="w-4 h-4 text-[#C8FF55]" />
            <div className="text-left">
              <span className="text-[10px] text-slate-400 block leading-none">Available Cash</span>
              <span className="text-xs font-mono font-bold text-white">
                {formatINR(metrics.availableCash)}
              </span>
            </div>
          </div>

          {/* Sample Data Quick Loader */}
          <button
            type="button"
            onClick={resetToDemoData}
            title="Load realistic sample data (8 transactions, 2 goals, 4 bills)"
            aria-label="Load Sample Data"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#131B2F] border border-slate-700/60 text-xs font-semibold text-slate-300 hover:text-[#C8FF55] hover:border-[#C8FF55]/40 transition-all cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C8FF55]" />
            <span className="hidden sm:inline">Sample Data</span>
          </button>

          {/* Theme Toggle Button (Dark / Light) */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode (T)' : 'Switch to Dark Mode (T)'}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl bg-[#131B2F] border border-slate-700/60 text-slate-300 hover:text-white hover:border-slate-500 transition-all cursor-pointer flex items-center justify-center shadow-sm"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500 transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* Keyboard Shortcuts Helper Button */}
          {onOpenShortcuts && (
            <button
              type="button"
              onClick={onOpenShortcuts}
              title="Keyboard Shortcuts (?)"
              aria-label="Keyboard Shortcuts"
              className="hidden md:flex p-2 rounded-xl bg-[#131B2F] border border-slate-700/60 text-slate-300 hover:text-[#C8FF55] hover:border-slate-500 transition-all cursor-pointer items-center justify-center shadow-sm"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
