import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import db from '../config/database';

export interface User {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
  password_hash: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  email: string;
  username?: string;
  password: string;
  display_name?: string;
  avatar_url?: string;
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export class UserModel {
  // Find user by ID
  static async findById(id: string): Promise<User | null> {
    const users = await db('users').where({ id }).first();
    return users || null;
  }

  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    const user = await db('users').where({ email }).first();
    return user || null;
  }

  // Find user by username
  static async findByUsername(username: string): Promise<User | null> {
    const user = await db('users').where({ username }).first();
    return user || null;
  }

  // Create new user
  static async create(userData: CreateUserData): Promise<User> {
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const newUser = {
      id,
      email: userData.email,
      username: userData.username || undefined,
      display_name: userData.display_name || undefined,
      password_hash: hashedPassword,
      avatar_url: userData.avatar_url || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db('users').insert(newUser);
    return newUser;
  }

  // Update user
  static async update(id: string, userData: UpdateUserData): Promise<User | null> {
    const updateData = {
      ...userData,
      updated_at: new Date().toISOString()
    };

    await db('users').where({ id }).update(updateData);
    return this.findById(id);
  }

  // Verify password
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Change password
  static async changePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db('users').where({ id }).update({
      password_hash: hashedPassword,
      updated_at: new Date().toISOString()
    });
  }

  // Check if email exists
  static async emailExists(email: string): Promise<boolean> {
    const user = await db('users').where({ email }).first();
    return !!user;
  }

  // Check if username exists
  static async usernameExists(username: string): Promise<boolean> {
    if (!username) return false;
    const user = await db('users').where({ username }).first();
    return !!user;
  }

  // Delete user
  static async delete(id: string): Promise<void> {
    await db('users').where({ id }).del();
  }

  // Convert User to UserResponse (remove sensitive data)
  static toResponse(user: User): UserResponse {
    const { password_hash, ...userResponse } = user;
    // Response middleware will automatically convert file paths to URLs
    return userResponse;
  }

  // Get user stats (for admin/analytics)
  static async getUserStats(id: string) {
    const [playlistCount, followingCount, playHistoryCount] = await Promise.all([
      db('playlists').where({ user_id: id }).count('* as count').first(),
      db('user_follows').where({ user_id: id }).count('* as count').first(),
      db('play_history').where({ user_id: id }).count('* as count').first()
    ]);

    return {
      playlists: parseInt(playlistCount?.count as string) || 0,
      following: parseInt(followingCount?.count as string) || 0,
      plays: parseInt(playHistoryCount?.count as string) || 0
    };
  }
} 