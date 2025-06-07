export const config = {
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost',
    queueName: process.env.RABBITMQ_QUEUE || 'logs-queue'
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },
  logAnalysis: {
    // Configurações de parsing
    parsing: {
      // Padrões de regex para extrair informações de logs
      patterns: {
        error: /^([A-Za-z]+Error|Exception):/,
        stackTrace: /at\s+.*\s+\(([^:]+):(\d+):(\d+)\)/,
        method: /at\s+([^(]+)\s+\(/,
      },

      // Configurações de fallback
      fallback: {
        arquivo: 'desconhecido',
        linha: 0,
        erro: 'UnknownError',
      },
    },

    // Configurações de cache
    cache: {
      enabled: true,
      ttl: 3600, // 1 hora em segundos
      maxSize: 1000, // máximo de entradas no cache
    },

    // Configurações de logging
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      file: {
        enabled: true,
        path: 'logs/log-analysis.log',
      },
    },

    // Configurações de retry
    retry: {
      maxAttempts: 3,
      delay: 1000, // 1 segundo
    },
  },
}; 