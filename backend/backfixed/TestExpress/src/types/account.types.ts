export interface Account {
  id: string;
  user_id: string;
  family_id?: string | null;
  name: string;
  balance: number;
  currency: string;
  is_archived: boolean;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}