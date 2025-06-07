import { IGitHubRepository } from '../../github-access/domain/ports/IGitHubRepository';
import { IAIService } from '../../ai-prompting/domain/ports/IAIService';
import { IAlertService } from '../../alerting/domain/ports/IAlertService';
import { IDocumentationService } from '../../documentation/domain/ports/IDocumentationService';
import { CodeContext } from '../../github-access/domain/CodeContext';
import { AnaliseErro } from '../../ai-prompting/domain/AnaliseErro';
import { Alerta } from '../../alerting/domain/Alerta';
import { InsightTecnico } from '../../documentation/domain/InsightTecnico';

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
      const analise: AnaliseErro = await this.aiService.analisarErro(codeContext, logEvent.erro);

      // 3. Enviar alerta no Slack
      const alerta: Alerta = {
        servico: logEvent.servico,
        erro: logEvent.erro,
        codigo: codeContext,
        analise,
        timestamp: new Date().toISOString(),
        nivel: 'error'
      };
      await this.alertService.enviarAlerta(alerta);

      // 4. Criar insight técnico no Confluence
      const insight: InsightTecnico = {
        titulo: `Erro em ${logEvent.servico}: ${logEvent.erro.tipo}`,
        servico: logEvent.servico,
        erro: logEvent.erro,
        codigo: codeContext,
        analise,
        dataOcorrencia: new Date().toISOString(),
        status: 'pendente',
        solucao: analise.sugestaoCorrecao,
        preventivas: analise.verificacoesAusentes
      };
      await this.documentationService.criarInsight(insight);
    } catch (error) {
      console.error('Erro ao processar evento de log:', error);
      throw error;
    }
  }
} 