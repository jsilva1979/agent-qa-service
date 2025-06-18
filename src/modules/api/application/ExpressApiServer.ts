import express, { Request, Response } from 'express';
import { IApiServer } from '../domain/ports/IApiServer';
import { LogEntry } from '../../log-analysis/domain/entities/LogEntry';
import { Logger } from 'winston';

export class ExpressApiServer implements IApiServer {
  private app: express.Application;
  private server: any;

  constructor(
    private readonly logger: Logger
  ) {
    this.app = express();
    this.configurarRotas();
  }

  private configurarRotas(): void {
    this.app.use(express.json());

    // Rota de health check
    this.app.get('/health', async (req: Request, res: Response) => {
      try {
        const status = await this.obterStatus();
        res.json(status);
      } catch (error) {
        this.logger.error('Erro ao obter status', { error });
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    // Rota para registrar logs
    this.app.post('/logs', async (req: Request, res: Response) => {
      try {
        const logEntry = req.body as LogEntry;
        await this.registrarLog(logEntry);
        res.status(201).json({ message: 'Log registrado com sucesso' });
      } catch (error) {
        this.logger.error('Erro ao registrar log', { error });
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    // Middleware de tratamento de erros
    this.app.use((err: Error, req: Request, res: Response, next: Function) => {
      this.logger.error('Erro não tratado', { error: err });
      res.status(500).json({ error: 'Erro interno do servidor' });
    });
  }

  async iniciar(port: number): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        this.logger.info(`Servidor API iniciado na porta ${port}`);
        resolve();
      });
    });
  }

  async parar(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err: Error) => {
          if (err) {
            this.logger.error('Erro ao parar servidor', { error: err });
            reject(err);
            return;
          }
          this.logger.info('Servidor API parado');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  async registrarLog(logEntry: LogEntry): Promise<void> {
    this.logger.info('Registrando novo log', { logEntry });
  }

  async obterStatus(): Promise<{
    status: 'online' | 'offline';
    servicos: {
      nome: string;
      status: 'online' | 'offline';
      metricas?: {
        cpu: number;
        memoria: number;
        pods: number;
      };
    }[];
  }> {
    return {
      status: 'online',
      servicos: [
        {
          nome: 'api',
          status: 'online',
          metricas: {
            cpu: 0,
            memoria: 0,
            pods: 1
          }
        }
      ]
    };
  }
} 