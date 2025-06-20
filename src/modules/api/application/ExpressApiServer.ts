import express, { Request, Response } from 'express';
import { Logger } from 'winston';

export interface LogEntry {
  // Defina os campos necessários conforme uso real
  [key: string]: unknown;
}

export class ExpressApiServer {
  private app: express.Application;
  private server: import('http').Server | undefined;

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

    // Rota para interações do Slack (botões)
    this.app.post('/slack/interactions', async (req: Request, res: Response) => {
      try {
        // Log detalhado do payload recebido
        console.log('Payload recebido do Slack:', req.body);
        // O Slack envia o payload como application/x-www-form-urlencoded
        const payload = typeof req.body.payload === 'string' ? JSON.parse(req.body.payload) : req.body.payload;
        const action = payload?.actions?.[0];
        const actionId = action?.action_id;
        const alertId = action?.value;

        this.logger.info('Interação recebida do Slack', { actionId, alertId });

        // Buscar detalhes da análise pelo ID (mock)
        // Em produção, buscar do banco/cache
        const analysisDetails = {
          id: alertId,
          summary: 'Resumo da análise de erro',
          logs: ['log1', 'log2'],
          screenshotUrl: 'https://exemplo.com/print.png',
        };

        // Criar card no Jira (mock)
        // Em produção, chamar serviço real
        const jiraIssueKey = 'TM-456';

        // Responder ao Slack (mensagem efêmera para o usuário)
        res.json({
          response_type: 'ephemeral',
          text: `Card criado: ${jiraIssueKey} ✅`,
        });
      } catch (error) {
        this.logger.error('Erro ao processar interação do Slack', { error });
        res.status(500).json({ error: 'Erro ao processar interação do Slack' });
      }
    });

    // Middleware de tratamento de erros
    this.app.use((err: Error, req: Request, res: Response, _next: express.NextFunction) => {
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
        this.server.close((err?: Error | undefined) => {
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