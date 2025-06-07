export interface LogEntry {
  servico: string;
  arquivo: string;
  linha: number;
  tipoErro: string;
  mensagem: string;
  timestamp: string;
  stacktrace?: string;
} 