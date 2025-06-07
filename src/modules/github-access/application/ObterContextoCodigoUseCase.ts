import { IGitHubRepository } from '../domain/ports/IGitHubRepository';
import { CodeContext } from '../domain/CodeContext';

export class ObterContextoCodigoUseCase {
  constructor(private readonly gitHubRepository: IGitHubRepository) {}

  async execute(
    repositorio: string,
    arquivo: string,
    linha: number,
    branch?: string
  ): Promise<CodeContext> {
    return this.gitHubRepository.obterContextoCodigo(
      repositorio,
      arquivo,
      linha,
      branch
    );
  }
} 