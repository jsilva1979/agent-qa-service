import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.POSTGRES_URL) {
  throw new Error('URL do PostgreSQL não encontrada nas variáveis de ambiente');
}

export const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Tipos do esquema do banco de dados
export interface LogEntry {
  id: string;
  created_at: Date;
  content: string;
  metadata: Record<string, any>;
  tags: string[];
}

export interface Analysis {
  id: string;
  created_at: Date;
  log_id: string;
  analysis_type: string;
  content: string;
  metadata: Record<string, any>;
  tags: string[];
} 