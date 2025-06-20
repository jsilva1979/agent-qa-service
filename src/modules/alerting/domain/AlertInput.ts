import { AnalyzeError } from '../../ai-prompting/domain/AnalyzeError';

export type CodeContext = {
  arquivo: string;
  linha: number;
  codigo: string;
  repositorio: string;
  branch: string;
  url: string;
};

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