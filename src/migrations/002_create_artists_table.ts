import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('artists', (table) => {
    table.uuid('id').primary();
    table.string('name', 255).notNullable();
    table.text('bio');
    table.text('image_url');
    table.text('background_image_url');
    table.integer('monthly_listeners').defaultTo(0);
    table.boolean('is_verified').defaultTo(false);
    table.timestamps(true, true);
    
    // Indexes
    table.index(['name']);
    table.index(['is_verified']);
    table.index(['monthly_listeners']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('artists');
} 