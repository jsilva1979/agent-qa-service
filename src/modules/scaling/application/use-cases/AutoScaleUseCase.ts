import { IScalingService, ServiceMetrics } from '../../domain/ports/IScalingService';
import { Logger } from 'winston';

export class AutoScaleUseCase {
  private readonly CPU_LIMIT = 80; // 80% of utilization
  private readonly MEMORY_LIMIT = 80; // 80% of utilization
  private readonly QUEUE_LIMIT = 1000; // 1000 messages in queue
  private readonly MIN_PODS = 1;
  private readonly MAX_PODS = 10;

  constructor(
    private readonly scalingService: IScalingService,
    private readonly logger: Logger
  ) {}

  /**
   * Executa o auto-scaling de um serviço
   * @param serviceName Nome do serviço a ser escalado
   * @returns true se o scaling foi realizado com sucesso
   * @throws Error se o serviço não estiver disponível ou ocorrer erro no scaling
   */
  async execute(serviceName: string): Promise<boolean> {
    try {
      // Primeiro verifica se o serviço está disponível
      const isAvailable = await this.scalingService.checkAvailability();
      
      if (!isAvailable) {
        throw new Error('Serviço de escalabilidade não está disponível no momento');
      }

      // Obtém as métricas atuais
      const metrics = await this.scalingService.getMetrics(serviceName);
      
      // Calcula o número ideal de pods
      const desiredPods = this.calculateDesiredPods(metrics);
      
      // Se o número de pods já está correto, não faz nada
      if (desiredPods === metrics.activePods) {
        this.logger.info('Número atual de pods é adequado', {
          service: serviceName,
          pods: metrics.activePods
        });
        return true;
      }

      // Realiza o scaling
      const success = await this.scalingService.scaleService(serviceName, desiredPods);

      if (success) {
        this.logger.info('Scaling realizado com sucesso', {
          service: serviceName,
          oldPods: metrics.activePods,
          newPods: desiredPods
        });
      }

      return success;
    } catch (error) {
      this.logger.error('Erro ao realizar auto-scaling', {
        error,
        service: serviceName
      });
      throw error;
    }
  }

  /**
   * Calcula o número ideal de pods baseado nas métricas
   * @param metrics Métricas atuais do serviço
   * @returns Número ideal de pods
   */
  private calculateDesiredPods(metrics: ServiceMetrics): number {
    // Calcula o fator de carga baseado em CPU, memória e fila
    const cpuFactor = metrics.cpuUsage / this.CPU_LIMIT;
    const memoryFactor = metrics.memoryUsage / this.MEMORY_LIMIT;
    const queueFactor = metrics.messageQueue / this.QUEUE_LIMIT;

    // Usa o maior fator para determinar o número de pods
    const loadFactor = Math.max(cpuFactor, memoryFactor, queueFactor);
    
    // Calcula o número de pods necessários
    let desiredPods = Math.ceil(metrics.activePods * loadFactor);

    // Aplica limites mínimo e máximo
    desiredPods = Math.max(this.MIN_PODS, Math.min(this.MAX_PODS, desiredPods));

    return desiredPods;
  }
} 