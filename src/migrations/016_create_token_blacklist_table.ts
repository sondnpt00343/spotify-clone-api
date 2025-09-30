import knex from 'knex';

export async function up(knex: any): Promise<void> {
  return knex.schema.createTable('token_blacklist', (table: any) => {
    table.uuid('id').primary();
    table.text('token_hash').notNullable().unique(); // Store hash of token for security
    table.uuid('user_id').notNullable();
    table.timestamp('expires_at').notNullable();
    table.string('token_type', 20).notNullable().defaultTo('access'); // 'access' or 'refresh'
    table.string('reason', 100).defaultTo('logout'); // 'logout', 'password_change', 'revoked', etc.
    table.timestamps(true, true);
    
    // Foreign key
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index(['token_hash']);
    table.index(['user_id']);
    table.index(['expires_at']);
    table.index(['token_type']);
  });
}

export async function down(knex: any): Promise<void> {
  return knex.schema.dropTableIfExists('token_blacklist');
}
