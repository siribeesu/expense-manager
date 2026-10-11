import type { Transaction } from '../types/finance';

export interface CsvExportResult {
  success: boolean;
  message: string;
  count: number;
}

/**
 * Exports transaction records as a clean downloadable CSV file with structured error handling.
 */
export function exportTransactionsToCsv(
  transactions: Transaction[],
  onResult?: (result: CsvExportResult) => void
): CsvExportResult {
  if (transactions.length === 0) {
    const res: CsvExportResult = {
      success: false,
      message: 'No transactions recorded yet to export.',
      count: 0,
    };
    if (onResult) onResult(res);
    return res;
  }

  try {
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

    const res: CsvExportResult = {
      success: true,
      message: `Successfully exported ${transactions.length} transactions to CSV.`,
      count: transactions.length,
    };
    if (onResult) onResult(res);
    return res;
  } catch (error) {
    console.error('[PaisaPilot CSV Export Error]:', error);
    const res: CsvExportResult = {
      success: false,
      message: 'Failed to generate CSV export file due to a browser permission or memory error.',
      count: 0,
    };
    if (onResult) onResult(res);
    return res;
  }
}
