import knex from 'knex';

export async function up(knex: any): Promise<void> {
  return knex.schema.table('playlist_tracks', (table: any) => {
    table.uuid('added_by_user_id').nullable();
    
    // Add foreign key constraint
    table.foreign('added_by_user_id').references('id').inTable('users').onDelete('SET NULL');
    
    // Add index for better query performance
    table.index(['added_by_user_id']);
  });
}

export async function down(knex: any): Promise<void> {
  return knex.schema.table('playlist_tracks', (table: any) => {
    table.dropForeign(['added_by_user_id']);
    table.dropIndex(['added_by_user_id']);
    table.dropColumn('added_by_user_id');
  });
}
