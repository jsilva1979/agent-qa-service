import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAIService, AnalysisData, CodeAnalysis } from '../../domain/ports/IAIService';
import { AnalyzeAI } from '../../domain/entities/AnalyzeAI';
import { Logger } from 'winston';
import crypto from 'crypto';

export class GeminiServiceAdapter implements IAIService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: any;

  constructor(
    private readonly logger: Logger,
    apiKey: string,
    model: string = 'gemini-2.0-flash'
  ) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model });
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });
      await model.generateContent('Teste de disponibilidade');
      return true;
    } catch (error) {
      this.logger.error('Erro ao verificar disponibilidade do Gemini', { error });
      return false;
    }
  }

  async analyzeCode(
    sourceCode: string,
    file: string,
    line: number,
    error: string
  ): Promise<CodeAnalysis> {
    try {
      const processingStartTime = Date.now();
      
      const prompt = this.prepareCodePrompt(sourceCode, file, line, error);
      const response = await this.model.generateContent(prompt);
      const text = response.response.text();

      const analysis: CodeAnalysis = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        file: file,
        line: line,
        error: error,
        result: {
          rootCause: this.extractRootCause(text),
          suggestions: this.extractSuggestions(text),
          confidenceLevel: this.calculateConfidenceLevel(text),
          category: this.extractCategory(text),
          tags: this.extractTags(text),
          references: this.extractReferences(text)
        },
        metadata: {
          model: this.model.model,
          version: '2.0-flash',
          processingTime: Date.now() - processingStartTime,
          tokensUsed: this.countTokens(text)
        }
      };

      this.logger.info('Análise de código concluída', {
        file,
        line,
        error,
        processingTime: analysis.metadata.processingTime
      });

      return analysis;
    } catch (error) {
      this.logger.error('Erro ao analisar código:', error);
      throw error;
    }
  }

  private prepareCodePrompt(
    sourceCode: string,
    file: string,
    line: number,
    error: string
  ): string {
    return `
      Você é um engenheiro de QA autônomo.

      Abaixo está o trecho de código onde ocorreu o erro:

      Arquivo: ${file}
      Linha: ${line}
      Erro: ${error}

      Código:
      ${sourceCode}

      Por favor, analise o código e forneça:
      1. A causa raiz do problema
      2. Sugestões de correção
      3. Categoria do problema
      4. Tags relevantes
      5. Referências úteis (documentação, exemplos, etc)
    `;
  }

  private extractRootCause(text: string): string {
    // Implementar lógica de extração da causa raiz
    return text.split('\n')[0];
  }

  private extractSuggestions(text: string): string[] {
    // Implementar lógica de extração das sugestões
    return text.split('\n').filter(line => line.startsWith('- '));
  }

  private calculateConfidenceLevel(text: string): number {
    // Implementar lógica de cálculo do nível de confiança
    return 0.8;
  }

  private extractCategory(text: string): string {
    // Implementar lógica de extração da categoria
    return 'Erro de Sistema';
  }

  private extractTags(text: string): string[] {
    // Implementar lógica de extração das tags
    return ['erro', 'sistema'];
  }

  private extractReferences(text: string): string[] {
    // Implementar lógica de extração das referências
    return [];
  }

  private countTokens(text: string): number {
    // Implementar lógica de contagem de tokens
    return text.split(/\s+/).length;
  }

  async analyzeError(data: AnalysisData): Promise<AnalyzeAI> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });
      const prompt = `
Você é um engenheiro de QA autônomo.

Analise o seguinte erro e forneça uma análise detalhada:

Tipo: ${data.error.type}
Mensagem: ${data.error.message}
Stack Trace: ${data.error.stackTrace || 'N/A'}

Código:
\`\`\`
${data.code}
\`\`\`

Logs:
${data.logs?.join('\n') || 'N/A'}

Métricas:
CPU: ${data.metrics?.cpu || 'N/A'}%
Memória: ${data.metrics?.memory || 'N/A'}%
Latência: ${data.metrics?.latency || 'N/A'}ms

Contexto:
${JSON.stringify(data.context || {}, null, 2)}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parseia a resposta do Gemini para o formato AnalyzeAI
      const lines = text.split('\n');
      
      return {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        erro: {
          tipo: data.error.type,
          mensagem: data.error.message,
          stackTrace: data.error.stackTrace,
          contexto: data.error.context,
        },
        resultado: {
          causaRaiz: lines[0] || 'Causa não identificada',
          nivelConfianca: 0.8,
          sugestoes: lines.slice(1).filter(l => l.trim().startsWith('-')),
          referencias: [],
          tags: [],
          categoria: 'erro'
        },
        metadados: {
          modelo: this.model.model,
          versao: '1.0',
          tempoProcessamento: 0,
          tokensUtilizados: 0
        }
      };
    } catch (error) {
      this.logger.error('Erro ao analisar erro com Gemini', { error, data });
      throw error;
    }
  }

  async getModelInfo(): Promise<{
    name: string;
    version: string;
    capabilities: string[];
    limitations: string[];
  }> {
    return {
      name: 'Mock Model',
      version: '1.0',
      capabilities: ['Mock capacidade'],
      limitations: ['Mock limitação'],
    };
  }
} 