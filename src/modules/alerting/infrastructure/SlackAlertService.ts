import axios from 'axios';
import { IAlertService, Alert } from '../domain/ports/IAlertService';
import { AnaliseIA } from '../../ai-prompting/domain/entities/AnaliseIA';
import winston from 'winston';
import crypto from 'crypto';

export class SlackAlertService implements IAlertService {
  private readonly webhookUrl: string;
  private readonly logger: winston.Logger;

  constructor(
    private readonly config: {
      webhookUrl: string;
      logging: {
        level: string;
        file: {
          path: string;
        };
      };
    }
  ) {
    this.webhookUrl = config.webhookUrl;
    if (!this.webhookUrl) {
      throw new Error('SLACK_WEBHOOK_URL não configurado');
    }

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
      const fullAlert: Alert = {
        ...alert,
        id: alertId,
        metadata: {
          source: 'slack',
          severity: 'medium',
          tags: [],
        },
      };

      const message = this.formatAlertMessage(fullAlert);
      await axios.post(this.webhookUrl, message);

      this.logger.info('Alerta enviado com sucesso', { id: alertId });
      return alertId;
    } catch (error) {
      this.logger.error('Erro ao enviar alerta:', error);
      throw new Error(`Erro ao enviar alerta para o Slack: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  async sendErrorAlert(error: Alert['details']['error'], analysis: AnaliseIA): Promise<string> {
    try {
      if (!error) {
        throw new Error('Dados do erro não fornecidos');
      }

      const alertId = crypto.randomUUID();
      const alert: Alert = {
        id: alertId,
        timestamp: new Date(),
        type: 'error',
        title: `Erro: ${error.type}`,
        message: error.message,
        details: {
          error,
        },
        metadata: {
          source: 'slack',
          severity: 'high',
          tags: analysis.resultado.tags,
        },
      };

      const message = this.formatErrorAlertMessage(alert, analysis);
      await axios.post(this.webhookUrl, message);

      this.logger.info('Alerta de erro enviado com sucesso', { id: alertId });
      return alertId;
    } catch (error) {
      this.logger.error('Erro ao enviar alerta de erro:', error);
      throw new Error(`Erro ao enviar alerta de erro para o Slack: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  async sendMetricsAlert(metrics: Alert['details']['metrics']): Promise<string> {
    try {
      const alertId = crypto.randomUUID();
      const alert: Alert = {
        id: alertId,
        timestamp: new Date(),
        type: 'warning',
        title: 'Métricas do Sistema',
        message: this.formatMetricsMessage(metrics),
        details: {
          metrics,
        },
        metadata: {
          source: 'slack',
          severity: 'medium',
          tags: ['metrics', 'system'],
        },
      };

      const message = this.formatMetricsAlertMessage(alert);
      await axios.post(this.webhookUrl, message);

      this.logger.info('Alerta de métricas enviado com sucesso', { id: alertId });
      return alertId;
    } catch (error) {
      this.logger.error('Erro ao enviar alerta de métricas:', error);
      throw new Error(`Erro ao enviar alerta de métricas para o Slack: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  async checkAvailability(): Promise<boolean> {
    try {
      await axios.get(this.webhookUrl);
      return true;
    } catch (error) {
      this.logger.error('Erro ao verificar disponibilidade do Slack:', error);
      return false;
    }
  }

  private formatAlertMessage(alert: Alert): any {
    return {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `🚨 ${alert.title}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: alert.message,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*Severidade:* ${alert.metadata.severity}`,
            },
            {
              type: 'mrkdwn',
              text: `*Tags:* ${alert.metadata.tags.join(', ')}`,
            },
          ],
        },
      ],
    };
  }

  private formatErrorAlertMessage(alert: Alert, analysis: AnaliseIA): any {
    return {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `🚨 Erro: ${alert.details.error?.type}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: alert.details.error?.message || '',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Causa Raiz:*\n${analysis.resultado.causaRaiz}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Sugestões de Correção:*\n${analysis.resultado.sugestoes.map(s => `• ${s}`).join('\n')}`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*Nível de Confiança:* ${analysis.resultado.nivelConfianca * 100}%`,
            },
            {
              type: 'mrkdwn',
              text: `*Categoria:* ${analysis.resultado.categoria}`,
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*Tags:* ${analysis.resultado.tags.join(', ')}`,
            },
          ],
        },
      ],
    };
  }

  private formatMetricsAlertMessage(alert: Alert): any {
    const metrics = alert.details.metrics;
    return {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `📊 ${alert.title}`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*CPU:*\n${metrics?.cpu?.toFixed(2)}%`,
            },
            {
              type: 'mrkdwn',
              text: `*Memória:*\n${metrics?.memory?.toFixed(2)}%`,
            },
            {
              type: 'mrkdwn',
              text: `*Latência:*\n${metrics?.latency?.toFixed(2)}ms`,
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*Severidade:* ${alert.metadata.severity}`,
            },
            {
              type: 'mrkdwn',
              text: `*Tags:* ${alert.metadata.tags.join(', ')}`,
            },
          ],
        },
      ],
    };
  }

  private formatMetricsMessage(metrics: Alert['details']['metrics']): string {
    const parts: string[] = [];
    if (metrics?.cpu !== undefined) parts.push(`CPU: ${metrics.cpu.toFixed(2)}%`);
    if (metrics?.memory !== undefined) parts.push(`Memória: ${metrics.memory.toFixed(2)}%`);
    if (metrics?.latency !== undefined) parts.push(`Latência: ${metrics.latency.toFixed(2)}ms`);
    return parts.join(' | ');
  }
} 