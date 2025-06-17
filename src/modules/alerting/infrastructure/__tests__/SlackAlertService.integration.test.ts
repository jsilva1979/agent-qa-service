import 'dotenv/config';
import { SlackAlertService } from '../SlackAlertService';
import { Alerta } from '../../domain/Alerta';
import { AnaliseErro } from '../../../ai-prompting/domain/AnaliseErro';
import { CodeContext } from '../../../github-access/domain/CodeContext';

describe('SlackAlertService Integration', () => {
  let slackService: SlackAlertService;

  beforeAll(() => {
    slackService = new SlackAlertService({
      accessToken: process.env.SLACK_ACCESS_TOKEN as string,
      refreshToken: process.env.SLACK_REFRESH_TOKEN as string,
      channel: process.env.SLACK_CHANNEL as string,
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: {
          path: 'logs/slack.log',
        },
      },
      jira: {
        url: process.env.JIRA_URL as string,
      },
    });
  });

  it('deve enviar um alerta de teste para o Slack', async () => {
    const alerta: Alerta = {
      servico: 'servico-teste',
      erro: {
        tipo: 'ReferenceError',
        mensagem: 'y is not defined'
      },
      codigo: {
        arquivo: 'index.ts',
        linha: 10,
        codigo: 'const x = y + 1;',
        repositorio: 'repo/teste',
        branch: 'main',
        url: 'https://github.com/teste/repo/blob/main/index.ts#L10'
      },
      analise: {
        causa: 'Variável y não foi definida',
        verificacoesAusentes: ['Verificação de variável definida'],
        sugestaoCorrecao: 'Defina a variável y antes de usá-la',
        explicacao: 'O erro ocorre porque y não foi inicializada.',
        nivelConfianca: 95
      },
      timestamp: new Date().toISOString(),
      nivel: 'error'
    };

    const alertPayload = {
      timestamp: new Date(alerta.timestamp),
      type: alerta.nivel === 'critical' ? 'error' : alerta.nivel,
      title: `Alerta de ${alerta.servico}: ${alerta.erro.tipo}`,
      message: alerta.erro.mensagem,
      details: {
        error: {
          type: alerta.erro.tipo,
          message: alerta.erro.mensagem,
          stackTrace: alerta.erro.stacktrace,
          context: {
            codigo: alerta.codigo,
            analise: alerta.analise,
          },
        },
      },
    };

    const result = await slackService.sendAlert(alertPayload);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  }, 10000);
}); 