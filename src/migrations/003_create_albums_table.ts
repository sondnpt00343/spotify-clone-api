import knex from 'knex';

export async function up(knex: any): Promise<void> {
  return knex.schema.createTable('albums', (table: any) => {
    table.uuid('id').primary();
    table.string('title', 255).notNullable();
    table.text('cover_image_url');
    table.date('release_date');
    table.uuid('artist_id').notNullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('artist_id').references('id').inTable('artists').onDelete('CASCADE');
    
    // Indexes
    table.index(['artist_id']);
    table.index(['release_date']);
    table.index(['title']);
  });
}

export async function down(knex: any): Promise<void> {
  return knex.schema.dropTableIfExists('albums');
} 