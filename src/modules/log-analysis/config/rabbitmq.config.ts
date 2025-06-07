export const rabbitMQConfig = {
  url: process.env.RABBITMQ_URL || 'amqp://localhost',
  queueName: process.env.RABBITMQ_QUEUE_NAME || 'log-analysis',
  maxReconnectAttempts: Number(process.env.RABBITMQ_MAX_RECONNECT_ATTEMPTS) || 5,
  reconnectDelay: Number(process.env.RABBITMQ_RECONNECT_DELAY) || 5000,
  queueOptions: {
    durable: true,
    arguments: {
      'x-message-ttl': Number(process.env.RABBITMQ_MESSAGE_TTL) || 86400000, // 24 horas em milissegundos
      'x-max-length': Number(process.env.RABBITMQ_MAX_QUEUE_LENGTH) || 10000,
    },
  },
}; 