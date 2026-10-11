import type { Transaction } from '../types/finance';

/**
 * Exports transaction records as a clean downloadable CSV file.
 */
export function exportTransactionsToCsv(transactions: Transaction[]): void {
  if (transactions.length === 0) {
    alert('No transactions recorded to export.');
    return;
  }

  const headers = ['ID', 'Day', 'Date Label', 'Description', 'Category', 'Amount (INR)', 'Type', 'Recurring'];
  const rows = transactions.map((t) => [
    `"${t.id}"`,
    t.day,
    `"${t.dateStr}"`,
    `"${t.description.replace(/"/g, '""')}"`,
    `"${t.category}"`,
    t.amount,
    `"${t.type}"`,
    t.isRecurring ? 'Yes' : 'No',
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `paisapilot_ledger_cycle30_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
