export interface LogEntry {
  // Defina os campos necessários conforme uso real
  [key: string]: unknown;
}

export interface IApiServer {
  /**
   * Inicia o servidor API
   * @param port Porta em que o servidor irá escutar
   */
  iniciar(port: number): Promise<void>;

  /**
   * Para o servidor API
   */
  parar(): Promise<void>;

  /**
   * Registra um novo log para processamento
   * @param logEntry Entrada de log a ser processada
   */
  registrarLog(logEntry: LogEntry): Promise<void>;

  /**
   * Obtém o status atual do sistema
   */
  obterStatus(): Promise<{
    status: 'online' | 'offline';
    servicos: {
      nome: string;
      status: 'online' | 'offline';
      metricas?: {
        cpu: number;
        memoria: number;
        pods: number;
      };
    }[];
  }>;
} 