export interface LogEntry {
  /**
   * Identificador único do log
   */
  id: string;

  /**
   * Nome do serviço que gerou o log
   */
  servico: string;

  /**
   * Nível do log (error, warn, info, debug)
   */
  nivel: 'error' | 'warn' | 'info' | 'debug';

  /**
   * Mensagem do log
   */
  mensagem: string;

  /**
   * Timestamp do log
   */
  timestamp: Date;

  /**
   * Stack trace do erro (se aplicável)
   */
  stackTrace?: string;

  /**
   * Metadados adicionais do log
   */
  metadata?: {
    /**
     * Nome do arquivo onde o erro ocorreu
     */
    arquivo?: string;

    /**
     * Número da linha onde o erro ocorreu
     */
    linha?: number;

    /**
     * Nome do método/função onde o erro ocorreu
     */
    metodo?: string;

    /**
     * Nome do repositório Git
     */
    repositorio?: string;

    /**
     * Branch do repositório
     */
    branch?: string;

    /**
     * Commit do repositório
     */
    commit?: string;

    /**
     * Ambiente onde o erro ocorreu (dev, staging, prod)
     */
    ambiente?: string;

    /**
     * ID da requisição (para rastreamento)
     */
    requestId?: string;

    /**
     * Dados adicionais específicos do serviço
     */
    [key: string]: any;
  };
}

export class LogEntryEntity implements LogEntry {
  constructor(
    public readonly id: string,
    public readonly servico: string,
    public readonly nivel: 'error' | 'warn' | 'info' | 'debug',
    public readonly mensagem: string,
    public readonly timestamp: Date,
    public readonly stackTrace?: string,
    public readonly metadata?: {
      arquivo?: string;
      linha?: number;
      metodo?: string;
      repositorio?: string;
      branch?: string;
      commit?: string;
      ambiente?: string;
      requestId?: string;
      [key: string]: any;
    }
  ) {}

  static create(rawLog: string): LogEntryEntity {
    // TODO: Implement log parsing logic
    // This is a placeholder implementation
    return new LogEntryEntity(
      'unknown-id',
      'unknown-service',
      'info',
      rawLog,
      new Date(),
      undefined,
      undefined
    );
  }
} 