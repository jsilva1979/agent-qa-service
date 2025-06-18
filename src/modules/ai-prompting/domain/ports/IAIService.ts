import { AnalyzeAI } from '@/modules/ai-prompting/domain/entities/AnalyzeAI';

export interface CodeAnalysis {
  /**
   * ID único da análise
   */
  id: string;

  /**
   * Timestamp da análise
   */
  timestamp: Date;

  /**
   * Arquivo analisado
   */
  file: string;

  /**
   * Linha analisada
   */
  line: number;

  /**
   * Erro encontrado
   */
  error: string;

  /**
   * Resultado da análise
   */
  result: {
    /**
     * Causa raiz do problema
     */
    rootCause: string;

    /**
     * Sugestões de correção
     */
    suggestions: string[];

    /**
     * Nível de confiança da análise (0-1)
     */
    confidenceLevel: number;

    /**
     * Categoria do problema
     */
    category: string;

    /**
     * Tags relacionadas
     */
    tags: string[];

    /**
     * Referências relevantes
     */
    references: string[];
  };

  /**
   * Metadados da análise
   */
  metadata: {
    /**
     * Modelo de IA utilizado
     */
    model: string;

    /**
     * Versão do modelo
     */
    version: string;

    /**
     * Tempo de processamento em ms
     */
    processingTime: number;

    /**
     * Número de tokens utilizados
     */
    tokensUsed: number;
  };
}

export interface AnalysisData {
  /**
   * Código fonte a ser analisado
   */
  code: string;

  /**
   * Tipo do erro encontrado
   */
  error: {
    type: string;
    message: string;
    stackTrace?: string;
    context?: Record<string, any>;
  };

  /**
   * Logs associados ao erro
   */
  logs?: string[];

  /**
   * Métricas associadas ao erro
   */
  metrics?: {
    cpu?: number;
    memory?: number;
    latency?: number;
  };

  /**
   * Contexto adicional do erro
   */
  context?: Record<string, any>;
}

export interface IAIService {
  /**
   * Analisa um erro e retorna uma análise detalhada
   */
  analyzeError(data: AnalysisData): Promise<AnalyzeAI>;

  /**
   * Analisa um trecho de código e retorna uma análise detalhada
   */
  analyzeCode(
    sourceCode: string,
    file: string,
    line: number,
    error: string
  ): Promise<CodeAnalysis>;

  /**
   * Verifica se o serviço de IA está disponível
   */
  checkAvailability(): Promise<boolean>;

  /**
   * Obtém informações sobre o modelo de IA
   */
  getModelInfo(): Promise<{
    name: string;
    version: string;
    capabilities: string[];
    limitations: string[];
  }>;
} 