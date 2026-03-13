import { query } from '../db';
import { AppError } from '../utils/AppError';
import { ensureAdultOwnsResource, ensureNotChild } from './permission.service';
import { writeActionLog } from '../utils/logger';

const applyTransactionToBalance = async (
  accountId: string,
  type: 'income' | 'expense',
  amount: number
) => {
  const delta = type === 'income' ? amount : -amount;

  await query(
    `
      UPDATE accounts
      SET balance = balance + $1, updated_at = NOW()
      WHERE id = $2
    `,
    [delta, accountId]
  );
};

const revertTransactionFromBalance = async (
  accountId: string,
  type: 'income' | 'expense',
  amount: number
) => {
  const delta = type === 'income' ? -amount : amount;

  await query(
    `
      UPDATE accounts
      SET balance = balance + $1, updated_at = NOW()
      WHERE id = $2
    `,
    [delta, accountId]
  );
};

const ensureCashAccount = async (userId: string) => {
  const existing = await query(
    `SELECT * FROM accounts WHERE user_id = $1 AND name = 'Наличные' AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 1`,
    [userId]
  );

  if (existing.rows[0]) return existing.rows[0];

  const created = await query(
    `
      INSERT INTO accounts (user_id, family_id, name, balance, currency, is_archived, created_at, updated_at)
      VALUES ($1, NULL, 'Наличные', 0, 'RUB', false, NOW(), NOW())
      RETURNING *
    `,
    [userId]
  );

  return created.rows[0];
};

