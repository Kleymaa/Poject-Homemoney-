import { query } from '../db';
import { AppError } from '../utils/AppError';

export const getUserFamilyRole = async (userId: string, familyId: string) => {
  const result = await query(
    `
      SELECT role
      FROM family_members
      WHERE user_id = $1 AND family_id = $2
    `,
    [userId, familyId]
  );

  return result.rows[0]?.role || null;
};

export const ensureCanReadFamily = async (userId: string, familyId: string) => {
  const role = await getUserFamilyRole(userId, familyId);
  if (!role) {
    throw new AppError('Forbidden', 403);
  }
};

export const ensureFamilyAdmin = async (userId: string, familyId: string) => {
  const role = await getUserFamilyRole(userId, familyId);
  if (role !== 'admin') {
    throw new AppError('Only family admin allowed', 403);
  }
};

export const ensureNotChild = async (userId: string, familyId?: string | null) => {
  if (!familyId) return;

  const role = await getUserFamilyRole(userId, familyId);
  if (role === 'child') {
    throw new AppError('Child role has read-only access', 403);
  }
};

export const ensureCanMutateFamilyEntity = async (
  userId: string,
  ownerId: string,
  familyId?: string | null
) => {
  if (!familyId) {
    if (userId !== ownerId) {
      throw new AppError('Forbidden', 403);
    }
    return;
  }

  const role = await getUserFamilyRole(userId, familyId);

  if (!role) throw new AppError('Forbidden', 403);
  if (role === 'child') throw new AppError('Child role has read-only access', 403);
  if (role === 'adult' && userId !== ownerId) {
    throw new AppError('Adult cannot modify foreign family entity', 403);
  }
};

/**
 * Оставлено для совместимости со старыми сервисами:
 * account.service.ts
 * category.service.ts
 * transaction.service.ts
 * loan.service.ts
 */
export const ensureAdultOwnsResource = async (
  userId: string,
  resourceOwnerId: string,
  familyId?: string | null
) => {
  return ensureCanMutateFamilyEntity(userId, resourceOwnerId, familyId);
};