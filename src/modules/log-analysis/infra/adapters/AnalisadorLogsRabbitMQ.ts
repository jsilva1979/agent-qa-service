import { IAnalisadorLogs } from '../../domain/ports/IAnalisadorLogs';
import { LogEntry, LogEntryEntity } from '../../domain/entities/LogEntry';
import * as amqp from 'amqplib';
import { Logger } from 'winston';

export class AnalisadorLogsRabbitMQ implements IAnalisadorLogs {
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;

  constructor(
    private readonly rabbitUrl: string,
    private readonly queueName: string,
    private readonly logger: Logger
  ) {}

  async conectar(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.rabbitUrl);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.queueName);
      this.logger.info('Conectado ao RabbitMQ com sucesso');
    } catch (error) {
      this.logger.error('Erro ao conectar ao RabbitMQ:', error);
      throw error;
    }
  }

  async desconectar(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
    } catch (error) {
      this.logger.error('Erro ao desconectar do RabbitMQ:', error);
      throw error;
    }
  }

  async contemErro(logBruto: string): Promise<boolean> {
    // Implementação básica - verifica se contém palavras-chave de erro
    const palavrasChaveErro = ['error', 'exception', 'failed', 'erro', 'falha'];
    return palavrasChaveErro.some(palavra => 
      logBruto.toLowerCase().includes(palavra.toLowerCase())
    );
  }

  async analisar(logBruto: string): Promise<LogEntry> {
    try {
      // Por enquanto retorna uma implementação básica
      // TODO: Implementar lógica mais robusta de parsing de logs
      return LogEntryEntity.create(logBruto);
    } catch (error) {
      this.logger.error('Erro ao analisar log:', error);
      throw error;
    }
  }

  async iniciarConsumo(callback: (log: LogEntry) => Promise<void>): Promise<void> {
    if (!this.channel) {
      throw new Error('Canal RabbitMQ não inicializado');
    }

    await this.channel.consume(this.queueName, async (msg) => {
      if (msg) {
        try {
          const logBruto = msg.content.toString();
          if (await this.contemErro(logBruto)) {
            const logAnalisado = await this.analisar(logBruto);
            await callback(logAnalisado);
          }
          this.channel?.ack(msg);
        } catch (error) {
          this.logger.error('Erro ao processar mensagem:', error);
          this.channel?.nack(msg);
        }
      }
    });
  }
} 