import knex from 'knex';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: any): Promise<void> {
  // Deletes ALL existing entries
  await knex('users').del();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Insert seed entries
  await knex('users').insert([
    {
      id: uuidv4(),
      email: 'admin@spotify.com',
      username: 'admin',
      display_name: 'Admin User',
      password_hash: hashedPassword,
      avatar_url: 'https://via.placeholder.com/150x150/1db954/ffffff?text=AD'
    },
    {
      id: uuidv4(),
      email: 'user1@spotify.com',
      username: 'musiclover',
      display_name: 'Music Lover',
      password_hash: hashedPassword,
      avatar_url: 'https://via.placeholder.com/150x150/1db954/ffffff?text=ML'
    },
    {
      id: uuidv4(),
      email: 'user2@spotify.com',
      username: 'beatdrop',
      display_name: 'Beat Drop',
      password_hash: hashedPassword,
      avatar_url: 'https://via.placeholder.com/150x150/1db954/ffffff?text=BD'
    }
  ]);
} 