import { query } from '../db';

export const getMe = async (userId: string) => {
  const result = await query(
    `SELECT id, login, email, created_at, updated_at FROM users WHERE id = $1`,
    [userId]
  );

  return result.rows[0];
};

export const updateMe = async (
  userId: string,
  payload: { login?: string; email?: string }
) => {
  const current = await query(`SELECT * FROM users WHERE id = $1`, [userId]);
  const user = current.rows[0];

  const result = await query(
    `
      UPDATE users
      SET login = $1, email = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING id, login, email, created_at, updated_at
    `,
    [payload.login ?? user.login, payload.email ?? user.email, userId]
  );

  return result.rows[0];
};