import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // SQLite doesn't support ALTER COLUMN, so we need to recreate the table
  
  // 1. Create new table with nullable audio_url
  await knex.schema.createTable('tracks_new', (table) => {
    table.string('id').primary();
    table.string('title').notNullable();
    table.integer('duration').notNullable();
    table.string('audio_url').nullable(); // Make nullable
    table.string('image_url').nullable();
    table.integer('play_count').defaultTo(0);
    table.string('album_id').nullable();
    table.string('artist_id').notNullable();
    table.integer('track_number').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Foreign key constraints
    table.foreign('album_id').references('id').inTable('albums').onDelete('SET NULL');
    table.foreign('artist_id').references('id').inTable('artists').onDelete('CASCADE');
    
    // Indexes
    table.index('artist_id');
    table.index('album_id');
    table.index('created_at');
  });

  // 2. Copy data from old table to new table
  await knex.raw(`
    INSERT INTO tracks_new (id, title, duration, audio_url, image_url, play_count, album_id, artist_id, track_number, created_at, updated_at)
    SELECT id, title, duration, audio_url, image_url, play_count, album_id, artist_id, track_number, created_at, updated_at
    FROM tracks
  `);

  // 3. Drop old table
  await knex.schema.dropTable('tracks');

  // 4. Rename new table to original name
  await knex.schema.renameTable('tracks_new', 'tracks');
}

export async function down(knex: Knex): Promise<void> {
  // Reverse: make audio_url NOT NULL again
  
  // 1. Create table with NOT NULL audio_url
  await knex.schema.createTable('tracks_old', (table) => {
    table.string('id').primary();
    table.string('title').notNullable();
    table.integer('duration').notNullable();
    table.string('audio_url').notNullable(); // Back to NOT NULL
    table.string('image_url').nullable();
    table.integer('play_count').defaultTo(0);
    table.string('album_id').nullable();
    table.string('artist_id').notNullable();
    table.integer('track_number').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Foreign key constraints
    table.foreign('album_id').references('id').inTable('albums').onDelete('SET NULL');
    table.foreign('artist_id').references('id').inTable('artists').onDelete('CASCADE');
    
    // Indexes
    table.index('artist_id');
    table.index('album_id');
    table.index('created_at');
  });

  // 2. Copy data (excluding rows with null audio_url)
  await knex.raw(`
    INSERT INTO tracks_old (id, title, duration, audio_url, image_url, play_count, album_id, artist_id, track_number, created_at, updated_at)
    SELECT id, title, duration, audio_url, image_url, play_count, album_id, artist_id, track_number, created_at, updated_at
    FROM tracks
    WHERE audio_url IS NOT NULL
  `);

  // 3. Drop current table
  await knex.schema.dropTable('tracks');

  // 4. Rename back
  await knex.schema.renameTable('tracks_old', 'tracks');
}
