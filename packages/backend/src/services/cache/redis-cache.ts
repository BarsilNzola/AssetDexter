import Redis from 'redis';
import { config } from '../../utils/config';

export class RedisCache {
  private client: Redis.RedisClientType;

  constructor() {
    this.client = Redis.createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port
      },
      password: config.redis.password
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    this.connect();
  }

  async connect() {
    await this.client.connect();
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
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
}