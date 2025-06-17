import { IGitHubRepository } from '../../github-access/domain/ports/IGitHubRepository';
import { IAIService, AnalysisData } from '../../ai-prompting/domain/ports/IAIService';
import { IAlertService, Alert } from '../../alerting/domain/ports/IAlertService';
import { IDocumentationService, TechnicalInsight } from '../../documentation/domain/ports/IDocumentationService';
import { CodeContext } from '../../github-access/domain/CodeContext';
import { AnaliseIA } from '../../ai-prompting/domain/entities/AnaliseIA';

export class LogEventHandler {
  constructor(
    private readonly gitHubRepository: IGitHubRepository,
    private readonly aiService: IAIService,
    private readonly alertService: IAlertService,
    private readonly documentationService: IDocumentationService
  ) {}

  async handle(logEvent: {
    servico: string;
    arquivo: string;
    linha: number;
    erro: {
      tipo: string;
      mensagem: string;
      stacktrace?: string;
    };
  }): Promise<void> {
    try {
      // 1. Extrair contexto do código do GitHub
      const codeContext: CodeContext = await this.gitHubRepository.obterContextoCodigo(
        logEvent.servico,
        logEvent.arquivo,
        logEvent.linha
      );

      // 2. Analisar o erro com a IA
      const analysisData: AnalysisData = {
        code: codeContext.codigo,
        error: {
          type: logEvent.erro.tipo,
          message: logEvent.erro.mensagem,
          stackTrace: logEvent.erro.stacktrace,
        },
      };
      const analiseIA: AnaliseIA = await this.aiService.analyzeError(analysisData);

      // 3. Enviar alerta no Slack
      const alertDetailsError: Alert['details']['error'] = {
        type: logEvent.erro.tipo,
        message: logEvent.erro.mensagem,
        stackTrace: logEvent.erro.stacktrace,
        context: {
          codigo: codeContext,
          analise: analiseIA,
        },
      };

      const newAlert: Omit<Alert, 'id' | 'metadata'> = {
        timestamp: new Date(),
        type: 'error',
        title: `Alerta de ${logEvent.servico}: ${logEvent.erro.tipo}`,
        message: logEvent.erro.mensagem,
        details: {
          error: alertDetailsError,
        },
      };
      await this.alertService.sendAlert(newAlert);

      // 4. Criar insight técnico no Confluence
      const technicalInsight: TechnicalInsight = {
        title: `Erro em ${logEvent.servico}: ${logEvent.erro.tipo}`,
        description: `Erro ocorrido no serviço ${logEvent.servico}: ${logEvent.erro.mensagem}`,
        service: logEvent.servico,
        error: {
          type: logEvent.erro.tipo,
          message: logEvent.erro.mensagem,
          stackTrace: logEvent.erro.stacktrace,
        },
        code: codeContext,
        analysis: analiseIA,
        recommendations: analiseIA.resultado.sugestoes,
        occurrenceDate: new Date().toISOString(),
        status: 'pending',
        solution: analiseIA.resultado.sugestoes.join('\n'),
        preventiveMeasures: analiseIA.resultado.tags,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          author: 'Sistema',
          status: 'draft',
          tags: analiseIA.resultado.tags,
          references: []
        }
      };
      await this.documentationService.createInsight(technicalInsight);
    } catch (error) {
      console.error('Erro ao processar evento de log:', error);
      throw error;
    }
  }
} 