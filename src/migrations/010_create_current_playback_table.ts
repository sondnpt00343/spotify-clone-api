import knex from 'knex';

export async function up(knex: any): Promise<void> {
  return knex.schema.createTable('current_playback', (table: any) => {
    table.uuid('user_id').primary();
    table.uuid('track_id');
    table.integer('position').defaultTo(0); // seconds into track
    table.boolean('is_playing').defaultTo(false);
    table.integer('volume').defaultTo(70); // 0-100
    table.boolean('shuffle').defaultTo(false);
    table.enu('repeat_mode', ['off', 'track', 'playlist']).defaultTo('off');
    table.uuid('playlist_id'); // null if not from playlist
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('track_id').references('id').inTable('tracks').onDelete('SET NULL');
    table.foreign('playlist_id').references('id').inTable('playlists').onDelete('SET NULL');
    
    // Indexes
    table.index(['track_id']);
    table.index(['playlist_id']);
    table.index(['updated_at']);
  });
}

export async function down(knex: any): Promise<void> {
  return knex.schema.dropTableIfExists('current_playback');
} 