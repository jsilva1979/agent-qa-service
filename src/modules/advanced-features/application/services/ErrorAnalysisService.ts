import { AnalyzeAI } from '../../../ai-prompting/domain/entities/AnalyzeAI';
import { IAIService } from '../../../ai-prompting/domain/ports/IAIService';

export class ErrorAnalysisService {
  constructor(private readonly aiService: IAIService) {}

  /**
   * Analisa o conteúdo de um erro usando o serviço de IA.
   * Atua como uma simples ponte para o serviço de IA, retornando a análise pura.
   * @param errorContent O texto do erro a ser analisado.
   * @returns Uma promessa que resolve para a análise da IA.
   */
  public async analyzeError(errorContent: string): Promise<AnalyzeAI> {
    const analysisInput = {
      error: {
        type: 'GenericError',
        message: errorContent,
        stackTrace: errorContent,
      },
      code: '',
      context: { source: 'Slack Message' } // Usando um objeto para o contexto
    };
    return this.aiService.analyzeError(analysisInput);
  }
} 