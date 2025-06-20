import { WebClient } from '@slack/web-api';
import dotenv from 'dotenv';

dotenv.config();

const slackToken = process.env.SLACK_BOT_TOKEN!;
const channel = process.env.SLACK_CHANNEL!;

const slackClient = new WebClient(slackToken);

async function main() {
  const result = await slackClient.chat.postMessage({
    channel,
    text: 'Alerta de teste com botão de criação de incidente!',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Alerta de teste!* Clique no botão abaixo para criar um incidente no Jira.',
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Criar Incidente',
              emoji: true,
            },
            style: 'primary',
            action_id: 'create_jira_issue',
            value: 'alerta-teste-123', // Pode ser um ID de alerta real
          },
        ],
      },
    ],
  });

  console.log('Mensagem enviada ao Slack:', result.ts);
}

main().catch(console.error); 