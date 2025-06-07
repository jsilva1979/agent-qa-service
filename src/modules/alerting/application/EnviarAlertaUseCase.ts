import { IAlertService } from '../domain/ports/IAlertService';
import { Alerta } from '../domain/Alerta';

export class EnviarAlertaUseCase {
  constructor(private readonly alertService: IAlertService) {}

  async execute(alerta: Alerta): Promise<void> {
    return this.alertService.enviarAlerta(alerta);
  }
} 