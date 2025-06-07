import { Router } from 'express';
import { LogEventHandler } from '../../orchestration/handlers/LogEventHandler';
import { IGitHubRepository } from '../../github-access/domain/ports/IGitHubRepository';
import { IAIService } from '../../ai-prompting/domain/ports/IAIService';
import { IAlertService } from '../../alerting/domain/ports/IAlertService';
import { IDocumentationService } from '../../documentation/domain/ports/IDocumentationService';

export class LogRoutes {
  private router: Router;
  private logEventHandler: LogEventHandler;

  constructor(
    gitHubRepository: IGitHubRepository,
    aiService: IAIService,
    alertService: IAlertService,
    documentationService: IDocumentationService
  ) {
    this.router = Router();
    this.logEventHandler = new LogEventHandler(
      gitHubRepository,
      aiService,
      alertService,
      documentationService
    );
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.post('/logs', async (req, res) => {
      try {
        const logEvent = req.body;
        await this.logEventHandler.handle(logEvent);
        res.status(200).json({ message: 'Log processado com sucesso' });
      } catch (error) {
        console.error('Erro ao processar log:', error);
        res.status(500).json({ 
          error: 'Erro ao processar log',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    });

    // Rota de health check
    this.router.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok' });
    });
  }

  public getRouter(): Router {
    return this.router;
  }
} 