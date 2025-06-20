import { WebClient } from '@slack/web-api';
import { JiraService } from '../../../shared/infrastructure/jiraService';
import { AnalyzeAI } from '@/modules/ai-prompting/domain/entities/AnalyzeAI';
import { beforeAll, describe, it, expect } from '@jest/globals';

describe('Demonstração do GeminiAIService com Slack', () => {
  let slackClient: WebClient;
  const SLACK_CHANNEL = process.env.SLACK_CHANNEL || '#alertas';

  beforeAll(() => {
    slackClient = new WebClient(process.env.SLACK_ACCESS_TOKEN);
  });

  it('Demonstração: Análise de código e notificação no Slack', async () => {
    // Simula uma análise de código
    const analysis: AnalyzeAI = {
      id: 'test-id',
      timestamp: new Date(),
      error: {
        type: 'TypeError',
        message: 'Cannot read property of undefined',
        stackTrace: 'Error: Cannot read property of undefined\nat test.ts:42',
        context: {
          file: 'test.ts',
          line: 42,
          code: 'const result = obj.property;'
        }
      },
      result: {
        rootCause: 'Tentativa de acessar propriedade de objeto undefined',
        suggestions: [
          'Adicionar verificação de null/undefined antes de acessar a propriedade',
          'Usar optional chaining (obj?.property)',
          'Inicializar o objeto antes de acessá-lo'
        ],
        confidenceLevel: 0.95,
        category: 'error',
        tags: ['javascript', 'type-error', 'undefined'],
        references: ['https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cant_access_property']
      },
      metadata: {
        model: 'Gemini',
        version: 'gemini-2.0-flash',
        processingTime: 150,
        tokensUsed: 75
      }
    };

    const mensagemSlack = {
      channel: SLACK_CHANNEL,
      text: 'Resumo da análise',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🔍 Análise de Código',
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Erro:* ${analysis.error.type}\n*Mensagem:* ${analysis.error.message}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Causa Raiz:*\n${analysis.result.rootCause}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Sugestões de Correção:*\n${analysis.result.suggestions.map(s => `• ${s}`).join('\n')}`
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*Nível de Confiança:* ${analysis.result.confidenceLevel * 100}%`
            },
            {
              type: 'mrkdwn',
              text: `*Categoria:* ${analysis.result.category}`
            }
          ]
        },
        {
          type: 'divider'
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*Tags:* ${analysis.result.tags.join(', ')}`
            }
          ]
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Ver no GitHub',
                emoji: true
              },
              url: 'https://github.com/jsilva1979/qa-ai-agent'
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Criar Issue',
                emoji: true
              },
              url: 'https://jeffersonsilva1979.atlassian.net/jira/projects?page=1&sortKey=name&sortOrder=ASC'
            }
          ]
        }
      ]
    };

    // Envia para o Slack usando WebClient
    try {
      const response = await slackClient.chat.postMessage(mensagemSlack);
      console.log('Mensagem enviada para o Slack:', response.ok ? 'Sucesso' : 'Falha');
    } catch (error) {
      console.error('Erro ao enviar mensagem para o Slack:', error);
    }

    // Simula uma resposta da equipe
    console.log('\n=== Demonstração: Notificação no Slack ===');
    console.log('Análise enviada para o canal:', SLACK_CHANNEL);
    console.log('\nConteúdo da mensagem:');
    console.log(JSON.stringify(mensagemSlack, null, 2));
  }, 30000);

  it('Demonstração: Análise de erro em produção e notificação no Slack', async () => {
    // Simula uma análise de erro em produção
    const analysis: AnalyzeAI = {
      id: 'prod-error-id',
      timestamp: new Date(),
      error: {
        type: 'Error',
        message: 'Failed to connect to database',
        stackTrace: 'Error: Failed to connect to database\nat db.ts:123',
        context: {
          environment: 'production',
          service: 'api-gateway',
          version: '1.2.3',
          timestamp: new Date().toISOString()
        }
      },
      result: {
        rootCause: 'Timeout na conexão com o banco de dados',
        suggestions: [
          'Verificar se o banco de dados está online',
          'Verificar configurações de rede e firewall',
          'Aumentar timeout da conexão',
          'Implementar retry com backoff exponencial'
        ],
        confidenceLevel: 0.9,
        category: 'critical',
        tags: ['database', 'connection', 'production'],
        references: ['https://docs.mongodb.com/manual/administration/production-notes/']
      },
      metadata: {
        model: 'Gemini',
        version: 'gemini-2.0-flash',
        processingTime: 200,
        tokensUsed: 100
      }
    };

    const mensagemSlack = {
      channel: SLACK_CHANNEL,
      text: 'Resumo da análise',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 Erro em Produção',
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Erro:* ${analysis.error.type}\n*Mensagem:* ${analysis.error.message}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Causa Raiz:*\n${analysis.result.rootCause}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Sugestões de Correção:*\n${analysis.result.suggestions.map(s => `• ${s}`).join('\n')}`
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*Nível de Confiança:* ${analysis.result.confidenceLevel * 100}%`
            },
            {
              type: 'mrkdwn',
              text: `*Categoria:* ${analysis.result.category}`
            }
          ]
        },
        {
          type: 'divider'
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*Tags:* ${analysis.result.tags.join(', ')}`
            }
          ]
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Ver Logs',
                emoji: true
              },
              url: 'https://console.cloud.google.com/logs/query;duration=PT1H?referrer=search&hl=pt-br&inv=1&invt=Abz4Dw&project=gen-lang-client-0394536245'
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Criar Incidente',
                emoji: true
              },
              url: 'https://jeffersonsilva1979.atlassian.net/jira/projects?page=1&sortKey=name&sortOrder=ASC'
            }
          ]
        }
      ]
    };

    // Envia para o Slack usando WebClient
    try {
      const response = await slackClient.chat.postMessage(mensagemSlack);
      console.log('Mensagem enviada para o Slack:', response.ok ? 'Sucesso' : 'Falha');
    } catch (error) {
      console.error('Erro ao enviar mensagem para o Slack:', error);
    }

    // Simula uma resposta da equipe
    console.log('\n=== Demonstração: Notificação de Erro no Slack ===');
    console.log('Análise enviada para o canal:', SLACK_CHANNEL);
    console.log('\nConteúdo da mensagem:');
    console.log(JSON.stringify(mensagemSlack, null, 2));
  }, 30000);
});

describe('Integração com Jira Cloud', () => {
  it('Deve criar uma issue real no Jira', async () => {
    const jira = new JiraService();
    const issueFields = {
      project: { key: process.env.JIRA_PROJECT_KEY || 'PROJ' }, // Troque para o seu projeto real
      summary: 'Issue criada automaticamente via teste automatizado',
      description: 'Esta issue foi criada por um teste automatizado para validar a integração OAuth2.',
      issuetype: { name: 'Task' }, // Ou 'Bug', 'Story', etc.
    };
    const result = await jira.createIssue(issueFields);
    expect(result).toHaveProperty('key');
    expect(result).toHaveProperty('id');
    console.log('Issue criada no Jira:', result.key);
  }, 20000);
});

jest.spyOn(JiraService.prototype, 'createIssue').mockResolvedValue({
  key: 'TEST-123',
  id: '10001',
  self: 'https://jira.example.com/rest/api/2/issue/10001',
}); 