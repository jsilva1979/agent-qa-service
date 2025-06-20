import Redis from 'ioredis';
import dotenv from 'dotenv';
import winston from 'winston';

dotenv.config();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'logs/redis-error.log',
      level: 'error',
    }),
  ],
});

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    logger.warn(`Tentando reconectar ao Redis em ${delay}ms (tentativa ${times})`);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
});

redis.on('error', (error) => {
  logger.error('Erro na conexão com Redis:', error);
});

redis.on('connect', () => {
  logger.info('Conectado ao Redis com sucesso');
});

redis.on('ready', () => {
  logger.info('Redis está pronto para receber comandos');
});

// Tipos do esquema do banco de dados
export interface LogEntry {
  id: string;
  created_at: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding?: number[];
}

export interface Analysis {
  id: string;
  created_at: string;
  log_id: string;
  analysis_type: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding?: number[];
}

// Prefixos para as chaves no Redis
export const REDIS_KEYS = {
  LOG: 'log:',
  ANALYSIS: 'analysis:',
  LOG_ANALYSES: 'log_analyses:',
  LOG_EMBEDDINGS: 'log_embeddings:',
} as const; 