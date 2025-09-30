import { TokenBlacklistModel } from '../models/TokenBlacklist';

export class TokenCleanupService {
  private static instance: TokenCleanupService;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

  private constructor() {}

  static getInstance(): TokenCleanupService {
    if (!TokenCleanupService.instance) {
      TokenCleanupService.instance = new TokenCleanupService();
    }
    return TokenCleanupService.instance;
  }

  /**
   * Start the automatic cleanup service
   */
  start(): void {
    if (this.cleanupInterval) {
      console.log('Token cleanup service is already running');
      return;
    }

    console.log('Starting token cleanup service...');
    
    // Run cleanup immediately
    this.runCleanup();

    // Schedule periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.runCleanup();
    }, this.CLEANUP_INTERVAL_MS);

    console.log(`Token cleanup service started. Running every ${this.CLEANUP_INTERVAL_MS / 1000 / 60 / 60} hours.`);
  }

  /**
   * Stop the automatic cleanup service
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('Token cleanup service stopped');
    }
  }

  /**
   * Run the cleanup process
   */
  private async runCleanup(): Promise<void> {
    try {
      console.log('Running token blacklist cleanup...');
      const deletedCount = await TokenBlacklistModel.cleanupExpiredTokens();
      
      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} expired blacklisted tokens`);
      } else {
        console.log('No expired tokens to clean up');
      }

      // Log current blacklist stats
      const stats = await TokenBlacklistModel.getStats();
      console.log('Current blacklist stats:', {
        total: stats.total,
        access_tokens: stats.byType.access,
        refresh_tokens: stats.byType.refresh
      });

    } catch (error) {
      console.error('Error during token cleanup:', error);
    }
  }

  /**
   * Manual cleanup trigger
   */
  async manualCleanup(): Promise<number> {
    console.log('Manual token cleanup triggered...');
    const deletedCount = await TokenBlacklistModel.cleanupExpiredTokens();
    console.log(`Manual cleanup completed. Removed ${deletedCount} expired tokens.`);
    return deletedCount;
  }

  /**
   * Get cleanup service status
   */
  getStatus(): {
    running: boolean;
    intervalMs: number;
    nextCleanupIn?: number;
  } {
    return {
      running: this.cleanupInterval !== null,
      intervalMs: this.CLEANUP_INTERVAL_MS,
      nextCleanupIn: this.cleanupInterval ? this.CLEANUP_INTERVAL_MS : undefined
    };
  }
}
