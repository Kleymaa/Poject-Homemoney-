import { query } from '../db';
import { SYSTEM_CATEGORIES } from '../utils/seed-categories';

export const seedSystemCategoriesForUser = async (userId: string) => {
  for (const category of SYSTEM_CATEGORIES) {
    const exists = await query(
      `
        SELECT id
        FROM categories
        WHERE user_id = $1
          AND name = $2
          AND type = $3
          AND is_system = true
          AND deleted_at IS NULL
      `,
      [userId, category.name, category.type]
    );

    if (exists.rows.length === 0) {
      await query(
        `
          INSERT INTO categories (user_id, name, type, is_system, created_at, updated_at)
          VALUES ($1, $2, $3, true, NOW(), NOW())
        `,
        [userId, category.name, category.type]
      );
    }
  }
};

export const seedSystemCategoriesForAllUsers = async () => {
  const users = await query(`SELECT id FROM users`);

  for (const user of users.rows) {
    await seedSystemCategoriesForUser(user.id);
  }
};