import { TransactionType } from './common.types';

export interface Transaction {
  id: string;
  user_id: string;
  family_id?: string | null;
  account_id: string;
  category_id: string;
  type: TransactionType;
  amount: number;
  description?: string | null;
  transaction_date: string;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}