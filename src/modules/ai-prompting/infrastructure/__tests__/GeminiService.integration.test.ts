import 'dotenv/config';
import { GeminiService } from '../GeminiService';
import { CodeContext } from '../../../github-access/domain/CodeContext';

describe('GeminiService Integration', () => {
  let geminiService: GeminiService;

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

    const resultado = await geminiService.analisarErro(codeContext, erro);
    expect(resultado).toHaveProperty('causa');
    expect(resultado).toHaveProperty('sugestaoCorrecao');
    expect(resultado).toHaveProperty('explicacao');
  }, 20000);
}); 