const ensureCategory = async (
  userId: string,
  type: 'income' | 'expense',
  categoryId?: string,
  categoryName?: string
) => {
  if (categoryId) {
    const found = await query(
      `SELECT * FROM categories WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [categoryId]
    );
    if (found.rows[0]) return found.rows[0];
  }

  const name = String(categoryName || 'Другое').trim() || 'Другое';

  const existing = await query(
    `
      SELECT * FROM categories
      WHERE user_id = $1 AND LOWER(name) = LOWER($2) AND type = $3 AND deleted_at IS NULL
      ORDER BY is_system DESC, created_at ASC
      LIMIT 1
    `,
    [userId, name, type]
  );

  if (existing.rows[0]) return existing.rows[0];

  const created = await query(
    `
      INSERT INTO categories (user_id, family_id, name, type, is_system, created_at, updated_at)
      VALUES ($1, NULL, $2, $3, false, NOW(), NOW())
      RETURNING *
    `,
    [userId, name, type]
  );

  return created.rows[0];
};

export const createTransaction = async (
  userId: string,
  payload: {
    accountId?: string | null;
    categoryId?: string | null;
    category?: string;
    type: 'income' | 'expense';
    amount: number;
    description?: string;
    transactionDate?: string;
    date?: string;
  }
) => {
  const account = payload.accountId
    ? (
        await query(`SELECT * FROM accounts WHERE id = $1 AND deleted_at IS NULL`, [
          payload.accountId,
        ])
      ).rows[0]
    : await ensureCashAccount(userId);

  if (!account) throw new AppError('Счёт не найден', 404);

  await ensureNotChild(userId, account.family_id);
  await ensureAdultOwnsResource(userId, account.user_id, account.family_id);

  const category = await ensureCategory(
    userId,
    payload.type,
    payload.categoryId || undefined,
    payload.category
  );

  const transactionDate = payload.transactionDate || payload.date || new Date().toISOString().slice(0, 10);

  const result = await query(
    `
      INSERT INTO transactions (
        user_id, family_id, account_id, category_id, type, amount, description, transaction_date, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `,
    [
      userId,
      account.family_id,
      account.id,
      category.id,
      payload.type,
      payload.amount,
      payload.description || null,
      transactionDate,
    ]
  );

  await applyTransactionToBalance(account.id, payload.type, payload.amount);

  await writeActionLog({
    userId,
    familyId: account.family_id,
    action: 'CREATE_TRANSACTION',
    entityType: 'transaction',
    entityId: result.rows[0].id,
  });

  return result.rows[0];
};

export const getTransactions = async (userId: string, queryParams: any) => {
  const params: any[] = [userId];
  let sql = `
    SELECT
      t.*,
      c.name AS category,
      a.name AS account_name,
      CASE WHEN a.name = 'Наличные' THEN 'cash' ELSE 'account' END AS payment_source
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    LEFT JOIN accounts a ON a.id = t.account_id
    WHERE t.user_id = $1 AND t.deleted_at IS NULL
  `;

  if (queryParams.type) {
    params.push(queryParams.type);
    sql += ` AND t.type = $${params.length}`;
  }

  if (queryParams.accountId) {
    params.push(queryParams.accountId);
    sql += ` AND t.account_id = $${params.length}`;
  }

  if (queryParams.category) {
    params.push(`%${queryParams.category}%`);
    sql += ` AND c.name ILIKE $${params.length}`;
  }

  if (queryParams.paymentSource === 'cash') {
    sql += ` AND a.name = 'Наличные'`;
  }

  if (queryParams.paymentSource === 'account') {
    sql += ` AND a.name <> 'Наличные'`;
  }

  const from = queryParams.from || queryParams.dateFrom;
  const to = queryParams.to || queryParams.dateTo;

  if (from) {
    params.push(from);
    sql += ` AND t.transaction_date >= $${params.length}`;
  }

  if (to) {
    params.push(to);
    sql += ` AND t.transaction_date <= $${params.length}`;
  }

  if (queryParams.minAmount) {
    params.push(Number(queryParams.minAmount));
    sql += ` AND t.amount >= $${params.length}`;
  }

  if (queryParams.maxAmount) {
    params.push(Number(queryParams.maxAmount));
    sql += ` AND t.amount <= $${params.length}`;
  }

  sql += ' ORDER BY t.transaction_date DESC, t.created_at DESC';

  const result = await query(sql, params);
  return result.rows;
};

export const getTransactionById = async (userId: string, transactionId: string) => {
  const result = await query(
    `
      SELECT t.*, c.name AS category, a.name AS account_name
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      LEFT JOIN accounts a ON a.id = t.account_id
      WHERE t.id = $1 AND t.user_id = $2 AND t.deleted_at IS NULL
    `,
    [transactionId, userId]
  );

  if (!result.rows[0]) throw new AppError('Transaction not found', 404);
  return result.rows[0];
};

export const updateTransaction = async (
  userId: string,
  transactionId: string,
  payload: {
    categoryId?: string;
    category?: string;
    type?: 'income' | 'expense';
    amount?: number;
    description?: string;
    transactionDate?: string;
    accountId?: string | null;
  }
) => {
  const currentRes = await query(`SELECT * FROM transactions WHERE id = $1 AND deleted_at IS NULL`, [transactionId]);
  const current = currentRes.rows[0];

  if (!current) throw new AppError('Transaction not found', 404);

  await ensureAdultOwnsResource(userId, current.user_id, current.family_id);

  await revertTransactionFromBalance(current.account_id, current.type, Number(current.amount));

  const nextType = payload.type ?? current.type;
  const nextAmount = payload.amount ?? Number(current.amount);
  const nextAccount = payload.accountId
    ? (await query(`SELECT * FROM accounts WHERE id = $1 AND deleted_at IS NULL`, [payload.accountId])).rows[0]
    : (await query(`SELECT * FROM accounts WHERE id = $1 AND deleted_at IS NULL`, [current.account_id])).rows[0];

  if (!nextAccount) throw new AppError('Счёт не найден', 404);

  const nextCategory = await ensureCategory(
    userId,
    nextType,
    payload.categoryId || current.category_id,
    payload.category
  );

  const result = await query(
    `
      UPDATE transactions
      SET
        account_id = $1,
        category_id = $2,
        type = $3,
        amount = $4,
        description = $5,
        transaction_date = $6,
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `,
    [
      nextAccount.id,
      nextCategory.id,
      nextType,
      nextAmount,
      payload.description ?? current.description,
      payload.transactionDate ?? current.transaction_date,
      transactionId,
    ]
  );

  await applyTransactionToBalance(nextAccount.id, nextType, nextAmount);

  await writeActionLog({
    userId,
    familyId: current.family_id,
    action: 'UPDATE_TRANSACTION',
    entityType: 'transaction',
    entityId: transactionId,
  });

  return result.rows[0];
};

export const deleteTransaction = async (userId: string, transactionId: string) => {
  const currentRes = await query(`SELECT * FROM transactions WHERE id = $1 AND deleted_at IS NULL`, [transactionId]);
  const current = currentRes.rows[0];

  if (!current) throw new AppError('Transaction not found', 404);

  await ensureAdultOwnsResource(userId, current.user_id, current.family_id);

  await query(
    `
      UPDATE transactions
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `,
    [transactionId]
  );

  await revertTransactionFromBalance(current.account_id, current.type, Number(current.amount));

  await writeActionLog({
    userId,
    familyId: current.family_id,
    action: 'DELETE_TRANSACTION',
    entityType: 'transaction',
    entityId: transactionId,
  });

  return { message: 'Transaction deleted' };
};

export const getHistory = async (userId: string, filters: any = {}) => {
  return getTransactions(userId, filters);
};

export const quickIncome = async (userId: string, payload: any) => {
  return createTransaction(userId, {
    ...payload,
    type: 'income',
  });
};

export const quickExpense = async (userId: string, payload: any) => {
  return createTransaction(userId, {
    ...payload,
    type: 'expense',
  });
};
