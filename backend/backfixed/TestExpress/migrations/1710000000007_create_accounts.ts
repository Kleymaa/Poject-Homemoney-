import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('accounts', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
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
    balance: {
      type: 'numeric(12,2)',
      notNull: true,
      default: 0,
    },
    currency: {
      type: 'varchar(10)',
      notNull: true,
      default: 'RUB',
    },
    is_archived: {
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
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('accounts');
}