import { pool } from '../config/database';
import { LogEntry, Analysis } from '../config/database';

export class DatabaseService {
  // Método para salvar um novo log
  async saveLog(content: string, metadata: Record<string, unknown>, tags: string[] = []): Promise<LogEntry> {
    const query = `
      INSERT INTO logs (content, metadata, tags)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const values = [content, metadata, tags];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  // Método para salvar uma nova análise
  async saveAnalysis(logId: string, analysisType: string, content: string, metadata: Record<string, unknown>, tags: string[] = []): Promise<Analysis> {
    const query = `
      INSERT INTO analyses (log_id, analysis_type, content, metadata, tags)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [logId, analysisType, content, metadata, tags];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  // Método para buscar logs por tags
  async searchLogsByTags(tags: string[], limit: number = 10): Promise<LogEntry[]> {
    const query = `
      SELECT * FROM search_logs_by_tags($1, $2)
    `;
    
    const { rows } = await pool.query(query, [tags, limit]);
    return rows;
  }

  // Método para buscar análises relacionadas a um log específico
  async getLogAnalyses(logId: string): Promise<Analysis[]> {
    const query = `
      SELECT *
      FROM analyses
      WHERE log_id = $1
      ORDER BY created_at DESC
    `;
    
    const { rows } = await pool.query(query, [logId]);
    return rows;
  }

  // Método para buscar logs por período
  async getLogsByDateRange(startDate: Date, endDate: Date): Promise<LogEntry[]> {
    const query = `
      SELECT *
      FROM logs
      WHERE created_at BETWEEN $1 AND $2
      ORDER BY created_at DESC
    `;
    
    const { rows } = await pool.query(query, [startDate, endDate]);
    return rows;
  }

  // Método para buscar logs por tipo de análise
  async getLogsByAnalysisType(analysisType: string): Promise<LogEntry[]> {
    const query = `
      SELECT l.*
      FROM logs l
      JOIN analyses a ON l.id = a.log_id
      WHERE a.analysis_type = $1
      ORDER BY l.created_at DESC
    `;
    
    const { rows } = await pool.query(query, [analysisType]);
    return rows;
  }
} 