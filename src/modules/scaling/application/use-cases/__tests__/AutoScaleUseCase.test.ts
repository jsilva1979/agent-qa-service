import { AutoScaleUseCase } from '../AutoScaleUseCase';
import { IScalingService, ServiceMetrics } from '../../../domain/ports/IScalingService';
import { Logger } from 'winston';

describe('AutoScaleUseCase', () => {
  let autoScaleUseCase: AutoScaleUseCase;
  let mockScalingService: jest.Mocked<IScalingService>;
  let mockLogger: jest.Mocked<Logger>;

  const mockMetrics: ServiceMetrics = {
    serviceName: 'servico-teste',
    activePods: 2,
    desiredPods: 2,
    cpuUsage: 50,
    memoryUsage: 60,
    messageQueue: 500
  };

  beforeEach(() => {
    mockScalingService = {
      checkAvailability: jest.fn().mockResolvedValue(true),
      getMetrics: jest.fn().mockResolvedValue(mockMetrics),
      scaleService: jest.fn().mockResolvedValue(true)
    } as any;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn()
    } as any;

    autoScaleUseCase = new AutoScaleUseCase(mockScalingService, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve realizar scaling quando necessário', async () => {
      const metricsComAltaCarga: ServiceMetrics = {
        ...mockMetrics,
        cpuUsage: 90,
        memoryUsage: 85,
        messageQueue: 1500
      };

      mockScalingService.getMetrics.mockResolvedValueOnce(metricsComAltaCarga);

      const result = await autoScaleUseCase.execute('servico-teste');

      expect(result).toBe(true);
      expect(mockScalingService.scaleService).toHaveBeenCalledWith(
        'servico-teste',
        expect.any(Number)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Scaling realizado com sucesso',
        expect.any(Object)
      );
    });

    it('não deve realizar scaling quando o número atual de pods é adequado', async () => {
      const result = await autoScaleUseCase.execute('servico-teste');

      expect(result).toBe(true);
      expect(mockScalingService.scaleService).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Número atual de pods é adequado',
        expect.any(Object)
      );
    });

    it('deve lançar erro quando o serviço não estiver disponível', async () => {
      mockScalingService.checkAvailability.mockResolvedValueOnce(false);

      await expect(autoScaleUseCase.execute('servico-teste'))
        .rejects.toThrow('Serviço de escalabilidade não está disponível no momento');
    });

    it('deve lançar erro quando falhar ao obter métricas', async () => {
      const error = new Error('Erro ao obter métricas');
      mockScalingService.getMetrics.mockRejectedValueOnce(error);

      await expect(autoScaleUseCase.execute('servico-teste'))
        .rejects.toThrow('Erro ao obter métricas');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro ao realizar auto-scaling',
        expect.any(Object)
      );
    });

    it('deve lançar erro quando falhar ao realizar scaling', async () => {
      const error = new Error('Erro ao realizar scaling');
      mockScalingService.scaleService.mockRejectedValueOnce(error);

      await expect(autoScaleUseCase.execute('servico-teste'))
        .rejects.toThrow('Erro ao realizar scaling');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro ao realizar auto-scaling',
        expect.any(Object)
      );
    });
  });

  describe('calculateDesiredPods', () => {
    it('deve calcular número correto de pods baseado em CPU', () => {
      const metrics: ServiceMetrics = {
        ...mockMetrics,
        cpuUsage: 90,
        memoryUsage: 50,
        messageQueue: 500
      };

      const result = autoScaleUseCase['calculateDesiredPods'](metrics);

      expect(result).toBeGreaterThan(metrics.activePods);
    });

    it('deve calcular número correto de pods baseado em memória', () => {
      const metrics: ServiceMetrics = {
        ...mockMetrics,
        cpuUsage: 50,
        memoryUsage: 90,
        messageQueue: 500
      };

      const result = autoScaleUseCase['calculateDesiredPods'](metrics);

      expect(result).toBeGreaterThan(metrics.activePods);
    });

    it('deve calcular número correto de pods baseado em fila', () => {
      const metrics: ServiceMetrics = {
        ...mockMetrics,
        cpuUsage: 50,
        memoryUsage: 50,
        messageQueue: 1500
      };

      const result = autoScaleUseCase['calculateDesiredPods'](metrics);

      expect(result).toBeGreaterThan(metrics.activePods);
    });

    it('deve respeitar o limite mínimo de pods', () => {
      const metrics: ServiceMetrics = {
        ...mockMetrics,
        cpuUsage: 10,
        memoryUsage: 10,
        messageQueue: 100,
        activePods: 1
      };

      const result = autoScaleUseCase['calculateDesiredPods'](metrics);

      expect(result).toBe(1);
    });

    it('deve respeitar o limite máximo de pods', () => {
      const metrics: ServiceMetrics = {
        ...mockMetrics,
        cpuUsage: 100,
        memoryUsage: 100,
        messageQueue: 2000,
        activePods: 10
      };

      const result = autoScaleUseCase['calculateDesiredPods'](metrics);

      expect(result).toBe(10);
    });
  });
}); 