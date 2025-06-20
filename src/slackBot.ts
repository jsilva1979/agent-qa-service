import { App } from '@slack/bolt';
import dotenv from 'dotenv';
import winston from 'winston';
import { pool } from './shared/config/database';
import { redis } from './shared/config/redis';
import { RedisCache } from './shared/infra/cache/RedisCache';
import { GeminiServiceAdapter } from './modules/ai-prompting/infra/adapters/GeminiServiceAdapter';
import { GeminiAIService } from './modules/ai-prompting/application/GeminiAIService';
import { ErrorAnalysisService } from './modules/advanced-features/application/services/ErrorAnalysisService';
import { AutoEscalationService } from './modules/advanced-features/application/services/AutoEscalationService';
import { SmartApprovalService } from './modules/advanced-features/application/services/SmartApprovalService';
import { ActionHistory } from './modules/advanced-features/domain/entities/ActionHistory';
import { createIssueForUser } from './shared/services/jiraIntegrationExample';
import { ErrorClassification, ImpactLevel } from './modules/advanced-features/domain/entities/ErrorClassification';

// Carregar variáveis de ambiente
dotenv.config();

// Configurar logger
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/slack-alerts.log' })
  ],
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

// Inicializar serviços
const cache = new RedisCache(redis);
const geminiServiceAdapter = new GeminiServiceAdapter(
  logger,
  process.env.GEMINI_API_KEY || '',
  'gemini-2.0-flash',
  cache
);

const geminiAI = new GeminiAIService(
  {
    apiKey: process.env.GEMINI_API_KEY || '',
    modelName: 'gemini-2.0-flash',
    logging: {
      level: 'debug',
      file: { path: 'logs/gemini.log' },
    },
  },
  geminiServiceAdapter,
  cache
);

const errorAnalysis = new ErrorAnalysisService(geminiAI);
const autoEscalation = new AutoEscalationService(app);
const smartApproval = new SmartApprovalService(app.client);

// Função para salvar histórico de ação
async function logAction(userId: string, data: any) {
  const { actionType, jiraIssueKey, analysisResult } = data;
  await pool.query(
    'INSERT INTO action_history (user_id, action_type, jira_issue_key, analysis_result) VALUES ($1, $2, $3, $4)',
    [userId, actionType, jiraIssueKey, analysisResult]
  );
}

// Handler para o botão inicial de criar incidente
app.action('create_jira_issue', async ({ ack, body, client }) => {
  await ack();
  const userId = (body as any).user.id;
  try {
    const alertId = (body as any).actions[0].value;
    const channelId = (body as any).channel.id;
    const messageTs = (body as any).message.ts;

    const errorDescription = `Alerta de erro identificado pelo agente QA.\nID: ${alertId}`;
    const analysis = await errorAnalysis.analyzeError(errorDescription);

    const classification = new ErrorClassification({
      jiraIssueKey: '',
      errorType: analysis.result.category,
      impactLevel: analysis.result.impact as ImpactLevel,
      aiAnalysis: analysis.result as unknown as Record<string, unknown>,
      recurrenceCount: 1 
    });

    // Esta chamada já atualiza a mensagem para mostrar os botões de aprovação.
    await smartApproval.requestApproval(
      channelId,
      messageTs,
      classification,
      alertId
    );

  } catch (error: any) {
    console.error('Erro ao analisar issue:', error);
    await logAction(userId, {
      actionType: 'ANALYSIS_ERROR',
      analysisResult: { error: error.message }
    });
  }
});

// Handler para aprovação de criação do card
app.action('approve_issue_creation', async ({ ack, body, client }) => {
  await ack();

  const channelId = (body as any).channel.id;
  const messageTs = (body as any).message.ts;

  try {
    const payload = JSON.parse((body as any).actions[0].value);
    const userId = (body as any).user.id;
    
    // O payload já contém a classificação correta. Vamos usá-la.
    const classification = new ErrorClassification(payload.classification);
    
    // Mapear os resultados para os campos do Jira
    const jiraIssueType = mapCategoryToJiraIssueType(classification.errorType);
    const jiraPriority = mapImpactToJiraPriority(classification.impactLevel);
    
    const summary = `[Análise de IA] - Incidente de ${classification.errorType}`;

    const suggestions = (classification.aiAnalysis?.suggestions as string[])?.filter(s => s) || [];
    
    const descriptionADF = {
        type: 'doc',
        version: 1,
        content: [
            {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Causa Raiz (Análise da IA):', marks: [{ type: 'strong' }] }]
            },
            {
                type: 'paragraph',
                content: [{ type: 'text', text: (classification.aiAnalysis?.rootCause as string) || 'Não determinada.' }]
            },
            {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Sugestões de Correção:', marks: [{ type: 'strong' }] }]
            },
            ...(suggestions.length > 0
                ? [{
                    type: 'bulletList',
                    content: suggestions.map(suggestion => ({
                        type: 'listItem',
                        content: [{
                            type: 'paragraph',
                            content: [{ type: 'text', text: suggestion }]
                        }]
                    }))
                }]
                : [{
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Nenhuma sugestão específica fornecida.', marks: [{ type: 'em' }] }]
                }]
            )
        ]
    };

    const issue = await createIssueForUser(
      userId,
      'CQ',
      summary,
      descriptionADF,
      jiraIssueType,
      jiraPriority
    );
    
    // Atualizar a classificação com a chave do Jira
    const finalClassification = new ErrorClassification({
      ...classification.toJSON(),
      jiraIssueKey: issue.key,
    });
    
    await pool.query(
      `INSERT INTO error_classifications (jira_issue_key, error_type, impact_level, recurrence_count, ai_analysis) 
       VALUES ($1, $2, $3, $4, $5)`,
      [finalClassification.jiraIssueKey, finalClassification.errorType, finalClassification.impactLevel, finalClassification.recurrenceCount, finalClassification.aiAnalysis]
    );

    await logAction(userId, {
      actionType: 'CREATE_ISSUE',
      jiraIssueKey: issue.key,
      analysisResult: finalClassification.aiAnalysis
    });

    await autoEscalation.checkAndEscalate(finalClassification);
    
    // Atualizar mensagem no Slack com sucesso
    await client.chat.update({
      channel: channelId,
      ts: messageTs,
      text: `Card ${issue.key} criado com sucesso.`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `✅ *Card criado com sucesso!*\n\n*Jira:* <https://${process.env.JIRA_HOST}/browse/${issue.key}|${issue.key}>\n*Tipo:* ${jiraIssueType}\n*Prioridade:* ${jiraPriority}`,
          },
        },
      ],
    });

  } catch (error: any) {
    console.error('Erro ao criar issue após aprovação:', error);
    await client.chat.postMessage({
      channel: channelId,
      thread_ts: messageTs,
      text: '❌ Ocorreu um erro ao criar o card no Jira. Verifique os logs do sistema para mais detalhes.'
    });
  }
});

