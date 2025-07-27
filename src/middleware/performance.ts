import { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import NodeCache from 'node-cache';

// Initialize cache with 1 hour TTL by default
const cache = new NodeCache({ 
  stdTTL: 3600, // 1 hour
  checkperiod: 600, // Check expired keys every 10 minutes
  useClones: false // Better performance for large objects
});

// Cache configuration for different types of data
const CACHE_CONFIGS = {
  search: { ttl: 900, prefix: 'search:' }, // 15 minutes for search results
  trending: { ttl: 1800, prefix: 'trending:' }, // 30 minutes for trending data
  artist: { ttl: 3600, prefix: 'artist:' }, // 1 hour for artist data
  album: { ttl: 3600, prefix: 'album:' }, // 1 hour for album data
  track: { ttl: 1800, prefix: 'track:' }, // 30 minutes for track data
  playlist: { ttl: 600, prefix: 'playlist:' }, // 10 minutes for playlist data (more dynamic)
  user: { ttl: 300, prefix: 'user:' } // 5 minutes for user data (frequently updated)
};

// Response compression middleware
export const compressionMiddleware = compression({
  filter: (req, res) => {
    // Don't compress responses if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Only compress JSON and text responses
    return compression.filter(req, res);
  },
  level: 6, // Compression level (1-9, 6 is good balance)
  threshold: 1024, // Only compress responses larger than 1KB
  chunkSize: 1024 * 16 // 16KB chunks
});

// Cache key generator
export const generateCacheKey = (prefix: string, ...parts: string[]): string => {
  return `${prefix}${parts.join(':')}`;
};

// Generic cache middleware
export const cacheMiddleware = (
  type: keyof typeof CACHE_CONFIGS,
  keyGenerator?: (req: Request) => string
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for authenticated requests that might have user-specific data
    if (req.headers.authorization && ['playlist', 'user'].includes(type)) {
      return next();
    }

    const config = CACHE_CONFIGS[type];
    const key = keyGenerator 
      ? generateCacheKey(config.prefix, keyGenerator(req))
      : generateCacheKey(config.prefix, req.originalUrl);

    // Try to get from cache
    const cachedResponse = cache.get(key);
    if (cachedResponse) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', `public, max-age=${config.ttl}`);
      return res.json(cachedResponse);
    }

    // Store original json method
    const originalJson = res.json;

    // Override json method to cache the response
    res.json = function(body: any) {
      // Cache successful responses only
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, body, config.ttl);
      }
      
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('Cache-Control', `public, max-age=${config.ttl}`);
      
      // Call original json method
      return originalJson.call(this, body);
    };

    return next();
  };
};

// Search-specific cache middleware
export const searchCacheMiddleware = cacheMiddleware('search', (req) => {
  const query = req.query.q as string;
  const type = req.query.type as string || 'all';
  const limit = req.query.limit as string || '20';
  return `${query}:${type}:${limit}`;
});

// Trending cache middleware
export const trendingCacheMiddleware = cacheMiddleware('trending', (req) => {
  const limit = req.query.limit as string || '10';
  return `trending:${limit}`;
});

// Artist cache middleware
export const artistCacheMiddleware = cacheMiddleware('artist', (req) => {
  const artistId = req.params.id || req.params.artistId;
  const action = req.path.split('/').pop() || 'details';
  return `${artistId}:${action}`;
});

// Album cache middleware
export const albumCacheMiddleware = cacheMiddleware('album', (req) => {
  const albumId = req.params.id || req.params.albumId;
  const action = req.path.split('/').pop() || 'details';
  return `${albumId}:${action}`;
});

// Track cache middleware
export const trackCacheMiddleware = cacheMiddleware('track', (req) => {
  const trackId = req.params.id || req.params.trackId;
  const action = req.path.split('/').pop() || 'details';
  return `${trackId}:${action}`;
});

