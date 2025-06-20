import { AnalyzeErrorUseCase } from './AnalyzeErrorUseCase';
import { IAIService } from '../domain/ports/IAIService';

describe('AnalyzeErrorUseCase', () => {
  type CodeContext = {
    arquivo: string;
    linha: number;
    codigo: string;
    repositorio: string;
    branch: string;
    url: string;
  };

  let useCase: AnalyzeErrorUseCase;
  let mockAIService: jest.Mocked<IAIService>;

  beforeEach(() => {
    mockAIService = {
      analyzeError: jest.fn(),
      analyzeCode: jest.fn(),
      checkAvailability: jest.fn(),
      getModelInfo: jest.fn(),
    };
    useCase = new AnalyzeErrorUseCase(mockAIService);
  });

  it('deve analisar o erro corretamente', async () => {
    const mockCode: CodeContext = {
      arquivo: 'UserProcessor.java',
      linha: 23,
      codigo: 'public class UserProcessor {\n  private String name;\n}',
      repositorio: 'user-service',
      branch: 'main',
      url: 'https://github.com/user-service/blob/main/UserProcessor.java#L23',
    };

    const mockError = {
      tipo: 'NullPointerException',
      mensagem: 'name is null',
    };

    const mockAIResponse: import('../domain/entities/AnalyzeAI').AnalyzeAI = {
      id: 'mock-id',
      timestamp: new Date(),
      error: {
        type: mockError.tipo,
        message: mockError.mensagem,
      },
      result: {
        rootCause: 'Variável name não foi inicializada',
        suggestions: ['Adicionar verificação if (name != null)'],
        confidenceLevel: 0.9,
        category: 'Bug',
        tags: ['null-pointer', 'initialization'],
        references: ['link-to-docs'],
      },
      metadata: {
        model: 'gemini-2.0-flash',
        version: '1.0',
        processingTime: 100,
        tokensUsed: 50,
      },
    };

    mockAIService.analyzeError.mockResolvedValue(mockAIResponse);

    const expectedResult = {
      causa: 'Variável name não foi inicializada',
      verificacoesAusentes: ['Adicionar verificação if (name != null)'],
      sugestaoCorrecao: 'Adicionar verificação if (name != null)',
      explicacao: 'O erro "NullPointerException" ocorreu porque Variável name não foi inicializada. Sugestões: Adicionar verificação if (name != null)',
      nivelConfianca: 90,
    };

    const result = await useCase.execute(mockError, mockCode);

    expect(result).toEqual(expectedResult);
    expect(mockAIService.analyzeError).toHaveBeenCalledWith({
      code: mockCode.codigo,
      error: {
        type: mockError.tipo,
        message: mockError.mensagem,
        stackTrace: undefined,
        context: undefined,
      },
    });
  });
}); 