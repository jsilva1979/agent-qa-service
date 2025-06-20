import 'dotenv/config';
import { SlackAlertService } from '../SlackAlertService';
import { AlertInput } from '../../domain/AlertInput';

describe('SlackAlertService Integration', () => {
  let slackService: SlackAlertService;

  beforeAll(() => {
    slackService = new SlackAlertService({
      accessToken: process.env.SLACK_ACCESS_TOKEN as string,
      refreshToken: process.env.SLACK_REFRESH_TOKEN as string,
      channel: process.env.SLACK_CHANNEL as string,
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: {
          path: 'logs/slack.log',
        },
      },
      jira: {
        url: process.env.JIRA_URL as string,
      },
    });
  });

  it('deve enviar um alerta de teste para o Slack', async () => {
    const alertInput: AlertInput = {
      service: 'servico-teste',
      error: {
        type: 'ReferenceError',
        message: 'y is not defined'
      },
      code: {
        arquivo: 'index.ts',
        linha: 10,
        codigo: 'const x = y + 1;',
        repositorio: 'repo/teste',
        branch: 'main',
        url: 'https://github.com/teste/repo/blob/main/index.ts#L10'
      },
      analysis: {
        rootCause: 'Variável y não foi definida',
        missingChecks: ['Verificação de variável definida'],
        correctionSuggestion: 'Defina a variável y antes de usá-la',
        explanation: 'O erro ocorre porque y não foi inicializada.',
        confidenceLevel: 95
      },
      timestamp: new Date().toISOString(),
      level: 'error'
    };

    const alertPayload = {
      timestamp: new Date(alertInput.timestamp),
      type: alertInput.level === 'critical' ? 'error' : alertInput.level,
      title: `Alert from ${alertInput.service}: ${alertInput.error.type}`,
      message: alertInput.error.message,
      details: {
        error: {
          type: alertInput.error.type,
          message: alertInput.error.message,
          stackTrace: alertInput.error.stacktrace,
          context: {
            code: alertInput.code,
            analysis: alertInput.analysis,
          },
        },
      },
    };

    const result = await slackService.sendAlert(alertPayload);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  }, 10000);
}); 