import type { Knex } from 'knex';

export async function up(knex: any): Promise<void> {
  return knex.schema.createTable('user_queue', (table: any) => {
    table.string('id').primary();
    table.string('user_id').notNullable();
    table.string('track_id').notNullable();
    table.integer('position').notNullable();
    table.string('added_at').notNullable();
    table.string('added_by').nullable();
    table.string('context_type').nullable();
    table.string('context_id').nullable();

    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('track_id').references('id').inTable('tracks').onDelete('CASCADE');

    // Indexes
    table.index(['user_id', 'position']);
    table.index(['user_id', 'added_at']);
  });
}

export async function down(knex: any): Promise<void> {
  return knex.schema.dropTable('user_queue');
} 