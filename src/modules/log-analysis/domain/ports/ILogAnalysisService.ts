import { LogEntry } from '../entities/LogEntry';

export interface AnaliseLog {
  /**
   * Serviço que gerou o log
   */
  servico: string;

  /**
   * Nome do repositório Git
   */
  repositorio: string;

  /**
   * Nome do arquivo onde o erro ocorreu
   */
  arquivo: string;

  /**
   * Número da linha onde o erro ocorreu
   */
  linha: number;

  /**
   * Tipo do erro
   */
  erro: string;

  /**
   * Contexto adicional do erro
   */
  contexto: {
    /**
     * Stack trace do erro
     */
    stackTrace?: string;

    /**
     * Método/função onde o erro ocorreu
     */
    metodo?: string;

    /**
     * Variáveis relevantes no momento do erro
     */
    variaveis?: Record<string, any>;

    /**
     * Dados adicionais do contexto
     */
    [key: string]: any;
  };
}

export interface ILogAnalysisService {
  /**
   * Analisa uma entrada de log e extrai informações relevantes
   * @param logEntry Entrada de log a ser analisada
   */
  analisarLog(logEntry: LogEntry): Promise<AnaliseLog>;

  /**
   * Inicia o serviço de análise de logs
   */
  iniciar(): Promise<void>;

  /**
   * Para o serviço de análise de logs
   */
  parar(): Promise<void>;

  /**
   * Verifica se o serviço está disponível
   */
  verificarDisponibilidade(): Promise<boolean>;
} 