// Response time middleware
export const responseTimeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Store original end method
  const originalEnd = res.end;
  
  // Override end method to set header before response is sent
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - startTime;
    
    // Set header before ending response (only if headers not sent)
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${duration}ms`);
    }
    
    // Log slow responses (> 1 second)
    if (duration > 1000) {
      console.warn(`Slow response: ${req.method} ${req.originalUrl} - ${duration}ms`);
    }
    
    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Request size limiter
export const requestSizeLimiter = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];
    
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength);
      const maxSizeInBytes = parseSize(maxSize);
      
      if (sizeInBytes > maxSizeInBytes) {
        return res.status(413).json({
          error: {
            code: 'REQUEST_TOO_LARGE',
            message: `Request size ${formatBytes(sizeInBytes)} exceeds limit of ${maxSize}`
          }
        });
      }
    }
    
    return next();
  };
};

// Parse size string to bytes
const parseSize = (size: string): number => {
  const units: { [key: string]: number } = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)(b|kb|mb|gb)$/);
  if (!match || match.length < 3) return 0;
  
  const value = parseFloat(match[1] || '0');
  const unit = match[2] || 'b';
  
  return value * (units[unit] || 1);
};

// Format bytes to human readable
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Cache statistics middleware
export const cacheStatsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/api/cache/stats' && req.method === 'GET') {
    const stats = cache.getStats();
    const keys = cache.keys();
    
    // Group keys by prefix
    const keysByType: { [key: string]: number } = {};
    keys.forEach((key: string) => {
      const parts = key.split(':');
      const prefix = (parts[0] || 'unknown') + ':';
      keysByType[prefix] = (keysByType[prefix] || 0) + 1;
    });
    
    return res.json({
      cache_stats: {
        ...stats,
        total_keys: keys.length,
        keys_by_type: keysByType,
        memory_usage: process.memoryUsage()
      }
    });
  }
  
  return next();
};

// Cache clear middleware (for admin use)
export const cacheClearMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/api/cache/clear' && req.method === 'POST') {
    const { type } = req.body as { type?: string };
    
    if (type && typeof type === 'string' && CACHE_CONFIGS[type as keyof typeof CACHE_CONFIGS]) {
      // Clear specific type
      const config = CACHE_CONFIGS[type as keyof typeof CACHE_CONFIGS];
      const keys = cache.keys().filter((key: string) => key.startsWith(config.prefix));
      cache.del(keys);
      
      return res.json({
        message: `Cleared ${keys.length} cache entries for type: ${type}`,
        cleared_keys: keys.length
      });
    } else {
      // Clear all cache
      const clearedKeys = cache.keys().length;
      cache.flushAll();
      
      return res.json({
        message: 'All cache cleared',
        cleared_keys: clearedKeys
      });
    }
  }
  
  return next();
};

// Pagination optimization
export const paginationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100); // Max 100 items
  const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
  
  req.query.limit = limit.toString();
  req.query.offset = offset.toString();
  
  next();
};

// Database connection optimization
export const dbOptimizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Add query optimization hints to request
  req.dbHints = {
    useIndex: true,
    limit: parseInt(req.query.limit as string) || 20,
    selectOnly: true // Only select needed fields
  };
  
  next();
};

// Health check with performance metrics
export const performanceHealthCheck = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/health/performance' && req.method === 'GET') {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: formatBytes(memoryUsage.rss),
        heapTotal: formatBytes(memoryUsage.heapTotal),
        heapUsed: formatBytes(memoryUsage.heapUsed),
        external: formatBytes(memoryUsage.external)
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      cache: {
        keys: cache.keys().length,
        stats: cache.getStats()
      }
    });
  }
  
  return next();
};

// Extend Request interface
declare module 'express-serve-static-core' {
  interface Request {
    dbHints?: {
      useIndex: boolean;
      limit: number;
      selectOnly: boolean;
    };
  }
}

export {
  cache,
  CACHE_CONFIGS
};

export default {
  compressionMiddleware,
  cacheMiddleware,
  searchCacheMiddleware,
  trendingCacheMiddleware,
  artistCacheMiddleware,
  albumCacheMiddleware,
  trackCacheMiddleware,
  responseTimeMiddleware,
  requestSizeLimiter,
  cacheStatsMiddleware,
  cacheClearMiddleware,
  paginationMiddleware,
  dbOptimizationMiddleware,
  performanceHealthCheck,
  cache
}; 