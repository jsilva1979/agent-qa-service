import { LogRoutes } from '../LogRoutes';
import { LogEventHandler } from '../../../orchestration/handlers/LogEventHandler';
import { IGitHubRepository } from '../../../github-access/domain/ports/IGitHubRepository';
import { IAIService } from '../../../ai-prompting/domain/ports/IAIService';
import { IAlertService } from '../../../alerting/domain/ports/IAlertService';
import { IDocumentationService } from '../../../documentation/domain/ports/IDocumentationService';
import { Request, Response, Router } from 'express';

jest.mock('../../../orchestration/handlers/LogEventHandler');

const mockRouter = {
  post: jest.fn(),
  get: jest.fn()
};

jest.mock('express', () => ({
  Router: jest.fn(() => mockRouter)
}));

describe('LogRoutes', () => {
  let logRoutes: LogRoutes;
  let mockGitHubRepository: jest.Mocked<IGitHubRepository>;
  let mockAIService: jest.Mocked<IAIService>;
  let mockAlertService: jest.Mocked<IAlertService>;
  let mockDocumentationService: jest.Mocked<IDocumentationService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockGitHubRepository = {
      getCode: jest.fn(),
      getRepositoryInfo: jest.fn(),
      getCommitHistory: jest.fn(),
      checkAvailability: jest.fn()
    } as any;

    mockAIService = {
      analyzeError: jest.fn(),
      analyzeCode: jest.fn(),
      checkAvailability: jest.fn(),
      getModelInfo: jest.fn()
    } as any;

    mockAlertService = {
      sendAlert: jest.fn(),
      checkAvailability: jest.fn()
    } as any;

    mockDocumentationService = {
      createInsight: jest.fn(),
      updateInsight: jest.fn(),
      getInsight: jest.fn()
    } as any;

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

      logRoutes.getRouter();
      const postHandler = mockRouter.post.mock.calls[0][1];

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

      logRoutes.getRouter();
      const postHandler = mockRouter.post.mock.calls[0][1];

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
      logRoutes.getRouter();
      const getHandler = mockRouter.get.mock.calls[0][1];

      getHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ status: 'ok' });
    });
  });
}); 