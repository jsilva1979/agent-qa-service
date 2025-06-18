import { GeminiAIService } from '../application/GeminiAIService';
import { RedisCache } from '../infra/cache/RedisCache';

// Mock do Redis
jest.mock('../infra/cache/RedisCache');

describe('GeminiAIService', () => {
  let aiService: GeminiAIService;
  let mockCache: jest.Mocked<RedisCache>;

  beforeEach(() => {
    mockCache = new RedisCache({
      url: 'redis://localhost:6379',
      ttl: 3600,
      maxSize: 1000,
      logging: {
        level: 'info',
        file: {
          path: 'logs/ai-service.log',
        },
      },
    }) as jest.Mocked<RedisCache>;

    aiService = new GeminiAIService(
      {
        apiKey: 'test-api-key',
        modelName: 'gemini-2.0-flash',
        logging: {
          level: 'info',
          file: {
            path: 'logs/ai-service.log',
          },
        },
      },
      mockCache
    );
  });

  describe('analyzeError', () => {
    it('should analyze error and return structured response', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: `
1. CAUSA RAIZ:
Erro de null pointer ao acessar propriedade de objeto não inicializado

2. SUGESTÕES DE CORREÇÃO:
1. Adicionar verificação de null
2. Inicializar o objeto antes de usar
3. Usar optional chaining

3. NÍVEL DE CONFIANÇA:
0.9

4. CATEGORIA:
Runtime

5. TAGS:
null-pointer, initialization, runtime-error

6. REFERÊNCIAS:
MDN Web Docs - Optional Chaining
TypeScript Handbook - Null Checks
`,
                },
              ],
            },
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await aiService.analyzeError({
        code: 'const obj = null;\nobj.property;',
        error: {
          type: 'TypeError',
          message: 'Cannot read property of null',
          stackTrace: 'at Object.process (index.js:10:5)',
        },
      });

      expect(result).toMatchObject({
        erro: {
          tipo: 'TypeError',
          mensagem: 'Cannot read property of null',
        },
        resultado: {
          causaRaiz: expect.stringContaining('null pointer'),
          sugestoes: expect.arrayContaining([
            expect.stringContaining('verificação de null'),
          ]),
          nivelConfianca: 0.9,
          categoria: 'Runtime',
          tags: expect.arrayContaining(['null-pointer']),
        },
      });
    });

    it('should use cache when available', async () => {
      const cachedAnalysis = {
        id: 'test-id',
        timestamp: new Date(),
        erro: {
          tipo: 'TypeError',
          mensagem: 'Cached error',
        },
        resultado: {
          causaRaiz: 'Cached cause',
          sugestoes: ['Cached suggestion'],
          nivelConfianca: 0.8,
          categoria: 'Runtime',
          tags: ['cached'],
          referencias: ['cached-ref'],
        },
        metadados: {
          modelo: 'Gemini',
          versao: 'gemini-pro',
          tempoProcessamento: 100,
          tokensUtilizados: 50,
        },
      };

      mockCache.get.mockResolvedValue(cachedAnalysis);

      const result = await aiService.analyzeError({
        code: 'const obj = null;\nobj.property;',
        error: {
          type: 'TypeError',
          message: 'Cached error',
        },
      });

      expect(result).toEqual(cachedAnalysis);
      expect(mockCache.get).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'API Error',
      });

      await expect(
        aiService.analyzeError({
          code: 'const obj = null;\nobj.property;',
          error: {
            type: 'Error',
            message: 'Test error',
          },
        })
      ).rejects.toThrow('Erro na API do Gemini');
    });
  });

  describe('analyzeCode', () => {
    it('should analyze code and return structured response', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: `
1. CAUSA RAIZ:
Loop infinito devido a condição incorreta

2. SUGESTÕES DE CORREÇÃO:
1. Corrigir a condição do while
2. Adicionar break condition
3. Usar for loop ao invés de while

3. NÍVEL DE CONFIANÇA:
0.95

4. CATEGORIA:
Logic

5. TAGS:
infinite-loop, logic-error, control-flow

6. REFERÊNCIAS:
MDN Web Docs - Loops
JavaScript Best Practices
`,
                },
              ],
            },
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await aiService.analyzeCode(
        'while(true) { console.log("loop"); }',
        'test.js',
        1,
        'Infinite loop detected'
      );

      expect(result).toMatchObject({
        file: 'test.js',
        line: 1,
        error: 'Infinite loop detected',
        result: {
          rootCause: expect.stringContaining('Loop infinito'),
          suggestions: expect.arrayContaining([
            expect.stringContaining('condição do while'),
          ]),
          confidenceLevel: 0.95,
          category: 'Logic',
          tags: expect.arrayContaining(['infinite-loop']),
        },
      });
    });

    it('should handle API errors gracefully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'API Error',
      });

      await expect(
        aiService.analyzeCode('test code', 'test.js', 1, 'test error')
      ).rejects.toThrow('Erro na API do Gemini');
    });
  });

  describe('checkAvailability', () => {
    it('should return true when API is available', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
      });

      const result = await aiService.checkAvailability();
      expect(result).toBe(true);
    });

    it('should return false when API is unavailable', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
      });

      const result = await aiService.checkAvailability();
      expect(result).toBe(false);
    });
  });

  describe('getModelInfo', () => {
    it('should return model information', async () => {
      const result = await aiService.getModelInfo();

      expect(result).toEqual({
        name: 'Gemini',
        version: 'gemini-2.0-flash',
        capabilities: expect.arrayContaining([
          'Análise de código',
          'Diagnóstico de erros',
        ]),
        limitations: expect.arrayContaining([
          'Pode não ter acesso ao código fonte completo',
          'Pode não entender contexto específico do negócio',
        ]),
      });
    });
  });
}); 