import { LogEventHandler } from '../LogEventHandler';
import { IGitHubRepository } from '../../../github-access/domain/ports/IGitHubRepository';
import { IAIService } from '../../../ai-prompting/domain/ports/IAIService';
import { IAlertService } from '../../../alerting/domain/ports/IAlertService';
import { IDocumentationService } from '../../../documentation/domain/ports/IDocumentationService';
import { CodeContext } from '../../../github-access/domain/CodeContext';
import { AnaliseErro } from '../../../ai-prompting/domain/AnaliseErro';
import { Alerta } from '../../../alerting/domain/Alerta';
import { InsightTecnico } from '../../../documentation/domain/InsightTecnico';

describe('LogEventHandler', () => {
  let logEventHandler: LogEventHandler;
  let mockGitHubRepository: jest.Mocked<IGitHubRepository>;
  let mockAIService: jest.Mocked<IAIService>;
  let mockAlertService: jest.Mocked<IAlertService>;
  let mockDocumentationService: jest.Mocked<IDocumentationService>;

  const mockLogEvent = {
    servico: 'teste',
    arquivo: 'teste.ts',
    linha: 10,
    erro: {
      tipo: 'ErroTeste',
      mensagem: 'Mensagem de erro teste',
      stacktrace: 'Stack trace teste'
    }
  };

  const mockCodeContext: CodeContext = {
    arquivo: 'teste.ts',
    linha: 10,
    codigo: 'console.log("teste");',
    repositorio: 'teste/repo',
    branch: 'main',
    url: 'https://github.com/teste/repo'
  };

  const mockAnalise: AnaliseErro = {
    causa: 'Causa teste',
    verificacoesAusentes: ['Verificação teste'],
    sugestaoCorrecao: 'Sugestão teste',
    explicacao: 'Explicação teste',
    nivelConfianca: 100
  };

  beforeEach(() => {
    mockGitHubRepository = {
      obterContextoCodigo: jest.fn().mockResolvedValue(mockCodeContext)
    } as any;

    mockAIService = {
      analisarErro: jest.fn().mockResolvedValue(mockAnalise)
    } as any;

    mockAlertService = {
      enviarAlerta: jest.fn().mockResolvedValue(undefined)
    } as any;

    mockDocumentationService = {
      criarInsight: jest.fn().mockResolvedValue('123456')
    } as any;

    logEventHandler = new LogEventHandler(
      mockGitHubRepository,
      mockAIService,
      mockAlertService,
      mockDocumentationService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handle', () => {
    it('deve processar evento de log com sucesso', async () => {
      await logEventHandler.handle(mockLogEvent);

      expect(mockGitHubRepository.obterContextoCodigo).toHaveBeenCalledWith(
        mockLogEvent.servico,
        mockLogEvent.arquivo,
        mockLogEvent.linha
      );

      expect(mockAIService.analisarErro).toHaveBeenCalledWith(
        mockCodeContext,
        mockLogEvent.erro
      );

      expect(mockAlertService.enviarAlerta).toHaveBeenCalledWith({
        servico: mockLogEvent.servico,
        erro: mockLogEvent.erro,
        codigo: mockCodeContext,
        analise: mockAnalise,
        timestamp: expect.any(String),
        nivel: 'error'
      });

      expect(mockDocumentationService.criarInsight).toHaveBeenCalledWith({
        titulo: `Erro em ${mockLogEvent.servico}: ${mockLogEvent.erro.tipo}`,
        servico: mockLogEvent.servico,
        erro: mockLogEvent.erro,
        codigo: mockCodeContext,
        analise: mockAnalise,
        dataOcorrencia: expect.any(String),
        status: 'pendente',
        solucao: mockAnalise.sugestaoCorrecao,
        preventivas: mockAnalise.verificacoesAusentes
      });
    });

    it('deve lançar erro quando falhar ao obter contexto do código', async () => {
      const error = new Error('Erro ao obter contexto');
      mockGitHubRepository.obterContextoCodigo.mockRejectedValueOnce(error);

      await expect(logEventHandler.handle(mockLogEvent))
        .rejects.toThrow('Erro ao obter contexto');
    });

    it('deve lançar erro quando falhar ao analisar erro', async () => {
      const error = new Error('Erro ao analisar');
      mockAIService.analisarErro.mockRejectedValueOnce(error);

      await expect(logEventHandler.handle(mockLogEvent))
        .rejects.toThrow('Erro ao analisar');
    });

    it('deve lançar erro quando falhar ao enviar alerta', async () => {
      const error = new Error('Erro ao enviar alerta');
      mockAlertService.enviarAlerta.mockRejectedValueOnce(error);

      await expect(logEventHandler.handle(mockLogEvent))
        .rejects.toThrow('Erro ao enviar alerta');
    });

    it('deve lançar erro quando falhar ao criar insight', async () => {
      const error = new Error('Erro ao criar insight');
      mockDocumentationService.criarInsight.mockRejectedValueOnce(error);

      await expect(logEventHandler.handle(mockLogEvent))
        .rejects.toThrow('Erro ao criar insight');
    });
  });
}); 