import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { query } from '../db';
import { AppError } from '../utils/AppError';

const router = Router();
router.use(authMiddleware);

const normalizeRole = (role: string) => {
  const value = String(role || '').trim().toLowerCase();

  if (value === 'child') return 'child';
  if (value === 'adult' || value === 'member') return 'adult';

  return 'adult';
};

const getFamilyForUser = async (userId: string) => {
  const familyRes = await query(
    `
      SELECT f.*, fm.role
      FROM families f
      JOIN family_members fm ON fm.family_id = f.id
      WHERE fm.user_id = $1
      LIMIT 1
    `,
    [userId]
  );

  const family = familyRes.rows[0];
  if (!family) return null;

  const membersRes = await query(
    `
      SELECT
        fm.id,
        fm.user_id AS "userId",
        fm.user_id,
        fm.role,
        fm.created_at AS "joinedAt",
        fm.created_at AS joined_at,
        u.login,
        u.email
      FROM family_members fm
      JOIN users u ON u.id = fm.user_id
      WHERE fm.family_id = $1
      ORDER BY fm.created_at ASC
    `,
    [family.id]
  );

  const statsRes = await query(
    `
      WITH family_users AS (
        SELECT user_id
        FROM family_members
        WHERE family_id = $1
      ),
      account_stats AS (
        SELECT COALESCE(SUM(a.balance), 0) AS balance
        FROM accounts a
        WHERE a.deleted_at IS NULL
          AND (
            a.family_id = $1
            OR a.user_id IN (SELECT user_id FROM family_users)
          )
      ),
      transaction_stats AS (
        SELECT
          COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS income,
          COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS expense
        FROM transactions t
        WHERE t.deleted_at IS NULL
          AND (
            t.family_id = $1
            OR t.user_id IN (SELECT user_id FROM family_users)
          )
      ),
      member_stats AS (
        SELECT COUNT(*)::int AS members_count
        FROM family_members
        WHERE family_id = $1
      )
      SELECT
        a.balance,
        t.income,
        t.expense,
        m.members_count
      FROM account_stats a
      CROSS JOIN transaction_stats t
      CROSS JOIN member_stats m
    `,
    [family.id]
  );

  const stats = statsRes.rows[0] || {};

  const preparedStats = {
    balance: Number(stats.balance || 0),
    income: Number(stats.income || 0),
    expense: Number(stats.expense || 0),
    membersCount: Number(stats.members_count || 0),
  };

  return {
    id: family.id,
    name: family.name,
    description: family.description || '',
    role: family.role,
    members: membersRes.rows,
    stats: preparedStats,
    familySummary: {
      balance: preparedStats.balance,
      income: preparedStats.income,
      expense: preparedStats.expense,
    },
  };
};

router.get('/', async (req, res, next) => {
  try {
    const data = await getFamilyForUser((req as any).user.id);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const existing = await getFamilyForUser(userId);
    if (existing) throw new AppError('Вы уже состоите в семье', 400);

    const created = await query(
      `
        INSERT INTO families (name, description, created_by, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING *
      `,
      [
        req.body?.name?.trim() || 'Моя семья',
        req.body?.description?.trim() || '',
        userId,
      ]
    );

    await query(
      `
        INSERT INTO family_members (family_id, user_id, role, created_at)
        VALUES ($1, $2, 'admin', NOW())
      `,
      [created.rows[0].id, userId]
    );

    const data = await getFamilyForUser(userId);
    res.status(201).json({ success: true, data });
  } catch (e) {
    next(e);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const family = await getFamilyForUser(userId);
    if (!family) throw new AppError('Семья не найдена', 404);
    if (family.role !== 'admin') {
      throw new AppError('Только администратор семьи может обновлять данные', 403);
    }

    await query(
      `
        UPDATE families
        SET name = $1, description = $2
        WHERE id = $3
      `,
      [
        req.body?.name || family.name,
        req.body?.description || family.description || '',
        family.id,
      ]
    );

    const data = await getFamilyForUser(userId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
});

router.delete('/', async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const family = await getFamilyForUser(userId);
    if (!family) throw new AppError('Семья не найдена', 404);
    if (family.role !== 'admin') {
      throw new AppError('Только администратор семьи может удалить семью', 403);
    }

    await query(`DELETE FROM families WHERE id = $1`, [family.id]);
    res.json({ success: true, message: 'Семья удалена' });
  } catch (e) {
    next(e);
  }
});

