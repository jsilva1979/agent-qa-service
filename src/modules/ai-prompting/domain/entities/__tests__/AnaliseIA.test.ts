import { AnalyzeAI } from '../AnalyzeAI';

describe('AnalyzeAI', () => {
  const mockAnalise: AnalyzeAI = {
    id: 'test-id',
    timestamp: new Date(),
    error: {
      type: 'TestError',
      message: 'Test message',
      stackTrace: 'at Test.test (Test.java:1)',
    },
    result: {
      rootCause: 'Test root cause',
      suggestions: ['Test suggestion'],
      confidenceLevel: 0.8,
      category: 'Test category',
      tags: ['test'],
      references: ['test-ref'],
    },
    metadata: {
      model: 'Test Model',
      version: '1.0',
      processingTime: 100,
      tokensUsed: 50,
    },
  };

  it('deve ter uma estrutura válida', () => {
    expect(mockAnalise).toHaveProperty('id');
    expect(mockAnalise).toHaveProperty('timestamp');
    expect(mockAnalise).toHaveProperty('error');
    expect(mockAnalise).toHaveProperty('result');
    expect(mockAnalise).toHaveProperty('metadata');
  });

  it('deve ter um erro válido', () => {
    expect(mockAnalise.error).toHaveProperty('type');
    expect(mockAnalise.error).toHaveProperty('message');
    expect(mockAnalise.error).toHaveProperty('stackTrace');
  });

  it('deve ter um resultado válido', () => {
    expect(mockAnalise.result).toHaveProperty('rootCause');
    expect(mockAnalise.result).toHaveProperty('suggestions');
    expect(mockAnalise.result).toHaveProperty('confidenceLevel');
    expect(mockAnalise.result).toHaveProperty('category');
    expect(mockAnalise.result).toHaveProperty('tags');
    expect(mockAnalise.result).toHaveProperty('references');

    expect(Array.isArray(mockAnalise.result.suggestions)).toBe(true);
    expect(Array.isArray(mockAnalise.result.tags)).toBe(true);
    expect(Array.isArray(mockAnalise.result.references)).toBe(true);
    expect(typeof mockAnalise.result.confidenceLevel).toBe('number');
    expect(mockAnalise.result.confidenceLevel).toBeGreaterThanOrEqual(0);
    expect(mockAnalise.result.confidenceLevel).toBeLessThanOrEqual(1);
  });

  it('deve ter metadados válidos', () => {
    expect(mockAnalise.metadata).toHaveProperty('model');
    expect(mockAnalise.metadata).toHaveProperty('version');
    expect(mockAnalise.metadata).toHaveProperty('processingTime');
    expect(mockAnalise.metadata).toHaveProperty('tokensUsed');

    expect(typeof mockAnalise.metadata.processingTime).toBe('number');
    expect(typeof mockAnalise.metadata.tokensUsed).toBe('number');
  });
}); 