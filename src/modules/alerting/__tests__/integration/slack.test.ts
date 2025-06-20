import { SlackAlertService } from '../../infrastructure/SlackAlertService';
import { config } from '../../config/config';

describe('Slack Integration Tests', () => {
  let service: SlackAlertService;

  beforeAll(() => {
    if (!config.slack.accessToken || !config.slack.refreshToken) {
      throw new Error('Tokens do Slack não configurados. Configure as variáveis de ambiente SLACK_ACCESS_TOKEN e SLACK_REFRESH_TOKEN.');
    }
    if (!config.jira || !config.jira.url) {
      throw new Error('URL do Jira não configurada. Configure a variável de ambiente JIRA_URL.');
    }

    service = new SlackAlertService({
      accessToken: config.slack.accessToken,
      refreshToken: config.slack.refreshToken,
      channel: config.slack.channel,
      logging: config.slack.logging,
      jira: {
        url: config.jira.url,
      },
    });
  });

  it('deve verificar a disponibilidade do Slack', async () => {
    const isAvailable = await service.checkAvailability();
    expect(isAvailable).toBe(true);
  });

  it('deve enviar um alerta de teste', async () => {
    const alert = {
      timestamp: new Date(),
      type: 'info' as const,
      title: 'Teste de Integração',
      message: 'Este é um teste de integração com o Slack',
      details: {},
    };

    const result = await service.sendAlert(alert);
    expect(result).toBeDefined();
  });

  it('deve enviar um alerta de métricas', async () => {
    const metrics = {
      cpu: 75.5,
      memory: 60.2,
      latency: 150,
    };

    const result = await service.sendMetricsAlert(metrics);
    expect(result).toBeDefined();
  });

  it('deve enviar um alerta de erro', async () => {
    const error = {
      type: 'IntegrationTestError',
      message: 'Erro de teste de integração',
    };

    const analysis = {
      id: 'test-integration-id',
      timestamp: new Date(),
      error: {
        type: 'IntegrationTestError',
        message: 'Erro de teste de integração',
      },
      result: {
        rootCause: 'Teste de integração com o Slack',
        suggestions: ['Verificar a integração', 'Testar novamente'],
        confidenceLevel: 0.95,
        category: 'Teste',
        tags: ['integration', 'test'],
        references: ['https://api.slack.com/docs'],
      },
      metadata: {
        model: 'gemini-2.0-flash',
        version: '1.0.0',
        processingTime: 100,
        tokensUsed: 150,
      },
    };

    const result = await service.sendErrorAlert(error, analysis);
    expect(result).toBeDefined();
  });
}); 