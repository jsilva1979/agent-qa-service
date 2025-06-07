import { IOrchestrator } from '../domain/ports/IOrchestrator';
import { LogEntry } from '../../log-analysis/domain/entities/LogEntry';
import { InsightTecnico, InsightTecnicoEntity } from '../../documentation/domain/entities/InsightTecnico';
import { Logger } from 'winston';
import { ILogAnalysisService } from '../../log-analysis/domain/ports/ILogAnalysisService';
import { IGitHubService } from '../../github-access/domain/ports/IGitHubService';
import { IAIService } from '../../ai-prompting/domain/ports/IAIService';
import { IAlertService } from '../../alerting/domain/ports/IAlertService';
import { IDocumentationService } from '../../documentation/domain/ports/IDocumentationService';
import { IScalingService } from '../../scaling/domain/ports/IScalingService';
import { AnaliseIA } from '../../ai-prompting/domain/entities/AnaliseIA';

export class Orchestrator implements IOrchestrator {
  constructor(
    private readonly logAnalysisService: ILogAnalysisService,
    private readonly gitHubService: IGitHubService,
    private readonly aiService: IAIService,
    private readonly alertService: IAlertService,
    private readonly documentationService: IDocumentationService,
    private readonly scalingService: IScalingService,
    private readonly logger: Logger
  ) {}

  async processarLog(logEntry: LogEntry): Promise<void> {
    try {
      this.logger.info('Iniciando processamento de log', { logEntry });

      // 1. Analisa o log
      const analise = await this.logAnalysisService.analisarLog(logEntry);
      
      // 2. Busca código no GitHub
      const codigo = await this.gitHubService.obterCodigo(
        analise.repositorio,
        analise.arquivo,
        analise.linha
      );

      // 3. Analisa com IA
      const analiseIA = await this.aiService.analyzeError({
        code: codigo.conteudo,
        error: {
          type: analise.erro,
          message: analise.contexto.stackTrace || '',
          stackTrace: analise.contexto.stackTrace,
          context: analise.contexto
        },
        context: analise.contexto
      });

      // 4. Envia alerta
      await this.alertService.sendErrorAlert(
        {
          type: analise.erro,
          message: analise.contexto.stackTrace || '',
          stackTrace: analise.contexto.stackTrace,
          context: analise.contexto
        },
        analiseIA
      );

      // 5. Cria insight técnico
      const insight = InsightTecnicoEntity.create({
        servico: analise.servico,
        erro: {
          tipo: analise.erro,
          mensagem: analise.contexto.stackTrace || '',
          stackTrace: analise.contexto.stackTrace
        },
        arquivo: analise.arquivo,
        linha: analise.linha,
        sugestao: analiseIA.resultado.causaRaiz,
        contexto: analise.contexto
      });

      await this.publicarInsight(insight);

      this.logger.info('Processamento de log concluído com sucesso');
    } catch (error) {
      this.logger.error('Erro ao processar log', { error, logEntry });
      throw error;
    }
  }

  async verificarSaudeSistema(): Promise<void> {
    try {
      this.logger.info('Verificando saúde do sistema');

      // Verifica disponibilidade dos serviços
      const disponibilidade = await this.scalingService.checkAvailability();
      
      if (!disponibilidade) {
        this.logger.warn('Serviço não está disponível');
        await this.alertService.sendAlert({
          timestamp: new Date(),
          type: 'error',
          title: 'Serviço indisponível',
          message: 'O serviço de escalabilidade está indisponível',
          details: {
            error: {
              type: 'Indisponibilidade',
              message: 'Serviço de escalabilidade não está respondendo'
            }
          }
        });
      }

      // Obtém métricas
      const metricas = await this.scalingService.getMetrics('sistema');
      
      // Se necessário, escala o serviço
      if (metricas.cpuUsage > 80 || metricas.memoryUsage > 80) {
        await this.scalingService.scaleService('sistema', metricas.desiredPods + 1);
      }

      this.logger.info('Verificação de saúde concluída');
    } catch (error) {
      this.logger.error('Erro ao verificar saúde do sistema', { error });
      throw error;
    }
  }

  async publicarInsight(insight: InsightTecnico): Promise<void> {
    try {
      this.logger.info('Publicando insight técnico', { insight });
      const analiseIA: AnaliseIA = {
        id: insight.id,
        timestamp: insight.timestamp,
        erro: {
          tipo: insight.erro.tipo,
          mensagem: insight.erro.mensagem,
          stackTrace: insight.erro.stackTrace,
          contexto: insight.contexto
        },
        resultado: {
          causaRaiz: insight.sugestao,
          sugestoes: [],
          nivelConfianca: 1,
          categoria: 'erro',
          tags: insight.metadados.tags,
          referencias: []
        },
        metadados: {
          modelo: 'gemini-2.0-flash',
          versao: insight.metadados.versao,
          tempoProcessamento: 0,
          tokensUtilizados: 0
        }
      };
      await this.documentationService.createDocument(analiseIA);
      this.logger.info('Insight técnico publicado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao publicar insight técnico', { error, insight });
      throw error;
    }
  }

  async iniciar(): Promise<void> {
    try {
      this.logger.info('Iniciando orquestrador');
      // Inicializa serviços necessários
      await this.logAnalysisService.iniciar();
      await this.scalingService.checkAvailability();
      this.logger.info('Orquestrador iniciado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao iniciar orquestrador', { error });
      throw error;
    }
  }

  async parar(): Promise<void> {
    try {
      this.logger.info('Parando orquestrador');
      // Limpa recursos e para serviços
      await this.logAnalysisService.parar();
      this.logger.info('Orquestrador parado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao parar orquestrador', { error });
      throw error;
    }
  }
} 