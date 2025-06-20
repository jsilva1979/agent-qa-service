import { SlackAlertService } from '../../infrastructure/SlackAlertService';
import { WebClient } from '@slack/web-api';
import { SlackAuthService } from '../../../../shared/infrastructure/slackAuth';
import { AnalyzeAI } from '../../../ai-prompting/domain/entities/AnalyzeAI';

// Mock do WebClient
jest.mock('@slack/web-api');
jest.mock('../../../../shared/infrastructure/slackAuth');

describe('SlackAlertService', () => {
  let service: SlackAlertService;
  let mockWebClient: jest.Mocked<WebClient>;
  let mockAuthService: jest.Mocked<SlackAuthService>;

  beforeEach(() => {
    // Limpa todos os mocks
    jest.clearAllMocks();

    // Configura o mock do WebClient
    mockWebClient = {
      chat: {
        postMessage: jest.fn().mockResolvedValue({ ok: true }),
      },
      auth: {
        test: jest.fn().mockResolvedValue({ ok: true }),
      },
    } as unknown as jest.Mocked<WebClient>;

    // Configura o mock do AuthService
    mockAuthService = {
      getClient: jest.fn().mockResolvedValue(mockWebClient),
    } as unknown as jest.Mocked<SlackAuthService>;

    // Cria uma instância do serviço com configurações de teste
    service = new SlackAlertService({
      accessToken: 'xoxb-test-token',
      refreshToken: 'xoxe-test-refresh-token',
      channel: '#test-channel',
      logging: {
        level: 'info',
        file: {
          path: 'logs/test.log',
        },
      },
      jira: {
        url: 'https://test-jira.example.com'
      }
    });

    // Substitui o authService pelo mock
    (service as unknown as { authService: typeof mockAuthService }).authService = mockAuthService;
  });

  describe('sendAlert', () => {
    it('deve enviar um alerta com sucesso', async () => {
      const alert = {
        timestamp: new Date(),
        type: 'info' as const,
        title: 'Teste de Alerta',
        message: 'Este é um teste de alerta',
        details: {},
      };

      const result = await service.sendAlert(alert);

      expect(result).toBeDefined();
      expect(mockWebClient.chat.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: '#test-channel',
          blocks: expect.any(Array),
        })
      );
    });

    it('deve enviar um alerta de erro com sucesso', async () => {
      const error = {
        type: 'TestError',
        message: 'Erro de teste',
      };

      const analysis: AnalyzeAI = {
        id: 'test-id',
        timestamp: new Date(),
        error: {
          type: 'TestError',
          message: 'Erro de teste',
        },
        result: {
          rootCause: 'Causa raiz do erro',
          suggestions: ['Sugestão 1', 'Sugestão 2'],
          confidenceLevel: 0.95,
          category: 'Teste',
          tags: ['error', 'test'],
          references: ['https://exemplo.com/docs'],
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
      expect(mockWebClient.chat.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: '#test-channel',
          blocks: expect.any(Array),
        })
      );
    });

    it('deve enviar um alerta de métricas com sucesso', async () => {
      const metrics = {
        cpu: 75.5,
        memory: 60.2,
        latency: 150,
      };

      const result = await service.sendMetricsAlert(metrics);

      expect(result).toBeDefined();
      expect(mockWebClient.chat.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: '#test-channel',
          blocks: expect.any(Array),
        })
      );
    });
  });

  describe('checkAvailability', () => {
    it('deve retornar true quando o Slack está disponível', async () => {
      const result = await service.checkAvailability();
      expect(result).toBe(true);
      expect(mockWebClient.auth.test).toHaveBeenCalled();
    });

    it('deve retornar false quando o Slack não está disponível', async () => {
      (mockWebClient.auth.test as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
      const result = await service.checkAvailability();
      expect(result).toBe(false);
    });
  });
}); 