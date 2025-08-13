import knex from 'knex';

export async function up(knex: any): Promise<void> {
  return knex.schema.alterTable('albums', (table: any) => {
    table.text('description');
  });
}

export async function down(knex: any): Promise<void> {
  return knex.schema.alterTable('albums', (table: any) => {
    table.dropColumn('description');
  });
} 