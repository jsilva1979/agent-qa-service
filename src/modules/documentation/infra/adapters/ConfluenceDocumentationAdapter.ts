import { IDocumentationService, Documentation, TechnicalInsight } from '../../domain/ports/IDocumentationService';
import { AnaliseIA } from '../../../ai-prompting/domain/entities/AnaliseIA';
import winston from 'winston';

interface ConfluenceConfig {
  baseUrl: string;
  username: string;
  apiToken: string;
  spaceKey: string;
  parentPageId: string;
  logging: {
    level: string;
    file: {
      path: string;
    };
  };
}

export class ConfluenceDocumentationAdapter implements IDocumentationService {
  private logger: winston.Logger;

  constructor(private readonly config: ConfluenceConfig) {
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

  private generateTitle(analysis: AnaliseIA): string {
    return `[${analysis.erro.tipo}] ${analysis.erro.mensagem}`;
  }

  private generateContent(analysis: AnaliseIA): string {
    return `
h2. Error Details

*Type:* ${analysis.erro.tipo}
*Message:* ${analysis.erro.mensagem}
*Stack Trace:* {code}${analysis.erro.stackTrace}{code}

h2. Analysis

*Root Cause:* ${analysis.resultado.causaRaiz}
*Confidence Level:* ${analysis.resultado.nivelConfianca * 100}%

h2. Suggested Fixes

${analysis.resultado.sugestoes.map(suggestion => `* ${suggestion}`).join('\n')}

h2. References

${analysis.resultado.referencias.map(ref => `* [${ref}|${ref}]`).join('\n')}

h2. Metadata

*Model:* ${analysis.metadados.modelo}
*Version:* ${analysis.metadados.versao}
*Processing Time:* ${analysis.metadados.tempoProcessamento}ms
*Tokens Used:* ${analysis.metadados.tokensUtilizados}
`;
  }

  private async makeRequest(endpoint: string, method: string, body?: any): Promise<any> {
    const url = `${this.config.baseUrl}/wiki/api/v2/${endpoint}`;
    const auth = Buffer.from(`${this.config.username}:${this.config.apiToken}`).toString('base64');

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Confluence API Error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      this.logger.error('Error making request to Confluence:', error);
      throw error;
    }
  }

  async createDocument(analysis: AnaliseIA): Promise<Documentation> {
    try {
      const title = this.generateTitle(analysis);
      const content = this.generateContent(analysis);

      const response = await this.makeRequest('pages', 'POST', {
        spaceId: this.config.spaceKey,
        status: 'current',
        title: title,
        body: {
          storage: {
            value: content,
            representation: 'storage',
          },
        },
        parentId: this.config.parentPageId,
      });

      const document: Documentation = {
        id: response.id,
        title: response.title,
        content: content,
        type: 'error',
        metadata: {
          createdAt: new Date(response.createdAt),
          updatedAt: new Date(response.version.when),
          author: response.version.by.displayName,
          status: 'published',
          tags: analysis.resultado.tags,
          references: [],
          version: response.version.number.toString(),
        },
      };

      this.logger.info('Document created successfully:', { id: document.id });
      return document;
    } catch (error) {
      this.logger.error('Error creating document:', error);
      throw error;
    }
  }

  async createInsight(insight: TechnicalInsight): Promise<string> {
    try {
      const title = insight.title;
      const content = `
h2. Technical Insight

*Title:* ${insight.title}
*Service:* ${insight.service}
*Error Type:* ${insight.error.type}
*Error Message:* ${insight.error.message}
*Analysis Root Cause:* ${insight.analysis.resultado.causaRaiz}
*Suggested Fixes:* ${insight.analysis.resultado.sugestoes.map(s => `* ${s}`).join('\n')}
*Occurrence Date:* ${insight.occurrenceDate}
*Status:* ${insight.status}
*Solution:* ${insight.solution || 'N/A'}
*Preventive Measures:* ${insight.preventiveMeasures?.join('\n') || 'N/A'}


      `;

      const response = await this.makeRequest('pages', 'POST', {
        spaceId: this.config.spaceKey,
        status: 'current',
        title: title,
        body: {
          storage: {
            value: content,
            representation: 'storage',
          },
        },
        parentId: this.config.parentPageId,
      });

      this.logger.info('Insight created successfully:', { id: response.id });
      return response.id;
    } catch (error) {
      this.logger.error('Error creating insight:', error);
      throw error;
    }
  }

  async updateDocument(id: string, analysis: AnaliseIA): Promise<Documentation> {
    try {
      const document = await this.findDocument(id);
      if (!document) {
        throw new Error(`Document not found: ${id}`);
      }

      const title = this.generateTitle(analysis);
      const content = this.generateContent(analysis);

      const response = await this.makeRequest(`pages/${id}`, 'PUT', {
        version: {
          number: parseInt(document.metadata.version as string) + 1,
        },
        title: title,
        body: {
          storage: {
            value: content,
            representation: 'storage',
          },
        },
      });

      const updatedDocument: Documentation = {
        ...document,
        title: response.title,
        content: content,
        metadata: {
          ...document.metadata,
          updatedAt: new Date(response.version.when),
          version: response.version.number.toString(),
        },
      };

      this.logger.info('Document updated successfully:', { id });
      return updatedDocument;
    } catch (error) {
      this.logger.error('Error updating document:', error);
      throw error;
    }
  }

  async findDocument(id: string): Promise<Documentation | null> {
    try {
      const response = await this.makeRequest(`pages/${id}`, 'GET');
      
      const document: Documentation = {
        id: response.id,
        title: response.title,
        content: response.body.storage.value,
        type: 'error',
        metadata: {
          createdAt: new Date(response.createdAt),
          updatedAt: new Date(response.version.when),
          author: response.version.by.displayName,
          status: 'published',
          tags: [],
          references: [],
          version: response.version.number.toString(),
        },
      };

      return document;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Not Found')) {
        return null;
      }
      this.logger.error('Error finding document:', error);
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
      let endpoint = 'pages';
      const params = new URLSearchParams();

      if (filters?.status) {
        params.append('status', filters.status);
      }

      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      const response = await this.makeRequest(endpoint, 'GET');
      return response.results.map((page: any) => ({
        id: page.id,
        title: page.title,
        content: page.body.storage.value,
        type: 'error',
        metadata: {
          createdAt: new Date(page.createdAt),
          updatedAt: new Date(page.version.when),
          author: page.version.by.displayName,
          status: 'published',
          tags: [],
          references: [],
          version: page.version.number.toString(),
        },
      }));
    } catch (error) {
      this.logger.error('Error listing documents:', error);
      throw error;
    }
  }

  async archiveDocument(id: string): Promise<Documentation> {
    try {
      const document = await this.findDocument(id);
      if (!document) {
        throw new Error(`Document not found: ${id}`);
      }

      await this.makeRequest(`pages/${id}`, 'DELETE');

      const archivedDocument: Documentation = {
        ...document,
        metadata: {
          ...document.metadata,
          status: 'archived',
          updatedAt: new Date(),
        },
      };
      this.logger.info('Document archived successfully:', { id });
      return archivedDocument;
    } catch (error) {
      this.logger.error('Error archiving document:', error);
      throw error;
    }
  }

  async checkAvailability(): Promise<boolean> {
    try {
      await this.makeRequest('pages?limit=1', 'GET');
      return true;
    } catch (error) {
      this.logger.error('Error checking Confluence availability:', error);
      return false;
    }
  }
}