import { LogAnalysisService } from '../../application/LogAnalysisService';
import { LogEntry } from '../../domain/entities/LogEntry';
import { AnaliseLog } from '../../domain/ports/ILogAnalysisService';
import { Logger } from 'winston';

describe('LogAnalysisService', () => {
  let logAnalysisService: LogAnalysisService;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    logAnalysisService = new LogAnalysisService(mockLogger);
  });

  describe('analisarLog', () => {
    const mockLogEntry: LogEntry = {
      id: 'test-id',
      servico: 'test-service',
      nivel: 'error',
      mensagem: 'NullPointerException: name is null',
      timestamp: new Date(),
      stackTrace: 'Error: name is null\nat UserProcessor.processName (UserProcessor.java:23)',
      metadata: {
        arquivo: 'UserProcessor.java',
        linha: 23,
        metodo: 'processName',
        repositorio: 'user-service',
        variaveis: { name: null }
      }
    };

    it('should analyze log successfully', async () => {
      const result = await logAnalysisService.analisarLog(mockLogEntry);

      const expectedAnalysis: AnaliseLog = {
        servico: 'test-service',
        repositorio: 'user-service',
        arquivo: 'UserProcessor.java',
        linha: 23,
        erro: 'NullPointerException',
        contexto: {
          stackTrace: mockLogEntry.stackTrace,
          metodo: 'processName',
          variaveis: { name: null },
          arquivo: 'UserProcessor.java',
          linha: 23,
          repositorio: 'user-service'
        }
      };

      expect(result).toEqual(expectedAnalysis);
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should handle missing stack trace', async () => {
      const logEntryWithoutStack = {
        ...mockLogEntry,
        stackTrace: undefined
      };

      const result = await logAnalysisService.analisarLog(logEntryWithoutStack);

      expect(result.arquivo).toBe('UserProcessor.java');
      expect(result.linha).toBe(23);
      expect(result.contexto.metodo).toBeUndefined();
    });

    it('should handle missing metadata', async () => {
      const logEntryWithoutMetadata = {
        ...mockLogEntry,
        metadata: undefined
      };

      const result = await logAnalysisService.analisarLog(logEntryWithoutMetadata);

      expect(result.repositorio).toBe('desconhecido');
      expect(result.arquivo).toBe('UserProcessor.java');
      expect(result.linha).toBe(23);
    });

    it('should handle analysis errors', async () => {
      const error = new Error('Analysis failed');
      mockLogger.error.mockImplementation(() => { throw error; });

      await expect(logAnalysisService.analisarLog(mockLogEntry)).rejects.toThrow('Analysis failed');
    });
  });

  describe('verificarDisponibilidade', () => {
    it('should return true when service is available', async () => {
      const result = await logAnalysisService.verificarDisponibilidade();
      expect(result).toBe(true);
    });

    it('should return false when service check fails', async () => {
      const error = new Error('Service unavailable');
      mockLogger.error.mockImplementation(() => { throw error; });

      const result = await logAnalysisService.verificarDisponibilidade();
      expect(result).toBe(false);
    });
  });

  describe('iniciar/parar', () => {
    it('should log service start', async () => {
      await logAnalysisService.iniciar();
      expect(mockLogger.info).toHaveBeenCalledWith('Iniciando serviço de análise de logs');
    });

    it('should log service stop', async () => {
      await logAnalysisService.parar();
      expect(mockLogger.info).toHaveBeenCalledWith('Parando serviço de análise de logs');
    });
  });
}); 