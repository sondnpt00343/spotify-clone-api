import knex from 'knex';

export async function up(knex: any): Promise<void> {
  return knex.schema.createTable('playlist_tracks', (table: any) => {
    table.uuid('id').primary();
    table.uuid('playlist_id').notNullable();
    table.uuid('track_id').notNullable();
    table.integer('position').notNullable();
    table.timestamp('added_at').defaultTo(knex.fn.now());
    
    // Foreign keys
    table.foreign('playlist_id').references('id').inTable('playlists').onDelete('CASCADE');
    table.foreign('track_id').references('id').inTable('tracks').onDelete('CASCADE');
    
    // Unique constraint to prevent duplicate tracks in same playlist
    table.unique(['playlist_id', 'track_id']);
    
    // Indexes
    table.index(['playlist_id']);
    table.index(['track_id']);
    table.index(['playlist_id', 'position']);
    table.index(['added_at']);
  });
}

export async function down(knex: any): Promise<void> {
  return knex.schema.dropTableIfExists('playlist_tracks');
} 