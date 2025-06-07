export interface ServiceMetrics {
  serviceName: string;
  activePods: number;
  desiredPods: number;
  cpuUsage: number;
  memoryUsage: number;
  messageQueue: number;
}

export interface IScalingService {
  /**
   * Obtém as métricas atuais de um serviço
   * @param serviceName Nome do serviço no Kubernetes
   * @returns Métricas atuais do serviço
   */
  getMetrics(serviceName: string): Promise<ServiceMetrics>;

  /**
   * Escala um serviço para um número específico de pods
   * @param serviceName Nome do serviço no Kubernetes
   * @param podCount Número desejado de pods
   * @returns true se o scaling foi realizado com sucesso
   */
  scaleService(serviceName: string, podCount: number): Promise<boolean>;

  /**
   * Verifica se o serviço de escalabilidade está disponível
   * @returns true se o serviço está disponível
   */
  checkAvailability(): Promise<boolean>;
} 