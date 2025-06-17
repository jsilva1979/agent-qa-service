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
      erro: {
        tipo: 'IntegrationTestError',
        mensagem: 'Erro de teste de integração',
      },
      resultado: {
        causaRaiz: 'Teste de integração com o Slack',
        sugestoes: ['Verificar a integração', 'Testar novamente'],
        nivelConfianca: 0.95,
        categoria: 'Teste',
        tags: ['integration', 'test'],
        referencias: ['https://api.slack.com/docs'],
      },
      metadados: {
        modelo: 'gemini-2.0-flash',
        versao: '1.0.0',
        tempoProcessamento: 100,
        tokensUtilizados: 150,
      },
    };

    const result = await service.sendErrorAlert(error, analysis);
    expect(result).toBeDefined();
  });
}); 