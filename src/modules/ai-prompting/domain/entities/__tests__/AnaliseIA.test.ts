import { AnaliseIA } from '../AnaliseIA';

describe('AnaliseIA', () => {
  const mockAnalise: AnaliseIA = {
    id: 'test-id',
    timestamp: new Date(),
    erro: {
      tipo: 'TestError',
      mensagem: 'Test message',
      stackTrace: 'at Test.test (Test.java:1)',
    },
    resultado: {
      causaRaiz: 'Test root cause',
      sugestoes: ['Test suggestion'],
      nivelConfianca: 0.8,
      categoria: 'Test category',
      tags: ['test'],
      referencias: ['test-ref'],
    },
    metadados: {
      modelo: 'Test Model',
      versao: '1.0',
      tempoProcessamento: 100,
      tokensUtilizados: 50,
    },
  };

  it('deve ter uma estrutura válida', () => {
    expect(mockAnalise).toHaveProperty('id');
    expect(mockAnalise).toHaveProperty('timestamp');
    expect(mockAnalise).toHaveProperty('erro');
    expect(mockAnalise).toHaveProperty('resultado');
    expect(mockAnalise).toHaveProperty('metadados');
  });

  it('deve ter um erro válido', () => {
    expect(mockAnalise.erro).toHaveProperty('tipo');
    expect(mockAnalise.erro).toHaveProperty('mensagem');
    expect(mockAnalise.erro).toHaveProperty('stackTrace');
  });

  it('deve ter um resultado válido', () => {
    expect(mockAnalise.resultado).toHaveProperty('causaRaiz');
    expect(mockAnalise.resultado).toHaveProperty('sugestoes');
    expect(mockAnalise.resultado).toHaveProperty('nivelConfianca');
    expect(mockAnalise.resultado).toHaveProperty('categoria');
    expect(mockAnalise.resultado).toHaveProperty('tags');
    expect(mockAnalise.resultado).toHaveProperty('referencias');

    expect(Array.isArray(mockAnalise.resultado.sugestoes)).toBe(true);
    expect(Array.isArray(mockAnalise.resultado.tags)).toBe(true);
    expect(Array.isArray(mockAnalise.resultado.referencias)).toBe(true);
    expect(typeof mockAnalise.resultado.nivelConfianca).toBe('number');
    expect(mockAnalise.resultado.nivelConfianca).toBeGreaterThanOrEqual(0);
    expect(mockAnalise.resultado.nivelConfianca).toBeLessThanOrEqual(1);
  });

  it('deve ter metadados válidos', () => {
    expect(mockAnalise.metadados).toHaveProperty('modelo');
    expect(mockAnalise.metadados).toHaveProperty('versao');
    expect(mockAnalise.metadados).toHaveProperty('tempoProcessamento');
    expect(mockAnalise.metadados).toHaveProperty('tokensUtilizados');

    expect(typeof mockAnalise.metadados.tempoProcessamento).toBe('number');
    expect(typeof mockAnalise.metadados.tokensUtilizados).toBe('number');
  });
}); 