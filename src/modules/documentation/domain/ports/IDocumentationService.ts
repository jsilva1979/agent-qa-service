import { AnaliseIA } from '../../../ai-prompting/domain/entities/AnaliseIA';
import { CodeContext } from '../../../github-access/domain/CodeContext';

export interface Documentation {
  id: string;
  title: string;
  content: string;
  type: 'error' | 'insight' | 'guide';
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    author: string;
    status: 'draft' | 'published' | 'archived';
    tags: string[];
    references: string[];
    version?: string;
  };
}

export interface TechnicalInsight {
  id?: string;
  title: string;
  description: string;
  service: string;
  error: {
    type: string;
    message: string;
    stackTrace?: string;
    context?: Record<string, any>;
  };
  code?: CodeContext;
  analysis: AnaliseIA;
  recommendations: string[];
  occurrenceDate: string;
  status: 'resolved' | 'in_progress' | 'pending';
  solution?: string;
  preventiveMeasures?: string[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    author: string;
    status: 'draft' | 'published' | 'archived';
    tags: string[];
    references: string[];
  };
}

export interface IDocumentationService {
  /**
   * Cria um novo documento técnico baseado na análise de erro
   * @param analysis Análise do erro gerada pelo serviço de IA
   * @returns Documento criado
   */
  createDocument(analysis: AnaliseIA): Promise<Documentation>;

  /**
   * Cria um novo insight técnico
   * @param insight Dados do insight técnico
   * @returns ID do insight criado
   */
  createInsight(insight: TechnicalInsight): Promise<string>;

  /**
   * Atualiza um documento existente com novas informações
   * @param id ID do documento
   * @param analysis Nova análise do erro
   * @returns Documento atualizado
   */
  updateDocument(id: string, analysis: AnaliseIA): Promise<Documentation>;

  /**
   * Busca um documento pelo ID
   * @param id ID do documento
   * @returns Documento encontrado ou null
   */
  findDocument(id: string): Promise<Documentation | null>;

  /**
   * Lista documentos com base em filtros
   * @param filters Filtros de busca (tags, status, etc)
   * @returns Lista de documentos
   */
  listDocuments(filters?: {
    tags?: string[];
    status?: Documentation['metadata']['status'];
    startDate?: Date;
    endDate?: Date;
  }): Promise<Documentation[]>;

  /**
   * Arquivar um documento
   * @param id ID do documento
   * @returns Documento arquivado
   */
  archiveDocument(id: string): Promise<Documentation>;

  /**
   * Verifica se o serviço está disponível
   * @returns true se disponível, false caso contrário
   */
  checkAvailability(): Promise<boolean>;
} 