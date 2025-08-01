import knex from 'knex';

export async function up(knex: any): Promise<void> {
  return knex.schema.alterTable('users', (table: any) => {
    // Remove the NOT NULL constraint from username
    table.string('username', 50).nullable().alter();
  });
}

export async function down(knex: any): Promise<void> {
  return knex.schema.alterTable('users', (table: any) => {
    // Restore the NOT NULL constraint
    table.string('username', 50).notNullable().alter();
  });
} 