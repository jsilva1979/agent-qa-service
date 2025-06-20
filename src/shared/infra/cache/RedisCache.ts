import { ICache } from '../../../modules/ai-prompting/domain/ports/ICache';
import { Redis } from 'ioredis';
import winston from 'winston';

export class RedisCache implements ICache {
  private logger: winston.Logger;

  constructor(private client: Redis) {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: 'logs/redis-cache-error.log',
          level: 'error',
        }),
      ],
    });
  }

  private async executeWithFallback<T>(
    operation: () => Promise<T>,
    fallback: T,
    errorMessage: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.logger.error(`${errorMessage}:`, error);
      return fallback;
    }
  }

  async get(key: string): Promise<any | null> {
    return this.executeWithFallback(
      async () => {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
      },
      null,
      `Erro ao obter valor do cache para chave ${key}`
    );
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.executeWithFallback(
      async () => {
        await this.client.set(key, JSON.stringify(value), 'EX', ttl);
      },
      undefined,
      `Erro ao definir valor no cache para chave ${key}`
    );
  }

  async del(key: string): Promise<void> {
    await this.executeWithFallback(
      async () => {
        await this.client.del(key);
      },
      undefined,
      `Erro ao deletar valor do cache para chave ${key}`
    );
  }
} 