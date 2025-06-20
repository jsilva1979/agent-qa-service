import 'dotenv/config';
import { ExpressApiServer } from './modules/api/application/ExpressApiServer';
import { IApiServer } from './modules/api/domain/ports/IApiServer';
import { createLogger, format, transports } from 'winston';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Configuração do logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: 'logs/app.log',
      level: 'error',
    }),
  ],
});

// Iniciar servidor
const server: IApiServer = new ExpressApiServer(logger);

// Iniciar o servidor usando o novo método
server.iniciar(PORT).catch(error => {
  logger.error('Erro ao iniciar o servidor:', { error });
  process.exit(1);
}); 
// Exibir mensagem de sucesso
