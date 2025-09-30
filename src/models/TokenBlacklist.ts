import db from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export interface TokenBlacklistEntry {
  id: string;
  token_hash: string;
  user_id: string;
  expires_at: Date;
  token_type: 'access' | 'refresh';
  reason: string;
  created_at: Date;
  updated_at: Date;
}

export class TokenBlacklistModel {
  /**
   * Hash a token for secure storage
   */
  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Extract expiration date from JWT token
   */
  private static getTokenExpiration(token: string): Date {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000); // Convert from seconds to milliseconds
      }
      // If no expiration, default to 24 hours from now
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    } catch (error) {
      // If token is invalid, default to 24 hours from now
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Add a token to the blacklist
   */
  static async blacklistToken(
    token: string,
    userId: string,
    tokenType: 'access' | 'refresh' = 'access',
    reason: string = 'logout'
  ): Promise<TokenBlacklistEntry> {
    const tokenHash = this.hashToken(token);
    const expiresAt = this.getTokenExpiration(token);
    
    const entry: Omit<TokenBlacklistEntry, 'created_at' | 'updated_at'> = {
      id: uuidv4(),
      token_hash: tokenHash,
      user_id: userId,
      expires_at: expiresAt,
      token_type: tokenType,
      reason
    };

    await db('token_blacklist').insert(entry);
    
    // Return the created entry with timestamps
    const created = await db('token_blacklist')
      .where({ id: entry.id })
      .first();
    
    return created;
  }

  /**
   * Check if a token is blacklisted
   */
  static async isTokenBlacklisted(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);
    
    const entry = await db('token_blacklist')
      .where({ token_hash: tokenHash })
      .andWhere('expires_at', '>', new Date())
      .first();
    
    return !!entry;
  }

  /**
   * Blacklist all tokens for a user (useful for password change, account suspension)
   */
  static async blacklistAllUserTokens(
    userId: string,
    reason: string = 'security_action'
  ): Promise<void> {
    // We can't blacklist all tokens without knowing them, but we can:
    // 1. Set a user-level token invalidation timestamp
    // 2. Or require re-authentication for sensitive actions
    
    // For now, we'll add a marker entry to indicate all tokens before this time are invalid
    const entry = {
      id: uuidv4(),
      token_hash: `user_invalidation_${userId}_${Date.now()}`,
      user_id: userId,
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      token_type: 'access' as const,
      reason
    };

    await db('token_blacklist').insert(entry);
  }

  /**
   * Clean up expired blacklisted tokens
   */
  static async cleanupExpiredTokens(): Promise<number> {
    const deletedCount = await db('token_blacklist')
      .where('expires_at', '<', new Date())
      .del();
    
    return deletedCount;
  }

  /**
   * Get blacklisted tokens for a user
   */
  static async getUserBlacklistedTokens(userId: string): Promise<TokenBlacklistEntry[]> {
    return await db('token_blacklist')
      .where({ user_id: userId })
      .andWhere('expires_at', '>', new Date())
      .orderBy('created_at', 'desc');
  }

  /**
   * Remove a specific token from blacklist (for token refresh scenarios)
   */
  static async removeFromBlacklist(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);
    
    const deletedCount = await db('token_blacklist')
      .where({ token_hash: tokenHash })
      .del();
    
    return deletedCount > 0;
  }

  /**
   * Get blacklist statistics
   */
  static async getStats(): Promise<{
    total: number;
    byType: { access: number; refresh: number };
    byReason: Record<string, number>;
  }> {
    const total = await db('token_blacklist')
      .where('expires_at', '>', new Date())
      .count('* as count')
      .first();

    const byType = await db('token_blacklist')
      .where('expires_at', '>', new Date())
      .select('token_type')
      .count('* as count')
      .groupBy('token_type');

    const byReason = await db('token_blacklist')
      .where('expires_at', '>', new Date())
      .select('reason')
      .count('* as count')
      .groupBy('reason');

    return {
      total: parseInt(total?.count as string) || 0,
      byType: {
        access: parseInt(byType.find(t => t.token_type === 'access')?.count as string) || 0,
        refresh: parseInt(byType.find(t => t.token_type === 'refresh')?.count as string) || 0
      },
      byReason: byReason.reduce((acc: Record<string, number>, item: any) => {
        if (item.reason) {
          acc[item.reason] = parseInt(item.count as string);
        }
        return acc;
      }, {})
    };
  }
}