router.post('/invite', async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const family = await getFamilyForUser(userId);

    if (!family) throw new AppError('Семья не найдена', 404);
    if (family.role !== 'admin') {
      throw new AppError('Только администратор семьи может приглашать участников', 403);
    }

    const emailOrLogin = String(req.body?.emailOrLogin || '').trim();
    if (!emailOrLogin) throw new AppError('Введите email или логин', 400);

    const requestedRole = String(req.body?.role || '').trim().toLowerCase();
    if (requestedRole === 'admin' || requestedRole === 'owner') {
      throw new AppError('Нельзя назначить ещё одного администратора', 403);
    }

    const role = normalizeRole(requestedRole);

    const userRes = await query(
      `
        SELECT id, login, email
        FROM users
        WHERE LOWER(login) = LOWER($1) OR LOWER(email) = LOWER($1)
        LIMIT 1
      `,
      [emailOrLogin]
    );

    const invitedUser = userRes.rows[0];
    if (!invitedUser) throw new AppError('Пользователь не найден', 404);

    const exists = await query(
      `
        SELECT id
        FROM family_members
        WHERE family_id = $1 AND user_id = $2
        LIMIT 1
      `,
      [family.id, invitedUser.id]
    );

    if (exists.rows[0]) {
      throw new AppError('Пользователь уже состоит в семье', 400);
    }

    await query(
      `
        INSERT INTO family_members (family_id, user_id, role, created_at)
        VALUES ($1, $2, $3, NOW())
      `,
      [family.id, invitedUser.id, role]
    );

    const data = await getFamilyForUser(userId);
    res.status(201).json({ success: true, data, message: 'Участник приглашён' });
  } catch (e) {
    next(e);
  }
});

router.patch('/members/:memberId/role', async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const family = await getFamilyForUser(userId);

    if (!family) throw new AppError('Семья не найдена', 404);
    if (family.role !== 'admin') {
      throw new AppError('Только администратор семьи может менять права участников', 403);
    }

    const memberRes = await query(
      `
        SELECT *
        FROM family_members
        WHERE id = $1 AND family_id = $2
        LIMIT 1
      `,
      [req.params.memberId, family.id]
    );

    const member = memberRes.rows[0];
    if (!member) throw new AppError('Участник семьи не найден', 404);

    if (member.role === 'admin') {
      throw new AppError('Роль администратора изменять нельзя', 403);
    }

    const requestedRole = String(req.body?.role || '').trim().toLowerCase();
    if (requestedRole === 'admin' || requestedRole === 'owner') {
      throw new AppError('Нельзя назначить ещё одного администратора', 403);
    }

    const nextRole = normalizeRole(requestedRole);

    await query(
      `
        UPDATE family_members
        SET role = $1
        WHERE id = $2 AND family_id = $3
      `,
      [nextRole, req.params.memberId, family.id]
    );

    const data = await getFamilyForUser(userId);
    res.json({ success: true, data, message: 'Права участника обновлены' });
  } catch (e) {
    next(e);
  }
});

router.delete('/members/:memberId', async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const family = await getFamilyForUser(userId);

    if (!family) throw new AppError('Семья не найдена', 404);
    if (family.role !== 'admin') {
      throw new AppError('Только администратор семьи может удалять участников', 403);
    }

    const memberRes = await query(
      `
        SELECT *
        FROM family_members
        WHERE id = $1 AND family_id = $2
        LIMIT 1
      `,
      [req.params.memberId, family.id]
    );

    const member = memberRes.rows[0];
    if (!member) throw new AppError('Участник семьи не найден', 404);

    if (member.role === 'admin') {
      throw new AppError('Администратора удалить нельзя', 403);
    }

    await query(
      `
        DELETE FROM family_members
        WHERE id = $1 AND family_id = $2
      `,
      [req.params.memberId, family.id]
    );

    const data = await getFamilyForUser(userId);
    res.json({ success: true, data, message: 'Участник удалён' });
  } catch (e) {
    next(e);
  }
});

router.post('/leave', async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const family = await getFamilyForUser(userId);

    if (!family) throw new AppError('Вы не состоите в семье', 400);
    if (family.role === 'admin') {
      throw new AppError('Администратор не может выйти из семьи. Сначала удалите семью.', 400);
    }

    await query(
      `
        DELETE FROM family_members
        WHERE family_id = $1 AND user_id = $2
      `,
      [family.id, userId]
    );

    res.json({ success: true, message: 'Вы вышли из семьи' });
  } catch (e) {
    next(e);
  }
});

export default router;