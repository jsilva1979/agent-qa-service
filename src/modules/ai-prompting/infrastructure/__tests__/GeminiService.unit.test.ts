import 'dotenv/config';
import { GeminiService } from '../GeminiService';
import { AnaliseErro } from '../../domain/AnaliseErro';

describe('GeminiService Unit', () => {
  let geminiService: GeminiService;

  beforeAll(() => {
    geminiService = new GeminiService();
  });

  it('deve parsear a resposta do Gemini corretamente', () => {
    const respostaMock = `
Causa: Variável não definida
Verificações ausentes: null-check, try-catch
Sugestão de correção: Defina a variável antes de usá-la
Explicação: O erro ocorre porque a variável não foi inicializada.
Nível de confiança: 95
`;

    const analise = (geminiService as any).parsearRespostaGemini(respostaMock);

    expect(analise).toEqual({
      causa: 'Variável não definida',
      verificacoesAusentes: ['null-check', 'try-catch'],
      sugestaoCorrecao: 'Defina a variável antes de usá-la',
      explicacao: 'O erro ocorre porque a variável não foi inicializada.',
      nivelConfianca: 95
    });
  });

  it('deve lidar com respostas incompletas', () => {
    const respostaIncompleta = `
Causa: Variável não definida
Sugestão de correção: Defina a variável antes de usá-la
`;

    const analise = (geminiService as any).parsearRespostaGemini(respostaIncompleta);

    expect(analise).toEqual({
      causa: 'Variável não definida',
      verificacoesAusentes: [],
      sugestaoCorrecao: 'Defina a variável antes de usá-la',
      explicacao: 'Explicação não disponível',
      nivelConfianca: 0
    });
  });
}); 