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
    
    logger.info(`=== REDIS CONNECTION DEBUG ===`);
    logger.info(`NODE_ENV: ${process.env.NODE_ENV}`);
    logger.info(`REDIS_URL configured: ${redisUrl ? 'YES' : 'NO'}`);
    
    if (redisUrl) {
      // Mask password in logs for security
      const maskedUrl = redisUrl.replace(/\/\/.*@/, '//***:***@');
      logger.info(`Attempting to connect to Redis: ${maskedUrl}`);
      
      this.redis = new Redis(redisUrl, {
        lazyConnect: true,
        connectTimeout: 10000,
        commandTimeout: 5000,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
      });

      this.redis.on('error', (error: any) => {
        // Only log connection errors once to avoid spam
        if (!this.connectionErrorLogged) {
          logger.error('=== REDIS CONNECTION ERROR ===');
          logger.error('Error message:', error.message);
          logger.error('Error code:', error.code);
          logger.error('Error stack:', error.stack);
          logger.error('Redis connection error - cache will be disabled');
          this.connectionErrorLogged = true;
        }
      });

      this.redis.on('connect', () => {
        logger.info('=== REDIS CONNECTION SUCCESS ===');
        logger.info('Redis connected successfully');
        this.connectionErrorLogged = false; // Reset for reconnection attempts
      });

      this.redis.on('ready', () => {
        logger.info('=== REDIS READY ===');
        logger.info('Redis is ready to accept commands');
      });

      this.redis.on('close', () => {
        logger.info('=== REDIS CONNECTION CLOSED ===');
        logger.info('Redis connection closed');
      });

      this.redis.on('reconnecting', (delay: number) => {
        logger.info(`=== REDIS RECONNECTING ===`);
        logger.info(`Redis attempting to reconnect in ${delay}ms`);
      });

      this.redis.on('end', () => {
        logger.info('=== REDIS CONNECTION ENDED ===');
        logger.info('Redis connection ended');
      });

      // Try to connect immediately and log the result
      this.redis.connect().then(() => {
        logger.info('=== REDIS CONNECT() SUCCESS ===');
        logger.info('Redis.connect() completed successfully');
      }).catch(error => {
        logger.error('=== REDIS CONNECT() FAILED ===');
        logger.error('Failed to connect to Redis:', error.message);
        logger.error('Error details:', error);
      });
    } else {
      // No Redis configured - cache will be disabled
      this.redis = null as any;
      logger.info('=== REDIS NOT CONFIGURED ===');
      logger.info('Redis not configured - caching disabled');
      logger.info('To enable caching, set REDIS_URL environment variable');
    }
    logger.info(`=== END REDIS CONNECTION DEBUG ===`);
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
      logger.debug(`Cache get skipped - Redis disabled for key: ${key}`);
      return null; // Cache disabled
    }

    try {
      const cacheKey = this.generateKey(key, prefix);
      logger.debug(`Attempting to get from cache: ${cacheKey}`);
      const cached = await this.redis.get(cacheKey);
      
      if (!cached) {
        logger.debug(`Cache miss for key: ${cacheKey}`);
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);
      
      // Check if cache is still valid
      if (Date.now() - entry.timestamp > (this.defaultTTL * 1000)) {
        logger.debug(`Cache expired for key: ${cacheKey}`);
        await this.redis.del(cacheKey);
        return null;
      }

      logger.info(`Cache hit for key: ${cacheKey}`);
      return entry.data;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set data in cache
   */
  async set<T>(key: string, data: T, options?: CacheOptions): Promise<void> {
    if (!this.redis) {
      logger.debug(`Cache set skipped - Redis disabled for key: ${key}`);
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

      logger.debug(`Attempting to set cache: ${cacheKey} with TTL: ${ttl}s`);
      await this.redis.setex(cacheKey, ttl, JSON.stringify(entry));
      logger.info(`Cache set successfully for key: ${cacheKey} with TTL: ${ttl}s`);
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
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
    logger.info('=== CACHE HEALTH CHECK START ===');
    
    if (!this.redis) {
      logger.info('Redis instance is null - cache disabled');
      logger.info('=== CACHE HEALTH CHECK END (DISABLED) ===');
      return false; // Cache disabled
    }

    try {
      logger.info('Attempting to ping Redis...');
      const result = await this.redis.ping();
      logger.info(`Redis ping result: ${result}`);
      logger.info('=== CACHE HEALTH CHECK END (SUCCESS) ===');
      return true;
    } catch (error) {
      logger.error('=== CACHE HEALTH CHECK FAILED ===');
      logger.error('Cache health check failed:', error);
      logger.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      logger.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      logger.info('=== CACHE HEALTH CHECK END (FAILED) ===');
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