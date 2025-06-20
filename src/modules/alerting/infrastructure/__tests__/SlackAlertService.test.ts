import { SlackAlertService } from '../SlackAlertService';
import { Alert } from '../../domain/ports/IAlertService';
import { SlackAuthService } from '../../../../shared/infrastructure/slackAuth';

// Mock do WebClient do Slack
jest.mock('@slack/web-api', () => ({
  WebClient: jest.fn().mockImplementation(() => ({
    chat: { postMessage: jest.fn() },
    auth: { test: jest.fn() }
  }))
}));

// Mock do SlackAuthService
jest.mock('../../../../shared/infrastructure/slackAuth', () => ({
  SlackAuthService: jest.fn().mockImplementation(() => ({
    getClient: jest.fn().mockResolvedValue({
      chat: { postMessage: jest.fn().mockResolvedValue({ ts: 'mock-ts' }) },
      auth: { test: jest.fn().mockResolvedValue(true) }
    })
  }))
}));

describe('SlackAlertService', () => {
  let slackAlertService: SlackAlertService;
  let mockAuthService: { getClient: jest.Mock };
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
    const getClientMock = jest.fn().mockResolvedValue({
      chat: { postMessage: jest.fn().mockResolvedValue({ ts: 'mock-ts' }) },
      auth: { test: jest.fn().mockResolvedValue(true) },
    });
    mockAuthService = {
      getClient: getClientMock,
    };
    slackAlertService = new SlackAlertService({
      accessToken: 'test_access_token',
      refreshToken: 'test_refresh_token',
      channel: '#test-channel',
      ...commonConfig
    }, mockAuthService as unknown as SlackAuthService);
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
      const result = await slackAlertService.sendAlert(mockAlerta);
      const client = await mockAuthService.getClient.mock.results[0].value;
      expect(client.chat.postMessage).toHaveBeenCalled();
      expect(result).toBeDefined();
    }, 10000);

    it('deve lançar erro quando o envio falhar', async () => {
      // Mock do client e do postMessage
      const client = {
        chat: { postMessage: jest.fn().mockRejectedValueOnce(new Error('Erro de rede')) },
        auth: { test: jest.fn().mockResolvedValue(true) }
      };
      mockAuthService.getClient.mockResolvedValueOnce(client);
      await expect(slackAlertService.sendAlert(mockAlerta))
        .rejects.toThrow(/Erro ao enviar alerta para o Slack/);
    });
  });
}); 