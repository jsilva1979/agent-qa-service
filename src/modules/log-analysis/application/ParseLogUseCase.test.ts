import { ParseLogUseCase } from './ParseLogUseCase';

describe('ParseLogUseCase', () => {
  it('deve fazer o parsing de um log válido', () => {
    const log = '[2024-05-01T12:34:56Z] user-service | UserProcessor.java:23 | NullPointerException | name is null';
    const result = ParseLogUseCase.parse(log);
    expect(result).toEqual({
      servico: 'user-service',
      arquivo: 'UserProcessor.java',
      linha: 23,
      tipoErro: 'NullPointerException',
      mensagem: 'name is null',
      timestamp: '2024-05-01T12:34:56Z',
      stacktrace: undefined,
    });
  });

  it('deve retornar null para log inválido', () => {
    const log = 'mensagem sem formato';
    const result = ParseLogUseCase.parse(log);
    expect(result).toBeNull();
  });
}); 