import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('transactions', {
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
    account_id: {
      type: 'uuid',
      notNull: true,
      references: 'accounts(id)',
      onDelete: 'CASCADE',
    },
    category_id: {
      type: 'uuid',
      notNull: true,
      references: 'categories(id)',
      onDelete: 'CASCADE',
    },
    type: {
      type: 'varchar(20)',
      notNull: true,
    },
    amount: {
      type: 'numeric(12,2)',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    transaction_date: {
      type: 'timestamp',
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

  pgm.addConstraint(
    'transactions',
    'transactions_type_check',
    `CHECK (type IN ('income', 'expense'))`
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('transactions');
}