import { AnaliseIA } from '../entities/AnaliseIA';
import { DadosAnalise } from './IAIService';

export interface ICache {
  /**
   * Obtém uma análise do cache
   * @param dados Dados do erro para buscar no cache
   * @returns Promise com a análise em cache ou null se não encontrada
   */
  get(dados: DadosAnalise): Promise<AnaliseIA | null>;

  /**
   * Armazena uma análise no cache
   * @param dados Dados do erro
   * @param analise Análise a ser armazenada
   */
  set(dados: DadosAnalise, analise: AnaliseIA): Promise<void>;

  /**
   * Limpa todo o cache
   */
  clear(): Promise<void>;

  /**
   * Encerra a conexão com o cache
   */
  disconnect(): Promise<void>;
} 