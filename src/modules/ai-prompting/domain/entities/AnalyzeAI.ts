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
  erro: {
    /**
     * Tipo do erro
     */
    tipo: string;

    /**
     * Mensagem do erro
     */
    mensagem: string;

    /**
     * Stack trace do erro
     */
    stackTrace?: string;

    /**
     * Contexto do erro
     */
    contexto?: Record<string, any>;
  };

  /**
   * Resultado da análise
   */
  resultado: {
    /**
     * Descrição da causa raiz do erro
     */
    causaRaiz: string;

    /**
     * Sugestões de correção
     */
    sugestoes: string[];

    /**
     * Nível de confiança da análise (0-1)
     */
    nivelConfianca: number;

    /**
     * Categorização do erro
     */
    categoria: string;

    /**
     * Tags relevantes
     */
    tags: string[];

    /**
     * Referências úteis (links, documentação, etc)
     */
    referencias: string[];
  };

  /**
   * Metadados da análise
   */
  metadados: {
    /**
     * Modelo de IA utilizado
     */
    modelo: string;

    /**
     * Versão do modelo
     */
    versao: string;

    /**
     * Tempo de processamento em ms
     */
    tempoProcessamento: number;

    /**
     * Tokens utilizados
     */
    tokensUtilizados: number;
  };
} 