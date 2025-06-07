import { ILogAnalyzer } from '../../domain/ports/IAnalisadorLogs';
import { LogEntry } from '../../domain/entities/LogEntry';

export class AnalyzeLogUseCase {
  constructor(private readonly logAnalyzer: ILogAnalyzer) {}

  /**
   * Executa a análise de um log bruto
   * @param rawLog O log bruto a ser analisado
   * @returns Uma entidade LogEntry com as informações estruturadas
   * @throws Error se o log não contiver erros para análise
   */
  async execute(rawLog: string): Promise<LogEntry> {
    // Primeiro verifica se o log contém um erro
    const hasError = await this.logAnalyzer.containsError(rawLog);
    
    if (!hasError) {
      throw new Error('O log não contém erros para análise');
    }

    // Se contém erro, analisa o log
    return this.logAnalyzer.analyze(rawLog);
  }
} 