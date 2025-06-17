import dotenv from 'dotenv';

dotenv.config();

export const config = {
  ai: {
    // Configurações da API do Gemini
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',

    // Configurações de prompt
    prompt: {
      // Número máximo de tokens no prompt
      maxTokens: 1000,
      // Temperatura da geração (0-1)
      temperatura: 0.7,
      // Número máximo de tentativas
      maxTentativas: 3,
    },

    // Configurações de cache
    cache: {
      enabled: true,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      ttl: parseInt(process.env.CACHE_TTL || '3600', 10), // 1 hora em segundos
      maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000', 10),
    },

    // Configurações de logging
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      file: {
        path: process.env.LOG_FILE_PATH || 'logs/ai-service.log',
      },
    },

    // Configurações de retry
    retry: {
      maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
      initialDelay: parseInt(process.env.INITIAL_RETRY_DELAY || '1000', 10),
      maxDelay: parseInt(process.env.MAX_RETRY_DELAY || '10000', 10),
      backoffFactor: parseFloat(process.env.RETRY_BACKOFF_FACTOR || '2'),
    },

    // Configurações de rate limiting
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000, // 1 minuto
    },
  },
} as const;

// Validação da configuração
if (!config.ai.apiKey) {
  throw new Error('GEMINI_API_KEY não configurada');
}

if (!config.ai.model) {
  throw new Error('GEMINI_MODEL não configurado');
} 