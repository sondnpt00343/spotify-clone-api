import knex from 'knex';

export async function up(knex: any): Promise<void> {
  return knex.schema.createTable('playlists', (table: any) => {
    table.uuid('id').primary();
    table.string('name', 255).notNullable();
    table.text('description');
    table.text('image_url');
    table.boolean('is_public').defaultTo(true);
    table.uuid('user_id').notNullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index(['user_id']);
    table.index(['is_public']);
    table.index(['name']);
    table.index(['user_id', 'created_at']);
  });
}

export async function down(knex: any): Promise<void> {
  return knex.schema.dropTableIfExists('playlists');
} 