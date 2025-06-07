import { createLogger, format, transports } from 'winston';
import { GitHubService } from './application/GitHubService';
import { config } from './config/config';

// Configuração do logger
const logger = createLogger({
  level: config.github.logging.level,
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    ...(config.github.logging.file.enabled
      ? [new transports.File({ filename: config.github.logging.file.path })]
      : []),
  ],
});

// Criação do serviço de acesso ao GitHub
const gitHubService = new GitHubService(logger);

// Exporta o serviço e o logger
export { gitHubService, logger }; 