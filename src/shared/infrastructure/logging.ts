import winston from 'winston';

export function setupLogging() {
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
      new winston.transports.File({ 
        filename: 'logs/erro.log', 
        level: 'error' 
      }),
      new winston.transports.File({ 
        filename: 'logs/geral.log' 
      }),
    ],
  });

  return logger;
} 