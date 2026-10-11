import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Input } from '../components/ui/Input';
import { Switch } from '../components/ui/Switch';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { exportTransactionsToCsv } from '../lib/exportCsv';
import type { Transaction } from '../types/finance';

describe('Accessibility: Input Component', () => {
  it('associates label htmlFor with input id', () => {
    render(<Input label="Expense Amount" placeholder="Enter amount" />);
    const input = screen.getByPlaceholderText('Enter amount');
    const label = screen.getByText('Expense Amount');
    expect(label).toHaveAttribute('for', input.getAttribute('id'));
  });

  it('renders validation error with role=alert and aria-invalid=true', () => {
    render(<Input label="Description" error="Description is required" />);
    const input = screen.getByLabelText('Description');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Description is required');
  });
});

describe('Accessibility: Switch Component', () => {
  it('renders with role="switch" and correct aria-checked', () => {
    const handleChange = vi.fn();
    render(<Switch label="Recurring" checked={false} onChange={handleChange} />);
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(switchEl);
    expect(handleChange).toHaveBeenCalledWith(true);
  });
});

describe('Reliability: ErrorBoundary Component', () => {
  it('catches render errors and displays fallback UI', () => {
    // Suppress expected console.error during deliberate error test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const ThrowingComponent = () => {
      throw new Error('Simulated runtime failure');
    };

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went unexpected')).toBeInTheDocument();
    expect(screen.getByText('Simulated runtime failure')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload app/i })).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});

describe('Reliability: CSV Export', () => {
  it('returns clean error result for empty transaction array', () => {
    const callback = vi.fn();
    const result = exportTransactionsToCsv([], callback);
    expect(result.success).toBe(false);
    expect(result.count).toBe(0);
    expect(callback).toHaveBeenCalledWith(result);
  });

  it('generates export file for valid transactions', () => {
    const sampleTxs: Transaction[] = [
      {
        id: 'tx-1',
        description: 'Swiggy Dinner',
        amount: 320,
        category: 'food_groceries',
        day: 2,
        dateStr: 'Day 2',
        type: 'expense',
        createdAt: Date.now(),
      },
    ];

    const callback = vi.fn();
    const result = exportTransactionsToCsv(sampleTxs, callback);
    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    expect(callback).toHaveBeenCalledWith(result);
  });
});
