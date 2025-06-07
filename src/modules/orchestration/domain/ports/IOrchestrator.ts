import { LogEntry } from '../../../log-analysis/domain/entities/LogEntry';
import { InsightTecnico } from '../../../documentation/domain/entities/InsightTecnico';

export interface IOrchestrator {
  /**
   * Inicia o processamento de um novo log de erro
   * @param logEntry Entrada de log a ser processada
   */
  processarLog(logEntry: LogEntry): Promise<void>;

  /**
   * Verifica a saúde do sistema e executa ações necessárias
   */
  verificarSaudeSistema(): Promise<void>;

  /**
   * Publica um insight técnico no sistema de documentação
   * @param insight Insight técnico a ser publicado
   */
  publicarInsight(insight: InsightTecnico): Promise<void>;

  /**
   * Inicia o orquestrador e suas dependências
   */
  iniciar(): Promise<void>;

  /**
   * Para o orquestrador e suas dependências
   */
  parar(): Promise<void>;
} 