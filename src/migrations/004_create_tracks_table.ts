import knex from 'knex';

export async function up(knex: any): Promise<void> {
  return knex.schema.createTable('tracks', (table: any) => {
    table.uuid('id').primary();
    table.string('title', 255).notNullable();
    table.integer('duration').notNullable(); // in seconds
    table.text('audio_url').notNullable();
    table.text('image_url');
    table.bigInteger('play_count').defaultTo(0);
    table.uuid('album_id');
    table.uuid('artist_id').notNullable();
    table.integer('track_number');
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('artist_id').references('id').inTable('artists').onDelete('CASCADE');
    table.foreign('album_id').references('id').inTable('albums').onDelete('SET NULL');
    
    // Indexes
    table.index(['artist_id']);
    table.index(['album_id']);
    table.index(['play_count']);
    table.index(['title']);
    table.index(['album_id', 'track_number']);
  });
}

export async function down(knex: any): Promise<void> {
  return knex.schema.dropTableIfExists('tracks');
} 