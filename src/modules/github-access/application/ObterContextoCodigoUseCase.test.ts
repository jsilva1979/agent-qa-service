import { ObterContextoCodigoUseCase } from './ObterContextoCodigoUseCase';
import { IGitHubRepository } from '../domain/ports/IGitHubRepository';
import { CodeContext } from '../domain/CodeContext';

describe('ObterContextoCodigoUseCase', () => {
  let useCase: ObterContextoCodigoUseCase;
  let mockGitHubRepository: jest.Mocked<IGitHubRepository>;

  beforeEach(() => {
    mockGitHubRepository = {
      obterContextoCodigo: jest.fn(),
    };
    useCase = new ObterContextoCodigoUseCase(mockGitHubRepository);
  });

  it('deve obter o contexto do código corretamente', async () => {
    const mockContexto: CodeContext = {
      arquivo: 'UserProcessor.java',
      linha: 23,
      codigo: 'public class UserProcessor {\n  private String name;\n}',
      repositorio: 'user-service',
      branch: 'main',
      url: 'https://github.com/user-service/blob/main/UserProcessor.java#L23',
    };

    mockGitHubRepository.obterContextoCodigo.mockResolvedValue(mockContexto);

    const resultado = await useCase.execute(
      'user-service',
      'UserProcessor.java',
      23
    );

    expect(resultado).toEqual(mockContexto);
    expect(mockGitHubRepository.obterContextoCodigo).toHaveBeenCalledWith(
      'user-service',
      'UserProcessor.java',
      23,
      undefined
    );
  });
}); 