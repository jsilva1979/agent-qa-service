import { IAlertService, Alert } from '../domain/ports/IAlertService';
import { Alerta } from '../domain/Alerta';

export class EnviarAlertaUseCase {
  constructor(private readonly alertService: IAlertService) {}

  async execute(alerta: Alerta): Promise<string> {
    const alertType: Alert['type'] = alerta.nivel === 'critical' ? 'error' : alerta.nivel;

    const alertDetailsError: Alert['details']['error'] = {
      type: alerta.erro.tipo,
      message: alerta.erro.mensagem,
      stackTrace: alerta.erro.stacktrace,
      context: {
        codigo: alerta.codigo,
        analise: alerta.analise,
      },
    };

    const newAlert: Omit<Alert, 'id' | 'metadata'> = {
      timestamp: new Date(alerta.timestamp),
      type: alertType,
      title: `Alerta de ${alerta.servico}: ${alerta.erro.tipo}`,
      message: alerta.erro.mensagem,
      details: {
        error: alertDetailsError,
      },
    };

    return this.alertService.sendAlert(newAlert);
  }
} 