import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authMiddleware } from '../middleware/auth.middleware';
import { query } from '../db';
import { AppError } from '../utils/AppError';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const result = await query(
      `SELECT id, login, email, avatar_url, created_at, updated_at FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    res.json({ success: true, data: result.rows[0] || null });
  } catch (e) {
    next(e);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const current = await query(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [userId]);
    const user = current.rows[0];
    if (!user) throw new AppError('Пользователь не найден', 404);

    const login = req.body?.login?.trim() || user.login;
    const email = req.body?.email?.trim() || user.email;

    const updated = await query(
      `UPDATE users SET login = $1, email = $2, updated_at = NOW() WHERE id = $3 RETURNING id, login, email, avatar_url, created_at, updated_at`,
      [login, email, userId]
    );
    res.json({ success: true, data: updated.rows[0] });
  } catch (e) {
    next(e);
  }
});

router.put('/password', async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const { currentPassword = '', newPassword = '' } = req.body || {};
    const current = await query(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [userId]);
    const user = current.rows[0];
    if (!user) throw new AppError('Пользователь не найден', 404);
    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) throw new AppError('Текущий пароль указан неверно', 400);
    if (String(newPassword).trim().length < 6) throw new AppError('Новый пароль должен быть не короче 6 символов', 400);
    const passwordHash = await bcrypt.hash(String(newPassword), 10);
    await query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [passwordHash, userId]);
    res.json({ success: true, message: 'Пароль успешно изменён' });
  } catch (e) {
    next(e);
  }
});

export default router;
