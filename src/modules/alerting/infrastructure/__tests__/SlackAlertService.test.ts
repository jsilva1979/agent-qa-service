import { SlackAlertService } from '../SlackAlertService';
import { Alert } from '../../domain/ports/IAlertService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SlackAlertService', () => {
  let slackAlertService: SlackAlertService;
  const mockAlerta: Omit<Alert, 'id' | 'metadata'> = {
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
    slackAlertService = new SlackAlertService({
      webhookUrl: 'https://hooks.slack.com/services/test',
      logging: {
        level: 'info',
        file: {
          path: 'logs/test.log'
        }
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('construtor', () => {
    it('deve lançar erro quando webhookUrl não estiver configurado', () => {
      expect(() => new SlackAlertService({
        webhookUrl: '',
        logging: {
          level: 'info',
          file: {
            path: 'logs/test.log'
          }
        }
      })).toThrow('SLACK_WEBHOOK_URL não configurado');
    });
  });

  describe('enviarAlerta', () => {
    it('deve enviar alerta com sucesso', async () => {
      mockedAxios.post.mockResolvedValueOnce({ status: 200 });

      const result = await slackAlertService.sendAlert(mockAlerta);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://hooks.slack.com/services/test',
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
    }, 10000);

    it('deve lançar erro quando o envio falhar', async () => {
      const error = new Error('Erro de rede');
      mockedAxios.post.mockRejectedValueOnce(error);

      await expect(slackAlertService.sendAlert(mockAlerta))
        .rejects.toThrow('Erro ao enviar alerta para o Slack: Erro de rede');
    });
  });
}); 