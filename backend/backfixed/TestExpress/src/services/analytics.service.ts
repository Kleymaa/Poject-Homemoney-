import { query } from '../db';

export const getSummary = async (userId: string, filters: any) => {
  const params: any[] = [userId];
  let where = `WHERE user_id = $1 AND deleted_at IS NULL`;

  if (filters.from) {
    params.push(filters.from);
    where += ` AND transaction_date >= $${params.length}`;
  }

  if (filters.to) {
    params.push(filters.to);
    where += ` AND transaction_date <= $${params.length}`;
  }

  const result = await query(
    `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
      FROM transactions
      ${where}
    `,
    params
  );

  const accounts = await query(
    `
      SELECT COALESCE(SUM(balance), 0) AS balance
      FROM accounts
      WHERE user_id = $1 AND deleted_at IS NULL
    `,
    [userId]
  );

  const totalIncome = Number(result.rows[0].total_income || 0);
  const totalExpense = Number(result.rows[0].total_expense || 0);

  return {
    totalIncome,
    totalExpense,
    difference: totalIncome - totalExpense,
    balance: Number(accounts.rows[0].balance || 0),
  };
};

export const getCategoryAnalytics = async (userId: string, filters: any) => {
  const params: any[] = [userId];
  let where = `WHERE t.user_id = $1 AND t.deleted_at IS NULL`;

  if (filters.from) {
    params.push(filters.from);
    where += ` AND t.transaction_date >= $${params.length}`;
  }

  if (filters.to) {
    params.push(filters.to);
    where += ` AND t.transaction_date <= $${params.length}`;
  }

  const result = await query(
    `
      SELECT c.name, c.type, COALESCE(SUM(t.amount), 0) AS total
      FROM transactions t
      JOIN categories c ON c.id = t.category_id
      ${where}
      GROUP BY c.name, c.type
      ORDER BY total DESC
    `,
    params
  );

  return result.rows;
};