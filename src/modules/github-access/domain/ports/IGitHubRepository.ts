import { CodeContext } from '../CodeContext';

export interface IGitHubRepository {
  obterContextoCodigo(
    repositorio: string,
    arquivo: string,
    linha: number,
    branch?: string
  ): Promise<CodeContext>;
} 