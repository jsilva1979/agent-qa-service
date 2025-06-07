import { ConfluenceService } from '../../infrastructure/ConfluenceService';
import { AnaliseIA } from '../../../ai-prompting/domain/entities/AnaliseIA';
import { Documentation } from '../../domain/ports/IDocumentationService';
import winston from 'winston';

describe('ConfluenceService', () => {
  let confluenceService: ConfluenceService;
  let mockLogger: jest.Mocked<winston.Logger>;

  const mockConfig = {
    baseUrl: 'https://test.atlassian.net/wiki',
    username: 'test@example.com',
    apiToken: 'test-token',
    spaceKey: 'TEST',
    parentPageId: '123',
    logging: {
      level: 'info',
      file: {
        path: 'test.log'
      }
    }
  };

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      log: jest.fn()
    } as unknown as jest.Mocked<winston.Logger>;

    confluenceService = new ConfluenceService(mockConfig);
  });

  describe('createDocument', () => {
    const mockAnalysis: AnaliseIA = {
      id: 'test-id',
      timestamp: new Date(),
      erro: {
        tipo: 'TypeError',
        mensagem: 'Test error',
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

    it('should create document successfully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'test-doc-id',
          title: 'Test Document',
          version: { number: 1 }
        })
      });

      const result = await confluenceService.createDocument(mockAnalysis);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockConfig.baseUrl}/rest/api/content`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': expect.any(String)
          }),
          body: expect.any(String)
        })
      );
      expect(result).toBeDefined();
      expect(result.id).toBe('test-doc-id');
    });

    it('should handle API errors', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'API Error'
      });

      await expect(confluenceService.createDocument(mockAnalysis))
        .rejects
        .toThrow('Erro ao criar documento no Confluence: API Error');
    });
  });

  describe('createInsight', () => {
    const mockInsight = {
      id: 'test-insight-id',
      title: 'Test Insight',
      description: 'Test description',
      analysis: {
        id: 'test-analysis-id',
        timestamp: new Date(),
        erro: {
          tipo: 'TypeError',
          mensagem: 'Test error',
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
      },
      recommendations: ['Test recommendation'],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'Test Author',
        status: 'published' as const,
        tags: ['test'],
        references: ['test-ref']
      }
    };

    it('should create insight successfully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'test-insight-id',
          title: 'Test Insight',
          version: { number: 1 }
        })
      });

      const result = await confluenceService.createInsight(mockInsight);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockConfig.baseUrl}/rest/api/content`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': expect.any(String)
          }),
          body: expect.any(String)
        })
      );
      expect(result).toBe('test-insight-id');
    });

    it('should handle API errors in insight creation', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'API Error'
      });

      await expect(confluenceService.createInsight(mockInsight))
        .rejects
        .toThrow('Erro ao criar insight no Confluence: API Error');
    });
  });

  describe('updateDocument', () => {
    const mockDocument: Documentation = {
      id: 'test-doc-id',
      type: 'error',
      title: 'Test Document',
      content: 'Test content',
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'Test Author',
        status: 'published',
        tags: ['test'],
        references: ['test-ref']
      }
    };

    const mockAnalysis: AnaliseIA = {
      id: 'test-analysis-id',
      timestamp: new Date(),
      erro: {
        tipo: 'TypeError',
        mensagem: 'Test error',
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

    it('should update document successfully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'test-doc-id',
          title: 'Updated Document',
          version: { number: 2 }
        })
      });

      const result = await confluenceService.updateDocument(mockDocument.id, mockAnalysis);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockConfig.baseUrl}/rest/api/content/${mockDocument.id}`,
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': expect.any(String)
          }),
          body: expect.any(String)
        })
      );
      expect(result).toBeDefined();
      expect(result.id).toBe('test-doc-id');
    });

    it('should handle API errors in document update', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'API Error'
      });

      await expect(confluenceService.updateDocument(mockDocument.id, mockAnalysis))
        .rejects
        .toThrow('Erro ao atualizar documento no Confluence: API Error');
    });
  });

  describe('findDocument', () => {
    it('should find document successfully', async () => {
      const mockDocument = {
        id: 'test-doc-id',
        title: 'Test Document',
        body: {
          storage: {
            value: 'Test content'
          }
        },
        version: { number: 1 },
        metadata: {
          labels: {
            results: [
              { name: 'test' },
              { name: 'error' }
            ]
          }
        }
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDocument)
      });

      const result = await confluenceService.findDocument('test-doc-id');

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockConfig.baseUrl}/rest/api/content/test-doc-id?expand=body.storage,version,metadata.labels`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      );
      expect(result).toBeDefined();
      expect(result?.id).toBe('test-doc-id');
    });

    it('should return null when document not found', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404
      });

      const result = await confluenceService.findDocument('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('listDocuments', () => {
    it('should list documents successfully', async () => {
      const mockDocuments = {
        results: [
          {
            id: 'doc1',
            title: 'Document 1',
            version: { number: 1 }
          },
          {
            id: 'doc2',
            title: 'Document 2',
            version: { number: 1 }
          }
        ]
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDocuments)
      });

      const result = await confluenceService.listDocuments();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`${mockConfig.baseUrl}/rest/api/content`),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      );
      expect(result).toHaveLength(2);
    });

    it('should handle API errors in document listing', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'API Error'
      });

      await expect(confluenceService.listDocuments())
        .rejects
        .toThrow('Erro ao listar documentos no Confluence: API Error');
    });
  });

  describe('archiveDocument', () => {
    it('should archive document successfully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true
      });

      await confluenceService.archiveDocument('test-doc-id');

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockConfig.baseUrl}/rest/api/content/test-doc-id`,
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': expect.any(String)
          }),
          body: expect.any(String)
        })
      );
    });

    it('should handle API errors in document archiving', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'API Error'
      });

      await expect(confluenceService.archiveDocument('test-doc-id'))
        .rejects
        .toThrow('Erro ao arquivar documento no Confluence: API Error');
    });
  });

  describe('checkAvailability', () => {
    it('should return true when service is available', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true
      });

      const result = await confluenceService.checkAvailability();
      expect(result).toBe(true);
    });

    it('should return false when service is unavailable', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false
      });

      const result = await confluenceService.checkAvailability();
      expect(result).toBe(false);
    });

    it('should return false when service call fails', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await confluenceService.checkAvailability();
      expect(result).toBe(false);
    });
  });
}); 