import { query } from '../db';
import { ensureAdultOwnsResource, ensureNotChild } from './permission.service';
import { writeActionLog } from '../utils/logger';
import { AppError } from '../utils/AppError';

export const createAccount = async (
  userId: string,
  payload: { name: string; balance: number; currency: string; familyId?: string | null }
) => {
  await ensureNotChild(userId, payload.familyId);

  const result = await query(
    `
      INSERT INTO accounts (user_id, family_id, name, balance, currency, is_archived, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())
      RETURNING *
    `,
    [userId, payload.familyId || null, payload.name, payload.balance || 0, payload.currency || 'RUB']
  );

  await writeActionLog({
    userId,
    familyId: payload.familyId || null,
    action: 'CREATE_ACCOUNT',
    entityType: 'account',
    entityId: result.rows[0].id,
  });

  return result.rows[0];
};

export const getAccounts = async (userId: string) => {
  const result = await query(
    `
      SELECT * FROM accounts
      WHERE user_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
    `,
    [userId]
  );

  return result.rows;
};

export const getAccountById = async (userId: string, accountId: string) => {
  const result = await query(
    `
      SELECT * FROM accounts
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
    `,
    [accountId, userId]
  );

  if (!result.rows[0]) throw new AppError('Account not found', 404);
  return result.rows[0];
};

export const updateAccount = async (
  userId: string,
  accountId: string,
  payload: { name?: string; balance?: number; currency?: string }
) => {
  const current = await query(`SELECT * FROM accounts WHERE id = $1 AND deleted_at IS NULL`, [accountId]);
  const account = current.rows[0];

  if (!account) throw new AppError('Account not found', 404);

  await ensureAdultOwnsResource(userId, account.user_id, account.family_id);

  const result = await query(
    `
      UPDATE accounts
      SET name = $1, balance = $2, currency = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `,
    [
      payload.name ?? account.name,
      payload.balance ?? account.balance,
      payload.currency ?? account.currency,
      accountId,
    ]
  );

  await writeActionLog({
    userId,
    familyId: account.family_id,
    action: 'UPDATE_ACCOUNT',
    entityType: 'account',
    entityId: accountId,
  });

  return result.rows[0];
};

export const deleteAccount = async (userId: string, accountId: string) => {
  const current = await query(`SELECT * FROM accounts WHERE id = $1 AND deleted_at IS NULL`, [accountId]);
  const account = current.rows[0];

  if (!account) throw new AppError('Account not found', 404);

  await ensureAdultOwnsResource(userId, account.user_id, account.family_id);

  await query(
    `
      UPDATE accounts
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `,
    [accountId]
  );

  await writeActionLog({
    userId,
    familyId: account.family_id,
    action: 'DELETE_ACCOUNT',
    entityType: 'account',
    entityId: accountId,
  });

  return { message: 'Account deleted' };
};