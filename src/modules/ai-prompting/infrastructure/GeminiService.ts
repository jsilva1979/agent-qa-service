import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAIService, AnalysisData, CodeAnalysis } from '../domain/ports/IAIService';
import { AnalyzeError } from '../domain/AnalyzeError';
import { CodeContext } from '../../github-access/domain/CodeContext';
import { AnalyzeAI } from '../domain/entities/AnalyzeAI';

export class GeminiService implements IAIService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: string = 'gemini-2.0-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não configurado');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async analyzeError(data: AnalysisData): Promise<AnalyzeAI> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });

      const prompt = `
Você é um engenheiro de QA autônomo.

Abaixo está o trecho de código onde ocorreu o erro, extraído automaticamente após a análise de logs.

1. O que pode ter causado o erro nesta linha?
2. Há alguma verificação ausente? (null-check, try-catch...)
3. Dê uma sugestão de correção com explicação.

\`\`\`
${data.code}
\`\`\`

Erro: ${data.error.type}
Mensagem: ${data.error.message}
${data.error.stackTrace ? `Stacktrace: ${data.error.stackTrace}` : ''}
`;

      const start = Date.now();
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const elapsed = Date.now() - start;

      // Parsear resposta do Gemini
      const parsed = this.parsearRespostaGemini(text);

      return {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        erro: {
          tipo: data.error.type,
          mensagem: data.error.message,
          stackTrace: data.error.stackTrace,
          contexto: data.error.context
        },
        resultado: {
          causaRaiz: parsed.causa,
          sugestoes: parsed.verificacoesAusentes?.length ? parsed.verificacoesAusentes : [parsed.sugestaoCorrecao],
          nivelConfianca: parsed.nivelConfianca ?? 0.8,
          categoria: 'erro',
          tags: [],
          referencias: []
        },
        metadados: {
          modelo: this.model,
          versao: '2.0-flash',
          tempoProcessamento: elapsed,
          tokensUtilizados: 0
        }
      };
    } catch (error: any) {
      throw new Error(`Erro ao analisar com Gemini: ${error.message}`);
    }
  }

  async analyzeCode(
    sourceCode: string,
    file: string,
    line: number,
    error: string
  ): Promise<CodeAnalysis> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });

      const prompt = `
Analise o seguinte código e erro:

Arquivo: ${file}
Linha: ${line}
Erro: ${error}

\`\`\`
${sourceCode}
\`\`\`
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        file,
        line,
        error,
        result: {
          rootCause: text.split('\n')[0],
          suggestions: text.split('\n').slice(1, 3),
          confidenceLevel: 0.8,
          category: 'code-analysis',
          tags: ['error', 'code-review'],
          references: []
        },
        metadata: {
          model: this.model,
          version: '2.0-flash',
          processingTime: 0,
          tokensUsed: 0
        }
      };
    } catch (error: any) {
      throw new Error(`Erro ao analisar código com Gemini: ${error.message}`);
    }
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });
      await model.generateContent('Teste de disponibilidade');
      return true;
    } catch {
      return false;
    }
  }

  async getModelInfo(): Promise<{
    name: string;
    version: string;
    capabilities: string[];
    limitations: string[];
  }> {
    return {
      name: 'Gemini',
      version: '2.0-flash',
      capabilities: [
        'Análise de código',
        'Diagnóstico de erros',
        'Sugestões de correção'
      ],
      limitations: [
        'Não pode executar código',
        'Não tem acesso a dados em tempo real',
        'Limitado ao contexto fornecido'
      ]
    };
  }

  private parsearRespostaGemini(resposta: string): AnalyzeError {
    // Extrair campos da resposta usando regex
    const causaMatch = resposta.match(/Causa: (.*?)(?:\n|$)/);
    const verificacoesMatch = resposta.match(/Verificações ausentes: (.*?)(?:\n|$)/);
    const sugestaoMatch = resposta.match(/Sugestão de correção: (.*?)(?:\n|$)/);
    const explicacaoMatch = resposta.match(/Explicação: (.*?)(?:\n|$)/);
    const nivelConfiancaMatch = resposta.match(/Nível de confiança: (\d+)/);

    // Mapear para o objeto AnalyzeError
    return {
      causa: causaMatch ? causaMatch[1].trim() : "Causa não identificada",
      verificacoesAusentes: verificacoesMatch ? verificacoesMatch[1].split(',').map(v => v.trim()) : [],
      sugestaoCorrecao: sugestaoMatch ? sugestaoMatch[1].trim() : "Sugestão não disponível",
      explicacao: explicacaoMatch ? explicacaoMatch[1].trim() : "Explicação não disponível",
      nivelConfianca: nivelConfiancaMatch ? parseInt(nivelConfiancaMatch[1]) : 0
    };
  }
} 