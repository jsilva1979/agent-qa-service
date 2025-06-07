import { IAIService, CodeAnalysis } from '../../domain/ports/IAIService';
import { Logger } from 'winston';

export class AnalyzeCodeUseCase {
  constructor(
    private readonly aiService: IAIService,
    private readonly logger: Logger
  ) {}

  /**
   * Executa a análise de um trecho de código
   * @param sourceCode Código fonte a ser analisado
   * @param file Nome do arquivo
   * @param line Número da linha
   * @param error Erro encontrado
   * @returns Análise detalhada do código
   * @throws Error se o serviço de IA não estiver disponível
   */
  async execute(
    sourceCode: string,
    file: string,
    line: number,
    error: string
  ): Promise<CodeAnalysis> {
    try {
      // Primeiro verifica se o serviço de IA está disponível
      const isAvailable = await this.aiService.checkAvailability();
      
      if (!isAvailable) {
        throw new Error('Serviço de IA não está disponível no momento');
      }

      // Realiza a análise do código
      const analysis = await this.aiService.analyzeCode(
        sourceCode,
        file,
        line,
        error
      );

      this.logger.info('Análise de código concluída com sucesso', {
        file,
        line,
        errorMessage: error
      });

      return analysis;
    } catch (error) {
      this.logger.error('Erro ao analisar código', {
        error,
        file,
        line,
        errorMessage: error
      });
      throw error;
    }
  }
} 