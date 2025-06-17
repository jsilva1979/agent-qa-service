import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.REDIS_URL) {
  throw new Error('URL do Redis não encontrada nas variáveis de ambiente');
}

export const redis = new Redis(process.env.REDIS_URL);

// Tipos do esquema do banco de dados
export interface LogEntry {
  id: string;
  created_at: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface Analysis {
  id: string;
  created_at: string;
  log_id: string;
  analysis_type: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

// Prefixos para as chaves no Redis
export const REDIS_KEYS = {
  LOG: 'log:',
  ANALYSIS: 'analysis:',
  LOG_ANALYSES: 'log_analyses:',
  LOG_EMBEDDINGS: 'log_embeddings:'
} as const; 