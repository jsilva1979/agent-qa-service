import { AnalyzeLogUseCase } from '../../application/use-cases/AnalisarLogUseCase';
import { ILogAnalyzer } from '../../domain/ports/IAnalisadorLogs';
import { LogEntry } from '../../domain/entities/LogEntry';

describe('AnalyzeLogUseCase', () => {
  let analyzeLogUseCase: AnalyzeLogUseCase;
  let mockLogAnalyzer: jest.Mocked<ILogAnalyzer>;

  beforeEach(() => {
    mockLogAnalyzer = {
      containsError: jest.fn(),
      analyze: jest.fn(),
    };

    analyzeLogUseCase = new AnalyzeLogUseCase(mockLogAnalyzer);
  });

  describe('execute', () => {
    const mockRawLog = 'Error: Test error message\nat test.ts:42';

    it('should analyze logs successfully', async () => {
      const mockLogEntry: LogEntry = {
        id: 'test-id',
        servico: 'test-service',
        nivel: 'error',
        mensagem: 'Test error message',
        timestamp: new Date(),
        metadata: {
          arquivo: 'test.ts',
          linha: 42,
        }
      };

      mockLogAnalyzer.containsError.mockResolvedValue(true);
      mockLogAnalyzer.analyze.mockResolvedValue(mockLogEntry);

      const result = await analyzeLogUseCase.execute(mockRawLog);

      expect(mockLogAnalyzer.containsError).toHaveBeenCalledWith(mockRawLog);
      expect(mockLogAnalyzer.analyze).toHaveBeenCalledWith(mockRawLog);
      expect(result).toEqual(mockLogEntry);
    });

    it('should throw error when log does not contain errors', async () => {
      mockLogAnalyzer.containsError.mockResolvedValue(false);

      await expect(analyzeLogUseCase.execute(mockRawLog)).rejects.toThrow('O log não contém erros para análise');
      expect(mockLogAnalyzer.analyze).not.toHaveBeenCalled();
    });

    it('should handle analysis errors', async () => {
      const error = new Error('Analysis failed');
      mockLogAnalyzer.containsError.mockResolvedValue(true);
      mockLogAnalyzer.analyze.mockRejectedValue(error);

      await expect(analyzeLogUseCase.execute(mockRawLog)).rejects.toThrow('Analysis failed');
    });
  });
}); 