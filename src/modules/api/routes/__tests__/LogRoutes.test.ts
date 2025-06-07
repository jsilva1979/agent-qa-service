import { LogRoutes } from '../LogRoutes';
import { LogEventHandler } from '../../../orchestration/handlers/LogEventHandler';
import { IGitHubRepository } from '../../../github-access/domain/ports/IGitHubRepository';
import { IAIService } from '../../../ai-prompting/domain/ports/IAIService';
import { IAlertService } from '../../../alerting/domain/ports/IAlertService';
import { IDocumentationService } from '../../../documentation/domain/ports/IDocumentationService';
import { Request, Response, Router } from 'express';

jest.mock('../../../orchestration/handlers/LogEventHandler');
jest.mock('express', () => ({
  Router: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn()
  }))
}));

describe('LogRoutes', () => {
  let logRoutes: LogRoutes;
  let mockGitHubRepository: jest.Mocked<IGitHubRepository>;
  let mockAIService: jest.Mocked<IAIService>;
  let mockAlertService: jest.Mocked<IAlertService>;
  let mockDocumentationService: jest.Mocked<IDocumentationService>;
  let mockRouter: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockGitHubRepository = {
      obterCodigo: jest.fn(),
      obterInfoRepositorio: jest.fn(),
      obterHistoricoCommits: jest.fn(),
      verificarDisponibilidade: jest.fn()
    } as any;

    mockAIService = {
      analisarErro: jest.fn(),
      analisarCodigo: jest.fn(),
      verificarDisponibilidade: jest.fn(),
      obterInfoModelo: jest.fn()
    } as any;

    mockAlertService = {
      enviarAlerta: jest.fn(),
      verificarDisponibilidade: jest.fn()
    } as any;

    mockDocumentationService = {
      criarInsight: jest.fn(),
      atualizarInsight: jest.fn(),
      buscarInsight: jest.fn()
    } as any;

    mockRouter = {
      post: jest.fn(),
      get: jest.fn()
    };

    mockRequest = {
      body: {
        id: '123',
        servico: 'teste',
        nivel: 'error',
        mensagem: 'Erro de teste'
      }
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    logRoutes = new LogRoutes(
      mockGitHubRepository,
      mockAIService,
      mockAlertService,
      mockDocumentationService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /logs', () => {
    it('deve processar log com sucesso', async () => {
      const mockLogEventHandler = {
        handle: jest.fn().mockResolvedValue(undefined)
      };
      (LogEventHandler as jest.Mock).mockImplementation(() => mockLogEventHandler);

      const router = logRoutes.getRouter();
      const postHandler = router.post.mock.calls[0][1];

      await postHandler(mockRequest as Request, mockResponse as Response);

      expect(mockLogEventHandler.handle).toHaveBeenCalledWith(mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Log processado com sucesso'
      });
    });

    it('deve lidar com erro ao processar log', async () => {
      const error = new Error('Erro ao processar log');
      const mockLogEventHandler = {
        handle: jest.fn().mockRejectedValue(error)
      };
      (LogEventHandler as jest.Mock).mockImplementation(() => mockLogEventHandler);

      const router = logRoutes.getRouter();
      const postHandler = router.post.mock.calls[0][1];

      await postHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Erro ao processar log',
        details: 'Erro ao processar log'
      });
    });
  });

  describe('GET /health', () => {
    it('deve retornar status ok', () => {
      const router = logRoutes.getRouter();
      const getHandler = router.get.mock.calls[0][1];

      getHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ status: 'ok' });
    });
  });
}); 