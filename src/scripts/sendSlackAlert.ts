import { SlackAlertService } from '../modules/alerting/infrastructure/SlackAlertService';
import { config } from '../modules/alerting/config/config';
import { AnalyzeAI } from '../modules/ai-prompting/domain/entities/AnalyzeAI';

async function main() {
  const slackAlertService = new SlackAlertService({
    accessToken: config.slack.accessToken!,
    refreshToken: config.slack.refreshToken!,
    channel: config.slack.channel,
    logging: config.slack.logging,
    jira: {
      url: config.jira.url!,
    },
  });

  const error = {
    type: 'ReferenceError',
    message: 'y is not defined',
    stackTrace: 'at index.ts:10:5',
    context: {
      arquivo: 'index.ts',
      linha: 10,
      codigo: 'const x = y + 1;',
      usuario: 'jefferson',
    },
  };

  const analysis: AnalyzeAI = {
    id: 'anl-001',
    timestamp: new Date(),
    error,
    result: {
      rootCause: 'Variável y não foi definida antes do uso.',
      suggestions: [
        'Definir a variável y antes de utilizá-la.',
        'Adicionar verificação de existência da variável.',
      ],
      confidenceLevel: 0.95,
      category: 'ReferenceError',
      tags: ['reference', 'undefined-variable'],
      references: ['https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Errors/Not_defined'],
    },
    metadata: {
      model: 'Gemini',
      version: 'gemini-2.0-flash',
      processingTime: 120,
      tokensUsed: 80,
    },
  };

  try {
    const alertId = await slackAlertService.sendErrorAlert(error, analysis);
    console.log('Alerta enviado ao Slack! ID:', alertId);
  } catch (err) {
    console.error('Erro ao enviar alerta:', err);
  }
}

main(); 