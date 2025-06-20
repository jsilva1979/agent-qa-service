import 'dotenv/config';
import { GeminiService } from '../GeminiService';
import { AnalyzeError } from '../../domain/AnalyzeError';

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

    const analise = (geminiService as unknown as { parsearRespostaGemini: (resposta: string) => AnalyzeError }).parsearRespostaGemini(respostaMock);

    expect(analise).toEqual({
      rootCause: 'Variável não definida',
      missingChecks: ['null-check', 'try-catch'],
      correctionSuggestion: 'Defina a variável antes de usá-la',
      explanation: 'O erro ocorre porque a variável não foi inicializada.',
      confidenceLevel: 95,
    });
  });

  it('deve lidar com respostas incompletas', () => {
    const respostaIncompleta = `
Causa: Variável não definida
Sugestão de correção: Defina a variável antes de usá-la
`;

    const analise = (geminiService as unknown as { parsearRespostaGemini: (resposta: string) => AnalyzeError }).parsearRespostaGemini(respostaIncompleta);

    expect(analise).toEqual({
      rootCause: 'Variável não definida',
      missingChecks: [],
      correctionSuggestion: 'Defina a variável antes de usá-la',
      explanation: 'Explicação não disponível',
      confidenceLevel: 0,
    });
  });
}); 