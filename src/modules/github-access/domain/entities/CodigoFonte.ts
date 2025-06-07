export interface CodigoFonte {
  /**
   * Nome do repositório
   */
  repositorio: string;

  /**
   * Nome do arquivo
   */
  arquivo: string;

  /**
   * Número da linha onde o erro ocorreu
   */
  linha: number;

  /**
   * Conteúdo do arquivo
   */
  conteudo: string;

  /**
   * URL do arquivo no GitHub
   */
  url: string;

  /**
   * Branch do repositório
   */
  branch: string;

  /**
   * Commit do repositório
   */
  commit: string;

  /**
   * Metadados adicionais
   */
  metadata?: {
    /**
     * Linguagem do arquivo
     */
    linguagem?: string;

    /**
     * Tamanho do arquivo em bytes
     */
    tamanho?: number;

    /**
     * Data da última modificação
     */
    ultimaModificacao?: Date;

    /**
     * Autor da última modificação
     */
    autor?: string;

    /**
     * Dados adicionais específicos do repositório
     */
    [key: string]: any;
  };
} 