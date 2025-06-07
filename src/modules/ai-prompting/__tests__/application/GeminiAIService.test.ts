import { GeminiAIService } from '../../application/GeminiAIService';
import { ICache } from '../../domain/ports/ICache';
import { AnalysisData } from '../../domain/ports/IAIService';
import { AnaliseIA } from '../../domain/entities/AnaliseIA';
import winston from 'winston';

describe('GeminiAIService', () => {
  let geminiAIService: GeminiAIService;
  let mockCache: jest.Mocked<ICache>;
  let mockLogger: jest.Mocked<winston.Logger>;

  const mockConfig = {
    apiKey: 'test-api-key',
    modelName: 'gemini-2.0-flash',
    logging: {
      level: 'info',
      file: {
        path: 'test.log'
      }
    }
  };

  beforeEach(() => {
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
      disconnect: jest.fn()
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      log: jest.fn()
    } as unknown as jest.Mocked<winston.Logger>;

    geminiAIService = new GeminiAIService(mockConfig, mockCache);
  });

  describe('analyzeError', () => {
    const mockAnalysisData: AnalysisData = {
      code: 'test code',
      error: {
        type: 'TypeError',
        message: 'Test error message',
        stackTrace: 'Error: Test error\nat test.ts:42',
        context: { test: 'context' }
      }
    };

    const mockAnaliseIA: AnaliseIA = {
      id: 'test-id',
      timestamp: new Date(),
      erro: {
        tipo: 'TypeError',
        mensagem: 'Test error message',
        stackTrace: 'Error: Test error\nat test.ts:42',
        contexto: { test: 'context' }
      },
      resultado: {
        causaRaiz: 'Test root cause',
        sugestoes: ['Test suggestion'],
        nivelConfianca: 0.8,
        categoria: 'error',
        tags: ['test'],
        referencias: ['test-ref']
      },
      metadados: {
        modelo: 'Gemini',
        versao: 'gemini-2.0-flash',
        tempoProcessamento: 100,
        tokensUtilizados: 50
      }
    };

    it('should return cached analysis if available', async () => {
      mockCache.get.mockResolvedValue(mockAnaliseIA);

      const result = await geminiAIService.analyzeError(mockAnalysisData);

      expect(mockCache.get).toHaveBeenCalledWith(mockAnalysisData);
      expect(result).toEqual(mockAnaliseIA);
    });

    it('should call Gemini API and cache result when no cache available', async () => {
      mockCache.get.mockResolvedValue(null);

      // Mock fetch response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: 'Test analysis'
              }]
            }
          }]
        })
      });

      const result = await geminiAIService.analyzeError(mockAnalysisData);

      expect(mockCache.get).toHaveBeenCalledWith(mockAnalysisData);
      expect(mockCache.set).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.erro.tipo).toBe(mockAnalysisData.error.type);
    });

    it('should handle API errors', async () => {
      mockCache.get.mockResolvedValue(null);
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'API Error'
      });

      await expect(geminiAIService.analyzeError(mockAnalysisData))
        .rejects
        .toThrow('Erro na API do Gemini: API Error');
    });
  });

  describe('analyzeCode', () => {
    it('should analyze code and return result', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: 'Test code analysis'
              }]
            }
          }]
        })
      });

      const result = await geminiAIService.analyzeCode(
        'test code',
        'test.ts',
        42,
        'TypeError'
      );

      expect(result).toBeDefined();
      expect(result.file).toBe('test.ts');
      expect(result.line).toBe(42);
      expect(result.error).toBe('TypeError');
    });

    it('should handle API errors in code analysis', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'API Error'
      });

      await expect(geminiAIService.analyzeCode(
        'test code',
        'test.ts',
        42,
        'TypeError'
      )).rejects.toThrow('Erro na API do Gemini: API Error');
    });
  });

  describe('checkAvailability', () => {
    it('should return true when API is available', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true
      });

      const result = await geminiAIService.checkAvailability();
      expect(result).toBe(true);
    });

    it('should return false when API is unavailable', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false
      });

      const result = await geminiAIService.checkAvailability();
      expect(result).toBe(false);
    });

    it('should return false when API call fails', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await geminiAIService.checkAvailability();
      expect(result).toBe(false);
    });
  });

  describe('getModelInfo', () => {
    it('should return model information', async () => {
      const result = await geminiAIService.getModelInfo();

      expect(result).toEqual({
        name: 'Gemini',
        version: 'gemini-2.0-flash',
        capabilities: expect.any(Array),
        limitations: expect.any(Array)
      });
    });
  });
}); 