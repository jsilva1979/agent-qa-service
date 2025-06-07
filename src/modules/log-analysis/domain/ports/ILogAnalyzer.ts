import { LogEntry } from '../entities/LogEntry';

export interface ILogAnalyzer {
  /**
   * Analyzes a log entry and returns detailed information about the error
   * @param logEntry The log entry to analyze
   * @returns Promise with the analysis result
   */
  analyze(logEntry: LogEntry): Promise<{
    errorCause: string;
    suggestedFix: string;
    confidence: number;
  }>;
} 