import { CategoryType } from './common.types';

export interface Category {
  id: string;
  user_id?: string | null;
  family_id?: string | null;
  name: string;
  type: CategoryType;
  is_system: boolean;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}