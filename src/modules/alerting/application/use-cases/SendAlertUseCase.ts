import { IAlertService, Alert } from '../../domain/ports/IAlertService';
import { Logger } from 'winston';

export class SendAlertUseCase {
  constructor(
    private readonly alertService: IAlertService,
    private readonly logger: Logger
  ) {}

  /**
   * Executa o envio de um alerta
   * @param alert Dados do alerta a ser enviado
   * @returns true se o alerta foi enviado com sucesso
   * @throws Error se o serviço não estiver disponível ou ocorrer erro no envio
   */
  async execute(alert: Alert): Promise<boolean> {
    try {
      // Primeiro verifica se o serviço está disponível
      const isAvailable = await this.alertService.checkAvailability();
      
      if (!isAvailable) {
        throw new Error('Serviço de alertas não está disponível no momento');
      }

      // Envia o alerta
      const id = await this.alertService.sendAlert(alert);

      if (id) {
        this.logger.info('Alerta enviado com sucesso', {
          type: alert.type,
          title: alert.title,
          message: alert.message
        });
      }

      return !!id;
    } catch (error) {
      this.logger.error('Erro ao enviar alerta', {
        error,
        type: alert.type,
        title: alert.title,
        message: alert.message
      });
      throw error;
    }
  }
} 