import { Redis } from 'ioredis';

// Simple logger for cache operations
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[CACHE INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[CACHE ERROR] ${message}`, ...args),
  debug: (message: string, ...args: any[]) => console.log(`[CACHE DEBUG] ${message}`, ...args),
};

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Cache key prefix
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string; // For cache invalidation
}

export class CacheService {
  private redis: Redis;
  private defaultTTL: number = 300; // 5 minutes default
  private version: string = '1.0.0'; // Cache version for invalidation
  private connectionErrorLogged: boolean = false;

  constructor() {
    // Use REDIS_URL for production (like DATABASE_URL) or fallback to localhost for development
    const redisUrl = process.env.REDIS_URL || (process.env.NODE_ENV === 'production' ? null : 'redis://localhost:6379');
    
    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        lazyConnect: true,
      });

      this.redis.on('error', (error: any) => {
        // Only log connection errors once to avoid spam
        if (!this.connectionErrorLogged) {
          logger.error('Redis connection error - cache will be disabled:', error.message);
          this.connectionErrorLogged = true;
        }
      });

      this.redis.on('connect', () => {
        logger.info('Redis connected successfully');
      });
    } else {
      // No Redis configured - cache will be disabled
      this.redis = null as any;
      logger.info('Redis not configured - caching disabled');
    }
  }

  /**
   * Generate a cache key with prefix and version
   */
  private generateKey(key: string, prefix?: string): string {
    const keyPrefix = prefix || 'volley';
    return `${keyPrefix}:${this.version}:${key}`;
  }

  /**
   * Get data from cache
   */
  async get<T>(key: string, prefix?: string): Promise<T | null> {
    if (!this.redis) {
      return null; // Cache disabled
    }

    try {
      const cacheKey = this.generateKey(key, prefix);
      const cached = await this.redis.get(cacheKey);
      
      if (!cached) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);
      
      // Check if cache is still valid
      if (Date.now() - entry.timestamp > (this.defaultTTL * 1000)) {
        await this.redis.del(cacheKey);
        return null;
      }

      logger.debug(`Cache hit for key: ${cacheKey}`);
      return entry.data;
    } catch (error) {
      // Don't log every cache get error to avoid spam
      return null;
    }
  }

  /**
   * Set data in cache
   */
  async set<T>(key: string, data: T, options?: CacheOptions): Promise<void> {
    if (!this.redis) {
      return; // Cache disabled
    }

    try {
      const cacheKey = this.generateKey(key, options?.prefix);
      const ttl = options?.ttl || this.defaultTTL;
      
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: this.version,
      };

      await this.redis.setex(cacheKey, ttl, JSON.stringify(entry));
      logger.debug(`Cache set for key: ${cacheKey} with TTL: ${ttl}s`);
    } catch (error) {
      // Don't log every cache set error to avoid spam
    }
  }

  /**
   * Delete specific cache key
   */
  async del(key: string, prefix?: string): Promise<void> {
    if (!this.redis) {
      return; // Cache disabled
    }

    try {
      const cacheKey = this.generateKey(key, prefix);
      await this.redis.del(cacheKey);
      logger.debug(`Cache deleted for key: ${cacheKey}`);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  /**
   * Invalidate all cache entries with a specific prefix
   */
  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.redis) {
      return; // Cache disabled
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.debug(`Invalidated ${keys.length} cache entries with pattern: ${pattern}`);
      }
    } catch (error) {
      logger.error('Cache pattern invalidation error:', error);
    }
  }

  /**
   * Invalidate all cache entries for a specific entity type
   */
  async invalidateEntity(entityType: string): Promise<void> {
    const pattern = `volley:${this.version}:${entityType}:*`;
    await this.invalidatePattern(pattern);
  }

  /**
   * Invalidate all cache entries
   */
  async invalidateAll(): Promise<void> {
    try {
      const pattern = `volley:${this.version}:*`;
      await this.invalidatePattern(pattern);
      logger.info('All cache entries invalidated');
    } catch (error) {
      logger.error('Cache invalidation error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ keys: number; memory: string }> {
    if (!this.redis) {
      return { keys: 0, memory: 'cache disabled' };
    }

    try {
      const info = await this.redis.info('memory');
      const keys = await this.redis.dbsize();
      
      // Parse memory info
      const memoryMatch = info.match(/used_memory_human:(\S+)/);
      const memory = memoryMatch ? memoryMatch[1] : 'unknown';
      
      return { keys, memory };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return { keys: 0, memory: 'unknown' };
    }
  }

  /**
   * Health check for cache service
   */
  async healthCheck(): Promise<boolean> {
    if (!this.redis) {
      return false; // Cache disabled
    }

    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      logger.error('Cache health check failed:', error);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService(); 