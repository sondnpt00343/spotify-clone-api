import knex from 'knex';

export async function up(knex: any): Promise<void> {
  return knex.schema.createTable('user_follows', (table: any) => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable();
    table.uuid('artist_id').notNullable();
    table.timestamp('followed_at').defaultTo(knex.fn.now());
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('artist_id').references('id').inTable('artists').onDelete('CASCADE');
    
    // Unique constraint to prevent duplicate follows
    table.unique(['user_id', 'artist_id']);
    
    // Indexes
    table.index(['user_id']);
    table.index(['artist_id']);
    table.index(['user_id', 'followed_at']);
  });
}

export async function down(knex: any): Promise<void> {
  return knex.schema.dropTableIfExists('user_follows');
} 