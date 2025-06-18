import { AnalyzeAI } from '@/modules/ai-prompting/domain/entities/AnalyzeAI';
import { AnalysisData } from './IAIService';

export interface ICache {
  /**
   * Obtém uma análise do cache
   * @param dados Dados do erro para buscar no cache
   * @returns Promise com a análise em cache ou null se não encontrada
   */
  get(dados: AnalysisData): Promise<AnalyzeAI | null>;

  /**
   * Armazena uma análise no cache
   * @param dados Dados do erro
   * @param analise Análise a ser armazenada
   */
  set(dados: AnalysisData, analise: AnalyzeAI): Promise<void>;

  /**
   * Limpa todo o cache
   */
  clear(): Promise<void>;

  /**
   * Encerra a conexão com o cache
   */
  disconnect(): Promise<void>;
} 