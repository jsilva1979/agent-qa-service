import { IGitHubService, CodigoFonte } from '../../domain/ports/IGitHubService';
import { Logger } from 'winston';

export class BuscarCodigoFonteUseCase {
  constructor(
    private readonly githubService: IGitHubService,
    private readonly logger: Logger
  ) {}

  async executar(
    repositorio: string,
    arquivo: string,
    linha: number,
    branch?: string
  ): Promise<CodigoFonte> {
    try {
      // Primeiro verifica se temos acesso ao repositório
      const temAcesso = await this.githubService.verificarDisponibilidade();
      
      if (!temAcesso) {
        throw new Error(`Serviço GitHub indisponível`);
      }

      // Busca o código fonte
      const codigoFonte = await this.githubService.obterCodigo(
        repositorio,
        arquivo,
        linha,
        branch
      );

      this.logger.info('Código fonte encontrado com sucesso', {
        repositorio,
        arquivo,
        linha,
        branch
      });

      return codigoFonte;
    } catch (error) {
      this.logger.error('Erro ao buscar código fonte', {
        error,
        repositorio,
        arquivo,
        linha,
        branch
      });
      throw error;
    }
  }
} 