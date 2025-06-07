import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAIService, DadosAnalise, AnaliseCodigo } from '../../domain/ports/IAIService';
import { AnaliseIA } from '../../domain/entities/AnaliseIA';
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

  async verificarDisponibilidade(): Promise<boolean> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });
      await model.generateContent('Teste de disponibilidade');
      return true;
    } catch (error) {
      this.logger.error('Erro ao verificar disponibilidade do Gemini', { error });
      return false;
    }
  }

  async analisarCodigo(
    codigoFonte: string,
    arquivo: string,
    linha: number,
    erro: string
  ): Promise<AnaliseCodigo> {
    try {
      const inicioProcessamento = Date.now();
      
      const prompt = this.prepararPromptCodigo(codigoFonte, arquivo, linha, erro);
      const response = await this.model.generateContent(prompt);
      const texto = response.response.text();

      const analise: AnaliseCodigo = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        arquivo,
        linha,
        erro,
        resultado: {
          causaRaiz: this.extrairCausaRaiz(texto),
          sugestoes: this.extrairSugestoes(texto),
          nivelConfianca: this.calcularNivelConfianca(texto),
          categoria: this.extrairCategoria(texto),
          tags: this.extrairTags(texto),
          referencias: this.extrairReferencias(texto)
        },
        metadados: {
          modelo: this.model.model,
          versao: '2.0-flash',
          tempoProcessamento: Date.now() - inicioProcessamento,
          tokensUtilizados: this.contarTokens(texto)
        }
      };

      this.logger.info('Análise de código concluída', {
        arquivo,
        linha,
        erro,
        tempoProcessamento: analise.metadados.tempoProcessamento
      });

      return analise;
    } catch (error) {
      this.logger.error('Erro ao analisar código:', error);
      throw error;
    }
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
    // Implementar lógica de extração da causa raiz
    return texto.split('\n')[0];
  }

  private extrairSugestoes(texto: string): string[] {
    // Implementar lógica de extração das sugestões
    return texto.split('\n').filter(line => line.startsWith('- '));
  }

  private calcularNivelConfianca(texto: string): number {
    // Implementar lógica de cálculo do nível de confiança
    return 0.8;
  }

  private extrairCategoria(texto: string): string {
    // Implementar lógica de extração da categoria
    return 'Erro de Sistema';
  }

  private extrairTags(texto: string): string[] {
    // Implementar lógica de extração das tags
    return ['erro', 'sistema'];
  }

  private extrairReferencias(texto: string): string[] {
    // Implementar lógica de extração das referências
    return [];
  }

  private contarTokens(texto: string): number {
    // Implementar lógica de contagem de tokens
    return texto.split(/\s+/).length;
  }

  async analisarErro(dados: DadosAnalise): Promise<AnaliseIA> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });
      const prompt = `
Você é um engenheiro de QA autônomo.

Analise o seguinte erro e forneça uma análise detalhada:

Tipo: ${dados.erro.tipo}
Mensagem: ${dados.erro.mensagem}
Stack Trace: ${dados.erro.stackTrace || 'N/A'}

Código:
\`\`\`
${dados.codigo}
\`\`\`

Logs:
${dados.logs?.join('\n') || 'N/A'}

Métricas:
CPU: ${dados.metricas?.cpu || 'N/A'}%
Memória: ${dados.metricas?.memoria || 'N/A'}%
Latência: ${dados.metricas?.latencia || 'N/A'}ms

Contexto:
${JSON.stringify(dados.contexto || {}, null, 2)}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const texto = response.text();

      // Parseia a resposta do Gemini para o formato AnaliseIA
      const linhas = texto.split('\n');
      
      return {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        erro: dados.erro,
        resultado: {
          causaRaiz: linhas[0] || 'Causa não identificada',
          nivelConfianca: 0.8,
          sugestoes: linhas.slice(1).filter(l => l.trim().startsWith('-')),
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
      this.logger.error('Erro ao analisar erro com Gemini', { error, dados });
      throw error;
    }
  }

  async obterInfoModelo(): Promise<{
    nome: string;
    versao: string;
    capacidades: string[];
    limitacoes: string[];
  }> {
    return {
      nome: 'Gemini',
      versao: '2.0-flash',
      capacidades: [
        'Análise de código',
        'Diagnóstico de erros',
        'Sugestões de correção',
        'Análise de logs'
      ],
      limitacoes: [
        'Contexto limitado',
        'Não executa código',
        'Não acessa banco de dados'
      ]
    };
  }
} 