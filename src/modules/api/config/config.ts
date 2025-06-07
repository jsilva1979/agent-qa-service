export const config = {
  api: {
    // Configurações do servidor
    server: {
      port: process.env.API_PORT || 3000,
      host: process.env.API_HOST || 'localhost',
    },

    // Configurações de segurança
    security: {
      cors: {
        enabled: true,
        origin: process.env.CORS_ORIGIN || '*',
      },
      rateLimit: {
        enabled: true,
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 100, // limite de 100 requisições por windowMs
      },
    },

    // Configurações de logging
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      file: {
        enabled: true,
        path: 'logs/api.log',
      },
    },

    // Configurações de timeout
    timeout: {
      request: 30000, // 30 segundos
      healthCheck: 5000, // 5 segundos
    },
  },
}; 