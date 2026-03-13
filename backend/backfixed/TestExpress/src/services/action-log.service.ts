import { query } from '../db';
import { ensureFamilyAdmin } from './permission.service';

export const getActionLogs = async (
  userId: string,
  familyId?: string
) => {
  if (familyId) {
    await ensureFamilyAdmin(userId, familyId);

    const result = await query(
      `
        SELECT *
        FROM action_logs
        WHERE family_id = $1
        ORDER BY created_at DESC
      `,
      [familyId]
    );

    return result.rows;
  }

  const result = await query(
    `
      SELECT *
      FROM action_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [userId]
  );

  return result.rows;
};