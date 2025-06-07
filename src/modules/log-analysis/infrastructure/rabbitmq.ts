import amqp from 'amqplib';
import { Channel, ConsumeMessage, Options } from 'amqplib';
import { setupLogging } from '../../../shared/infrastructure/logging';
import { LogEntry } from '../domain/LogEntry';
import { rabbitMQConfig } from '../config/rabbitmq.config';

const logger = setupLogging();

export class RabbitMQService {
  private connection: any = null;
  private channel: amqp.Channel | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;

  constructor() {
    this.reconnectAttempts = 0;
  }

  /**
   * Inicializa a conexão com o RabbitMQ
   */
  public async initialize(): Promise<void> {
    try {
      await this.connect();
      await this.setupChannel();
      await this.setupQueue();
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info('Conexão com RabbitMQ estabelecida com sucesso');
    } catch (error) {
      logger.error('Erro ao inicializar RabbitMQ:', error);
      await this.handleConnectionError();
    }
  }

  /**
   * Estabelece conexão com o RabbitMQ
   */
  private async connect(): Promise<void> {
    try {
      const options: Options.Connect = {
        heartbeat: 60
      };
      this.connection = (await amqp.connect(rabbitMQConfig.url, options)) as unknown as ReturnType<typeof amqp.connect> extends Promise<infer T> ? T : never;
      
      if (this.connection) {
        this.connection.on('error', async (error: Error) => {
          logger.error('Erro na conexão RabbitMQ:', error);
          await this.handleConnectionError();
        });

        this.connection.on('close', async () => {
          logger.warn('Conexão RabbitMQ fechada');
          this.isConnected = false;
          await this.handleConnectionError();
        });
      }
    } catch (error) {
      logger.error('Falha ao conectar ao RabbitMQ:', error);
      throw error;
    }
  }

  /**
   * Configura o canal de comunicação
   */
  private async setupChannel(): Promise<void> {
    if (!this.connection) {
      throw new Error('Conexão não inicializada');
    }
    this.channel = await this.connection.createChannel();
  }

  /**
   * Configura a fila de mensagens
   */
  private async setupQueue(): Promise<void> {
    if (!this.channel) {
      throw new Error('Canal não inicializado');
    }

    await this.channel.assertQueue(rabbitMQConfig.queueName, rabbitMQConfig.queueOptions);
  }

  /**
   * Inicia o consumo de mensagens
   */
  public async startConsuming(processMessage: (logEntry: LogEntry) => Promise<void>): Promise<void> {
    if (!this.channel) {
      throw new Error('Canal não inicializado');
    }

    await this.channel.consume(rabbitMQConfig.queueName, async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const logEntry: LogEntry = JSON.parse(msg.content.toString());
        await processMessage(logEntry);
        this.channel?.ack(msg);
      } catch (error) {
        logger.error('Erro ao processar mensagem:', error);
        // Rejeita a mensagem e reencaminha para a fila
        this.channel?.nack(msg, false, true);
      }
    });

    logger.info(`Consumidor iniciado na fila: ${rabbitMQConfig.queueName}`);
  }

  /**
   * Trata erros de conexão e tenta reconectar
   */
  private async handleConnectionError(): Promise<void> {
    if (this.reconnectAttempts >= rabbitMQConfig.maxReconnectAttempts) {
      logger.error('Número máximo de tentativas de reconexão atingido');
      return;
    }

    this.reconnectAttempts++;
    logger.info(`Tentativa de reconexão ${this.reconnectAttempts}/${rabbitMQConfig.maxReconnectAttempts}`);

    setTimeout(async () => {
      try {
        await this.initialize();
      } catch (error) {
        logger.error('Falha na tentativa de reconexão:', error);
      }
    }, rabbitMQConfig.reconnectDelay);
  }

  /**
   * Fecha a conexão com o RabbitMQ
   */
  public async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      logger.info('Conexão com RabbitMQ fechada com sucesso');
    } catch (error) {
      logger.error('Erro ao fechar conexão com RabbitMQ:', error);
      throw error;
    }
  }

  /**
   * Verifica se a conexão está ativa
   */
  public isConnectionActive(): boolean {
    return this.isConnected;
  }
}

// Exporta uma instância única do serviço
export const rabbitMQService = new RabbitMQService(); 