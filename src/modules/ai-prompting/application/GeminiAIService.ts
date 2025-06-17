import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAIService, AnalysisData, CodeAnalysis } from '../domain/ports/IAIService';
import { AnaliseIA } from '../domain/entities/AnaliseIA';
import { ICache } from '../domain/ports/ICache';
import { config } from '../config/config';
import winston from 'winston';
import crypto from 'crypto';

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
  private model: any;
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

  async analyzeError(data: AnalysisData): Promise<AnaliseIA> {
    try {
      // Tenta obter do cache primeiro
      if (this.cache) {
        const cached = await this.cache.get(data);
        if (cached) {
          this.logger.info('Análise obtida do cache');
          return cached;
        }
      }

      const inicioProcessamento = Date.now();
      const prompt = this.prepararPrompt(data);
      const texto = await this.callGeminiAPI(prompt);

      const analise: AnaliseIA = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        erro: {
          tipo: data.error.type,
          mensagem: data.error.message,
          stackTrace: data.error.stackTrace,
          contexto: data.error.context
        },
        resultado: {
          causaRaiz: this.extrairCausaRaiz(texto),
          sugestoes: this.extrairSugestoes(texto),
          nivelConfianca: this.calcularNivelConfianca(texto),
          categoria: this.extrairCategoria(texto),
          tags: this.extrairTags(texto),
          referencias: this.extrairReferencias(texto),
        },
        metadados: {
          modelo: 'Gemini',
          versao: this.modelName,
          tempoProcessamento: Date.now() - inicioProcessamento,
          tokensUtilizados: this.contarTokens(texto),
        },
      };

      // Armazena no cache se disponível
      if (this.cache) {
        await this.cache.set(data, analise);
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
          confidenceLevel: this.calcularNivelConfianca(texto),
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
    return `Você é um engenheiro de QA autônomo especializado em análise de erros e debugging.

Contexto do erro:
- Tipo: ${data.error.type}
- Mensagem: ${data.error.message}
${data.error.stackTrace ? `- Stack Trace:\n${data.error.stackTrace}` : ''}
${data.error.context ? `- Contexto adicional:\n${JSON.stringify(data.error.context, null, 2)}` : ''}

${data.logs ? `Logs relevantes:\n${data.logs.join('\n')}` : ''}

${data.metrics ? `Métricas do sistema:\n${JSON.stringify(data.metrics, null, 2)}` : ''}

Por favor, forneça uma análise detalhada seguindo este formato:

1. CAUSA RAIZ:
[Identifique a causa fundamental do erro]

2. SUGESTÕES DE CORREÇÃO:
[Liste as sugestões de correção em ordem de prioridade]

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

  private extrairCausaRaiz(texto: string): string {
    const match = texto.match(/1\. CAUSA RAIZ:\s*([\s\S]*?)(?=2\.|$)/i);
    return match ? match[1].trim() : 'Causa raiz não identificada';
  }

  private extrairSugestoes(texto: string): string[] {
    const match = texto.match(/2\. SUGESTÕES DE CORREÇÃO:\s*([\s\S]*?)(?=3\.|$)/i);
    if (!match) return ['Sugestões não identificadas'];
    
    return match[1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('-') && !line.startsWith('*'))
      .map(line => line.replace(/^\d+\.\s*/, ''));
  }

  private calcularNivelConfianca(texto: string): number {
    const match = texto.match(/3\. NÍVEL DE CONFIANÇA:\s*([\d.]+)/i);
    if (!match) return 0.5;
    
    const nivel = parseFloat(match[1]);
    return isNaN(nivel) ? 0.5 : Math.max(0, Math.min(1, nivel));
  }

  private extrairCategoria(texto: string): string {
    const match = texto.match(/4\. CATEGORIA:\s*([\s\S]*?)(?=5\.|$)/i);
    if (!match) return 'Other';
    
    const categoria = match[1].trim();
    const categoriasValidas = [
      'Runtime',
      'Logic',
      'Resource',
      'Network',
      'Security',
      'Data',
      'Configuration',
      'Other'
    ];
    
    return categoriasValidas.includes(categoria) ? categoria : 'Other';
  }

  private extrairTags(texto: string): string[] {
    const match = texto.match(/5\. TAGS:\s*([\s\S]*?)(?=6\.|$)/i);
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
} 