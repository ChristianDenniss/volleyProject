import { cacheService } from './cache.js';

export interface CacheableServiceOptions {
  entityType: string;
  defaultTTL?: number;
  cachePrefix?: string;
}

export abstract class CacheableService {
  protected entityType: string;
  protected defaultTTL: number;
  protected cachePrefix: string;

  constructor(options: CacheableServiceOptions) {
    this.entityType = options.entityType;
    this.defaultTTL = options.defaultTTL || 300; // 5 minutes default
    this.cachePrefix = options.cachePrefix || options.entityType;
  }

  /**
   * Generate a cache key for a specific entity
   */
  protected generateCacheKey(id: number | string, suffix?: string): string {
    const baseKey = `${this.entityType}:${id}`;
    return suffix ? `${baseKey}:${suffix}` : baseKey;
  }

  /**
   * Get data from cache or fetch from database
   */
  protected async getCachedOrFetch<T>(
    cacheKey: string,
    fetchFunction: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await cacheService.get<T>(cacheKey, this.cachePrefix);
      if (cached) {
        return cached;
      }

      // If not in cache, fetch from database
      const data = await fetchFunction();
      
      // Cache the result
      await cacheService.set(cacheKey, data, {
        ttl: ttl || this.defaultTTL,
        prefix: this.cachePrefix
      });

      return data;
    } catch (error) {
      console.error(`Cache operation failed for ${cacheKey}:`, error);
      // Fallback to direct database fetch
      return await fetchFunction();
    }
  }

  /**
   * Invalidate cache for a specific entity
   */
  protected async invalidateEntityCache(id?: number | string): Promise<void> {
    try {
      if (id) {
        // Invalidate specific entity cache
        const cacheKey = this.generateCacheKey(id);
        await cacheService.del(cacheKey, this.cachePrefix);
      } else {
        // Invalidate all cache for this entity type
        await cacheService.invalidateEntity(this.entityType);
      }
    } catch (error) {
      console.error(`Failed to invalidate cache for ${this.entityType}:`, error);
    }
  }

  /**
   * Invalidate all cache for this service
   */
  protected async invalidateAllCache(): Promise<void> {
    try {
      await cacheService.invalidateEntity(this.entityType);
    } catch (error) {
      console.error(`Failed to invalidate all cache for ${this.entityType}:`, error);
    }
  }

  /**
   * Cache a list of entities with pagination support
   */
  protected async getCachedList<T>(
    cacheKey: string,
    fetchFunction: () => Promise<T[]>,
    ttl?: number
  ): Promise<T[]> {
    return this.getCachedOrFetch(cacheKey, fetchFunction, ttl);
  }

  /**
   * Cache a single entity by ID
   */
  protected async getCachedById<T>(
    id: number,
    fetchFunction: () => Promise<T | null>,
    ttl?: number
  ): Promise<T | null> {
    const cacheKey = this.generateCacheKey(id);
    return this.getCachedOrFetch(cacheKey, fetchFunction, ttl);
  }

  /**
   * Cache entities by a specific field
   */
  protected async getCachedByField<T>(
    field: string,
    value: string | number,
    fetchFunction: () => Promise<T[]>,
    ttl?: number
  ): Promise<T[]> {
    const cacheKey = this.generateCacheKey(`${field}:${value}`);
    return this.getCachedOrFetch(cacheKey, fetchFunction, ttl);
  }

  /**
   * Cache complex queries with parameters
   */
  protected async getCachedQuery<T>(
    queryName: string,
    params: Record<string, any>,
    fetchFunction: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const paramString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    
    const cacheKey = this.generateCacheKey(`${queryName}:${paramString}`);
    return this.getCachedOrFetch(cacheKey, fetchFunction, ttl);
  }
} 