import { createLogger, format, transports } from 'winston';
import { ExpressApiServer } from './application/ExpressApiServer';
import { config } from './config/config';
import { orchestrator } from '../orchestration';

// Configuração do logger
const logger = createLogger({
  level: config.api.logging.level,
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    ...(config.api.logging.file.enabled
      ? [new transports.File({ filename: config.api.logging.file.path })]
      : []),
  ],
});

// Criação do servidor API
const apiServer = new ExpressApiServer(orchestrator, logger);

// Exporta o servidor e o logger
export { apiServer, logger }; 