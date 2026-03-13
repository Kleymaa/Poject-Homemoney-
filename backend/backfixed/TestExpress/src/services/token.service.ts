import { query } from '../db';
import { hashToken, compareHash } from '../utils/hash';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  signResetToken,
  verifyResetToken,
} from '../utils/jwt';
import { AppError } from '../utils/AppError';

export const generateAuthTokens = async (user: { id: string; login: string; email: string }) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const refreshTokenHash = await hashToken(refreshToken);

  await query(
    `
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at, created_at)
      VALUES ($1, $2, NOW() + INTERVAL '7 days', NOW())
    `,
    [user.id, refreshTokenHash]
  );

  return { accessToken, refreshToken };
};

export const rotateRefreshToken = async (refreshToken: string) => {
  const decoded = verifyRefreshToken(refreshToken) as any;
  const userId = decoded.id;

  const result = await query(
    `SELECT * FROM refresh_tokens WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );

  let valid = false;
  for (const row of result.rows) {
    const matched = await compareHash(refreshToken, row.token_hash);
    if (matched) {
      valid = true;
      break;
    }
  }

  if (!valid) {
    throw new AppError('Invalid refresh token', 401);
  }

  await query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [userId]);

  return generateAuthTokens({
    id: decoded.id,
    login: decoded.login,
    email: decoded.email,
  });
};

export const createResetToken = async (user: { id: string; login: string; email: string }) => {
  const resetToken = signResetToken({
    id: user.id,
    login: user.login,
    email: user.email,
  });

  const tokenHash = await hashToken(resetToken);

  await query(
    `
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at)
      VALUES ($1, $2, NOW() + INTERVAL '15 minutes', NOW())
    `,
    [user.id, tokenHash]
  );

  return resetToken;
};

export const validateResetToken = async (resetToken: string) => {
  const decoded = verifyResetToken(resetToken) as any;
  const result = await query(
    `
      SELECT * FROM password_reset_tokens
      WHERE user_id = $1 AND used_at IS NULL AND expires_at > NOW()
      ORDER BY created_at DESC
    `,
    [decoded.id]
  );

  let valid = false;
  for (const row of result.rows) {
    const matched = await compareHash(resetToken, row.token_hash);
    if (matched) {
      valid = true;
      break;
    }
  }

  if (!valid) {
    throw new Error('Invalid reset token');
  }

  return decoded;
};