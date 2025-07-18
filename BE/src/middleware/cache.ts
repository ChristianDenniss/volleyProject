import { Request, Response, NextFunction } from 'express';
import { cacheService, CacheOptions } from '../utils/cache.js';

export interface CacheMiddlewareOptions extends CacheOptions {
  key?: string | ((req: Request) => string); // Custom cache key function
  condition?: (req: Request) => boolean; // Condition to check if request should be cached
}

/**
 * Generate a cache key from the request
 */
function generateCacheKey(req: Request): string {
  const { method, path, query } = req;
  const queryString = Object.keys(query).length > 0 
    ? '?' + new URLSearchParams(query as Record<string, string>).toString()
    : '';
  
  return `${method}:${path}${queryString}`;
}

/**
 * Cache middleware for Express routes
 */
export function cacheMiddleware(options: CacheMiddlewareOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check if caching should be skipped based on condition
    if (options.condition && !options.condition(req)) {
      return next();
    }

    // Generate cache key
    const cacheKey = typeof options.key === 'function' 
      ? options.key(req) 
      : options.key || generateCacheKey(req);

    try {
      // Try to get cached response
      const cached = await cacheService.get(cacheKey, options.prefix);
      
      if (cached) {
        // Return cached response
        res.json(cached);
        return;
      }

      // If not cached, intercept the response to cache it
      const originalSend = res.send;
      res.send = function(data: any) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            // Parse JSON data to cache
            const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
            cacheService.set(cacheKey, jsonData, options);
          } catch (error) {
            // If parsing fails, don't cache
            console.error('Failed to cache response:', error);
          }
        }
        
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

/**
 * Cache invalidation middleware
 * Call this after successful POST/PUT/DELETE operations
 */
export function invalidateCacheMiddleware(entityType: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalSend = res.send;
    
    res.send = function(data: any) {
      // Invalidate cache on successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheService.invalidateEntity(entityType).catch(error => {
          console.error(`Failed to invalidate cache for ${entityType}:`, error);
        });
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}

/**
 * Manual cache invalidation function
 */
export async function invalidateCache(entityType: string): Promise<void> {
  await cacheService.invalidateEntity(entityType);
}

/**
 * Cache health check middleware
 */
export async function cacheHealthCheck(req: Request, res: Response): Promise<void> {
  try {
    const isHealthy = await cacheService.healthCheck();
    const stats = await cacheService.getStats();
    
    res.json({
      healthy: isHealthy,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
} 