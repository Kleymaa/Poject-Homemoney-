import { query } from '../db';

export const writeActionLog = async ({
  userId,
  familyId = null,
  action,
  entityType,
  entityId = null,
  metadata = null,
}: {
  userId: string;
  familyId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: any;
}) => {
  await query(
    `
      INSERT INTO action_logs (user_id, family_id, action, entity_type, entity_id, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `,
    [userId, familyId, action, entityType, entityId, metadata]
  );
};