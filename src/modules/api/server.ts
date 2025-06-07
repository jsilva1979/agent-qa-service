import express from 'express';
import cors from 'cors';
import { LogRoutes } from './routes/LogRoutes';
import { IGitHubRepository } from '../github-access/domain/ports/IGitHubRepository';
import { IAIService } from '../ai-prompting/domain/ports/IAIService';
import { IAlertService } from '../alerting/domain/ports/IAlertService';
import { IDocumentationService } from '../documentation/domain/ports/IDocumentationService';

export class Server {
  private app: express.Application;
  private port: number;

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

  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`Servidor rodando na porta ${this.port}`);
    });
  }
} 