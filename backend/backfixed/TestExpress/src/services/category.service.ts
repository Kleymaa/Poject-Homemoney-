import { query } from '../db';
import { ensureAdultOwnsResource, ensureNotChild } from './permission.service';
import { writeActionLog } from '../utils/logger';
import { AppError } from '../utils/AppError';
import { seedSystemCategoriesForUser } from './seed.service';

export const createCategory = async (
  userId: string,
  payload: { name: string; type: 'income' | 'expense'; familyId?: string | null }
) => {
  await ensureNotChild(userId, payload.familyId);

  const result = await query(
    `
      INSERT INTO categories (user_id, family_id, name, type, is_system, created_at, updated_at)
      VALUES ($1, $2, $3, $4, false, NOW(), NOW())
      RETURNING *
    `,
    [userId, payload.familyId || null, payload.name, payload.type]
  );

  await writeActionLog({
    userId,
    familyId: payload.familyId || null,
    action: 'CREATE_CATEGORY',
    entityType: 'category',
    entityId: result.rows[0].id,
  });

  return result.rows[0];
};

export const getCategories = async (userId: string) => {
  const result = await query(
    `
      SELECT * FROM categories
      WHERE user_id = $1 AND deleted_at IS NULL
      ORDER BY is_system DESC, created_at DESC
    `,
    [userId]
  );

  return result.rows;
};

export const updateCategory = async (
  userId: string,
  categoryId: string,
  payload: { name?: string; type?: 'income' | 'expense' }
) => {
  const current = await query(`SELECT * FROM categories WHERE id = $1 AND deleted_at IS NULL`, [categoryId]);
  const category = current.rows[0];

  if (!category) throw new AppError('Category not found', 404);

  await ensureAdultOwnsResource(userId, category.user_id, category.family_id);

  const result = await query(
    `
      UPDATE categories
      SET name = $1, type = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `,
    [payload.name ?? category.name, payload.type ?? category.type, categoryId]
  );

  await writeActionLog({
    userId,
    familyId: category.family_id,
    action: 'UPDATE_CATEGORY',
    entityType: 'category',
    entityId: categoryId,
  });

  return result.rows[0];
};

export const deleteCategory = async (userId: string, categoryId: string) => {
  const current = await query(`SELECT * FROM categories WHERE id = $1 AND deleted_at IS NULL`, [categoryId]);
  const category = current.rows[0];

  if (!category) throw new AppError('Category not found', 404);
  if (category.is_system) throw new AppError('System category cannot be deleted', 400);

  await ensureAdultOwnsResource(userId, category.user_id, category.family_id);

  await query(`UPDATE categories SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`, [categoryId]);

  await writeActionLog({
    userId,
    familyId: category.family_id,
    action: 'DELETE_CATEGORY',
    entityType: 'category',
    entityId: categoryId,
  });

  return { message: 'Category deleted' };
};

export const seedCategories = async (userId: string) => {
  await seedSystemCategoriesForUser(userId);
  return { message: 'Seed completed' };
};