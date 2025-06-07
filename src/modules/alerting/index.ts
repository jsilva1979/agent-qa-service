import { createLogger, format, transports } from 'winston';
import { SlackAlertAdapter } from './infra/adapters/SlackAlertAdapter';
import { EnviarAlertaUseCase } from './application/use-cases/EnviarAlertaUseCase';
import { config } from './config/config';

// Configuração do logger
const logger = createLogger({
  level: config.slack.logging.level,
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ]
});

// Inicialização do serviço de alertas
const alertService = new SlackAlertAdapter({
  webhookUrl: config.slack.webhookUrl,
  canal: config.slack.canal,
  logging: {
    level: config.slack.logging.level,
    file: {
      path: config.slack.logging.file.path,
    },
  },
});

// Inicialização do caso de uso
const enviarAlertaUseCase = new EnviarAlertaUseCase(
  alertService,
  logger
);

export { enviarAlertaUseCase, alertService }; 