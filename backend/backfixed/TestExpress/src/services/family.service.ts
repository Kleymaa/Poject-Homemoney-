import crypto from 'crypto';
import { query } from '../db';
import { AppError } from '../utils/AppError';
import { sendFamilyInviteEmail } from './mail.service';
import { createNotification } from './notification.service';
import { writeActionLog } from '../utils/logger';
import { getUserFamilyRole } from './permission.service';

type FamilyRole = 'admin' | 'adult' | 'child';

const normalizeIncomingRole = (role?: string): FamilyRole => {
  if (role === 'child') return 'child';
  if (role === 'adult' || role === 'member') return 'adult';
  return 'adult';
};

export const createFamily = async (
  userId: string,
  payload: { name: string; description?: string }
) => {
  const familyResult = await query(
    `
      INSERT INTO families (name, description, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *
    `,
    [payload.name, payload.description || null, userId]
  );

  const family = familyResult.rows[0];

  await query(
    `
      INSERT INTO family_members (family_id, user_id, role, created_at, updated_at)
      VALUES ($1, $2, 'admin', NOW(), NOW())
    `,
    [family.id, userId]
  );

  await writeActionLog({
    userId,
    familyId: family.id,
    action: 'CREATE_FAMILY',
    entityType: 'family',
    entityId: family.id,
  });

  return family;
};

export const getMyFamily = async (userId: string) => {
  const result = await query(
    `
      SELECT f.*, fm.role AS my_role
      FROM families f
      JOIN family_members fm ON fm.family_id = f.id
      WHERE fm.user_id = $1
      LIMIT 1
    `,
    [userId]
  );

  const family = result.rows[0];

  if (!family) {
    return null;
  }

  const membersResult = await query(
    `
      SELECT
        fm.id,
        fm.family_id,
        fm.user_id,
        fm.role,
        fm.created_at,
        fm.updated_at,
        u.login,
        u.email
      FROM family_members fm
      JOIN users u ON u.id = fm.user_id
      WHERE fm.family_id = $1
      ORDER BY fm.created_at ASC
    `,
    [family.id]
  );

  const summaryResult = await query(
    `
      WITH family_users AS (
        SELECT user_id
        FROM family_members
        WHERE family_id = $1
      ),
      transaction_totals AS (
        SELECT
          COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS total_income,
          COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS total_expense
        FROM transactions t
        WHERE t.deleted_at IS NULL
          AND (
            t.family_id = $1
            OR t.user_id IN (SELECT user_id FROM family_users)
          )
      ),
      account_totals AS (
        SELECT
          COALESCE(SUM(a.balance), 0) AS total_balance
        FROM accounts a
        WHERE a.deleted_at IS NULL
          AND (
            a.family_id = $1
            OR a.user_id IN (SELECT user_id FROM family_users)
          )
      )
      SELECT
        at.total_balance,
        tt.total_income,
        tt.total_expense
      FROM account_totals at
      CROSS JOIN transaction_totals tt
    `,
    [family.id]
  );

  const familySummary = summaryResult.rows[0] || {
    total_balance: 0,
    total_income: 0,
    total_expense: 0,
  };

  return {
    id: family.id,
    name: family.name,
    description: family.description,
    myRole: family.my_role,
    members: membersResult.rows,
    familySummary: {
      balance: Number(familySummary.total_balance || 0),
      income: Number(familySummary.total_income || 0),
      expense: Number(familySummary.total_expense || 0),
    },
  };
};

export const updateFamily = async (
  userId: string,
  familyId: string,
  payload: { name: string; description?: string }
) => {
  const myRole = await getUserFamilyRole(userId, familyId);
  if (myRole !== 'admin') {
    throw new AppError('Only admin can update family', 403);
  }

  const result = await query(
    `
      UPDATE families
      SET name = $1,
          description = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `,
    [payload.name, payload.description || null, familyId]
  );

  return result.rows[0];
};

export const deleteFamily = async (userId: string, familyId: string) => {
  const myRole = await getUserFamilyRole(userId, familyId);
  if (myRole !== 'admin') {
    throw new AppError('Only admin can delete family', 403);
  }

  await query(`DELETE FROM family_members WHERE family_id = $1`, [familyId]);
  await query(`DELETE FROM families WHERE id = $1`, [familyId]);

  return { message: 'Family deleted' };
};

