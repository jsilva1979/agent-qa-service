import { Octokit } from '@octokit/rest';
import { IGitHubService } from '../domain/ports/IGitHubService';
import { CodigoFonte } from '../entities/CodigoFonte';
import { Logger } from 'winston';
import { config } from '../config/config';

export class GitHubService implements IGitHubService {
  private octokit: Octokit;

  constructor(private readonly logger: Logger) {
    this.octokit = new Octokit({
      auth: config.github.token,
      baseUrl: config.github.apiUrl,
    });
  }

  async obterCodigo(
    repositorio: string,
    arquivo: string,
    linha: number,
    branch: string = 'main'
  ): Promise<CodigoFonte> {
    try {
      this.logger.info('Obtendo código do GitHub', { repositorio, arquivo, linha, branch });

      // Obtém o conteúdo do arquivo
      const [owner, repo] = repositorio.split('/');
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path: arquivo,
        ref: branch,
      });

      if ('content' in response.data) {
        const conteudo = Buffer.from(response.data.content, 'base64').toString();
        const url = `https://github.com/${repositorio}/blob/${branch}/${arquivo}#L${linha}`;

        // Obtém informações adicionais do arquivo
        const infoArquivo = await this.obterInfoArquivo(repositorio, arquivo, branch);

        return {
          repositorio,
          arquivo,
          linha,
          conteudo,
          url,
          branch,
          commit: infoArquivo.commit,
          metadata: {
            linguagem: infoArquivo.linguagem,
            tamanho: infoArquivo.tamanho,
            ultimaModificacao: infoArquivo.ultimaModificacao,
            autor: infoArquivo.autor,
          },
        };
      }

      throw new Error('Arquivo não encontrado');
    } catch (error) {
      this.logger.error('Erro ao obter código do GitHub', { error, repositorio, arquivo, linha });
      throw error;
    }
  }

  async obterInfoRepositorio(repositorio: string): Promise<{
    nome: string;
    descricao?: string;
    linguagem?: string;
    estrelas: number;
    forks: number;
    ultimaAtualizacao: Date;
  }> {
    try {
      this.logger.info('Obtendo informações do repositório', { repositorio });

      const [owner, repo] = repositorio.split('/');
      const response = await this.octokit.repos.get({
        owner,
        repo,
      });

      return {
        nome: response.data.name,
        descricao: response.data.description || undefined,
        linguagem: response.data.language || undefined,
        estrelas: response.data.stargazers_count,
        forks: response.data.forks_count,
        ultimaAtualizacao: new Date(response.data.updated_at),
      };
    } catch (error) {
      this.logger.error('Erro ao obter informações do repositório', { error, repositorio });
      throw error;
    }
  }

  async obterHistoricoCommits(
    repositorio: string,
    arquivo: string,
    branch: string = 'main'
  ): Promise<{
    commit: string;
    autor: string;
    data: Date;
    mensagem: string;
  }[]> {
    try {
      this.logger.info('Obtendo histórico de commits', { repositorio, arquivo, branch });

      const [owner, repo] = repositorio.split('/');
      const response = await this.octokit.repos.listCommits({
        owner,
        repo,
        path: arquivo,
        sha: branch,
      });

      return response.data.map((commit) => ({
        commit: commit.sha,
        autor: commit.commit.author?.name || 'Desconhecido',
        data: new Date(commit.commit.author?.date || ''),
        mensagem: commit.commit.message,
      }));
    } catch (error) {
      this.logger.error('Erro ao obter histórico de commits', { error, repositorio, arquivo });
      throw error;
    }
  }

  async verificarDisponibilidade(): Promise<boolean> {
    try {
      await this.octokit.rateLimit.get();
      return true;
    } catch (error) {
      this.logger.error('Erro ao verificar disponibilidade do GitHub', { error });
      return false;
    }
  }

  private async obterInfoArquivo(
    repositorio: string,
    arquivo: string,
    branch: string
  ): Promise<{
    commit: string;
    linguagem?: string;
    tamanho?: number;
    ultimaModificacao?: Date;
    autor?: string;
  }> {
    try {
      const [owner, repo] = repositorio.split('/');
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path: arquivo,
        ref: branch,
      });

      if ('sha' in response.data) {
        return {
          commit: response.data.sha,
          tamanho: response.data.size,
        };
      }

      return { commit: '' };
    } catch (error) {
      this.logger.warn('Erro ao obter informações do arquivo', { error, repositorio, arquivo });
      return { commit: '' };
    }
  }
} 