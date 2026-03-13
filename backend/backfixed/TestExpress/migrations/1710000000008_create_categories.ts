import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('categories', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    family_id: {
      type: 'uuid',
      references: 'families(id)',
      onDelete: 'SET NULL',
    },
    name: {
      type: 'varchar(100)',
      notNull: true,
    },
    type: {
      type: 'varchar(20)',
      notNull: true,
    },
    is_system: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    deleted_at: {
      type: 'timestamp',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  pgm.addConstraint(
    'categories',
    'categories_type_check',
    `CHECK (type IN ('income', 'expense'))`
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('categories');
}