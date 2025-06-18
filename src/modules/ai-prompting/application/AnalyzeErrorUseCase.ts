import { IAIService } from '../domain/ports/IAIService';
import { AnalyzeError } from '../domain/AnalyzeError';
import { CodeContext } from '../../github-access/domain/CodeContext';

export class AnalyzeErrorUseCase {
  constructor(private readonly aiService: IAIService) { }

async execute(
    codigo: CodeContext,
    erro: { tipo: string; mensagem: string; stackTrace?: string; contexto?: Record<string, any> }
  ): Promise<AnalyzeError> {
    // Validar os parâmetros de entrada
    if (!codigo || !erro || !erro.tipo || !erro.mensagem) {
      throw new Error('Parâmetros inválidos para análise de erro');
    }

    // Chamar o serviço de IA para analisar o erro
    const analise = await this.aiService.analyzeError(codigo, erro);

    // Validar o resultado da análise
    if (!analise || !analise.resultado) {
      throw new Error('Análise de erro falhou ou retornou resultado inválido');
    }

    // Retornar a análise formatada
    return {
      causa: analise.resultado.causaRaiz,
      verificacoesAusentes: analise.resultado.sugestoes,
      sugestaoCorrecao: analise.resultado.sugestoes.join(', '),
      explicacao: `O erro "${erro.tipo}" ocorreu porque ${analise.resultado.causaRaiz}. Sugestões: ${analise.resultado.sugestoes.join(', ')}`,
      nivelConfianca: analise.resultado.nivelConfianca * 100, // Convertendo para 0-100
    };
  }
