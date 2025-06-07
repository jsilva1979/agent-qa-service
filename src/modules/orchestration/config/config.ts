export const config = {
  orchestrator: {
    // Intervalo em milissegundos para verificação de saúde do sistema
    healthCheckInterval: 60000, // 1 minuto
    
    // Configurações de retry
    retry: {
      maxAttempts: 3,
      delay: 1000, // 1 segundo
    },

    // Configurações de timeout
    timeout: {
      default: 30000, // 30 segundos
      healthCheck: 10000, // 10 segundos
    },

    // Configurações de logging
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      file: {
        enabled: true,
        path: 'logs/orchestrator.log',
      },
    },
  },
}; 