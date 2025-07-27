import knex from 'knex';
import path from 'path';

type KnexConfig = Parameters<typeof knex>[0];

const config: { [key: string]: KnexConfig } = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './database.sqlite'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './src/migrations',
      extension: 'ts'
    },
    seeds: {
      directory: './src/seeds',
      extension: 'ts'
    },
    pool: {
      afterCreate: (conn: any, cb: any) => {
        conn.run('PRAGMA foreign_keys = ON', cb);
      }
    }
  },

  test: {
    client: 'sqlite3',
    connection: {
      filename: ':memory:'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './src/migrations',
      extension: 'ts'
    },
    seeds: {
      directory: './src/seeds',
      extension: 'ts'
    },
    pool: {
      afterCreate: (conn: any, cb: any) => {
        conn.run('PRAGMA foreign_keys = ON', cb);
      }
    }
  },

  production: {
    client: 'sqlite3',
    connection: {
      filename: process.env.DATAAPP_URL || './production.sqlite'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './dist/migrations',
      extension: 'js'
    },
    seeds: {
      directory: './dist/seeds',
      extension: 'js'
    },
    pool: {
      min: 2,
      max: 10,
      afterCreate: (conn: any, cb: any) => {
        conn.run('PRAGMA foreign_keys = ON', cb);
      }
    }
  }
};

export default config; 