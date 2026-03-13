import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { AppError } from '../utils/AppError';
import { sendResetPasswordEmail } from '../services/mail.service';

const ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ||
  process.env.JWT_SECRET ||
  'access_secret';

const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'refresh_secret';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const signAccessToken = (user: { id: string; login: string; email: string }) => {
  return jwt.sign(user, ACCESS_SECRET, { expiresIn: '1h' });
};

const signRefreshToken = (user: { id: string; login: string; email: string }) => {
  return jwt.sign(user, REFRESH_SECRET, { expiresIn: '7d' });
};

const getBlockDurationMs = (level: number) => {
  if (level <= 1) return 5 * 60 * 1000; // 5 минут
  if (level === 2) return 60 * 60 * 1000; // 1 час
  if (level === 3) return 24 * 60 * 60 * 1000; // 1 день
  return 182 * 24 * 60 * 60 * 1000; // примерно 6 месяцев
};

const getBlockMessage = (level: number) => {
  if (level <= 1) {
    return 'Слишком много попыток входа. Аккаунт заблокирован на 5 минут.';
  }
  if (level === 2) {
    return 'Слишком много попыток входа. Аккаунт заблокирован на 1 час.';
  }
  if (level === 3) {
    return 'Слишком много попыток входа. Аккаунт заблокирован на 1 день.';
  }
  return 'Слишком много попыток входа. Аккаунт заблокирован на 6 месяцев.';
};

