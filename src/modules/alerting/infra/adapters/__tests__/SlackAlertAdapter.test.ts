import { SlackAlertAdapter } from '../SlackAlertAdapter';
import { AnalyzeAI } from '../../../../ai-prompting/domain/entities/AnalyzeAI';
import { Alert } from '../../../domain/ports/IAlertService';

describe('SlackAlertAdapter', () => {
  let adapter: SlackAlertAdapter;
  const mockConfig = {
    token: 'test-token',
    channel: '#test-channel',
    logging: {
      level: 'info',
      file: {
        path: 'logs/test.log',
      },
    },
  };

  beforeEach(() => {
    adapter = new SlackAlertAdapter(mockConfig);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendAlert', () => {
    it('should send an alert successfully', async () => {
      const mockResponse = { ts: '1234567890.123456' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const alert: Omit<Alert, 'id' | 'metadata'> = {
        type: 'info',
        title: 'Test',
        message: 'Test message',
        timestamp: new Date(),
        details: {},
      };

      const id = await adapter.sendAlert(alert);
      expect(id).toBe(mockResponse.ts);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://slack.com/api/chat.postMessage',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"channel":"#test-channel"')
        })
      );
    });

    it('should throw an error when API fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      });

      const alert: Omit<Alert, 'id' | 'metadata'> = {
        type: 'info',
        title: 'Test',
        message: 'Test message',
        timestamp: new Date(),
        details: {},
      };

      await expect(adapter.sendAlert(alert)).rejects.toThrow('Error in Slack API: Bad Request');
    });
  });

  describe('sendErrorAlert', () => {
    it('should send an error alert successfully', async () => {
      const mockResponse = { ts: '1234567890.123456' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const errorDetails: Alert['details']['error'] = {
        type: 'TypeError',
        message: 'Cannot read property of undefined',
        stackTrace: 'at Object.process (test.js:10:5)',
      };

      const analysis: AnalyzeAI = {
        id: '1',
        timestamp: new Date(),
        erro: {
          tipo: 'TypeError',
          mensagem: 'Cannot read property of undefined',
          stackTrace: 'at Object.process (test.js:10:5)',
        },
        resultado: {
          causaRaiz: 'Access to undefined object property',
          sugestoes: ['Check if the object exists before accessing its properties'],
          nivelConfianca: 0.95,
          categoria: 'runtime',
          tags: ['undefined', 'property-access'],
          referencias: [],
        },
        metadados: {
          modelo: 'gemini-2.0-flash',
          versao: '1.0.0',
          tempoProcessamento: 0.5,
          tokensUtilizados: 150,
        },
      };

      const id = await adapter.sendErrorAlert(errorDetails, analysis);
      expect(id).toBe(mockResponse.ts);
    });

    it('should throw an error when error is undefined', async () => {
      const analysis: AnalyzeAI = {
        id: '1',
        timestamp: new Date(),
        erro: {
          tipo: 'TypeError',
          mensagem: 'Cannot read property of undefined',
          stackTrace: 'at Object.process (test.js:10:5)',
        },
        resultado: {
          causaRaiz: 'Access to undefined object property',
          sugestoes: ['Check if the object exists before accessing its properties'],
          nivelConfianca: 0.95,
          categoria: 'runtime',
          tags: ['undefined', 'property-access'],
          referencias: [],
        },
        metadados: {
          modelo: 'gemini-2.0-flash',
          versao: '1.0.0',
          tempoProcessamento: 0.5,
          tokensUtilizados: 150,
        },
      };

      await expect(adapter.sendErrorAlert(undefined as any, analysis)).rejects.toThrow('Error details not provided');
    });
  });

  describe('sendMetricsAlert', () => {
    it('should send a metrics alert successfully', async () => {
      const mockResponse = { ts: '1234567890.123456' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const metrics: Alert['details']['metrics'] = {
        cpu: 75,
        memory: 80,
        latency: 10,
      };

      const id = await adapter.sendMetricsAlert(metrics);
      expect(id).toBe(mockResponse.ts);
    });
  });

  describe('checkAvailability', () => {
    it('should return true when service is available', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const available = await adapter.checkAvailability();
      expect(available).toBe(true);
    });

    it('should return false when service is unavailable', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      const available = await adapter.checkAvailability();
      expect(available).toBe(false);
    });

    it('should return false when an error occurs', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const available = await adapter.checkAvailability();
      expect(available).toBe(false);
    });
  });
}); 