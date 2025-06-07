import winston from 'winston';
import { GeminiAIService } from './application/GeminiAIService';
import { RedisCache } from './infra/cache/RedisCache';
import { config } from './config/config';

// Configuração do logger
const logger = winston.createLogger({
  level: config.ai.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: config.ai.logging.file.path,
      level: 'error',
    }),
  ],
});

// Inicialização do cache Redis
const cache = new RedisCache({
  url: `redis://${config.ai.cache.host}:${config.ai.cache.port}`,
  ttl: config.ai.cache.ttl,
  maxSize: config.ai.cache.maxSize,
  logging: {
    level: config.ai.logging.level,
    file: {
      path: config.ai.logging.file.path,
    },
  },
});

// Inicialização do serviço AI
const aiService = new GeminiAIService(
  {
    apiKey: config.ai.apiKey,
    modelName: config.ai.model,
    logging: {
      level: config.ai.logging.level,
      file: {
        path: config.ai.logging.file.path,
      },
    },
  },
  cache
);

// Exporta o serviço AI
export { aiService }; 