// Handler para rejeição de criação do card
app.action('reject_issue_creation', async ({ ack, body, client }) => {
  await ack();
  const userId = (body as any).user.id;
  try {
    const payload = JSON.parse((body as any).actions[0].value);
    const channelId = (body as any).channel.id;
    const messageTs = (body as any).message.ts;

    // Registrar rejeição
    await logAction(userId, {
      actionType: 'REJECT_ISSUE',
      analysisResult: { alertId: payload.alertId }
    });

    // Atualizar mensagem
    await client.chat.update({
      channel: channelId,
      ts: messageTs,
      text: 'Criação de card cancelada',
      blocks: [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '❌ *Criação de card cancelada pelo usuário*'
        }
      }]
    });

  } catch (error: any) {
    console.error('Erro ao rejeitar criação:', error);
  }
});

/**
 * Mapeia o nível de impacto da IA para um nível de prioridade válido no Jira.
 * @param impact O impacto retornado pela IA (LOW, MEDIUM, HIGH, CRITICAL).
 * @returns O nome da prioridade correspondente no Jira.
 */
function mapImpactToJiraPriority(impact: string): string {
  switch (impact.toUpperCase()) {
    case 'CRITICAL':
      return 'Highest';
    case 'HIGH':
      return 'High';
    case 'MEDIUM':
      return 'Medium';
    case 'LOW':
      return 'Low';
    default:
      return 'Medium';
  }
}

/**
 * Mapeia a categoria do erro da IA para um tipo de item válido no Jira.
 * @param category A categoria retornada pela IA.
 * @returns O nome do tipo de item correspondente no Jira.
 */
function mapCategoryToJiraIssueType(category: string): string {
  // Para qualquer categoria retornada pela IA, usamos '[System] Incident',
  // que sabemos ser um tipo de item válido neste projeto específico.
  // Em uma implementação futura, poderíamos ter um mapeamento mais complexo.
  return '[System] Incident';
}

// Regex to detect potential error messages
const errorKeywords = [
  'error', 'exception', 'failed', 'trace', 'stacktrace', 
  'nullpointer', 'unhandled', 'uncaught', 'fatal', 'critical', 'npe'
];
const errorRegex = new RegExp(errorKeywords.join('|'), 'i');

// Handler for messages that look like errors
app.message(errorRegex, async ({ message, say, client }) => {
  // Ignora mensagens do próprio bot para evitar loops
  if (message.subtype || (message as any).bot_id) {
    return;
  }

  try {
    const text = (message as any).text;
    const channelId = (message as any).channel;
    const messageTs = (message as any).ts;

    const initialReply = await say({
      thread_ts: messageTs,
      text: '🔄 Erro detectado! Iniciando análise com IA...',
    });

    const analysis = await errorAnalysis.analyzeError(text);

    const classification = new ErrorClassification({
      jiraIssueKey: '', // Inicialmente vazio
      errorType: analysis.result.category,
      impactLevel: analysis.result.impact as ImpactLevel,
      aiAnalysis: analysis.result as unknown as Record<string, unknown>,
      recurrenceCount: 1 
    });
    
    await smartApproval.requestApproval(
      channelId,
      initialReply.ts!,
      classification, // Passando o objeto correto
      messageTs
    );

  } catch (error) {
    console.error('Erro ao processar mensagem de erro:', error);
    const channelId = (message as any).channel;
    const messageTs = (message as any).ts;
    await client.chat.postMessage({
      channel: channelId,
      thread_ts: messageTs,
      text: '❌ Ocorreu um erro ao analisar a mensagem. Por favor, tente novamente mais tarde.',
    });
  }
});

app.message(async ({ message, say }) => {
  // Ensure we are dealing with a standard text message and not in a thread
  if (message.subtype === undefined && !('thread_ts' in message && message.thread_ts)) {
    await say(`Olá, <@${message.user}>! Você disse: ${message.text}. Como posso ajudar?`);
  }
});

(async () => {
  await app.start();
  console.log('⚡️ Agente de QA está online e ouvindo mensagens!');
})(); 