import knex from 'knex';

export async function up(knex: any): Promise<void> {
  return knex.schema.createTable('play_history', (table: any) => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable();
    table.uuid('track_id').notNullable();
    table.timestamp('played_at').defaultTo(knex.fn.now());
    table.integer('play_duration'); // seconds actually played
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('track_id').references('id').inTable('tracks').onDelete('CASCADE');
    
    // Indexes
    table.index(['user_id']);
    table.index(['track_id']);
    table.index(['user_id', 'played_at']);
    table.index(['played_at']);
  });
}

export async function down(knex: any): Promise<void> {
  return knex.schema.dropTableIfExists('play_history');
} 