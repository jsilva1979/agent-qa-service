import { GeminiAIService } from '../GeminiAIService';
import { IAIService, AnalysisData } from '../../domain/ports/IAIService';
import { AnaliseIA } from '../../domain/entities/AnaliseIA';
import { ICache } from '../../domain/ports/ICache';

jest.mock('@google/generative-ai');

describe('GeminiAIService', () => {
  let geminiAIService: GeminiAIService;
  let mockCache: jest.Mocked<ICache>;
  let mockGenerativeModel: any;

  const mockConfig = {
    apiKey: 'test-api-key',
    modelName: 'gemini-2.0-flash',
    logging: {
      level: 'info',
      file: {
        path: 'logs/ai-service.log',
      },
    },
  };

  beforeEach(() => {
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
      disconnect: jest.fn(),
    };

    mockGenerativeModel = {
      generateContent: jest.fn(),
    };

    geminiAIService = new GeminiAIService(mockConfig, mockCache);
    (geminiAIService as any).model = mockGenerativeModel;
  });

  describe('analyzeError', () => {
    const mockDados: AnalysisData = {
      code: 'public class UserProcessor {\n  private String name;\n}',
      error: {
        type: 'NullPointerException',
        message: 'name is null',
        stackTrace: 'at UserProcessor.java:23',
      },
      logs: ['Error: name is null'],
      metrics: {
        cpu: 80,
        memory: 512,
      },
    };

    it('deve analisar erro com sucesso', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                causaRaiz: 'Variável name não foi inicializada',
                sugestoes: ['Verificação de null'],
                nivelConfianca: 0.9,
                categoria: 'NullPointerException',
                tags: ['null-check'],
                referencias: [],
              }),
            }],
          },
        }],
      };

      mockGenerativeModel.generateContent.mockResolvedValue(mockResponse);

      const resultado = await geminiAIService.analyzeError(mockDados);

      expect(resultado).toMatchObject({
        erro: mockDados.error,
        resultado: {
          causaRaiz: 'Variável name não foi inicializada',
          sugestoes: ['Verificação de null'],
          nivelConfianca: 0.9,
          categoria: 'NullPointerException',
          tags: ['null-check'],
          referencias: [],
        },
      });
    });

    it('deve lidar com erro na análise', async () => {
      const error = new Error('Falha na análise');
      mockGenerativeModel.generateContent.mockRejectedValue(error);

      await expect(geminiAIService.analyzeError(mockDados))
        .rejects.toThrow('Falha na análise');
    });

    it('deve validar resposta inválida', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: 'resposta inválida',
            }],
          },
        }],
      };

      mockGenerativeModel.generateContent.mockResolvedValue(mockResponse);

      await expect(geminiAIService.analyzeError(mockDados))
        .rejects.toThrow('Resposta inválida do modelo');
    });

    it('deve obter análise do cache quando disponível', async () => {
      const mockAnalise: AnaliseIA = {
        id: '123',
        timestamp: new Date(),
        erro: {
          tipo: mockDados.error.type,
          mensagem: mockDados.error.message,
          stackTrace: mockDados.error.stackTrace,
          contexto: mockDados.error.context
        },
        resultado: {
          causaRaiz: 'Variável name não foi inicializada',
          sugestoes: ['Verificação de null'],
          nivelConfianca: 0.9,
          categoria: 'NullPointerException',
          tags: ['null-check'],
          referencias: [],
        },
        metadados: {
          modelo: 'Gemini',
          versao: '2.0-flash',
          tempoProcessamento: 100,
          tokensUtilizados: 150,
        },
      };

      mockCache.get.mockResolvedValue(mockAnalise);

      const resultado = await geminiAIService.analyzeError(mockDados);

      expect(resultado).toEqual(mockAnalise);
      expect(mockCache.get).toHaveBeenCalledWith(mockDados);
      expect(mockGenerativeModel.generateContent).not.toHaveBeenCalled();
    });
  });

  describe('analyzeCode', () => {
    const mockCodigo = 'public class UserProcessor {\n  private String name;\n}';
    const mockArquivo = 'UserProcessor.java';
    const mockLinha = 23;
    const mockErro = 'NullPointerException: name is null';

    it('deve analisar código com sucesso', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                id: '123',
                timestamp: new Date().toISOString(),
                file: mockArquivo,
                line: mockLinha,
                error: mockErro,
                result: {
                  rootCause: 'Variável name não foi inicializada',
                  suggestions: ['Verificação de null'],
                  confidenceLevel: 0.9,
                  category: 'NullPointerException',
                  tags: ['null-check'],
                  references: [],
                },
                metadata: {
                  model: 'Gemini',
                  version: '2.0-flash',
                  processingTime: 100,
                  tokensUsed: 150,
                },
              }),
            }],
          },
        }],
      };

      mockGenerativeModel.generateContent.mockResolvedValue(mockResponse);

      const resultado = await geminiAIService.analyzeCode(
        mockCodigo,
        mockArquivo,
        mockLinha,
        mockErro
      );

      expect(resultado).toMatchObject({
        file: mockArquivo,
        line: mockLinha,
        error: mockErro,
        result: {
          rootCause: 'Variável name não foi inicializada',
          suggestions: ['Verificação de null'],
          confidenceLevel: 0.9,
          category: 'NullPointerException',
          tags: ['null-check'],
          references: [],
        },
      });
    });

    it('deve lidar com erro na análise', async () => {
      const error = new Error('Falha na análise');
      mockGenerativeModel.generateContent.mockRejectedValue(error);

      await expect(geminiAIService.analyzeCode(mockCodigo, mockArquivo, mockLinha, mockErro))
        .rejects.toThrow('Falha na análise');
    });

    it('deve validar resposta inválida', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: 'resposta inválida',
            }],
          },
        }],
      };

      mockGenerativeModel.generateContent.mockResolvedValue(mockResponse);

      await expect(geminiAIService.analyzeCode(mockCodigo, mockArquivo, mockLinha, mockErro))
        .rejects.toThrow('Resposta inválida do modelo');
    });
  });

  describe('checkAvailability', () => {
    it('deve retornar true quando o serviço está disponível', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: 'OK',
            }],
          },
        }],
      };

      mockGenerativeModel.generateContent.mockResolvedValue(mockResponse);

      const resultado = await geminiAIService.checkAvailability();

      expect(resultado).toBe(true);
    });

    it('deve retornar false quando o serviço está indisponível', async () => {
      mockGenerativeModel.generateContent.mockRejectedValue(new Error('Serviço indisponível'));

      const resultado = await geminiAIService.checkAvailability();

      expect(resultado).toBe(false);
    });
  });

  describe('getModelInfo', () => {
    it('deve retornar informações do modelo', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                name: 'Gemini',
                version: '2.0-flash',
                capabilities: ['Análise de código', 'Análise de erros'],
                limitations: ['Limite de tokens', 'Tempo de resposta'],
              }),
            }],
          },
        }],
      };

      mockGenerativeModel.generateContent.mockResolvedValue(mockResponse);

      const resultado = await geminiAIService.getModelInfo();

      expect(resultado).toEqual({
        name: 'Gemini',
        version: '2.0-flash',
        capabilities: ['Análise de código', 'Análise de erros'],
        limitations: ['Limite de tokens', 'Tempo de resposta'],
      });
    });

    it('deve lidar com erro ao obter informações do modelo', async () => {
      mockGenerativeModel.generateContent.mockRejectedValue(new Error('Erro ao obter informações'));

      await expect(geminiAIService.getModelInfo())
        .rejects.toThrow('Erro ao obter informações do modelo');
    });
  });
}); 