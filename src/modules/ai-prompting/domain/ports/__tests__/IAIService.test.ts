import { IAIService, AnalysisData, CodeAnalysis } from '../IAIService';
import { AnalyzeAI } from '../../entities/AnalyzeAI';

// Classe mock para testar a interface
class MockAIService implements IAIService {
  async analyzeError(data: AnalysisData): Promise<AnalyzeAI> {
    return {
      id: 'mock-id',
      timestamp: new Date(),
      error: {
        type: data.error.type,
        message: data.error.message,
        stackTrace: data.error.stackTrace,
        context: data.error.context,
      },
      result: {
        rootCause: 'Mock causa raiz',
        suggestions: ['Mock sugestão'],
        confidenceLevel: 0.8,
        category: 'Mock categoria',
        tags: ['mock'],
        references: ['mock-ref'],
      },
      metadata: {
        model: 'Mock Model',
        version: '1.0',
        processingTime: 100,
        tokensUsed: 50,
      },
    };
  }

  async analyzeCode(
    sourceCode: string,
    file: string,
    line: number,
    error: string
  ): Promise<CodeAnalysis> {
    return {
      id: 'mock-code-id',
      timestamp: new Date(),
      file: file,
      line: line,
      error: error,
      result: {
        rootCause: 'Mock code root cause',
        suggestions: ['Mock code suggestion'],
        confidenceLevel: 0.9,
        category: 'Code Analysis',
        tags: ['code', 'mock'],
        references: ['mock-code-ref'],
      },
      metadata: {
        model: 'Mock Code Model',
        version: '1.0',
        processingTime: 50,
        tokensUsed: 25,
      },
    };
  }

  async checkAvailability(): Promise<boolean> {
    return true;
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
}

describe('IAIService', () => {
  let service: IAIService;

  beforeEach(() => {
    service = new MockAIService();
  });

  describe('analyzeError', () => {
    const mockData: AnalysisData = {
      error: {
        type: 'TestError',
        message: 'Test message',
      },
      code: 'test code',
    };

    it('should return a valid analysis', async () => {
      const result = await service.analyzeError(mockData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('metadata');

      expect(result.result).toHaveProperty('rootCause');
      expect(result.result).toHaveProperty('suggestions');
      expect(result.result).toHaveProperty('confidenceLevel');
      expect(result.result).toHaveProperty('category');
      expect(result.result).toHaveProperty('tags');
      expect(result.result).toHaveProperty('references');

      expect(result.metadata).toHaveProperty('model');
      expect(result.metadata).toHaveProperty('version');
      expect(result.metadata).toHaveProperty('processingTime');
      expect(result.metadata).toHaveProperty('tokensUsed');
    });
  });

  describe('analyzeCode', () => {
    const mockSourceCode = 'const a = 1;';
    const mockFile = 'test.ts';
    const mockLine = 1;
    const mockError = 'SyntaxError';

    it('should return a valid code analysis', async () => {
      const result = await service.analyzeCode(mockSourceCode, mockFile, mockLine, mockError);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('file');
      expect(result).toHaveProperty('line');
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('metadata');
    });
  });

  describe('checkAvailability', () => {
    it('should return a boolean', async () => {
      const result = await service.checkAvailability();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getModelInfo', () => {
    it('should return model information', async () => {
      const info = await service.getModelInfo();

      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('version');
      expect(info).toHaveProperty('capabilities');
      expect(info).toHaveProperty('limitations');

      expect(Array.isArray(info.capabilities)).toBe(true);
      expect(Array.isArray(info.limitations)).toBe(true);
    });
  });
}); 