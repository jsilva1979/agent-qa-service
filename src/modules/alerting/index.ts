import { createLogger, format, transports } from 'winston';
import { SlackAlertService } from './infrastructure/SlackAlertService';
import { SendAlertUseCase } from './application/use-cases/SendAlertUseCase';
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

if (!config.slack.accessToken) {
  throw new Error('SLACK_ACCESS_TOKEN não configurado');
}

if (!config.slack.refreshToken) {
  throw new Error('SLACK_REFRESH_TOKEN não configurado');
}

if (!config.jira || !config.jira.url) {
  throw new Error('JIRA_URL não configurado');
}

// Inicialização do serviço de alertas
const alertService = new SlackAlertService({
  accessToken: config.slack.accessToken,
  refreshToken: config.slack.refreshToken,
  channel: config.slack.channel,
  logging: config.slack.logging,
  jira: {
    url: config.jira.url,
  },
});

// Inicialização do caso de uso
const sendAlertUseCase = new SendAlertUseCase(
  alertService,
  logger
);

export { sendAlertUseCase, alertService };
export * from './domain/ports/IAlertService';
export { Alert } from './domain/entities/Alert'; 