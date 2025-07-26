import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary();
    table.string('email', 255).notNullable().unique();
    table.string('username', 50).notNullable().unique();
    table.string('display_name', 100);
    table.string('password_hash', 255).notNullable();
    table.text('avatar_url');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['email']);
    table.index(['username']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('users');
} 