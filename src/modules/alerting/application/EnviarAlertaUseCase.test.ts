import { EnviarAlertaUseCase } from './EnviarAlertaUseCase';
import { IAlertService } from '../domain/ports/IAlertService';
import { Alerta } from '../domain/Alerta';
import { CodeContext } from '../../github-access/domain/CodeContext';
import { AnaliseErro } from '../../ai-prompting/domain/AnaliseErro';

describe('EnviarAlertaUseCase', () => {
  let useCase: EnviarAlertaUseCase;
  let mockAlertService: jest.Mocked<IAlertService>;

  beforeEach(() => {
    mockAlertService = {
      enviarAlerta: jest.fn(),
    };
    useCase = new EnviarAlertaUseCase(mockAlertService);
  });

  it('deve enviar o alerta corretamente', async () => {
    const mockCodigo: CodeContext = {
      arquivo: 'UserProcessor.java',
      linha: 23,
      codigo: 'public class UserProcessor {\n  private String name;\n}',
      repositorio: 'user-service',
      branch: 'main',
      url: 'https://github.com/user-service/blob/main/UserProcessor.java#L23',
    };

    const mockAnalise: AnaliseErro = {
      causa: 'Variável name não foi inicializada',
      verificacoesAusentes: ['Verificação de null'],
      sugestaoCorrecao: 'Adicionar verificação if (name != null)',
      explicacao: 'O erro ocorre porque...',
      nivelConfianca: 90,
    };

    const mockAlerta: Alerta = {
      servico: 'user-service',
      erro: {
        tipo: 'NullPointerException',
        mensagem: 'name is null',
      },
      codigo: mockCodigo,
      analise: mockAnalise,
      timestamp: new Date().toISOString(),
      nivel: 'error',
    };

    await useCase.execute(mockAlerta);

    expect(mockAlertService.enviarAlerta).toHaveBeenCalledWith(mockAlerta);
  });
}); 