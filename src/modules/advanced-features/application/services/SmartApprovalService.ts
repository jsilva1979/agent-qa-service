import { WebClient } from '@slack/web-api';
import { ErrorClassification } from '../../domain/entities/ErrorClassification';

export class SmartApprovalService {
  constructor(private client: WebClient) {}

  async requestApproval(
    channelId: string,
    messageTs: string,
    classification: ErrorClassification,
    originalMessageTs: string
  ): Promise<void> {
    const payload = {
      classification: classification.toJSON(),
      originalMessageTs,
    };

    const text = `Análise do Erro Concluída. Deseja criar um card com base nesta análise?`;
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    await this.client.chat.update({
      channel: channelId,
      ts: messageTs,
      text: text,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🤖 *Análise do Erro Concluída*  -  _${timeString}_`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Deseja criar um card com base nesta análise?`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Tipo de Erro:*\n${classification.errorType}`,
            },
            {
              type: 'mrkdwn',
              text: `*Nível de Impacto:*\n${classification.impactLevel}`,
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
                text: '✅ Criar Card',
                emoji: true,
              },
              style: 'primary',
              action_id: 'approve_issue_creation',
              value: JSON.stringify(payload),
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '❌ Cancelar',
                emoji: true,
              },
              style: 'danger',
              action_id: 'deny_issue_creation',
            },
          ],
        },
      ],
    });
  }
} 