import { IAIService } from '../domain/ports/IAIService';
import { AnaliseErro } from '../domain/AnaliseErro';
import { CodeContext } from '../../github-access/domain/CodeContext';

export class AnalisarErroUseCase {
  constructor(private readonly aiService: IAIService) {}

  async execute(
    codigo: CodeContext,
    erro: {
      tipo: string;
      mensagem: string;
      stacktrace?: string;
    }
  ): Promise<AnaliseErro> {
    return this.aiService.analisarErro(codigo, erro);
  }
} 