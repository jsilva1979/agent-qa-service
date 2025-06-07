import { IDocumentationService, TechnicalInsight } from '../domain/ports/IDocumentationService';

export class CreateInsightUseCase {
  constructor(private readonly documentationService: IDocumentationService) {}

  /**
   * Executa a criação de um insight técnico
   * @param insight Dados do insight técnico a ser criado
   * @returns ID do insight criado
   */
  async execute(insight: TechnicalInsight): Promise<string> {
    return this.documentationService.createInsight(insight);
  }
} 