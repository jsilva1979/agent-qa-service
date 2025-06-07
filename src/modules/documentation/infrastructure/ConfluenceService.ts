import { IDocumentationService, Documentation, TechnicalInsight } from '../domain/ports/IDocumentationService';
import { AnaliseIA } from '../../ai-prompting/domain/entities/AnaliseIA';
import axios, { AxiosInstance } from 'axios';
import winston from 'winston';
import crypto from 'crypto';

interface ConfluencePage {
  id: string;
  title: string;
  body: {
    storage: {
      value: string;
    };
  };
  createdAt: string;
  updatedAt: string;
  author: {
    displayName: string;
  };
  metadata: {
    labels: Array<{
      name: string;
    }>;
  };
}

interface ConfluencePageList {
  results: ConfluencePage[];
}

export class ConfluenceService implements IDocumentationService {
  private readonly client: AxiosInstance;
  private logger: winston.Logger;

  constructor(
    private readonly config: {
      baseUrl: string;
      username: string;
      apiToken: string;
      spaceKey: string;
      logging: {
        level: string;
        file: {
          path: string;
        };
      };
    }
  ) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      auth: {
        username: config.username,
        password: config.apiToken,
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.logger = winston.createLogger({
      level: config.logging.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: config.logging.file.path,
          level: 'error',
        }),
      ],
    });
  }

  async createDocument(analysis: AnaliseIA): Promise<Documentation> {
    try {
      const doc: Documentation = {
        id: crypto.randomUUID(),
        title: `Análise de Erro: ${analysis.erro.tipo}`,
        content: this.formatDocumentContent(analysis),
        type: 'error',
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          author: 'Sistema de QA',
          status: 'published',
          tags: analysis.resultado.tags,
          references: analysis.resultado.referencias,
        },
      };

      const response = await this.client.post<ConfluencePage>('/rest/api/content', {
        type: 'page',
        title: doc.title,
        space: {
          key: this.config.spaceKey,
        },
        body: {
          storage: {
            value: doc.content,
            representation: 'storage',
          },
        },
        metadata: {
          labels: doc.metadata.tags.map(tag => ({ name: tag })),
        },
      });

      this.logger.info('Documento criado com sucesso', { id: doc.id });
      return doc;
    } catch (error) {
      this.logger.error('Erro ao criar documento:', error);
      throw error;
    }
  }

  async createInsight(insight: TechnicalInsight): Promise<string> {
    try {
      const response = await this.client.post<ConfluencePage>('/rest/api/content', {
        type: 'page',
        title: insight.title,
        space: {
          key: this.config.spaceKey,
        },
        body: {
          storage: {
            value: this.formatInsightContent(insight),
            representation: 'storage',
          },
        },
        metadata: {
          labels: insight.metadata.tags.map(tag => ({ name: tag })),
        },
      });

      this.logger.info('Insight técnico criado com sucesso', { id: insight.id });
      return insight.id;
    } catch (error) {
      this.logger.error('Erro ao criar insight técnico:', error);
      throw error;
    }
  }

  async updateDocument(id: string, analysis: AnaliseIA): Promise<Documentation> {
    try {
      const doc = await this.findDocument(id);
      if (!doc) {
        throw new Error(`Documento não encontrado: ${id}`);
      }

      const updatedDoc: Documentation = {
        ...doc,
        title: `Análise de Erro: ${analysis.erro.tipo}`,
        content: this.formatDocumentContent(analysis),
        metadata: {
          ...doc.metadata,
          updatedAt: new Date(),
          tags: analysis.resultado.tags,
          references: analysis.resultado.referencias,
        },
      };

      await this.client.put<ConfluencePage>(`/rest/api/content/${id}`, {
        version: {
          number: 2,
        },
        title: updatedDoc.title,
        body: {
          storage: {
            value: updatedDoc.content,
            representation: 'storage',
          },
        },
        metadata: {
          labels: updatedDoc.metadata.tags.map(tag => ({ name: tag })),
        },
      });

      this.logger.info('Documento atualizado com sucesso', { id });
      return updatedDoc;
    } catch (error) {
      this.logger.error('Erro ao atualizar documento:', error);
      throw error;
    }
  }

  async findDocument(id: string): Promise<Documentation | null> {
    try {
      const response = await this.client.get<ConfluencePage>(`/rest/api/content/${id}`, {
        params: {
          expand: 'body.storage,version',
        },
      });

      const page = response.data;
      return {
        id: page.id,
        title: page.title,
        content: page.body.storage.value,
        type: 'error',
        metadata: {
          createdAt: new Date(page.createdAt),
          updatedAt: new Date(page.updatedAt),
          author: page.author.displayName,
          status: 'published',
          tags: page.metadata.labels.map(label => label.name),
          references: [],
        },
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      this.logger.error('Erro ao buscar documento:', error);
      throw error;
    }
  }

  async listDocuments(filters?: {
    tags?: string[];
    status?: Documentation['metadata']['status'];
    startDate?: Date;
    endDate?: Date;
  }): Promise<Documentation[]> {
    try {
      const response = await this.client.get<ConfluencePageList>('/rest/api/content', {
        params: {
          spaceKey: this.config.spaceKey,
          type: 'page',
          expand: 'body.storage,version',
          limit: 100,
          start: 0,
        },
      });

      return response.data.results.map(page => ({
        id: page.id,
        title: page.title,
        content: page.body.storage.value,
        type: 'error',
        metadata: {
          createdAt: new Date(page.createdAt),
          updatedAt: new Date(page.updatedAt),
          author: page.author.displayName,
          status: 'published',
          tags: page.metadata.labels.map(label => label.name),
          references: [],
        },
      }));
    } catch (error) {
      this.logger.error('Erro ao listar documentos:', error);
      throw error;
    }
  }

  async archiveDocument(id: string): Promise<Documentation> {
    try {
      const doc = await this.findDocument(id);
      if (!doc) {
        throw new Error(`Documento não encontrado: ${id}`);
      }

      const archivedDoc: Documentation = {
        ...doc,
        metadata: {
          ...doc.metadata,
          status: 'archived',
          updatedAt: new Date(),
        },
      };

      await this.client.put<ConfluencePage>(`/rest/api/content/${id}`, {
        version: {
          number: 2,
        },
        metadata: {
          labels: [
            ...archivedDoc.metadata.tags.map(tag => ({ name: tag })),
            { name: 'archived' },
          ],
        },
      });

      this.logger.info('Documento arquivado com sucesso', { id });
      return archivedDoc;
    } catch (error) {
      this.logger.error('Erro ao arquivar documento:', error);
      throw error;
    }
  }

  async checkAvailability(): Promise<boolean> {
    try {
      await this.client.get(`/rest/api/space/${this.config.spaceKey}`);
      return true;
    } catch (error) {
      this.logger.error('Erro ao verificar disponibilidade do Confluence:', error);
      return false;
    }
  }

  private formatDocumentContent(analysis: AnaliseIA): string {
    return `
      <h1>Análise de Erro</h1>
      
      <h2>Detalhes do Erro</h2>
      <ul>
        <li><strong>Tipo:</strong> ${analysis.erro.tipo}</li>
        <li><strong>Mensagem:</strong> ${analysis.erro.mensagem}</li>
        ${analysis.erro.stackTrace ? `<li><strong>Stack Trace:</strong><pre>${analysis.erro.stackTrace}</pre></li>` : ''}
      </ul>

      <h2>Análise</h2>
      <h3>Causa Raiz</h3>
      <p>${analysis.resultado.causaRaiz}</p>

      <h3>Sugestões de Correção</h3>
      <ul>
        ${analysis.resultado.sugestoes.map(s => `<li>${s}</li>`).join('\n')}
      </ul>

      <h3>Metadados</h3>
      <ul>
        <li><strong>Nível de Confiança:</strong> ${analysis.resultado.nivelConfianca * 100}%</li>
        <li><strong>Categoria:</strong> ${analysis.resultado.categoria}</li>
        <li><strong>Tags:</strong> ${analysis.resultado.tags.join(', ')}</li>
      </ul>

      <h3>Referências</h3>
      <ul>
        ${analysis.resultado.referencias.map(r => `<li>${r}</li>`).join('\n')}
      </ul>
    `;
  }

  private formatInsightContent(insight: TechnicalInsight): string {
    return `
      <h1>${insight.title}</h1>
      
      <h2>Descrição</h2>
      <p>${insight.description}</p>

      <h2>Análise</h2>
      <h3>Causa Raiz</h3>
      <p>${insight.analysis.resultado.causaRaiz}</p>

      <h3>Recomendações</h3>
      <ul>
        ${insight.recommendations.map(r => `<li>${r}</li>`).join('\n')}
      </ul>

      <h3>Metadados</h3>
      <ul>
        <li><strong>Autor:</strong> ${insight.metadata.author}</li>
        <li><strong>Status:</strong> ${insight.metadata.status}</li>
        <li><strong>Tags:</strong> ${insight.metadata.tags.join(', ')}</li>
      </ul>

      <h3>Referências</h3>
      <ul>
        ${insight.metadata.references.map(r => `<li>${r}</li>`).join('\n')}
      </ul>
    `;
  }
} 