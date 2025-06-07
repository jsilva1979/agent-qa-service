export const config = {
  ai: {
    // Configurações da API do Gemini
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-2.0-flash',

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
      port: parseInt(process.env.REDIS_PORT || '6379'),
      ttl: 3600, // 1 hora em segundos
      maxSize: 1000, // número máximo de itens no cache
    },

    // Configurações de logging
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      file: {
        path: 'logs/ai-service.log',
      },
    },

    // Configurações de retry
    retry: {
      maxAttempts: 3,
      delay: 1000, // 1 segundo
    },

    // Configurações de rate limiting
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000, // 1 minuto
    },
  },
}; 