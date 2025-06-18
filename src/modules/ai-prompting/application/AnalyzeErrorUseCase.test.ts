import { AnalyzeErrorUseCase } from './AnalyzeErrorUseCase';
import { IAIService } from '../domain/ports/IAIService';
import { AnalyzeError } from '../domain/AnalyzeError';
import { CodeContext } from '../../github-access/domain/CodeContext';
import { AnalyzeAI } from '../domain/entities/AnalyzeAI';

describe('AnalyzeErrorUseCase', () => {
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
    const mockCodigo: CodeContext = {
      arquivo: 'UserProcessor.java',
      linha: 23,
      codigo: 'public class UserProcessor {\n  private String name;\n}',
      repositorio: 'user-service',
      branch: 'main',
      url: 'https://github.com/user-service/blob/main/UserProcessor.java#L23',
    };

    const mockErro = {
      tipo: 'NullPointerException',
      mensagem: 'name is null',
    };

    const mockAnalise: AnalyzeAI = {
      id: 'mock-id',
      timestamp: new Date(),
      erro: {
        tipo: mockErro.tipo,
        mensagem: mockErro.mensagem,
      },
      resultado: {
        causaRaiz: 'Variável name não foi inicializada',
        sugestoes: ['Adicionar verificação if (name != null)'],
        nivelConfianca: 0.9,
        categoria: 'Bug',
        tags: ['null-pointer', 'initialization'],
        referencias: ['link-to-docs'],
      },
      metadados: {
        modelo: 'gemini-2.0-flash',
        versao: '1.0',
        tempoProcessamento: 100,
        tokensUtilizados: 50,
      },
    };

    mockAIService.analyzeError.mockResolvedValue(mockAnalise);

    const resultado = await useCase.execute(mockCodigo, mockErro);

    expect(resultado).toEqual(mockAnalise);
    expect(mockAIService.analyzeError).toHaveBeenCalledWith(mockCodigo, mockErro);
  });
}); 