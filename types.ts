export type TransactionType = 'revenue' | 'expense';

export type TransactionCategory = 
  | 'revenue' 
  | 'acquisition' 
  | 'renovation' 
  | 'monthly' 
  | 'other';

export type TransactionStatus = 'paid' | 'pending';

export interface Installment {
  groupId: string;
  current: number;
  total: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: TransactionCategory;
  payer: string; // "Todos", "Cida", etc.
  propertyId: string;
  status: TransactionStatus;
  installment?: Installment;
  createdAt: number;
}

export interface Property {
  id: string;
  name: string;
}

export interface UserSettings {
  theme: 'light' | 'dark';
}

export type ViewName = 
  | 'dashboard' 
  | 'calendar' 
  | 'payers' 
  | 'transactions_revenue' 
  | 'transactions_acquisition' 
  | 'transactions_renovation' 
  | 'transactions_monthly' 
  | 'transactions_other'
  | 'transactions_all'
  | 'calculator';

export const PAYERS = ['Todos', 'Cida', 'Michell', 'Paulo', 'William'];

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  revenue: 'RECEITAS',
  acquisition: 'AQUISIÇÃO',
  renovation: 'REFORMA',
  monthly: 'MENSAIS',
  other: 'OUTROS'
};

// Colors matched to the screenshot
export const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  revenue: '#10b981',     // Green
  acquisition: '#a855f7', // Purple
  renovation: '#f97316',  // Orange
  monthly: '#3b82f6',     // Blue
  other: '#ec4899'        // Pink
};