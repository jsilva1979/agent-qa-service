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

export class GeminiAIService implements IAIService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private logger: winston.Logger;
  private modelName: string;

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
    },
    private readonly cache?: ICache
  ) {
    this.genAI = new GoogleGenerativeAI(aiConfig.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: aiConfig.modelName });
    this.modelName = aiConfig.modelName;
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
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erro na API do Gemini: ${response.statusText}`);
      }

      const result = (await response.json()) as GeminiResponse;
      const texto = result.candidates[0].content.parts[0].text;

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
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erro na API do Gemini: ${response.statusText}`);
      }

      const result = (await response.json()) as GeminiResponse;
      const texto = result.candidates[0].content.parts[0].text;

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
    return `
      Você é um engenheiro de QA autônomo.

      Abaixo está o trecho de código onde ocorreu o erro, extraído automaticamente após a análise de logs.

      1. O que pode ter causado o erro nesta linha?
      2. Há alguma verificação ausente? (null-check, try-catch...)
      3. Dê uma sugestão de correção com explicação.

      Tipo do erro: ${data.error.type}
      Mensagem: ${data.error.message}
      ${data.error.stackTrace ? `Stack trace: ${data.error.stackTrace}` : ''}
      
      Contexto adicional:
      ${JSON.stringify(data.context || {}, null, 2)}
      
      ${data.logs ? `Logs relevantes:\n${data.logs.join('\n')}` : ''}
      
      ${data.metrics ? `Métricas:\n${JSON.stringify(data.metrics, null, 2)}` : ''}
    `;
  }

  private prepararPromptCodigo(
    codigoFonte: string,
    arquivo: string,
    linha: number,
    erro: string
  ): string {
    return `
      Você é um engenheiro de QA autônomo.

      Abaixo está o trecho de código onde ocorreu o erro:

      Arquivo: ${arquivo}
      Linha: ${linha}
      Erro: ${erro}

      Código:
      ${codigoFonte}

      Por favor, analise o código e forneça:
      1. A causa raiz do problema
      2. Sugestões de correção
      3. Categoria do problema
      4. Tags relevantes
      5. Referências úteis (documentação, exemplos, etc)
    `;
  }

  private extrairCausaRaiz(texto: string): string {
    return texto.split('\n')[0];
  }

  private extrairSugestoes(texto: string): string[] {
    return texto.split('\n').filter(line => line.startsWith('- '));
  }

  private calcularNivelConfianca(texto: string): number {
    return 0.8;
  }

  private extrairCategoria(texto: string): string {
    return 'Erro de Sistema';
  }

  private extrairTags(texto: string): string[] {
    return ['erro', 'sistema'];
  }

  private extrairReferencias(texto: string): string[] {
    return [];
  }

  private contarTokens(texto: string): number {
    return texto.split(/\s+/).length;
  }
} 