import type { TransactionCategory, CategoryMeta } from '../types/finance';

/**
 * Format Indian Rupee with INR symbol and Indian numbering system (e.g. ₹10,000 or ₹1,50,000)
 */
export function formatINR(amount: number, showDecimals: boolean = false): string {
  if (isNaN(amount) || !isFinite(amount)) return '₹0';
  
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });

  return formatter.format(amount);
}

/**
 * Format compact INR (e.g., ₹2.5k, ₹10k)
 */
export function formatINRCompact(amount: number): string {
  if (isNaN(amount) || !isFinite(amount)) return '₹0';
  if (Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (Math.abs(amount) >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}k`;
  }
  return formatINR(amount);
}

export function formatPercent(value: number, decimals: number = 0): string {
  if (isNaN(value) || !isFinite(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
}

export const CATEGORY_DEFINITIONS: Record<TransactionCategory, CategoryMeta> = {
  food_groceries: {
    id: 'food_groceries',
    label: 'Food & Groceries',
    color: '#10B981', // Emerald
    icon: 'Utensils',
  },
  transport: {
    id: 'transport',
    label: 'Travel & Metro',
    color: '#06B6D4', // Cyan
    icon: 'Train',
  },
  education: {
    id: 'education',
    label: 'Study & Courses',
    color: '#8B5CF6', // Purple
    icon: 'GraduationCap',
  },
  entertainment: {
    id: 'entertainment',
    label: 'Outings & Fun',
    color: '#EC4899', // Pink
    icon: 'Film',
  },
  shopping: {
    id: 'shopping',
    label: 'Shopping & Gear',
    color: '#F59E0B', // Amber
    icon: 'ShoppingBag',
  },
  subscriptions: {
    id: 'subscriptions',
    label: 'OTT & Apps',
    color: '#6366F1', // Indigo
    icon: 'PlaySquare',
  },
  health_wellness: {
    id: 'health_wellness',
    label: 'Health & Pharmacy',
    color: '#14B8A6', // Teal
    icon: 'HeartPulse',
  },
  bills_utilities: {
    id: 'bills_utilities',
    label: 'Bills & WiFi',
    color: '#3B82F6', // Blue
    icon: 'Zap',
  },
  other: {
    id: 'other',
    label: 'Misc & Cash',
    color: '#94A3B8', // Slate
    icon: 'MoreHorizontal',
  },
};

export function getCategoryMeta(category: TransactionCategory): CategoryMeta {
  return CATEGORY_DEFINITIONS[category] || CATEGORY_DEFINITIONS.other;
}
