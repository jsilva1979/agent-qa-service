import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAIService, AnalysisData, CodeAnalysis } from '../../domain/ports/IAIService';
import { AnalyzeAI } from '../../domain/entities/AnalyzeAI';
import { Logger } from 'winston';
import { ICache } from '../../domain/ports/ICache';
import * as crypto from 'crypto';

export class GeminiServiceAdapter implements IAIService {
  private genAI: GoogleGenerativeAI;
  private logger: Logger;
  private modelName: string;
  private cache?: ICache;
  private generativeModel: any;

  constructor(
    logger: Logger,
    apiKey: string,
    modelName: string,
    cache?: ICache,
  ) {
    this.logger = logger;
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
    this.cache = cache;
    this.generativeModel = this.genAI.getGenerativeModel({ model: this.modelName });
  }

  public async analyzeError(input: AnalysisData): Promise<AnalyzeAI> {
    const shouldCache = false; // Manter cache desativado por enquanto
    
    if (this.cache && shouldCache) {
      const cacheKey = `analysis:${crypto.createHash('md5').update(JSON.stringify(input)).digest('hex')}`;
      const cachedResult = await this.cache.get(cacheKey);
      if (cachedResult) {
        this.logger.info('Análise obtida do cache');
        return cachedResult as AnalyzeAI;
      }
    }

    try {
      const prompt = `
        Análise de Erro de Software
        ===========================
        Por favor, analise o seguinte erro e forneça uma análise detalhada.
        Erro:
        - Tipo: ${input.error.type}
        - Mensagem: ${input.error.message}
        - Stack Trace: ${input.error.stackTrace || 'N/A'}
        Análise Solicitada:
        - ROOT_CAUSE: Descreva a causa raiz em uma frase.
        - SUGGESTIONS: Forneça sugestões de correção em uma lista.
        - CATEGORY: Classifique como [API, Database, Network, UI, Logic, Other].
        - IMPACT: Avalie como [LOW, MEDIUM, HIGH, CRITICAL].
      `;
      
      const result = await this.generativeModel.generateContent(prompt);
      const texto = result.response.text();

      const analysis: AnalyzeAI = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        error: { ...input.error },
        result: {
          rootCause: this.extrairCampo(texto, 'ROOT_CAUSE'),
          suggestions: this.extrairCampo(texto, 'SUGGESTIONS').split('\n').map(s => s.trim()).filter(Boolean),
          confidenceLevel: 0.9,
          category: this.extrairCampo(texto, 'CATEGORY'),
          impact: this.extrairCampo(texto, 'IMPACT'),
          tags: [],
          references: [],
        },
        metadata: {
          model: this.modelName,
          version: '1.0',
          processingTime: 0,
          tokensUsed: texto.length, 
        }
      };

      if (this.cache && shouldCache) {
        const cacheKey = `analysis:${crypto.createHash('md5').update(JSON.stringify(input)).digest('hex')}`;
        await this.cache.set(cacheKey, analysis, 3600);
      }

      return analysis;
    } catch (error) {
      this.logger.error('Erro ao analisar erro com Gemini', { error, input });
      throw error;
    }
  }

  private extrairCampo(texto: string, campo: string): string {
    const regex = new RegExp(`${campo}:\\s*(.+)`);
    const match = texto.match(regex);
    return match ? match[1].trim() : `Unknown ${campo}`;
  }

  async checkAvailability(): Promise<boolean> {
    try {
      await this.genAI.getGenerativeModel({ model: this.modelName }).generateContent('Teste de disponibilidade');
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
      const response = await this.generativeModel.generateContent(prompt);

      const analysis: CodeAnalysis = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        file: file,
        line: line,
        error: error,
        result: {
          rootCause: this.extractRootCause(response.response.text()),
          suggestions: this.extractSuggestions(response.response.text()),
          confidenceLevel: this.calculateConfidenceLevel(response.response.text()),
          category: this.extractCategory(response.response.text()),
          tags: this.extractTags(response.response.text()),
          references: this.extractReferences(response.response.text())
        },
        metadata: {
          model: this.modelName,
          version: '2.0-flash',
          processingTime: Date.now() - processingStartTime,
          tokensUsed: this.countTokens(response.response.text())
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
    return text.split('\n')[0];
  }

  private extractSuggestions(text: string): string[] {
    return text.split('\n').filter(line => line.startsWith('- '));
  }

  private calculateConfidenceLevel(_: string): number {
    return 0.8;
  }

  private extractCategory(_: string): string {
    return 'Erro de Sistema';
  }

  private extractTags(_: string): string[] {
    return ['erro', 'sistema'];
  }

  private extractReferences(_: string): string[] {
    return [];
  }

  private countTokens(text: string): number {
    return text.split(/\s+/).length;
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

  async generateContent(prompt: string): Promise<string> {
    try {
      // Tentar buscar do cache primeiro
      if (this.cache) {
        const cached = await this.cache.get(prompt);
        if (cached) return cached;
      }

      const result = await this.generativeModel.generateContent(prompt);
      const response = result.response.text();

      // Salvar no cache se disponível
      if (this.cache) {
        await this.cache.set(prompt, response);
      }

      return response;
    } catch (error) {
      console.error('Erro ao gerar conteúdo com Gemini:', error);
      throw error;
    }
  }
} 