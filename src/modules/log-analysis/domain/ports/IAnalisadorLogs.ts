import { LogEntry } from '../entities/LogEntry';

export interface ILogAnalyzer {
  /**
   * Analisa um log bruto e extrai as informações relevantes
   * @param rawLog O log bruto recebido do RabbitMQ
   * @returns Uma entidade LogEntry com as informações estruturadas
   */
  analyze(rawLog: string): Promise<LogEntry>;

  /**
   * Verifica se o log contém um erro que precisa ser analisado
   * @param rawLog O log bruto a ser verificado
   * @returns true se o log contém um erro que precisa ser analisado
   */
  containsError(rawLog: string): Promise<boolean>;
} 