export const registerController = async (req: any, res: any, next: any) => {
  try {
    const { login, email, password } = req.body;

    if (!login?.trim()) {
      throw new AppError('Введите логин', 400);
    }

    if (!email?.trim()) {
      throw new AppError('Введите email', 400);
    }

    if (!password?.trim()) {
      throw new AppError('Введите пароль', 400);
    }

    if (password.length < 6) {
      throw new AppError('Пароль должен быть не короче 6 символов', 400);
    }

    const exists = await query(
      `
        SELECT id
        FROM users
        WHERE LOWER(TRIM(login)) = LOWER(TRIM($1))
           OR LOWER(TRIM(email)) = LOWER(TRIM($2))
        LIMIT 1
      `,
      [login.trim(), email.trim()]
    );

    if (exists.rows[0]) {
      throw new AppError('Пользователь с таким логином или email уже существует', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await query(
      `
        INSERT INTO users (
          login,
          email,
          password_hash,
          failed_login_attempts,
          blocked_until,
          login_block_level,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, 0, NULL, 0, NOW(), NOW())
        RETURNING id, login, email, avatar_url
      `,
      [login.trim(), email.trim(), passwordHash]
    );

    const user = created.rows[0];

    const safeUser = {
      id: user.id,
      login: user.login,
      email: user.email,
      avatar_url: user.avatar_url ?? null,
    };

    const accessToken = signAccessToken(safeUser);
    const refreshToken = signRefreshToken(safeUser);

    res.status(201).json({
      success: true,
      data: {
        user: safeUser,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const loginController = async (req: any, res: any, next: any) => {
  try {
    const loginOrEmail = String(
      req.body?.loginOrEmail ?? req.body?.email ?? req.body?.login ?? ''
    ).trim();
    const password = String(req.body?.password ?? '');

    if (!loginOrEmail) {
      throw new AppError('Введите логин или email', 400);
    }

    if (!password.trim()) {
      throw new AppError('Введите пароль', 400);
    }

    const found = await query(
      `
        SELECT
          id,
          login,
          email,
          password_hash,
          avatar_url,
          failed_login_attempts,
          blocked_until,
          COALESCE(login_block_level, 0) AS login_block_level
        FROM users
        WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
           OR LOWER(TRIM(login)) = LOWER(TRIM($1))
        LIMIT 1
      `,
      [loginOrEmail]
    );

    const user = found.rows[0];

    if (!user) {
      throw new AppError('Неверный логин/email или пароль', 401);
    }

    const now = new Date();

    if (user.blocked_until && new Date(user.blocked_until) > now) {
      const blockedUntil = new Date(user.blocked_until);
      const diffMs = blockedUntil.getTime() - now.getTime();
      const diffMinutes = Math.ceil(diffMs / (1000 * 60));

      throw new AppError(
        `Слишком много попыток входа. Попробуйте снова через ${diffMinutes} мин.`,
        429
      );
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      const nextAttempts = Number(user.failed_login_attempts || 0) + 1;

      if (nextAttempts >= 3) {
        const nextBlockLevel = Number(user.login_block_level || 0) + 1;
        const durationMs = getBlockDurationMs(nextBlockLevel);
        const blockedUntil = new Date(Date.now() + durationMs);

        await query(
          `
            UPDATE users
            SET
              failed_login_attempts = 0,
              blocked_until = $1,
              login_block_level = $2,
              updated_at = NOW()
            WHERE id = $3
          `,
          [blockedUntil, nextBlockLevel, user.id]
        );

        throw new AppError(getBlockMessage(nextBlockLevel), 429);
      }

      await query(
        `
          UPDATE users
          SET
            failed_login_attempts = $1,
            updated_at = NOW()
          WHERE id = $2
        `,
        [nextAttempts, user.id]
      );

      throw new AppError('Неверный логин/email или пароль', 401);
    }

    await query(
      `
        UPDATE users
        SET
          failed_login_attempts = 0,
          blocked_until = NULL,
          updated_at = NOW()
        WHERE id = $1
      `,
      [user.id]
    );

    const safeUser = {
      id: user.id,
      login: user.login,
      email: user.email,
      avatar_url: user.avatar_url ?? null,
    };

    const accessToken = signAccessToken(safeUser);
    const refreshToken = signRefreshToken(safeUser);

    res.status(200).json({
      success: true,
      data: {
        user: safeUser,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshController = async (req: any, res: any, next: any) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token отсутствует', 400);
    }

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as any;

    const found = await query(
      `
        SELECT id, login, email, avatar_url
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [decoded.id]
    );

    const user = found.rows[0];

    if (!user) {
      throw new AppError('Пользователь не найден', 404);
    }

    const accessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(new AppError('Недействительный refresh token', 401));
  }
};

export const logoutController = async (_req: any, res: any, next: any) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Выход выполнен',
    });
  } catch (error) {
    next(error);
  }
};

export const profileController = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user?.id || req.auth?.id;

    if (!userId) {
      throw new AppError('Пользователь не авторизован', 401);
    }

    const found = await query(
      `
        SELECT id, login, email, avatar_url
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [userId]
    );

    const user = found.rows[0];

    if (!user) {
      throw new AppError('Пользователь не найден', 404);
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPasswordController = async (
  req: any,
  res: any,
  next: any
) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      throw new AppError('Введите email', 400);
    }

    const userResult = await query(
      `
        SELECT id, email
        FROM users
        WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
        LIMIT 1
      `,
      [email.trim()]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Если такой email существует, письмо отправлено',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await query(
      `
        UPDATE users
        SET reset_password_token = $1,
            reset_password_expires_at = $2
        WHERE id = $3
      `,
      [resetToken, expiresAt, user.id]
    );

    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendResetPasswordEmail(user.email, resetLink);

    res.status(200).json({
      success: true,
      message: 'Если такой email существует, письмо отправлено',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPasswordController = async (
  req: any,
  res: any,
  next: any
) => {
  try {
    const { token, newPassword } = req.body;

    if (!token?.trim()) {
      throw new AppError('Некорректный токен', 400);
    }

    if (!newPassword?.trim()) {
      throw new AppError('Введите новый пароль', 400);
    }

    if (newPassword.length < 6) {
      throw new AppError('Пароль должен быть не короче 6 символов', 400);
    }

    const userResult = await query(
      `
        SELECT id, reset_password_expires_at
        FROM users
        WHERE reset_password_token = $1
        LIMIT 1
      `,
      [token]
    );

    const user = userResult.rows[0];

    if (!user) {
      throw new AppError('Токен недействителен', 400);
    }

    if (
      !user.reset_password_expires_at ||
      new Date(user.reset_password_expires_at) < new Date()
    ) {
      throw new AppError('Срок действия токена истёк', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await query(
      `
        UPDATE users
        SET
          password_hash = $1,
          reset_password_token = NULL,
          reset_password_expires_at = NULL,
          updated_at = NOW()
        WHERE id = $2
      `,
      [passwordHash, user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Пароль успешно изменён',
    });
  } catch (error) {
    next(error);
  }
};