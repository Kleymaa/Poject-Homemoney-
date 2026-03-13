import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('loans', {
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
    principal: {
      type: 'numeric(12,2)',
      notNull: true,
    },
    annual_rate: {
      type: 'numeric(5,2)',
      notNull: true,
    },
    term_months: {
      type: 'integer',
      notNull: true,
    },
    monthly_payment: {
      type: 'numeric(12,2)',
      notNull: true,
    },
    total_payment: {
      type: 'numeric(12,2)',
      notNull: true,
    },
    overpayment: {
      type: 'numeric(12,2)',
      notNull: true,
    },
    start_date: {
      type: 'date',
      notNull: true,
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
  pgm.dropTable('loans');
}