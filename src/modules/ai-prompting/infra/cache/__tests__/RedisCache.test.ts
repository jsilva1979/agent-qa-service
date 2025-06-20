import { RedisCache } from '../RedisCache';
import { AnalysisData } from '../../../domain/ports/IAIService';
import { AnalyzeAI } from '../../../domain/entities/AnalyzeAI';

// Mock do módulo redis para testes
jest.mock('redis', () => ({
  createClient: () => ({
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
    flushAll: jest.fn(),
    on: jest.fn(),
  }),
}));

describe('RedisCache', () => {
  let client: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    quit: jest.Mock;
    flushAll: jest.Mock;
    connect: jest.Mock;
    on: jest.Mock;
  };
  let cache: RedisCache;
  const mockConfig = {
    url: 'redis://localhost:6379',
    ttl: 60,
    maxSize: 100,
    logging: {
      level: 'info',
      file: { path: 'logs/redis-error.log' },
    },
  };

  const mockDados: AnalysisData = {
    error: {
      type: 'NullPointerException',
      message: 'Cannot read property of null',
      stackTrace: 'at UserProcessor.process (UserProcessor.java:23)',
    },
    code: `
      public class UserProcessor {
        public void process(String name) {
          System.out.println(name.length()); // Linha 23
        }
      }
    `,
  };

  const mockAnalise: AnalyzeAI = {
    id: '123',
    timestamp: new Date(),
    error: {
      type: mockDados.error.type,
      message: mockDados.error.message,
      stackTrace: mockDados.error.stackTrace,
    },
    result: {
      rootCause: 'Objeto name está nulo',
      suggestions: ['Adicionar verificação if (name != null)'],
      confidenceLevel: 0.9,
      category: 'NullPointerException',
      tags: ['null-check', 'validation'],
      references: ['https://docs.oracle.com/javase/8/docs/api/java/lang/NullPointerException.html'],
    },
    metadata: {
      model: 'Gemini',
      version: '2.0-flash',
      processingTime: 100,
      tokensUsed: 150,
    },
  };

  // Função auxiliar para acessar o client privado apenas em testes
  function getTestClient(instance: RedisCache) {
    return (instance as unknown as { client: typeof client }).client;
  }

  beforeEach(() => {
    cache = new RedisCache(mockConfig);
    client = getTestClient(cache);
  });

  describe('get', () => {
    it('deve retornar null quando não há cache', async () => {
      client.get.mockResolvedValue(null);

      const result = await cache.get(mockDados);
      expect(result).toBeNull();
      expect(client.get).toHaveBeenCalledWith('analise:NullPointerException:Cannot read property of null');
    });

    it('deve retornar análise do cache quando existe', async () => {
      const mockAnaliseComString = { ...mockAnalise, timestamp: mockAnalise.timestamp.toISOString() };
      client.get.mockResolvedValue(JSON.stringify(mockAnaliseComString));

      const result = await cache.get(mockDados);
      expect(result).toEqual(mockAnaliseComString);
      expect(client.get).toHaveBeenCalledWith('analise:NullPointerException:Cannot read property of null');
    });

    it('deve retornar null em caso de erro', async () => {
      client.get.mockRejectedValue(new Error('Redis error'));

      const result = await cache.get(mockDados);
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('deve armazenar análise no cache com TTL', async () => {
      client.set.mockResolvedValue('OK');

      await cache.set(mockDados, mockAnalise);
      expect(client.set).toHaveBeenCalledWith(
        'analise:NullPointerException:Cannot read property of null',
        JSON.stringify(mockAnalise),
        { EX: mockConfig.ttl }
      );
    });

    it('deve lidar com erro ao armazenar no cache', async () => {
      client.set.mockRejectedValue(new Error('Redis error'));

      await expect(cache.set(mockDados, mockAnalise)).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('deve limpar todo o cache', async () => {
      client.flushAll.mockResolvedValue('OK');

      await cache.clear();
      expect(client.flushAll).toHaveBeenCalled();
    });

    it('deve lidar com erro ao limpar cache', async () => {
      client.flushAll.mockRejectedValue(new Error('Redis error'));

      await expect(cache.clear()).resolves.not.toThrow();
    });
  });

  describe('disconnect', () => {
    it('deve encerrar conexão com Redis', async () => {
      client.quit.mockResolvedValue('OK');

      await cache.disconnect();
      expect(client.quit).toHaveBeenCalled();
    });

    it('deve lidar com erro ao encerrar conexão', async () => {
      client.quit.mockRejectedValue(new Error('Redis error'));

      await expect(cache.disconnect()).resolves.not.toThrow();
    });
  });
}); 