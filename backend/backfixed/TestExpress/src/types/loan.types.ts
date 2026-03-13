export interface Loan {
  id: string;
  user_id: string;
  family_id?: string | null;
  name: string;
  principal: number;
  annual_rate: number;
  term_months: number;
  monthly_payment: number;
  total_payment: number;
  overpayment: number;
  start_date: string;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}