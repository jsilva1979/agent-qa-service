import { LogEntry } from '../domain/LogEntry';

export class ParseLogUseCase {
  static parse(log: string): LogEntry | null {
    // Exemplo de log esperado:
    // [2024-05-01T12:34:56Z] user-service | UserProcessor.java:23 | NullPointerException | name is null
    // Opcional: | stacktrace: ...
    const regex = /^\[(.+?)\]\s+(.+?)\s\|\s(.+?):(\d+)\s\|\s(.+?)\s\|\s(.+?)(?:\s\|\sstacktrace:(.*))?$/;
    const match = log.match(regex);
    if (!match) return null;
    const [, timestamp, servico, arquivo, linha, tipoErro, mensagem, stacktrace] = match;
    return {
      servico: servico.trim(),
      arquivo: arquivo.trim(),
      linha: Number(linha),
      tipoErro: tipoErro.trim(),
      mensagem: mensagem.trim(),
      timestamp: timestamp.trim(),
      stacktrace: stacktrace?.trim(),
    };
  }
} 