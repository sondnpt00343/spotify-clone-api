import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('albums', (table) => {
    table.text('description');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('albums', (table) => {
    table.dropColumn('description');
  });
} 