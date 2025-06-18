import express from 'express';
import cors from 'cors';
import { LogRoutes } from './routes/LogRoutes';
import { IGitHubRepository } from '../github-access/domain/ports/IGitHubRepository';
import { IAIService } from '../ai-prompting/domain/ports/IAIService';
import { IAlertService } from '../alerting/domain/ports/IAlertService';
import { IDocumentationService } from '../documentation/domain/ports/IDocumentationService';
import { IApiServer } from './domain/ports/IApiServer';
import { LogEntry } from '../log-analysis/domain/entities/LogEntry';

export class Server implements IApiServer {
  private app: express.Application;
  private port: number;
  private server: any;

  constructor(
    port: number,
    gitHubRepository: IGitHubRepository,
    aiService: IAIService,
    alertService: IAlertService,
    documentationService: IDocumentationService
  ) {
    this.app = express();
    this.port = port;
    this.setupMiddleware();
    this.setupRoutes(gitHubRepository, aiService, alertService, documentationService);
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private setupRoutes(
    gitHubRepository: IGitHubRepository,
    aiService: IAIService,
    alertService: IAlertService,
    documentationService: IDocumentationService
  ): void {
    const logRoutes = new LogRoutes(
      gitHubRepository,
      aiService,
      alertService,
      documentationService
    );
    this.app.use('/api', logRoutes.getRouter());
  }

  public async iniciar(port: number): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        console.log(`Servidor rodando na porta ${port}`);
        resolve();
      });
    });
  }

  public async parar(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err: Error) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  public async registrarLog(logEntry: LogEntry): Promise<void> {
    // Implementação do registro de log
    console.log('Log registrado:', logEntry);
  }

  public async obterStatus(): Promise<{
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

  // Método de compatibilidade com código existente
  public start(): void {
    this.iniciar(this.port);
  }
} 