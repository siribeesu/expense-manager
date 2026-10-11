import React from 'react';
import { Modal } from '../ui/Modal';
import { Keyboard } from 'lucide-react';

export interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const shortcutGroups = [
    {
      title: 'Navigation Shortcuts',
      shortcuts: [
        { key: '1', desc: 'Jump to Financial Cockpit' },
        { key: '2', desc: 'Jump to What-If Simulator' },
        { key: '3', desc: 'Jump to Transactions Ledger' },
        { key: '4', desc: 'Jump to Savings Goals' },
        { key: '5', desc: 'Jump to Bills & Subscriptions' },
        { key: '6', desc: 'Jump to Health & Insights' },
      ],
    },
    {
      title: 'Quick Power Actions',
      shortcuts: [
        { key: '⌘ K / Ctrl K', desc: 'Open Command Palette' },
        { key: 'N', desc: 'Record New Expense' },
        { key: 'D', desc: 'Advance Budget Day (+1)' },
        { key: 'T', desc: 'Toggle Dark / Light Theme' },
        { key: '?', desc: 'Toggle This Shortcuts Guide' },
        { key: 'Esc', desc: 'Close any open modal or sheet' },
      ],
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      description="Power through your financial cycle with rapid single-key navigation"
      maxWidth="md"
    >
      <div className="space-y-5">
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
          <Keyboard className="w-4 h-4 text-[#C8FF55] shrink-0" />
          <span>Press these keys anytime outside of text input fields.</span>
        </div>

        {shortcutGroups.map((group) => (
          <div key={group.title} className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {group.title}
            </h4>
            <div className="divide-y divide-slate-800/80 rounded-xl bg-[#0E1526] border border-slate-800 px-3">
              {group.shortcuts.map((sc) => (
                <div
                  key={sc.key}
                  className="py-2.5 flex items-center justify-between text-xs"
                >
                  <span className="text-slate-300 font-medium">{sc.desc}</span>
                  <kbd className="px-2 py-1 font-mono font-bold text-[11px] rounded bg-slate-800 text-[#C8FF55] border border-slate-700 shadow-sm">
                    {sc.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
