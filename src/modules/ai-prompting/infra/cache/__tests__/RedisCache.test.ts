import { RedisCache } from '../RedisCache';
import { AnalysisData } from '../../../domain/ports/IAIService';
import { AnalyzeAI } from '../../../domain/entities/AnalyzeAI';
import { createClient } from 'redis';

// Mock do Redis client
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    on: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    flushAll: jest.fn(),
    quit: jest.fn(),
  })),
}));

describe('RedisCache', () => {
  let cache: RedisCache;
  const mockConfig = {
    url: 'redis://localhost:6379',
    ttl: 3600,
    maxSize: 1000,
    logging: {
      level: 'info',
      file: {
        path: 'logs/cache.log',
      },
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
    erro: {
      tipo: mockDados.error.type,
      mensagem: mockDados.error.message,
      stackTrace: mockDados.error.stackTrace,
    },
    resultado: {
      causaRaiz: 'Objeto name está nulo',
      sugestoes: ['Adicionar verificação if (name != null)'],
      nivelConfianca: 0.9,
      categoria: 'NullPointerException',
      tags: ['null-check', 'validation'],
      referencias: ['https://docs.oracle.com/javase/8/docs/api/java/lang/NullPointerException.html'],
    },
    metadados: {
      modelo: 'Gemini',
      versao: '2.0-flash',
      tempoProcessamento: 100,
      tokensUtilizados: 150,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    cache = new RedisCache(mockConfig);
  });

  describe('get', () => {
    it('deve retornar null quando não há cache', async () => {
      const mockClient = createClient() as any;
      mockClient.get.mockResolvedValue(null);

      const result = await cache.get(mockDados);
      expect(result).toBeNull();
      expect(mockClient.get).toHaveBeenCalledWith('analise:NullPointerException:Cannot read property of null');
    });

    it('deve retornar análise do cache quando existe', async () => {
      const mockClient = createClient() as any;
      mockClient.get.mockResolvedValue(JSON.stringify(mockAnalise));

      const result = await cache.get(mockDados);
      expect(result).toEqual(mockAnalise);
      expect(mockClient.get).toHaveBeenCalledWith('analise:NullPointerException:Cannot read property of null');
    });

    it('deve retornar null em caso de erro', async () => {
      const mockClient = createClient() as any;
      mockClient.get.mockRejectedValue(new Error('Redis error'));

      const result = await cache.get(mockDados);
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('deve armazenar análise no cache com TTL', async () => {
      const mockClient = createClient() as any;
      mockClient.set.mockResolvedValue('OK');

      await cache.set(mockDados, mockAnalise);
      expect(mockClient.set).toHaveBeenCalledWith(
        'analise:NullPointerException:Cannot read property of null',
        JSON.stringify(mockAnalise),
        { EX: mockConfig.ttl }
      );
    });

    it('deve lidar com erro ao armazenar no cache', async () => {
      const mockClient = createClient() as any;
      mockClient.set.mockRejectedValue(new Error('Redis error'));

      await expect(cache.set(mockDados, mockAnalise)).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('deve limpar todo o cache', async () => {
      const mockClient = createClient() as any;
      mockClient.flushAll.mockResolvedValue('OK');

      await cache.clear();
      expect(mockClient.flushAll).toHaveBeenCalled();
    });

    it('deve lidar com erro ao limpar cache', async () => {
      const mockClient = createClient() as any;
      mockClient.flushAll.mockRejectedValue(new Error('Redis error'));

      await expect(cache.clear()).resolves.not.toThrow();
    });
  });

  describe('disconnect', () => {
    it('deve encerrar conexão com Redis', async () => {
      const mockClient = createClient() as any;
      mockClient.quit.mockResolvedValue('OK');

      await cache.disconnect();
      expect(mockClient.quit).toHaveBeenCalled();
    });

    it('deve lidar com erro ao encerrar conexão', async () => {
      const mockClient = createClient() as any;
      mockClient.quit.mockRejectedValue(new Error('Redis error'));

      await expect(cache.disconnect()).resolves.not.toThrow();
    });
  });
}); 