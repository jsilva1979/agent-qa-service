import 'dotenv/config';
import { GeminiService } from '../GeminiService';

describe('GeminiService Integration', () => {
  let geminiService: GeminiService;

  type CodeContext = {
    arquivo: string;
    linha: number;
    codigo: string;
    repositorio: string;
    branch: string;
    url: string;
  };

  beforeAll(() => {
    geminiService = new GeminiService();
  });

  it('deve analisar um erro usando a IA Gemini', async () => {
    const codeContext: CodeContext = {
      arquivo: 'index.ts',
      linha: 10,
      codigo: 'const x = y + 1;',
      repositorio: 'repo/teste',
      branch: 'main',
      url: 'https://github.com/teste/repo/blob/main/index.ts#L10'
    };
    const erro = {
      tipo: 'ReferenceError',
      mensagem: 'y is not defined'
    };

    const analysisData = {
      code: codeContext.codigo,
      error: {
        type: erro.tipo,
        message: erro.mensagem
      }
    };

    const resultado = await geminiService.analyzeError(analysisData);
    expect(resultado).toHaveProperty('result');
    expect(resultado.result).toHaveProperty('rootCause');
    expect(resultado.result).toHaveProperty('suggestions');
    expect(resultado.result).toHaveProperty('confidenceLevel');
    expect(resultado.result).toHaveProperty('category');
    expect(resultado.result).toHaveProperty('tags');
    expect(resultado.result).toHaveProperty('references');
    expect(resultado).toHaveProperty('error');
    expect(resultado.error).toHaveProperty('type');
    expect(resultado.error).toHaveProperty('message');
    expect(resultado).toHaveProperty('metadata');
    expect(resultado.metadata).toHaveProperty('model');
    expect(resultado.metadata).toHaveProperty('version');
    expect(resultado.metadata).toHaveProperty('processingTime');
    expect(resultado.metadata).toHaveProperty('tokensUsed');
  }, 20000);
}); 