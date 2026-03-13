export interface ApiSuccess<T = any> {
  success: true;
  data?: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  details?: any;
}

export type FamilyRole = 'admin' | 'adult' | 'child';
export type TransactionType = 'income' | 'expense';
export type CategoryType = 'income' | 'expense';