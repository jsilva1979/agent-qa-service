import { SlackAlertAdapter } from '../SlackAlertAdapter';
import { AnaliseIA } from '../../../../ai-prompting/domain/entities/AnaliseIA';

describe('SlackAlertAdapter', () => {
  let adapter: SlackAlertAdapter;
  const mockConfig = {
    webhookUrl: 'https://hooks.slack.com/services/test',
    canal: '#test-channel',
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

  describe('enviarAlerta', () => {
    it('deve enviar um alerta com sucesso', async () => {
      const mockResponse = { ts: '1234567890.123456' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const alerta = {
        tipo: 'info' as const,
        titulo: 'Teste',
        mensagem: 'Mensagem de teste',
        detalhes: {},
      };

      const id = await adapter.enviarAlerta(alerta);
      expect(id).toBe(mockResponse.ts);
      expect(global.fetch).toHaveBeenCalledWith(
        mockConfig.webhookUrl,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('deve lançar erro quando a API falhar', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      });

      const alerta = {
        tipo: 'info' as const,
        titulo: 'Teste',
        mensagem: 'Mensagem de teste',
        detalhes: {},
      };

      await expect(adapter.enviarAlerta(alerta)).rejects.toThrow('Erro na API do Slack: Bad Request');
    });
  });

  describe('enviarAlertaErro', () => {
    it('deve enviar um alerta de erro com sucesso', async () => {
      const mockResponse = { ts: '1234567890.123456' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const erro = {
        tipo: 'TypeError',
        mensagem: 'Cannot read property of undefined',
        stackTrace: 'at Object.process (test.js:10:5)',
      };

      const analise: AnaliseIA = {
        id: '1',
        timestamp: new Date(),
        erro: {
          tipo: 'TypeError',
          mensagem: 'Cannot read property of undefined',
          stackTrace: 'at Object.process (test.js:10:5)',
        },
        resultado: {
          causaRaiz: 'Acesso a propriedade de objeto undefined',
          sugestoes: ['Verificar se o objeto existe antes de acessar suas propriedades'],
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

      const id = await adapter.enviarAlertaErro(erro, analise);
      expect(id).toBe(mockResponse.ts);
    });

    it('deve lançar erro quando o erro for undefined', async () => {
      const analise: AnaliseIA = {
        id: '1',
        timestamp: new Date(),
        erro: {
          tipo: 'TypeError',
          mensagem: 'Cannot read property of undefined',
          stackTrace: 'at Object.process (test.js:10:5)',
        },
        resultado: {
          causaRaiz: 'Acesso a propriedade de objeto undefined',
          sugestoes: ['Verificar se o objeto existe antes de acessar suas propriedades'],
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

      await expect(adapter.enviarAlertaErro(undefined as any, analise)).rejects.toThrow('Erro não pode ser undefined');
    });
  });

  describe('enviarAlertaMetricas', () => {
    it('deve enviar um alerta de métricas com sucesso', async () => {
      const mockResponse = { ts: '1234567890.123456' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const metricas = {
        cpu: 75,
        memoria: 80,
        fila: 10,
      };

      const id = await adapter.enviarAlertaMetricas(metricas);
      expect(id).toBe(mockResponse.ts);
    });
  });

  describe('verificarDisponibilidade', () => {
    it('deve retornar true quando o serviço estiver disponível', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const disponivel = await adapter.verificarDisponibilidade();
      expect(disponivel).toBe(true);
    });

    it('deve retornar false quando o serviço estiver indisponível', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      const disponivel = await adapter.verificarDisponibilidade();
      expect(disponivel).toBe(false);
    });

    it('deve retornar false quando ocorrer um erro', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const disponivel = await adapter.verificarDisponibilidade();
      expect(disponivel).toBe(false);
    });
  });
}); 