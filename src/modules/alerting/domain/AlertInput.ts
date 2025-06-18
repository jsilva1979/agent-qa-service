import { AnalyzeError } from '../../ai-prompting/domain/AnalyzeError';
import { CodeContext } from '../../github-access/domain/CodeContext';

/**
 * Interface que representa os dados de entrada para criação de um alerta
 */
export interface AlertInput {
  service: string;
  error: {
    type: string;
    message: string;
    stacktrace?: string;
  };
  code: CodeContext;
  analysis: AnalyzeError;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'critical';
} 