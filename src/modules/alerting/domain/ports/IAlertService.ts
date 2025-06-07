import { AnaliseIA } from '../../../ai-prompting/domain/entities/AnaliseIA';

export interface Alert {
  id: string;
  timestamp: Date;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  details: {
    error?: {
      type: string;
      message: string;
      stackTrace?: string;
      context?: Record<string, any>;
    };
    metrics?: {
      cpu?: number;
      memory?: number;
      latency?: number;
    };
  };
  metadata: {
    source: string;
    severity: 'high' | 'medium' | 'low';
    tags: string[];
  };
}

export interface IAlertService {
  /**
   * Envia um alerta para o canal configurado
   * @param alert Dados do alerta a ser enviado
   * @returns ID do alerta enviado
   */
  sendAlert(alert: Omit<Alert, 'id' | 'metadata'>): Promise<string>;

  /**
   * Envia um alerta de erro com análise do Gemini
   * @param error Dados do erro
   * @param analysis Análise do erro gerada pelo Gemini
   * @returns ID do alerta enviado
   */
  sendErrorAlert(error: Alert['details']['error'], analysis: AnaliseIA): Promise<string>;

  /**
   * Envia um alerta de métricas do sistema
   * @param metrics Métricas do sistema
   * @returns ID do alerta enviado
   */
  sendMetricsAlert(metrics: Alert['details']['metrics']): Promise<string>;

  /**
   * Verifica se o serviço está disponível
   * @returns true se disponível, false caso contrário
   */
  checkAvailability(): Promise<boolean>;
} 