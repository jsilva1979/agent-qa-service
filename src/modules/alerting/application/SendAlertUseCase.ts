import { IAlertService, Alert } from '../domain/ports/IAlertService';
import { AlertInput } from '../domain/AlertInput';

export class SendAlertUseCase {
  constructor(private readonly alertService: IAlertService) {}

  async execute(input: AlertInput): Promise<string> {
    const alertType: Alert['type'] = input.level === 'critical' ? 'error' : input.level;

    const alertDetailsError: Alert['details']['error'] = {
      type: input.error.type,
      message: input.error.message,
      stackTrace: input.error.stacktrace,
      context: {
        code: input.code,
        analysis: input.analysis,
      },
    };

    const newAlert: Omit<Alert, 'id' | 'metadata'> = {
      timestamp: new Date(input.timestamp),
      type: alertType,
      title: `Alert from ${input.service}: ${input.error.type}`,
      message: input.error.message,
      details: {
        error: alertDetailsError,
      },
    };

    return this.alertService.sendAlert(newAlert);
  }
} 