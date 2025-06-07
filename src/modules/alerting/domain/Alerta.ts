import { AnaliseErro } from '../../ai-prompting/domain/AnaliseErro';
import { CodeContext } from '../../github-access/domain/CodeContext';

export interface Alerta {
  servico: string;
  erro: {
    tipo: string;
    mensagem: string;
    stacktrace?: string;
  };
  codigo: CodeContext;
  analise: AnaliseErro;
  timestamp: string;
  nivel: 'info' | 'warning' | 'error' | 'critical';
} 