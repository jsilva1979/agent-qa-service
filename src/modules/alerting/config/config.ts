export const config = {
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
    canal: process.env.SLACK_CHANNEL || '#alertas',
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      file: {
        path: process.env.LOG_FILE_PATH || 'logs/alerting.log',
      },
    },
  },
  retry: {
    maxAttempts: 3,
    delay: 1000, // ms
  },
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000, // 1 minuto
  },
}; 