export const inviteMember = async (
  userId: string,
  familyId: string,
  payload: { email: string; role?: string }
) => {
  const myRole = await getUserFamilyRole(userId, familyId);
  if (myRole !== 'admin') {
    throw new AppError('Only admin can invite members', 403);
  }

  const normalizedRole = normalizeIncomingRole(payload.role);

  const token = crypto.randomBytes(24).toString('hex');

  const result = await query(
    `
      INSERT INTO family_invitations (
        family_id,
        email,
        role,
        token_hash,
        expires_at,
        created_by,
        created_at
      )
      VALUES ($1, $2, $3, $4, NOW() + INTERVAL '3 days', $5, NOW())
      RETURNING *
    `,
    [familyId, payload.email, normalizedRole, token, userId]
  );

  await sendFamilyInviteEmail(payload.email, token);

  await writeActionLog({
    userId,
    familyId,
    action: 'INVITE_MEMBER',
    entityType: 'family_invitation',
    entityId: result.rows[0].id,
  });

  return { invitation: result.rows[0], token };
};

export const acceptInvitation = async (userId: string, token: string) => {
  const result = await query(
    `
      SELECT *
      FROM family_invitations
      WHERE token_hash = $1
        AND accepted_at IS NULL
        AND expires_at > NOW()
      LIMIT 1
    `,
    [token]
  );

  const invitation = result.rows[0];

  if (!invitation) {
    throw new AppError('Invitation not found or expired', 404);
  }

  await query(
    `
      INSERT INTO family_members (family_id, user_id, role, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
    `,
    [invitation.family_id, userId, invitation.role]
  );

  await query(
    `
      UPDATE family_invitations
      SET accepted_at = NOW()
      WHERE id = $1
    `,
    [invitation.id]
  );

  await createNotification(
    userId,
    'family_invite',
    'Приглашение принято',
    'Вы вступили в семейный бюджет'
  );

  return { message: 'Invitation accepted' };
};

export const getFamilyMembers = async (userId: string, familyId: string) => {
  const myRole = await getUserFamilyRole(userId, familyId);
  if (!myRole) {
    throw new AppError('Forbidden', 403);
  }

  const result = await query(
    `
      SELECT
        fm.id,
        fm.family_id,
        fm.user_id,
        fm.role,
        fm.created_at,
        fm.updated_at,
        u.login,
        u.email
      FROM family_members fm
      JOIN users u ON u.id = fm.user_id
      WHERE fm.family_id = $1
      ORDER BY fm.created_at ASC
    `,
    [familyId]
  );

  return result.rows;
};

export const changeMemberRole = async (
  userId: string,
  familyId: string,
  memberId: string,
  role: string
) => {
  const myRole = await getUserFamilyRole(userId, familyId);
  if (myRole !== 'admin') {
    throw new AppError('Only admin can change roles', 403);
  }

  const targetResult = await query(
    `
      SELECT *
      FROM family_members
      WHERE id = $1 AND family_id = $2
      LIMIT 1
    `,
    [memberId, familyId]
  );

  const targetMember = targetResult.rows[0];

  if (!targetMember) {
    throw new AppError('Family member not found', 404);
  }

  if (targetMember.role === 'admin') {
    throw new AppError('Admin role cannot be changed', 403);
  }

  const normalizedRole = normalizeIncomingRole(role);

  const result = await query(
    `
      UPDATE family_members
      SET role = $1,
          updated_at = NOW()
      WHERE id = $2 AND family_id = $3
      RETURNING *
    `,
    [normalizedRole, memberId, familyId]
  );

  return result.rows[0];
};

export const removeMember = async (
  userId: string,
  familyId: string,
  memberId: string
) => {
  const myRole = await getUserFamilyRole(userId, familyId);
  if (myRole !== 'admin') {
    throw new AppError('Only admin can remove members', 403);
  }

  const targetResult = await query(
    `
      SELECT *
      FROM family_members
      WHERE id = $1 AND family_id = $2
      LIMIT 1
    `,
    [memberId, familyId]
  );

  const targetMember = targetResult.rows[0];

  if (!targetMember) {
    throw new AppError('Family member not found', 404);
  }

  if (targetMember.role === 'admin') {
    throw new AppError('Admin cannot be removed', 403);
  }

  await query(
    `
      DELETE FROM family_members
      WHERE id = $1 AND family_id = $2
    `,
    [memberId, familyId]
  );

  return { message: 'Member removed' };
};