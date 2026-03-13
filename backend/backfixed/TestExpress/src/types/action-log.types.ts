export interface ActionLog {
  id: string;
  user_id: string;
  family_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
}