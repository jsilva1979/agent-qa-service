import { WebClient } from '@slack/web-api';
import { IAlertService, Alert } from '../domain/ports/IAlertService';
import { AnalyzeAI } from '../../ai-prompting/domain/entities/AnalyzeAI';
import { SlackAuthService } from '../../../shared/infrastructure/slackAuth';
import winston from 'winston';
import crypto from 'crypto';

export class SlackAlertService implements IAlertService {
  private readonly authService: SlackAuthService;
  private readonly logger: winston.Logger;
  private readonly channel: string;
  private readonly jiraUrl: string;

  constructor(
    private readonly config: {
      accessToken: string;
      refreshToken: string;
      channel: string;
      logging: {
        level: string;
        file: {
          path: string;
        };
      };
      jira: {
        url: string;
      };
    }
  ) {
    if (!this.config.accessToken) {
      throw new Error('SLACK_ACCESS_TOKEN não configurado');
    }
    if (!this.config.refreshToken) {
      throw new Error('SLACK_REFRESH_TOKEN não configurado');
    }
    if (!this.config.channel) {
      throw new Error('SLACK_CHANNEL não configurado');
    }
    if (!this.config.jira || !this.config.jira.url) {
      throw new Error('JIRA_URL não configurado');
    }

    this.authService = new SlackAuthService(
      this.config.accessToken,
      this.config.refreshToken,
      {
        level: this.config.logging.level,
        file: {
          path: this.config.logging.file.path
        }
      }
    );
    this.channel = this.config.channel;
    this.jiraUrl = this.config.jira.url;

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
      const client = await this.authService.getClient();
      await client.chat.postMessage({
        channel: this.channel,
        ...message
      });

      this.logger.info('Alerta enviado com sucesso', { id: alertId });
      return alertId;
    } catch (error) {
      this.logger.error('Erro ao enviar alerta:', error);
      throw new Error(`Erro ao enviar alerta para o Slack: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  async sendErrorAlert(error: Alert['details']['error'], analysis: AnalyzeAI): Promise<string> {
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
      const client = await this.authService.getClient();
      await client.chat.postMessage({
        channel: this.channel,
        ...message
      });

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
      const client = await this.authService.getClient();
      await client.chat.postMessage({
        channel: this.channel,
        ...message
      });

      this.logger.info('Alerta de métricas enviado com sucesso', { id: alertId });
      return alertId;
    } catch (error) {
      this.logger.error('Erro ao enviar alerta de métricas:', error);
      throw new Error(`Erro ao enviar alerta de métricas para o Slack: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const client = await this.authService.getClient();
      await client.auth.test();
      return true;
    } catch (error) {
      this.logger.error('Erro ao verificar disponibilidade do Slack:', error);
      return false;
    }
  }

  private formatAlertMessage(alert: Alert): any {
    return {
      text: alert.message,
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

  private formatErrorAlertMessage(alert: Alert, analysis: AnalyzeAI): any {
    const jiraCreateIssueUrl = `${this.jiraUrl}/secure/CreateIssue!default.jspa`;

    return {
      text: alert.details.error?.message || 'Erro reportado',
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
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Criar Issue no Jira',
                emoji: true,
              },
              style: 'primary',
              url: jiraCreateIssueUrl,
              action_id: 'create_jira_issue',
            },
          ],
        },
      ],
    };
  }

  private formatMetricsAlertMessage(alert: Alert): any {
    const metrics = alert.details.metrics;
    return {
      text: `Métricas do Sistema: CPU ${metrics?.cpu?.toFixed(2)}%, Memória ${metrics?.memory?.toFixed(2)}%, Latência ${metrics?.latency?.toFixed(2)}ms`,
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