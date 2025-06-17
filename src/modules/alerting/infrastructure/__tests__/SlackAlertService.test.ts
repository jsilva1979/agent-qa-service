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

  const commonConfig = {
    logging: {
      level: 'info',
      file: {
        path: 'logs/test.log'
      }
    },
    jira: {
      url: 'https://jira.test.com'
    }
  };

  beforeEach(() => {
    slackAlertService = new SlackAlertService({
      accessToken: 'test_access_token',
      refreshToken: 'test_refresh_token',
      channel: '#test-channel',
      ...commonConfig
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('construtor', () => {
    it('deve lançar erro quando accessToken não estiver configurado', () => {
      expect(() => new SlackAlertService({
        accessToken: '',
        refreshToken: 'test_refresh_token',
        channel: '#test-channel',
        ...commonConfig
      })).toThrow('SLACK_ACCESS_TOKEN não configurado');
    });

    it('deve lançar erro quando refreshToken não estiver configurado', () => {
      expect(() => new SlackAlertService({
        accessToken: 'test_access_token',
        refreshToken: '',
        channel: '#test-channel',
        ...commonConfig
      })).toThrow('SLACK_REFRESH_TOKEN não configurado');
    });

    it('deve lançar erro quando channel não estiver configurado', () => {
      expect(() => new SlackAlertService({
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token',
        channel: '',
        ...commonConfig
      })).toThrow('SLACK_CHANNEL não configurado');
    });

    it('deve lançar erro quando jira.url não estiver configurado', () => {
      expect(() => new SlackAlertService({
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token',
        channel: '#test-channel',
        logging: {
          level: 'info',
          file: {
            path: 'logs/test.log'
          }
        },
        jira: {
          url: '',
        }
      })).toThrow('JIRA_URL não configurado');
    });
  });

  describe('sendAlert', () => {
    it('deve enviar alerta com sucesso', async () => {
      mockedAxios.post.mockResolvedValueOnce({ status: 200 });

      const result = await slackAlertService.sendAlert(mockAlerta);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://slack.com/api/chat.postMessage',
        expect.objectContaining({
          channel: '#test-channel',
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
        .rejects.toThrow(/Erro ao enviar alerta para o Slack/);
    });
  });
}); 