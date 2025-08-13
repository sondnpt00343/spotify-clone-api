import knex from 'knex';

export async function up(knex: any): Promise<void> {
  return knex.schema.createTable('user_library', (table: any) => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable();
    table.enu('item_type', ['track', 'album', 'playlist', 'artist']).notNullable();
    table.uuid('item_id').notNullable();
    table.timestamp('saved_at').defaultTo(knex.fn.now());
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Unique constraint to prevent duplicate saves
    table.unique(['user_id', 'item_type', 'item_id']);
    
    // Indexes
    table.index(['user_id']);
    table.index(['user_id', 'item_type']);
    table.index(['user_id', 'item_type', 'saved_at']);
    table.index(['item_type', 'item_id']);
  });
}

export async function down(knex: any): Promise<void> {
  return knex.schema.dropTableIfExists('user_library');
} 