import { createClient, RedisClientType } from 'redis';
import { ICache } from '../../domain/ports/ICache';
import { AnalysisData } from '../../domain/ports/IAIService';
import { AnaliseIA } from '../../domain/entities/AnaliseIA';
import winston from 'winston';

interface RedisConfig {
  url: string;
  ttl: number;
  maxSize: number;
  logging: {
    level: string;
    file: {
      path: string;
    };
  };
}

export class RedisCache implements ICache {
  private client: RedisClientType;
  private logger: winston.Logger;

  constructor(private readonly config: RedisConfig) {
    this.client = createClient({
      url: config.url,
    });

    this.logger = winston.createLogger({
      level: config.logging.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: config.logging.file.path,
          level: 'error',
        }),
      ],
    });

    this.client.on('error', (error: Error) => {
      this.logger.error('Erro na conexão com Redis:', error);
    });

    this.client.connect().catch((error: Error) => {
      this.logger.error('Erro ao conectar ao Redis:', error);
    });
  }

  private gerarChave(data: AnalysisData): string {
    return `analise:${data.error.type}:${data.error.message}`;
  }

  async get(data: AnalysisData): Promise<AnaliseIA | null> {
    try {
      const chave = this.gerarChave(data);
      const valor = await this.client.get(chave);
      
      if (valor) {
        this.logger.info('Cache hit para análise:', { chave });
        return JSON.parse(valor) as AnaliseIA;
      }
      
      return null;
    } catch (error) {
      this.logger.error('Erro ao obter do cache:', error);
      return null;
    }
  }

  async set(data: AnalysisData, analise: AnaliseIA): Promise<void> {
    try {
      const chave = this.gerarChave(data);
      await this.client.set(chave, JSON.stringify(analise), {
        EX: this.config.ttl,
      });
      this.logger.info('Análise armazenada no cache:', { chave });
    } catch (error) {
      this.logger.error('Erro ao armazenar no cache:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.client.flushAll();
      this.logger.info('Cache limpo com sucesso');
    } catch (error) {
      this.logger.error('Erro ao limpar cache:', error);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      this.logger.info('Conexão com Redis encerrada');
    } catch (error) {
      this.logger.error('Erro ao encerrar conexão com Redis:', error);
    }
  }
} 