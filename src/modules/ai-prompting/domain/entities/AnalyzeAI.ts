export interface AnalyzeAI {
  /**
   * ID único da análise
   */
  id: string;

  /**
   * Timestamp da análise
   */
  timestamp: Date;

  /**
   * Dados do erro analisado
   */
  error: {
    /**
     * Tipo do erro
     */
    type: string;

    /**
     * Mensagem do erro
     */
    message: string;

    /**
     * Stack trace do erro
     */
    stackTrace?: string;

    /**
     * Contexto do erro
     */
    context?: Record<string, unknown>;
  };

  /**
   * Resultado da análise
   */
  result: {
    /**
     * Descrição da causa raiz do erro
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
     * Categorização do erro
     */
    category: string;

    /**
     * Tags relevantes
     */
    tags: string[];

    /**
     * Referências úteis (links, documentação, etc)
     */
    references: string[];

    /**
     * Nível de impacto do erro
     */
    impact: string;
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
     * Tokens utilizados
     */
    tokensUsed: number;
  };
} 