import { IAlertService, Alert } from '../../domain/ports/IAlertService';
import { AnaliseIA } from '../../../ai-prompting/domain/entities/AnaliseIA';
import { WebClient } from '@slack/web-api';
import winston from 'winston';
import crypto from 'crypto';

export class SlackAlertAdapter implements IAlertService {
  private client: WebClient;
  private logger: winston.Logger;

  constructor(
    private readonly config: {
      token: string;
      channel: string;
      logging: {
        level: string;
        file: {
          path: string;
        };
      };
    }
  ) {
    this.client = new WebClient(config.token);
    this.logger = winston.createLogger({
      level: config.logging.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: config.logging.file.path,
          level: 'error',
        }),
      ],
    });
  }

  async sendAlert(alert: Omit<Alert, 'id' | 'metadata'>): Promise<string> {
    try {
      const alertId = crypto.randomUUID();
      const message = this.formatAlertMessage(alert);

      await this.client.chat.postMessage({
        channel: this.config.channel,
        text: message,
        blocks: this.createAlertBlocks(alert),
      });

      this.logger.info('Alerta enviado com sucesso', { alertId });
      return alertId;
    } catch (error) {
      this.logger.error('Erro ao enviar alerta:', error);
      throw error;
    }
  }

  async sendErrorAlert(error: Alert['details']['error'], analysis: AnaliseIA): Promise<string> {
    try {
      const alertId = crypto.randomUUID();
      const alert: Omit<Alert, 'id' | 'metadata'> = {
        timestamp: new Date(),
        type: 'error',
        title: `Erro: ${error?.type || 'Desconhecido'}`,
        message: error?.message || 'Erro não especificado',
        details: {
          error,
        },
      };

      const message = this.formatErrorAlertMessage(alert, analysis);

      await this.client.chat.postMessage({
        channel: this.config.channel,
        text: message,
        blocks: this.createErrorAlertBlocks(alert, analysis),
      });

      this.logger.info('Alerta de erro enviado com sucesso', { alertId });
      return alertId;
    } catch (error) {
      this.logger.error('Erro ao enviar alerta de erro:', error);
      throw error;
    }
  }

  async sendMetricsAlert(metrics: Alert['details']['metrics']): Promise<string> {
    try {
      const alertId = crypto.randomUUID();
      const alert: Omit<Alert, 'id' | 'metadata'> = {
        timestamp: new Date(),
        type: 'warning',
        title: 'Alerta de Métricas',
        message: 'Métricas do sistema fora do padrão',
        details: {
          metrics,
        },
      };

      const message = this.formatMetricsAlertMessage(alert);

      await this.client.chat.postMessage({
        channel: this.config.channel,
        text: message,
        blocks: this.createMetricsAlertBlocks(alert),
      });

      this.logger.info('Alerta de métricas enviado com sucesso', { alertId });
      return alertId;
    } catch (error) {
      this.logger.error('Erro ao enviar alerta de métricas:', error);
      throw error;
    }
  }

  async checkAvailability(): Promise<boolean> {
    try {
      await this.client.auth.test();
      return true;
    } catch (error) {
      this.logger.error('Erro ao verificar disponibilidade do Slack:', error);
      return false;
    }
  }

  private formatAlertMessage(alert: Omit<Alert, 'id' | 'metadata'>): string {
    return `*${alert.title}*\n${alert.message}`;
  }

  private formatErrorAlertMessage(alert: Omit<Alert, 'id' | 'metadata'>, analysis: AnaliseIA): string {
    return `
*🚨 ${alert.title}*

${alert.message}

*Análise:*
${analysis.resultado.causaRaiz}

*Sugestões:*
${analysis.resultado.sugestoes.map(s => `• ${s}`).join('\n')}
    `;
  }

  private formatMetricsAlertMessage(alert: Omit<Alert, 'id' | 'metadata'>): string {
    const metrics = alert.details.metrics;
    return `
*⚠️ ${alert.title}*

${alert.message}

*Métricas:*
• CPU: ${metrics?.cpu || 'N/A'}%
• Memória: ${metrics?.memory || 'N/A'}%
• Latência: ${metrics?.latency || 'N/A'}ms
    `;
  }

  private createAlertBlocks(alert: Omit<Alert, 'id' | 'metadata'>): any[] {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: this.formatAlertMessage(alert),
        },
      },
    ];
  }

  private createErrorAlertBlocks(alert: Omit<Alert, 'id' | 'metadata'>, analysis: AnaliseIA): any[] {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: this.formatErrorAlertMessage(alert, analysis),
        },
      },
    ];
  }

  private createMetricsAlertBlocks(alert: Omit<Alert, 'id' | 'metadata'>): any[] {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: this.formatMetricsAlertMessage(alert),
        },
      },
    ];
  }
} 