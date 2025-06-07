import { CodigoFonte } from '../entities/CodigoFonte';

export { CodigoFonte };

export interface IGitHubService {
  /**
   * Obtém o código fonte de um arquivo específico
   * @param repositorio Nome do repositório
   * @param arquivo Caminho do arquivo
   * @param linha Número da linha
   * @param branch Branch do repositório (opcional)
   */
  obterCodigo(
    repositorio: string,
    arquivo: string,
    linha: number,
    branch?: string
  ): Promise<CodigoFonte>;

  /**
   * Obtém informações sobre um repositório
   * @param repositorio Nome do repositório
   */
  obterInfoRepositorio(repositorio: string): Promise<{
    nome: string;
    descricao?: string;
    linguagem?: string;
    estrelas: number;
    forks: number;
    ultimaAtualizacao: Date;
  }>;

  /**
   * Obtém o histórico de commits de um arquivo
   * @param repositorio Nome do repositório
   * @param arquivo Caminho do arquivo
   * @param branch Branch do repositório (opcional)
   */
  obterHistoricoCommits(
    repositorio: string,
    arquivo: string,
    branch?: string
  ): Promise<{
    commit: string;
    autor: string;
    data: Date;
    mensagem: string;
  }[]>;

  /**
   * Verifica se o serviço está disponível
   */
  verificarDisponibilidade(): Promise<boolean>;
} 