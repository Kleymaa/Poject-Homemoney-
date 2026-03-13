import crypto from 'crypto';
import { query } from '../db';
import { AppError } from '../utils/AppError';
import { hashPassword, verifyPassword } from '../utils/hash';
import {
  createResetToken,
  generateAuthTokens,
  rotateRefreshToken,
  validateResetToken,
} from './token.service';
import { seedSystemCategoriesForUser } from './seed.service';
import { writeActionLog } from '../utils/logger';
import { sendResetPasswordEmail } from './mail.service';

export const registerUser = async (payload: {
  login: string;
  email: string;
  password: string;
  confirmPassword: string;
}) => {
  const { login, email, password, confirmPassword } = payload;

  if (password !== confirmPassword) {
    throw new AppError('Passwords do not match', 400);
  }

  const existingUser = await query(
    `SELECT id FROM users WHERE login = $1 OR email = $2`,
    [login, email]
  );

  if (existingUser.rows.length > 0) {
    throw new AppError('Login or email already exists', 409);
  }

  const passwordHash = await hashPassword(password);

  const result = await query(
    `
      INSERT INTO users (login, email, password_hash, failed_login_attempts, blocked_until, created_at, updated_at)
      VALUES ($1, $2, $3, 0, NULL, NOW(), NOW())
      RETURNING id, login, email
    `,
    [login, email, passwordHash]
  );

  const user = result.rows[0];

  await seedSystemCategoriesForUser(user.id);
  await writeActionLog({
    userId: user.id,
    action: 'REGISTER',
    entityType: 'user',
    entityId: user.id,
  });

  const tokens = await generateAuthTokens(user);

  return { user, ...tokens };
};

export const loginUser = async (payload: { login: string; password: string }) => {
  const { login, password } = payload;

  const result = await query(`SELECT * FROM users WHERE login = $1`, [login]);
  const user = result.rows[0];

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  if (user.blocked_until && new Date(user.blocked_until) > new Date()) {
    throw new AppError('User is temporarily blocked', 403);
  }

  const isPasswordValid = await verifyPassword(password, user.password_hash);

  if (!isPasswordValid) {
    const attempts = Number(user.failed_login_attempts || 0) + 1;
    const blockedUntil = attempts >= 5 ? new Date(Date.now() + 3 * 60 * 60 * 1000) : null;

    await query(
      `
        UPDATE users
        SET failed_login_attempts = $1, blocked_until = $2, updated_at = NOW()
        WHERE id = $3
      `,
      [attempts >= 5 ? 0 : attempts, blockedUntil, user.id]
    );

    throw new AppError('Invalid credentials', 401);
  }

  await query(
    `
      UPDATE users
      SET failed_login_attempts = 0, blocked_until = NULL, updated_at = NOW()
      WHERE id = $1
    `,
    [user.id]
  );

  await writeActionLog({
    userId: user.id,
    action: 'LOGIN',
    entityType: 'user',
    entityId: user.id,
  });

  const tokens = await generateAuthTokens({
    id: user.id,
    login: user.login,
    email: user.email,
  });

  return {
    user: {
      id: user.id,
      login: user.login,
      email: user.email,
    },
    ...tokens,
  };
};

export const refreshTokens = async (refreshToken: string) => {
  return rotateRefreshToken(refreshToken);
};

export const logoutUser = async (userId: string) => {
  await query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [userId]);
  return { message: 'Logged out' };
};

export const getProfile = async (userId: string) => {
  const result = await query(
    `SELECT id, login, email, created_at, updated_at FROM users WHERE id = $1`,
    [userId]
  );
  return result.rows[0];
};

export const forgotPassword = async (email: string) => {
  const result = await query(`SELECT id, login, email FROM users WHERE email = $1`, [email]);
  const user = result.rows[0];

  if (!user) {
    return { message: 'If email exists, reset instructions sent' };
  }

  const resetToken = await createResetToken(user);
  await sendResetPasswordEmail(user.email, resetToken);

  return { message: 'If email exists, reset instructions sent' };
};

export const resetPassword = async (resetToken: string, password: string, confirmPassword: string) => {
  if (password !== confirmPassword) {
    throw new AppError('Passwords do not match', 400);
  }

  const decoded = await validateResetToken(resetToken);
  const passwordHash = await hashPassword(password);

  await query(
    `
      UPDATE users
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
    `,
    [passwordHash, decoded.id]
  );

  await query(
    `
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE user_id = $1 AND used_at IS NULL
    `,
    [decoded.id]
  );

  await writeActionLog({
    userId: decoded.id,
    action: 'RESET_PASSWORD',
    entityType: 'user',
    entityId: decoded.id,
  });

  return { message: 'Password reset successfully' };
};

export const createInviteToken = () => crypto.randomBytes(24).toString('hex');