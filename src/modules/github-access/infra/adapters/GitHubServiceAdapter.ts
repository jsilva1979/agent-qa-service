import axios from 'axios';
import { IGitHubService, CodigoFonte } from '../../domain/ports/IGitHubService';
import { Logger } from 'winston';

export class GitHubServiceAdapter implements IGitHubService {
  private readonly apiUrl = 'https://api.github.com';
  private readonly token: string;

  constructor(
    private readonly logger: Logger,
    githubToken: string
  ) {
    this.token = githubToken;
  }

  private getHeaders() {
    return {
      'Authorization': `token ${this.token}`,
      'Accept': 'application/vnd.github.v3+json'
    };
  }

  async obterCodigo(
    repositorio: string,
    arquivo: string,
    linha: number,
    branch: string = 'main'
  ): Promise<CodigoFonte> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/repos/${repositorio}/contents/${arquivo}?ref=${branch}`,
        { headers: this.getHeaders() }
      );

      if (response.data.type !== 'file') {
        throw new Error(`O caminho ${arquivo} não é um arquivo`);
      }

      const conteudo = Buffer.from(response.data.content, 'base64').toString('utf-8');
      const linhas = conteudo.split('\n');
      const inicio = Math.max(0, linha - 6);
      const fim = Math.min(linhas.length, linha + 5);
      const contexto = linhas.slice(inicio, fim).join('\n');

      return {
        repositorio,
        arquivo,
        linha,
        conteudo: contexto,
        url: `https://github.com/${repositorio}/blob/${branch}/${arquivo}#L${linha}`,
        branch,
        commit: response.data.sha,
        metadata: {
          tamanho: response.data.size
        }
      };
    } catch (error) {
      this.logger.error('Erro ao obter código', { error, repositorio, arquivo, linha });
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
      const response = await axios.get(
        `${this.apiUrl}/repos/${repositorio}`,
        { headers: this.getHeaders() }
      );

      return {
        nome: response.data.name,
        descricao: response.data.description,
        linguagem: response.data.language,
        estrelas: response.data.stargazers_count,
        forks: response.data.forks_count,
        ultimaAtualizacao: new Date(response.data.updated_at)
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
      const response = await axios.get(
        `${this.apiUrl}/repos/${repositorio}/commits?path=${arquivo}&sha=${branch}`,
        { headers: this.getHeaders() }
      );

      return response.data.map((commit: any) => ({
        commit: commit.sha,
        autor: commit.commit.author.name,
        data: new Date(commit.commit.author.date),
        mensagem: commit.commit.message
      }));
    } catch (error) {
      this.logger.error('Erro ao obter histórico de commits', { error, repositorio, arquivo });
      throw error;
    }
  }

  async verificarDisponibilidade(): Promise<boolean> {
    try {
      await axios.get(`${this.apiUrl}/rate_limit`, { headers: this.getHeaders() });
      return true;
    } catch (error) {
      this.logger.error('Erro ao verificar disponibilidade do GitHub', { error });
      return false;
    }
  }
} 