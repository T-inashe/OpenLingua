/**
 * Simple in-memory caching middleware for API responses
 * Caches GET requests only, with configurable TTL (Time To Live)
 */

const cache = new Map();

/**
 * Cache middleware factory
 * @param {number} ttl - Time to live in seconds (default: 60)
 * @returns {Function} Express middleware function
 */
const cacheMiddleware = (ttl = 60) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from URL and user ID (for user-specific data)
    const cacheKey = `${req.originalUrl || req.url}_${req.user?.id || 'anonymous'}`;
    
    // Check if cached response exists and is still valid
    const cachedData = cache.get(cacheKey);
    if (cachedData && Date.now() < cachedData.expiry) {
      // Return cached response
      return res.json(cachedData.data);
    }

    // Store original res.json function
    const originalJson = res.json.bind(res);

    // Override res.json to cache the response
    res.json = (data) => {
      // Only cache successful responses (status < 400)
      if (res.statusCode < 400) {
        cache.set(cacheKey, {
          data,
          expiry: Date.now() + (ttl * 1000)
        });

        // Cleanup old cache entries periodically
        if (cache.size > 1000) {
          cleanupCache();
        }
      }

      // Call original json method
      return originalJson(data);
    };

    next();
  };
};

/**
 * Clear cache for a specific pattern
 * @param {string} pattern - Pattern to match URLs (e.g., '/api/courses')
 */
const clearCachePattern = (pattern) => {
  const keysToDelete = [];
  
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => cache.delete(key));
  console.log(`Cleared ${keysToDelete.length} cache entries matching: ${pattern}`);
};

/**
 * Clear all cache
 */
const clearAllCache = () => {
  cache.clear();
  console.log('All cache cleared');
};

/**
 * Cleanup expired cache entries
 */
const cleanupCache = () => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, value] of cache.entries()) {
    if (now >= value.expiry) {
      cache.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired cache entries`);
  }
};

// Cleanup expired entries every 5 minutes
setInterval(cleanupCache, 5 * 60 * 1000);

module.exports = {
  cacheMiddleware,
  clearCachePattern,
  clearAllCache
};
