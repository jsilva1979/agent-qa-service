import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Variáveis de ambiente do Supabase não encontradas');
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

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