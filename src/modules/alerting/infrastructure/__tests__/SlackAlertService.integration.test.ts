import 'dotenv/config';
import { SlackAlertService } from '../SlackAlertService';
import { Alerta } from '../../domain/Alerta';
import { AnaliseErro } from '../../../ai-prompting/domain/AnaliseErro';
import { CodeContext } from '../../../github-access/domain/CodeContext';

describe('SlackAlertService Integration', () => {
  let slackService: SlackAlertService;

  beforeAll(() => {
    slackService = new SlackAlertService();
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

    await expect(slackService.enviarAlerta(alerta)).resolves.toBeUndefined();
  }, 10000);
}); 