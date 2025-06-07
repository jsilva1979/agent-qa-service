import { SlackAlertService } from '../../infrastructure/SlackAlertService';
import { Alert } from '../../domain/ports/IAlertService';
import { AnaliseIA } from '../../../ai-prompting/domain/entities/AnaliseIA';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SlackAlertService', () => {
  let slackAlertService: SlackAlertService;

  const mockConfig = {
    webhookUrl: 'https://hooks.slack.com/services/test',
    logging: {
      level: 'info',
      file: {
        path: 'logs/test.log'
      }
    }
  };

  const mockAlert: Omit<Alert, 'id' | 'metadata'> = {
    timestamp: new Date(),
    type: 'error',
    title: 'Erro no serviço teste',
    message: 'Mensagem de erro teste',
    details: {
      error: {
        type: 'ErroTeste',
        message: 'Mensagem de erro teste',
        stackTrace: 'Stack trace teste',
        context: {
          code: 'ERR_TEST'
        }
      }
    }
  };

  beforeEach(() => {
    slackAlertService = new SlackAlertService(mockConfig);
    jest.clearAllMocks();
  });

  describe('sendAlert', () => {
    it('should send alert successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({ status: 200 });

      const result = await slackAlertService.sendAlert(mockAlert);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        mockConfig.webhookUrl,
        expect.objectContaining({
          blocks: expect.arrayContaining([
            expect.objectContaining({
              type: 'header',
              text: expect.objectContaining({
                text: expect.stringContaining('🚨 Erro no serviço teste')
              })
            })
          ])
        })
      );
      expect(result).toBeDefined();
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockedAxios.post.mockRejectedValueOnce(error);

      await expect(slackAlertService.sendAlert(mockAlert))
        .rejects
        .toThrow('Erro ao enviar alerta para o Slack: API Error');
    });
  });

  describe('sendErrorAlert', () => {
    const mockError = {
      type: 'TypeError',
      message: 'Test error',
      stackTrace: 'Error: Test error\nat test.ts:42',
      context: { test: 'context' }
    };

    const mockAnalysis: AnaliseIA = {
      id: 'test-id',
      timestamp: new Date(),
      erro: {
        tipo: 'TypeError',
        mensagem: 'Test error',
        stackTrace: 'Error: Test error\nat test.ts:42',
        contexto: { test: 'context' }
      },
      resultado: {
        causaRaiz: 'Test root cause',
        sugestoes: ['Test suggestion'],
        nivelConfianca: 0.8,
        categoria: 'error',
        tags: ['test'],
        referencias: ['test-ref']
      },
      metadados: {
        modelo: 'Gemini',
        versao: 'gemini-2.0-flash',
        tempoProcessamento: 100,
        tokensUtilizados: 50
      }
    };

    it('should send error alert successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({ status: 200 });

      const result = await slackAlertService.sendErrorAlert(mockError, mockAnalysis);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        mockConfig.webhookUrl,
        expect.objectContaining({
          blocks: expect.arrayContaining([
            expect.objectContaining({
              type: 'header',
              text: expect.objectContaining({
                text: expect.stringContaining('🚨 Erro: TypeError')
              })
            })
          ])
        })
      );
      expect(result).toBeDefined();
    });

    it('should handle API errors in error alert', async () => {
      const error = new Error('API Error');
      mockedAxios.post.mockRejectedValueOnce(error);

      await expect(slackAlertService.sendErrorAlert(mockError, mockAnalysis))
        .rejects
        .toThrow('Erro ao enviar alerta de erro para o Slack: API Error');
    });
  });

  describe('sendMetricsAlert', () => {
    const mockMetrics = {
      cpu: 80,
      memory: 75,
      latency: 200
    };

    it('should send metrics alert successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({ status: 200 });

      const result = await slackAlertService.sendMetricsAlert(mockMetrics);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        mockConfig.webhookUrl,
        expect.objectContaining({
          blocks: expect.arrayContaining([
            expect.objectContaining({
              type: 'header',
              text: expect.objectContaining({
                text: expect.stringContaining('📊 Métricas do Sistema')
              })
            })
          ])
        })
      );
      expect(result).toBeDefined();
    });

    it('should handle API errors in metrics alert', async () => {
      const error = new Error('API Error');
      mockedAxios.post.mockRejectedValueOnce(error);

      await expect(slackAlertService.sendMetricsAlert(mockMetrics))
        .rejects
        .toThrow('Erro ao enviar alerta de métricas para o Slack: API Error');
    });
  });

  describe('checkAvailability', () => {
    it('should return true when webhook is available', async () => {
      mockedAxios.get.mockResolvedValueOnce({ status: 200 });

      const result = await slackAlertService.checkAvailability();
      expect(result).toBe(true);
    });

    it('should return false when webhook is unavailable', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Not Found'));

      const result = await slackAlertService.checkAvailability();
      expect(result).toBe(false);
    });

    it('should return false when webhook call fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await slackAlertService.checkAvailability();
      expect(result).toBe(false);
    });
  });
}); 