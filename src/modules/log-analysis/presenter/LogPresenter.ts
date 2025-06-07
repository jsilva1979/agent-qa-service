import { LogEntry } from '../domain/LogEntry';

export class LogPresenter {
  static toConsole(log: LogEntry): string {
    return `\n🚨 Erro detectado no serviço: ${log.servico}\nArquivo: ${log.arquivo}\nLinha: ${log.linha}\nTipo de erro: ${log.tipoErro}\nMensagem: ${log.mensagem}\nTimestamp: ${log.timestamp}\n${log.stacktrace ? 'Stacktrace: ' + log.stacktrace : ''}`;
  }
} 