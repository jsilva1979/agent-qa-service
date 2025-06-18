import { SendAlertUseCase } from './SendAlertUseCase';
import { IAlertService, Alert } from '../domain/ports/IAlertService';
import { AlertInput } from '../domain/AlertInput';
import { CodeContext } from '../../github-access/domain/CodeContext';
import { AnalyzeError } from '../../ai-prompting/domain/AnalyzeError';

describe('SendAlertUseCase', () => {
  let useCase: SendAlertUseCase;
  let mockAlertService: jest.Mocked<IAlertService>;

  beforeEach(() => {
    mockAlertService = {
      sendAlert: jest.fn(),
      sendErrorAlert: jest.fn(),
      sendMetricsAlert: jest.fn(),
      checkAvailability: jest.fn(),
    };
    useCase = new SendAlertUseCase(mockAlertService);
  });

  it('deve enviar o Alert corretamente', async () => {
    const mockCode: CodeContext = {
      arquivo: 'UserProcessor.java',
      linha: 23,
      codigo: 'public class UserProcessor {\n  private String name;\n}',
      repositorio: 'user-service',
      branch: 'main',
      url: 'https://github.com/user-service/blob/main/UserProcessor.java#L23',
    };

    const mockAnalysis: AnalyzeError = {
      causa: 'Variável name não foi inicializada',
      verificacoesAusentes: ['Verificação de null'],
      sugestaoCorrecao: 'Adicionar verificação if (name != null)',
      explicacao: 'O erro ocorre porque...',
      nivelConfianca: 90,
    };

    const mockAlertInput: AlertInput = {
      service: 'user-service',
      error: {
        type: 'NullPointerException',
        message: 'name is null',
      },
      code: mockCode,
      analysis: mockAnalysis,
      timestamp: new Date().toISOString(),
      level: 'error',
    };

    await useCase.execute(mockAlertInput);

    const expectedAlertPayload: Omit<Alert, 'id' | 'metadata'> = {
      timestamp: new Date(mockAlertInput.timestamp),
      type: 'error',
      title: `Alert from ${mockAlertInput.service}: ${mockAlertInput.error.type}`,
      message: mockAlertInput.error.message,
      details: {
        error: {
          type: mockAlertInput.error.type,
          message: mockAlertInput.error.message,
          stackTrace: undefined,
          context: {
            code: mockAlertInput.code,
            analysis: mockAlertInput.analysis,
          }
        }
      }
    };

    expect(mockAlertService.sendAlert).toHaveBeenCalledWith(expectedAlertPayload);
  });
}); 