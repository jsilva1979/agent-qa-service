import axios from 'axios';
import { IGitHubRepository } from '../domain/ports/IGitHubRepository';
import { CodeContext } from '../domain/CodeContext';

export class GitHubRepository implements IGitHubRepository {
  private readonly baseUrl = 'https://api.github.com';
  private readonly token: string;

  constructor() {
    this.token = process.env.GITHUB_TOKEN || '';
    if (!this.token) {
      throw new Error('GITHUB_TOKEN não configurado');
    }
  }

  async obterContextoCodigo(
    repositorio: string,
    arquivo: string,
    linha: number,
    branch: string = 'main'
  ): Promise<CodeContext> {
    try {
      // Obtém o conteúdo do arquivo
      const response = await axios.get(
        `${this.baseUrl}/repos/${repositorio}/contents/${arquivo}?ref=${branch}`,
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3.raw',
          },
        }
      );

      const codigo = response.data;
      const linhas = codigo.split('\n');
      
      // Obtém o contexto ao redor da linha do erro (5 linhas antes e depois)
      const inicio = Math.max(0, linha - 6);
      const fim = Math.min(linhas.length, linha + 5);
      const contexto = linhas.slice(inicio, fim).join('\n');

      return {
        arquivo,
        linha,
        codigo: contexto,
        repositorio,
        branch,
        url: `https://github.com/${repositorio}/blob/${branch}/${arquivo}#L${linha}`,
      };
    } catch (error: any) {
      throw new Error(`Erro ao obter contexto do código: ${error.message}`);
    }
  }
} 