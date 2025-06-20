import 'dotenv/config';
import { GeminiAIService } from '../GeminiAIService';
import { AnalysisData } from '../../domain/ports/IAIService';
import { AnalyzeAI } from '@/modules/ai-prompting/domain/entities/AnalyzeAI';
import { ICache } from '../../domain/ports/ICache';

// Mock global do fetch para todos os testes deste arquivo
beforeAll(() => {
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                rootCause: 'Causa raiz não identificada',
                suggestions: ['Sugestões não identificadas'],
                confidenceLevel: 0.5,
                category: 'Other',
                tags: [],
                references: [],
              }),
            }],
          },
        }],
      }),
    })
  );
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('GeminiAIService', () => {
  let geminiAIService: GeminiAIService;
  let mockCache: jest.Mocked<ICache>;
  let mockGenerativeModel: { generateContent: jest.Mock };

  const mockConfig = {
    apiKey: process.env.GEMINI_API_KEY || '',
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
    (geminiAIService as unknown as { model: { generateContent: jest.Mock } }).model = mockGenerativeModel;
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
                rootCause: 'Causa raiz não identificada',
                suggestions: ['Sugestões não identificadas'],
                confidenceLevel: 0.5,
                category: 'Other',
                tags: [],
                references: [],
              }),
            }],
          },
        }],
      };

      mockGenerativeModel.generateContent.mockResolvedValue(mockResponse);

      const resultado = await geminiAIService.analyzeError(mockDados);

      expect(resultado.result).toMatchObject({
        rootCause: 'Causa raiz não identificada',
        suggestions: ['Sugestões não identificadas'],
        confidenceLevel: 0.5,
        category: 'Other',
        tags: [],
        references: [],
      });
    });

    it('deve lidar com erro na análise', async () => {
      const error = new Error('Falha na análise');
      mockGenerativeModel.generateContent.mockRejectedValue(error);

      await expect(geminiAIService.analyzeError(mockDados))
        .resolves.toBeDefined();
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
        .resolves.toBeDefined();
    });

    it('deve obter análise do cache quando disponível', async () => {
      const mockAnalise: AnalyzeAI = {
        id: '123',
        timestamp: new Date(),
        error: {
          type: mockDados.error.type,
          message: mockDados.error.message,
          stackTrace: mockDados.error.stackTrace,
          context: mockDados.error.context
        },
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
      };

      mockCache.get.mockResolvedValue(mockAnalise);

      const resultado = await geminiAIService.analyzeError(mockDados);

      expect(resultado).toEqual(mockAnalise);
      expect(mockCache.get).toHaveBeenCalledWith(mockDados);
      expect(mockGenerativeModel.generateContent).not.toHaveBeenCalled();
    });

    it('deve lidar com resposta padrão', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: 'Causa raiz não identificada',
            }],
          },
        }],
      };

      mockGenerativeModel.generateContent.mockResolvedValue(mockResponse);

      const resultado = await geminiAIService.analyzeError(mockDados);

      expect(resultado.result).toMatchObject({
        rootCause: 'Causa raiz não identificada',
        suggestions: ['Sugestões não identificadas'],
        confidenceLevel: 0.5,
        category: 'Other',
        tags: [],
        references: [],
      });
    });

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
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });
      const resultado = await geminiAIService.checkAvailability();
      expect(resultado).toBe(false);
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
                  rootCause: 'Causa raiz não identificada',
                  suggestions: ['Sugestões não identificadas'],
                  confidenceLevel: 0.5,
                  category: 'Other',
                  tags: [],
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

      expect(resultado.result).toMatchObject({
        rootCause: 'Causa raiz não identificada',
        suggestions: ['Sugestões não identificadas'],
        confidenceLevel: 0.5,
        category: 'Other',
        tags: [],
        references: [],
      });
    });

    it('deve lidar com erro na análise', async () => {
      const error = new Error('Falha na análise');
      mockGenerativeModel.generateContent.mockRejectedValue(error);

      await expect(geminiAIService.analyzeCode(mockCodigo, mockArquivo, mockLinha, mockErro))
        .resolves.toBeDefined();
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
        .resolves.toBeDefined();
    });

    it('deve lidar com resposta padrão', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: 'Causa raiz não identificada',
            }],
          },
        }],
      };

      mockGenerativeModel.generateContent.mockResolvedValue(mockResponse);

      const resultado = await geminiAIService.analyzeCode(mockCodigo, mockArquivo, mockLinha, mockErro);

      expect(resultado.result).toMatchObject({
        rootCause: 'Causa raiz não identificada',
        suggestions: ['Sugestões não identificadas'],
        confidenceLevel: 0.5,
        category: 'Other',
        tags: [],
        references: [],
      });
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
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });
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
                version: 'gemini-2.0-flash',
                capabilities: [
                  'Análise de código',
                  'Diagnóstico de erros',
                  'Sugestões de correção',
                  'Categorização de problemas',
                ],
                limitations: [
                  'Pode não ter acesso ao código fonte completo',
                  'Pode não entender contexto específico do negócio',
                  'Pode sugerir soluções genéricas',
                ],
              }),
            }],
          },
        }],
      };

      mockGenerativeModel.generateContent.mockResolvedValue(mockResponse);

      const resultado = await geminiAIService.getModelInfo();

      expect(resultado).toEqual({
        name: 'Gemini',
        version: 'gemini-2.0-flash',
        capabilities: [
          'Análise de código',
          'Diagnóstico de erros',
          'Sugestões de correção',
          'Categorização de problemas',
        ],
        limitations: [
          'Pode não ter acesso ao código fonte completo',
          'Pode não entender contexto específico do negócio',
          'Pode sugerir soluções genéricas',
        ],
      });
    });

    it('deve lidar com erro ao obter informações do modelo', async () => {
      mockGenerativeModel.generateContent.mockRejectedValue(new Error('Erro ao obter informações'));

      await expect(geminiAIService.getModelInfo())
        .resolves.toBeDefined();
    });

    it('deve lidar com resposta padrão', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: 'Causa raiz não identificada',
            }],
          },
        }],
      };

      mockGenerativeModel.generateContent.mockResolvedValue(mockResponse);

      const resultado = await geminiAIService.getModelInfo();

      expect(resultado).toEqual({
        name: 'Gemini',
        version: 'gemini-2.0-flash',
        capabilities: [
          'Análise de código',
          'Diagnóstico de erros',
          'Sugestões de correção',
          'Categorização de problemas',
        ],
        limitations: [
          'Pode não ter acesso ao código fonte completo',
          'Pode não entender contexto específico do negócio',
          'Pode sugerir soluções genéricas',
        ],
      });
    });

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
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });
      const resultado = await geminiAIService.checkAvailability();
      expect(resultado).toBe(false);
    });
  });
}); 