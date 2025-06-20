import { IAIService } from '../domain/ports/IAIService';
import { AnalyzeAI } from '../domain/entities/AnalyzeAI';

export interface ErrorInput {
  tipo: string;
  mensagem: string;
  stackTrace?: string;
  contexto?: Record<string, unknown>;
}

export interface CodeContext {
  arquivo: string;
  linha: number;
  codigo: string;
  repositorio: string;
  branch: string;
  url: string;
}

export class AnalyzeErrorUseCase {
  constructor(private readonly aiService: IAIService) { }

  async execute(erro: ErrorInput, codigo: CodeContext): Promise<{
    causa: string;
    verificacoesAusentes: string[];
    sugestaoCorrecao: string;
    explicacao: string;
    nivelConfianca: number;
  }> {
    // Validar os parâmetros de entrada
    if (!codigo || !erro || !erro.tipo || !erro.mensagem) {
      throw new Error('Parâmetros inválidos para análise de erro');
    }

    // Chamar o serviço de IA para analisar o erro
    const analise: AnalyzeAI = await this.aiService.analyzeError({
      code: codigo.codigo,
      error: {
        type: erro.tipo,
        message: erro.mensagem,
        stackTrace: erro.stackTrace,
        context: erro.contexto,
      },
    });

    // Validar o resultado da análise
    if (!analise || !analise.result) {
      throw new Error('Análise de erro falhou ou retornou resultado inválido');
    }

    // Retornar a análise formatada
    return {
      causa: analise.result.rootCause,
      verificacoesAusentes: analise.result.suggestions,
      sugestaoCorrecao: analise.result.suggestions.join(', '),
      explicacao: `O erro "${erro.tipo}" ocorreu porque ${analise.result.rootCause}. Sugestões: ${analise.result.suggestions.join(', ')}`,
      nivelConfianca: analise.result.confidenceLevel * 100, // Convertendo para 0-100
    };
  }
}
