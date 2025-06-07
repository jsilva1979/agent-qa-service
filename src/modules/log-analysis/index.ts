import { createLogger, format, transports } from 'winston';
import { LogAnalysisService } from './application/LogAnalysisService';
import { config } from './config/config';

// Configuração do logger
const logger = createLogger({
  level: config.logAnalysis.logging.level,
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    ...(config.logAnalysis.logging.file.enabled
      ? [new transports.File({ filename: config.logAnalysis.logging.file.path })]
      : []),
  ],
});

// Criação do serviço de análise de logs
const logAnalysisService = new LogAnalysisService(logger);

// Exporta o serviço e o logger
export { logAnalysisService, logger }; 