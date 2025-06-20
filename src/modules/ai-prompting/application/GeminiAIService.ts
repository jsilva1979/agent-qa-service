import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAIService, AnalysisData, CodeAnalysis } from '../domain/ports/IAIService';
import { AnalyzeAI } from '../domain/entities/AnalyzeAI';
import { ICache } from '../domain/ports/ICache';
import { config } from '../config/config';
import winston from 'winston';
import crypto from 'crypto';
import { GeminiServiceAdapter } from '../infra/adapters/GeminiServiceAdapter';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export class GeminiAIService implements IAIService {
  private genAI: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;
  private logger: winston.Logger;
  private modelName: string;
  private retryConfig: RetryConfig;

  constructor(
    private readonly aiConfig: {
      apiKey: string;
      modelName: string;
      logging: {
        level: string;
        file: {
          path: string;
        };
      };
      retry?: RetryConfig;
    },
    private readonly geminiService: GeminiServiceAdapter,
    private readonly cache?: ICache
  ) {
    this.genAI = new GoogleGenerativeAI(aiConfig.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: aiConfig.modelName });
    this.modelName = aiConfig.modelName;
    this.retryConfig = aiConfig.retry || {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
    };
    this.logger = winston.createLogger({
      level: aiConfig.logging.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: aiConfig.logging.file.path,
          level: 'error',
        }),
      ],
    });
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | null = null;
    let delay = this.retryConfig.initialDelay;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(
          `Tentativa ${attempt} de ${this.retryConfig.maxRetries} falhou para ${operationName}: ${lastError.message}`
        );

        if (attempt === this.retryConfig.maxRetries) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(
          delay * this.retryConfig.backoffFactor,
          this.retryConfig.maxDelay
        );
      }
    }

    throw new Error(
      `Falha após ${this.retryConfig.maxRetries} tentativas para ${operationName}: ${lastError?.message}`
    );
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    return this.executeWithRetry(
      async () => {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.aiConfig.apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Erro na API do Gemini: ${response.statusText}. Detalhes: ${JSON.stringify(
              errorData
            )}`
          );
        }

        const result = (await response.json()) as GeminiResponse;
        return result.candidates[0].content.parts[0].text;
      },
      'callGeminiAPI'
    );
  }

  private extrairCampo(texto: string, campo: string): string {
    const regex = new RegExp(`${campo}:\\s*(.+)`, 'i');
    const match = texto.match(regex);
    return match ? match[1].trim() : '';
  }

  private extrairCausaRaiz(texto: string): string {
    return this.extrairCampo(texto, 'ROOT_CAUSE');
  }

  private extrairSugestoes(texto: string): string[] {
    const sugestoesTexto = this.extrairCampo(texto, 'SUGGESTIONS');
    return sugestoesTexto.split(/\\n-?\s*/).map(s => s.trim()).filter(Boolean);
  }

  private extrairCategoria(texto: string): string {
    return this.extrairCampo(texto, 'CATEGORY') || 'Other';
  }

  private extrairImpacto(texto: string): string {
    const impacto = this.extrairCampo(texto, 'IMPACT').toUpperCase();
    const niveisValidos = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    return niveisValidos.includes(impacto) ? impacto : 'MEDIUM';
  }

  async analyzeError(data: AnalysisData): Promise<AnalyzeAI> {
    const cacheKey = `analysis:${data.error.message}`;
    const shouldCache = false;

    try {
      if (this.cache && shouldCache) {
        const cached = await this.cache.get(cacheKey);
        if (cached) {
          this.logger.info('Análise obtida do cache');
          return cached as AnalyzeAI;
        }
      }

      const inicioProcessamento = Date.now();
      const prompt = this.prepararPrompt(data);
      const texto = await this.callGeminiAPI(prompt);

      // Log da resposta crua da IA para depuração
      this.logger.debug('Resposta crua do Gemini:', { texto });

      const analise: AnalyzeAI = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        error: {
          type: data.error.type,
          message: data.error.message,
          stackTrace: data.error.stackTrace,
          context: data.error.context,
        },
        result: {
          rootCause: this.extrairCausaRaiz(texto),
          suggestions: this.extrairSugestoes(texto),
          confidenceLevel: 0.9, // Usando valor padrão por enquanto
          category: this.extrairCategoria(texto),
          tags: [], // Tags não são mais extraídas
          references: [], // Referências não são mais extraídas
          impact: this.extrairImpacto(texto)
        },
        metadata: {
          model: 'Gemini',
          version: this.modelName,
          processingTime: Date.now() - inicioProcessamento,
          tokensUsed: this.contarTokens(texto),
        },
      };

      if (this.cache) {
        await this.cache.set(cacheKey, analise);
      }

      return analise;
    } catch (error) {
      this.logger.error('Erro ao analisar erro:', error);
      throw error;
    }
  }

  async analyzeCode(
    sourceCode: string,
    file: string,
    line: number,
    error: string
  ): Promise<CodeAnalysis> {
    try {
      const inicioProcessamento = Date.now();
      const prompt = this.prepararPromptCodigo(sourceCode, file, line, error);
      const texto = await this.callGeminiAPI(prompt);

      return {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        file,
        line,
        error,
        result: {
          rootCause: this.extrairCausaRaiz(texto),
          suggestions: this.extrairSugestoes(texto),
          confidenceLevel: 0.9, // Usando valor padrão por enquanto
          category: this.extrairCategoria(texto),
          tags: this.extrairTags(texto),
          references: this.extrairReferencias(texto),
        },
        metadata: {
          model: 'Gemini',
          version: this.modelName,
          processingTime: Date.now() - inicioProcessamento,
          tokensUsed: this.contarTokens(texto),
        },
      };
    } catch (error) {
      this.logger.error('Erro ao analisar código:', error);
      throw error;
    }
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${config.ai.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'Teste de disponibilidade',
                  },
                ],
              },
            ],
          }),
        }
      );

      return response.ok;
    } catch (error) {
      this.logger.error('Erro ao verificar disponibilidade:', error);
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
      version: this.modelName,
      capabilities: [
        'Análise de código',
        'Diagnóstico de erros',
        'Sugestões de correção',
        'Categorização de problemas',
      ],
      limitations: [
        'Pode não ter acesso ao código fonte completo',
        'Pode não entender contexto específico do negócio',
        'Pode sugerir soluções genéricas',
      ],
    };
  }

  private prepararPrompt(data: AnalysisData): string {
    const { error, code } = data;
    const context = error.context ? `Contexto adicional: ${error.context}` : '';

    return `
      Análise de Erro de Software
      ===========================

      Por favor, analise o seguinte erro e forneça uma análise detalhada.

      Erro
      ----
      Tipo: ${error.type}
      Mensagem: ${error.message}
      Stack Trace:
      \`\`\`
      ${error.stackTrace}
      \`\`\`

      Código Relevante
      ----------------
      \`\`\`
      ${code}
      \`\`\`
      ${context}

      Análise Solicitada
      ------------------
      Com base nos dados fornecidos, por favor, responda nos seguintes campos:

      1. ROOT_CAUSE: Descreva a causa raiz do erro em uma frase.
      2. SUGGESTIONS: Forneça uma lista de 2-3 sugestões claras e acionáveis para corrigir o erro.
      3. CATEGORY: Classifique o erro em UMA das seguintes categorias: [API, Database, Network, UI, Security, Performance, Logic, Other].
      4. IMPACT: Avalie o impacto potencial do erro como [LOW, MEDIUM, HIGH, CRITICAL].
    `;
  }

  private prepararPromptCodigo(
    codigoFonte: string,
    arquivo: string,
    linha: number,
    erro: string
  ): string {
    return `Você é um engenheiro de QA autônomo especializado em análise de código e debugging.

Arquivo: ${arquivo}
Linha: ${linha}
Erro: ${erro}

Código relevante:
\`\`\`
${codigoFonte}
\`\`\`

Por favor, forneça uma análise detalhada seguindo este formato:

1. CAUSA RAIZ:
[Identifique a causa fundamental do erro no código]

2. SUGESTÕES DE CORREÇÃO:
[Liste as sugestões de correção em ordem de prioridade, incluindo exemplos de código quando apropriado]

3. NÍVEL DE CONFIANÇA:
[Indique um número entre 0 e 1 representando sua confiança na análise]

4. CATEGORIA:
[Classifique o erro em uma das seguintes categorias: Runtime, Logic, Resource, Network, Security, Data, Configuration, ou Other]

5. TAGS:
[Liste tags relevantes separadas por vírgula]

6. REFERÊNCIAS:
[Liste referências relevantes (documentação, padrões, etc.)]

Por favor, seja específico e técnico em sua análise.`;
  }

  private extrairTags(texto: string): string[] {
    const match = texto.match(/TAGS:\s*(.*)/i);
    if (!match) return [];
    
    return match[1]
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag);
  }

  private extrairReferencias(texto: string): string[] {
    const match = texto.match(/6\. REFERÊNCIAS:\s*([\s\S]*?)(?=$)/i);
    if (!match) return [];
    
    return match[1]
      .split('\n')
      .map(ref => ref.trim())
      .filter(ref => ref && !ref.startsWith('-') && !ref.startsWith('*'));
  }

  private contarTokens(texto: string): number {
    // Implementação simplificada - em produção, usar uma biblioteca específica
    return Math.ceil(texto.length / 4);
  }

  async analyze(prompt: string): Promise<any> {
    try {
      const response = await this.geminiService.generateContent(prompt);
      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error('Erro ao analisar com IA:', error);
      throw error;
    }
  }

  private parseAnalysisResponse(response: string): any {
    try {
      // Tenta extrair informações estruturadas da resposta
      const lines = response.split('\n');
      const analysis: Record<string, any> = {};

      for (const line of lines) {
        if (line.includes('Tipo de erro:')) {
          analysis.errorType = line.split(':')[1].trim();
        } else if (line.includes('Nível de impacto:')) {
          analysis.impactLevel = line.split(':')[1].trim();
        } else if (line.includes('Causa raiz:')) {
          analysis.rootCause = line.split(':')[1].trim();
        } else if (line.includes('Sugestões:')) {
          analysis.suggestions = line.split(':')[1].trim();
        }
      }

      return analysis;
    } catch (error) {
      console.error('Erro ao parsear resposta da IA:', error);
      return {
        errorType: 'Unknown',
        impactLevel: 'MEDIUM',
        rootCause: 'Não foi possível determinar',
        suggestions: []
      };
    }
  }
} 