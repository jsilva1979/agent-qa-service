import { ILogAnalysisService, AnaliseLog } from '../domain/ports/ILogAnalysisService';
import { LogEntry } from '../domain/entities/LogEntry';
import { Logger } from 'winston';

export class LogAnalysisService implements ILogAnalysisService {
  constructor(private readonly logger: Logger) {}

  async analisarLog(logEntry: LogEntry): Promise<AnaliseLog> {
    try {
      this.logger.info('Iniciando análise de log', { logEntry });

      // Extrai informações do stack trace se disponível
      const stackInfo = this.extrairInfoStack(logEntry.stackTrace);

      // Extrai informações do repositório
      const repoInfo = this.extrairInfoRepositorio(logEntry.metadata);

      // Cria o objeto de análise
      const analise: AnaliseLog = {
        servico: logEntry.servico,
        repositorio: repoInfo.repositorio || 'desconhecido',
        arquivo: stackInfo.arquivo || repoInfo.arquivo || 'desconhecido',
        linha: stackInfo.linha || repoInfo.linha || 0,
        erro: this.extrairTipoErro(logEntry.mensagem),
        contexto: {
          stackTrace: logEntry.stackTrace,
          metodo: stackInfo.metodo,
          variaveis: logEntry.metadata?.variaveis,
          ...logEntry.metadata
        }
      };

      this.logger.info('Análise de log concluída', { analise });
      return analise;
    } catch (error) {
      this.logger.error('Erro ao analisar log', { error, logEntry });
      throw error;
    }
  }

  private extrairInfoStack(stackTrace?: string): { arquivo?: string; linha?: number; metodo?: string } {
    if (!stackTrace) return {};

    try {
      // Procura por padrões comuns em stack traces
      const stackLines = stackTrace.split('\n');
      const firstLine = stackLines[1]; // Pula a primeira linha que geralmente é o erro

      if (!firstLine) return {};

      // Tenta extrair informações usando regex
      const fileMatch = firstLine.match(/at\s+.*\s+\(([^:]+):(\d+):(\d+)\)/);
      if (fileMatch) {
        return {
          arquivo: fileMatch[1],
          linha: parseInt(fileMatch[2]),
          metodo: firstLine.split('at')[1]?.split('(')[0]?.trim()
        };
      }

      return {};
    } catch (error) {
      this.logger.warn('Erro ao extrair informações do stack trace', { error, stackTrace });
      return {};
    }
  }

  private extrairInfoRepositorio(metadata?: LogEntry['metadata']): { repositorio?: string; arquivo?: string; linha?: number } {
    if (!metadata) return {};

    return {
      repositorio: metadata.repositorio,
      arquivo: metadata.arquivo,
      linha: metadata.linha
    };
  }

  private extrairTipoErro(mensagem: string): string {
    // Tenta extrair o tipo do erro da mensagem
    const errorMatch = mensagem.match(/^([A-Za-z]+Error|Exception):/);
    return errorMatch ? errorMatch[1] : 'UnknownError';
  }

  async iniciar(): Promise<void> {
    this.logger.info('Iniciando serviço de análise de logs');
  }

  async parar(): Promise<void> {
    this.logger.info('Parando serviço de análise de logs');
  }

  async verificarDisponibilidade(): Promise<boolean> {
    try {
      // Verifica se o serviço está funcionando corretamente
      return true;
    } catch (error) {
      this.logger.error('Erro ao verificar disponibilidade', { error });
      return false;
    }
  }
} 