import { WebClient } from '@slack/web-api';
import { GeminiAIService } from '../application/GeminiAIService';
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
    const aiService = new GeminiAIService({
      apiKey: process.env.GEMINI_API_KEY || '',
      modelName: 'gemini-2.0-flash',
      logging: {
        level: 'info',
        file: {
          path: 'logs/ai-service.log'
        }
      }
    });

    // Simula uma análise de código
    const analise: AnalyzeAI = {
      id: 'test-id',
      timestamp: new Date(),
      erro: {
        tipo: 'TypeError',
        mensagem: 'Cannot read property of undefined',
        stackTrace: 'Error: Cannot read property of undefined\nat test.ts:42',
        contexto: {
          arquivo: 'test.ts',
          linha: 42,
          codigo: 'const result = obj.property;'
        }
      },
      resultado: {
        causaRaiz: 'Tentativa de acessar propriedade de objeto undefined',
        sugestoes: [
          'Adicionar verificação de null/undefined antes de acessar a propriedade',
          'Usar optional chaining (obj?.property)',
          'Inicializar o objeto antes de acessá-lo'
        ],
        nivelConfianca: 0.95,
        categoria: 'error',
        tags: ['javascript', 'type-error', 'undefined'],
        referencias: ['https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cant_access_property']
      },
      metadados: {
        modelo: 'Gemini',
        versao: 'gemini-2.0-flash',
        tempoProcessamento: 150,
        tokensUtilizados: 75
      }
    };

    const mensagemSlack = {
      channel: SLACK_CHANNEL,
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
            text: `*Erro:* ${analise.erro.tipo}\n*Mensagem:* ${analise.erro.mensagem}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Causa Raiz:*\n${analise.resultado.causaRaiz}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Sugestões de Correção:*\n${analise.resultado.sugestoes.map(s => `• ${s}`).join('\n')}`
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*Nível de Confiança:* ${analise.resultado.nivelConfianca * 100}%`
            },
            {
              type: 'mrkdwn',
              text: `*Categoria:* ${analise.resultado.categoria}`
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
              text: `*Tags:* ${analise.resultado.tags.join(', ')}`
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
    const aiService = new GeminiAIService({
      apiKey: process.env.GEMINI_API_KEY || '',
      modelName: 'gemini-2.0-flash',
      logging: {
        level: 'info',
        file: {
          path: 'logs/ai-service.log'
        }
      }
    });

    // Simula uma análise de erro em produção
    const analise: AnalyzeAI = {
      id: 'prod-error-id',
      timestamp: new Date(),
      erro: {
        tipo: 'Error',
        mensagem: 'Failed to connect to database',
        stackTrace: 'Error: Failed to connect to database\nat db.ts:123',
        contexto: {
          ambiente: 'production',
          servico: 'api-gateway',
          versao: '1.2.3',
          timestamp: new Date().toISOString()
        }
      },
      resultado: {
        causaRaiz: 'Timeout na conexão com o banco de dados',
        sugestoes: [
          'Verificar se o banco de dados está online',
          'Verificar configurações de rede e firewall',
          'Aumentar timeout da conexão',
          'Implementar retry com backoff exponencial'
        ],
        nivelConfianca: 0.9,
        categoria: 'critical',
        tags: ['database', 'connection', 'production'],
        referencias: ['https://docs.mongodb.com/manual/administration/production-notes/']
      },
      metadados: {
        modelo: 'Gemini',
        versao: 'gemini-2.0-flash',
        tempoProcessamento: 200,
        tokensUtilizados: 100
      }
    };

    const mensagemSlack = {
      channel: SLACK_CHANNEL,
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
            text: `*Erro:* ${analise.erro.tipo}\n*Mensagem:* ${analise.erro.mensagem}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Causa Raiz:*\n${analise.resultado.causaRaiz}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Sugestões de Correção:*\n${analise.resultado.sugestoes.map(s => `• ${s}`).join('\n')}`
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*Nível de Confiança:* ${analise.resultado.nivelConfianca * 100}%`
            },
            {
              type: 'mrkdwn',
              text: `*Categoria:* ${analise.resultado.categoria}`
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
              text: `*Tags:* ${analise.resultado.tags.join(', ')}`
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