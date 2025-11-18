export class SimpleCache {
    private cache = new Map<string, { value: any; expiry: number }>();
  
    async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
      const expiry = Date.now() + (ttlSeconds * 1000);
      this.cache.set(key, { value, expiry });
      
      // Clean up expired entries occasionally
      this.cleanup();
    }
  
    async get<T>(key: string): Promise<T | null> {
      const entry = this.cache.get(key);
      if (!entry) return null;
      
      if (Date.now() > entry.expiry) {
        this.cache.delete(key);
        return null;
      }
      
      return entry.value as T;
    }
  
    async exists(key: string): Promise<boolean> {
      const entry = this.cache.get(key);
      if (!entry) return false;
      
      if (Date.now() > entry.expiry) {
        this.cache.delete(key);
        return false;
      }
      
      return true;
    }
  
    async del(key: string): Promise<void> {
      this.cache.delete(key);
    }
  
    async getOrSet<T>(
      key: string, 
      fetchFn: () => Promise<T>, 
      ttlSeconds: number = 300
    ): Promise<T> {
      const cached = await this.get<T>(key);
      if (cached) {
        return cached;
      }
  
      const freshData = await fetchFn();
      await this.set(key, freshData, ttlSeconds);
      return freshData;
    }
  
    private cleanup(): void {
      // Clean up every 100th set operation to avoid performance hit
      if (this.cache.size > 0 && Math.random() < 0.01) {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
          if (now > entry.expiry) {
            this.cache.delete(key);
          }
        }
      }
    }
  }