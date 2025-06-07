import { AnalisarErroUseCase } from './AnalisarErroUseCase';
import { IAIService } from '../domain/ports/IAIService';
import { AnaliseErro } from '../domain/AnaliseErro';
import { CodeContext } from '../../github-access/domain/CodeContext';

describe('AnalisarErroUseCase', () => {
  let useCase: AnalisarErroUseCase;
  let mockAIService: jest.Mocked<IAIService>;

  beforeEach(() => {
    mockAIService = {
      analisarErro: jest.fn(),
    };
    useCase = new AnalisarErroUseCase(mockAIService);
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

    const mockAnalise: AnaliseErro = {
      causa: 'Variável name não foi inicializada',
      verificacoesAusentes: ['Verificação de null'],
      sugestaoCorrecao: 'Adicionar verificação if (name != null)',
      explicacao: 'O erro ocorre porque...',
      nivelConfianca: 90,
    };

    mockAIService.analisarErro.mockResolvedValue(mockAnalise);

    const resultado = await useCase.execute(mockCodigo, mockErro);

    expect(resultado).toEqual(mockAnalise);
    expect(mockAIService.analisarErro).toHaveBeenCalledWith(mockCodigo, mockErro);
  });
}); 