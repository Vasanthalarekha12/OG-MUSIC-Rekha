const CACHE_PREFIX = 'og_music_yt_';
const MEMORY_CACHE: Record<string, { data: any; expiry: number }> = {};
const DEDUPE_PROMISES: Record<string, Promise<any>> = {};

export interface CacheOptions {
  ttlSeconds?: number;
  useMemoryOnly?: boolean;
}

export const youtubeCache = {
  get: <T>(key: string): T | null => {
    const memCache = MEMORY_CACHE[key];
    if (memCache && memCache.expiry > Date.now()) {
      return memCache.data as T;
    }

    try {
      const localData = localStorage.getItem(CACHE_PREFIX + key);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (parsed.expiry > Date.now()) {
          // Re-populate memory cache
          MEMORY_CACHE[key] = parsed;
          return parsed.data as T;
        } else {
          localStorage.removeItem(CACHE_PREFIX + key);
        }
      }
    } catch (e) {
      // ignore parsing errors
    }

    return null;
  },

  set: <T>(key: string, data: T, options?: CacheOptions) => {
    const ttl = (options?.ttlSeconds || 300) * 1000;
    const expiry = Date.now() + ttl;
    
    const cacheObject = { data, expiry };
    
    MEMORY_CACHE[key] = cacheObject;
    
    if (!options?.useMemoryOnly) {
      try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheObject));
      } catch (e) {
        // quota exceeded maybe
      }
    }
  },

  getOrFetch: async <T>(key: string, fetcher: () => Promise<T>, options?: CacheOptions): Promise<T> => {
    // 1. Check cache
    const cached = youtubeCache.get<T>(key);
    if (cached) return cached;

    // 2. Check deduplication (is this request already in flight?)
    const inFlight = DEDUPE_PROMISES[key];
    if (inFlight) {
      return inFlight as Promise<T>;
    }

    // 3. Fetch and cache
    const promise = fetcher().then((data) => {
      youtubeCache.set(key, data, options);
      delete DEDUPE_PROMISES[key];
      return data;
    }).catch(err => {
      delete DEDUPE_PROMISES[key];
      throw err;
    });

    DEDUPE_PROMISES[key] = promise;
    return promise;
  }
};
