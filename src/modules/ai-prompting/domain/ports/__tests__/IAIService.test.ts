import { IAIService, AnalysisData, CodeAnalysis } from '../IAIService';
import { AnaliseIA } from '../../entities/AnaliseIA';

// Classe mock para testar a interface
class MockAIService implements IAIService {
  async analyzeError(data: AnalysisData): Promise<AnaliseIA> {
    return {
      id: 'mock-id',
      timestamp: new Date(),
      erro: {
        tipo: data.error.type,
        mensagem: data.error.message,
        stackTrace: data.error.stackTrace,
        contexto: data.error.context,
      },
      resultado: {
        causaRaiz: 'Mock causa raiz',
        sugestoes: ['Mock sugestão'],
        nivelConfianca: 0.8,
        categoria: 'Mock categoria',
        tags: ['mock'],
        referencias: ['mock-ref'],
      },
      metadados: {
        modelo: 'Mock Model',
        versao: '1.0',
        tempoProcessamento: 100,
        tokensUtilizados: 50,
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
      expect(result).toHaveProperty('erro');
      expect(result).toHaveProperty('resultado');
      expect(result).toHaveProperty('metadados');

      expect(result.resultado).toHaveProperty('causaRaiz');
      expect(result.resultado).toHaveProperty('sugestoes');
      expect(result.resultado).toHaveProperty('nivelConfianca');
      expect(result.resultado).toHaveProperty('categoria');
      expect(result.resultado).toHaveProperty('tags');
      expect(result.resultado).toHaveProperty('referencias');

      expect(result.metadados).toHaveProperty('modelo');
      expect(result.metadados).toHaveProperty('versao');
      expect(result.metadados).toHaveProperty('tempoProcessamento');
      expect(result.metadados).toHaveProperty('tokensUtilizados');
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