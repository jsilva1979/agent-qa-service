import { App } from '@slack/bolt';
import { pool } from '../../../../shared/config/database';
import { ErrorClassification } from '../../domain/entities/ErrorClassification';

export class AutoEscalationService {
  constructor(private slackApp: App) {}

  async checkAndEscalate(classification: ErrorClassification): Promise<void> {
    if (classification.impactLevel === 'HIGH' || classification.impactLevel === 'CRITICAL') {
      const rules = await this.getEscalationRules(
        classification.errorType,
        classification.impactLevel
      );

      for (const rule of rules) {
        await this.notifyStakeholders(rule, classification);
      }
    }
  }

  private async getEscalationRules(errorType: string, impactLevel: string) {
    const result = await pool.query(
      `SELECT * FROM escalation_rules 
       WHERE error_type = $1 
       AND impact_level = $2 
       AND is_active = true`,
      [errorType, impactLevel]
    );
    return result.rows;
  }

  private async notifyStakeholders(rule: any, classification: ErrorClassification) {
    const message = this.createEscalationMessage(classification);

    // Notificar canal específico
    if (rule.slack_channel) {
      await this.slackApp.client.chat.postMessage({
        channel: rule.slack_channel,
        text: message,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `🚨 *Alerta de Incidente Crítico*\n${message}`
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `*Tipo:* ${classification.errorType} | *Impacto:* ${classification.impactLevel}`
              }
            ]
          }
        ]
      });
    }

    // Notificar usuários específicos
    if (rule.slack_users && rule.slack_users.length > 0) {
      const mentions = rule.slack_users.map((user: string) => `<@${user}>`).join(' ');
      await this.slackApp.client.chat.postMessage({
        channel: rule.slack_channel,
        text: `${mentions} ${message}`,
        link_names: true
      });
    }
  }

  private createEscalationMessage(classification: ErrorClassification): string {
    return `🚨 *Incidente Crítico Detectado*
Issue: ${classification.jiraIssueKey}
Tipo: ${classification.errorType}
Impacto: ${classification.impactLevel}
${classification.recurrenceCount > 1 ? `\nReincidência: ${classification.recurrenceCount}x` : ''}

${classification.aiAnalysis?.rootCause ? `*Causa Raiz Provável:*\n${classification.aiAnalysis.rootCause}` : ''}`;
  }
} 