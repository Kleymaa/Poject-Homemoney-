import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns('users', {
    reset_password_token: { type: 'text' },
    reset_password_expires_at: { type: 'timestamp' },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns('users', ['reset_password_token', 'reset_password_expires_at']);
}
