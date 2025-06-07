import { CreateInsightUseCase } from './CriarInsightUseCase';
import { IDocumentationService, TechnicalInsight } from '../domain/ports/IDocumentationService';
import { AnaliseIA } from '../../ai-prompting/domain/entities/AnaliseIA';

describe('CreateInsightUseCase', () => {
  let mockDocumentationService: jest.Mocked<IDocumentationService>;
  let useCase: CreateInsightUseCase;

  beforeEach(() => {
    mockDocumentationService = {
      createInsight: jest.fn(),
      createDocument: jest.fn(),
      updateDocument: jest.fn(),
      findDocument: jest.fn(),
      listDocuments: jest.fn(),
      archiveDocument: jest.fn(),
      checkAvailability: jest.fn()
    };
    useCase = new CreateInsightUseCase(mockDocumentationService);
  });

  it('deve criar um insight técnico', async () => {
    // Arrange
    const mockAnalise: AnaliseIA = {
      id: '123',
      timestamp: new Date(),
      erro: {
        tipo: 'Erro Teste',
        mensagem: 'Mensagem de erro teste',
        stackTrace: 'Stack trace teste'
      },
      resultado: {
        causaRaiz: 'Causa teste',
        sugestoes: ['Sugestão teste'],
        nivelConfianca: 1,
        categoria: 'Teste',
        tags: ['teste'],
        referencias: []
      },
      metadados: {
        modelo: 'gemini-2.0-flash',
        versao: '1.0',
        tempoProcessamento: 100,
        tokensUtilizados: 50
      }
    };

    const mockInsight: TechnicalInsight = {
      id: '123',
      title: 'Teste de Insight',
      description: 'Descrição do insight',
      analysis: mockAnalise,
      recommendations: ['Preventiva teste'],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'Teste',
        status: 'published',
        tags: ['teste'],
        references: []
      }
    };

    const mockPageId = '123456';

    mockDocumentationService.createInsight.mockResolvedValue(mockPageId);

    // Act
    const result = await useCase.execute(mockInsight);

    // Assert
    expect(result).toBe(mockPageId);
    expect(mockDocumentationService.createInsight).toHaveBeenCalledWith(mockInsight);
  });
}); 