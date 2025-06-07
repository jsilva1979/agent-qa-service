import { IDocumentationService, Documentacao } from '../../domain/ports/IDocumentationService';
import { AnaliseIA } from '../../../../modules/ai-prompting/domain/entities/AnaliseIA';
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

  private gerarTitulo(analise: AnaliseIA): string {
    return `[${analise.erro.tipo}] ${analise.erro.mensagem}`;
  }

  private gerarConteudo(analise: AnaliseIA): string {
    return `
h2. Detalhes do Erro

*Tipo:* ${analise.erro.tipo}
*Mensagem:* ${analise.erro.mensagem}
*Stack Trace:* {code}${analise.erro.stackTrace}{code}

h2. Análise

*Causa Raiz:* ${analise.resultado.causaRaiz}
*Nível de Confiança:* ${analise.resultado.nivelConfianca * 100}%

h2. Sugestões de Correção

${analise.resultado.sugestoes.map(sugestao => `* ${sugestao}`).join('\n')}

h2. Referências

${analise.resultado.referencias.map(ref => `* [${ref}|${ref}]`).join('\n')}

h2. Metadados

*Modelo:* ${analise.metadados.modelo}
*Versão:* ${analise.metadados.versao}
*Tempo de Processamento:* ${analise.metadados.tempoProcessamento}ms
*Tokens Utilizados:* ${analise.metadados.tokensUtilizados}
`;
  }

  private async fazerRequisicao(endpoint: string, method: string, body?: any): Promise<any> {
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
        throw new Error(`Erro na API do Confluence: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      this.logger.error('Erro na requisição ao Confluence:', error);
      throw error;
    }
  }

  async criarDocumento(analise: AnaliseIA): Promise<Documentacao> {
    try {
      const titulo = this.gerarTitulo(analise);
      const conteudo = this.gerarConteudo(analise);

      const response = await this.fazerRequisicao('pages', 'POST', {
        spaceId: this.config.spaceKey,
        status: 'current',
        title: titulo,
        body: {
          storage: {
            value: conteudo,
            representation: 'storage',
          },
        },
        parentId: this.config.parentPageId,
      });

      const documento: Documentacao = {
        id: response.id,
        titulo: response.title,
        conteudo: conteudo,
        tags: analise.resultado.tags,
        metadados: {
          autor: response.version.by.displayName,
          dataCriacao: new Date(response.createdAt),
          dataAtualizacao: new Date(response.version.when),
          versao: response.version.number.toString(),
          status: 'publicado',
        },
      };

      this.logger.info('Documento criado com sucesso:', { id: documento.id });
      return documento;
    } catch (error) {
      this.logger.error('Erro ao criar documento:', error);
      throw error;
    }
  }

  async atualizarDocumento(id: string, analise: AnaliseIA): Promise<Documentacao> {
    try {
      const documento = await this.buscarDocumento(id);
      if (!documento) {
        throw new Error(`Documento não encontrado: ${id}`);
      }

      const titulo = this.gerarTitulo(analise);
      const conteudo = this.gerarConteudo(analise);

      const response = await this.fazerRequisicao(`pages/${id}`, 'PUT', {
        version: {
          number: parseInt(documento.metadados.versao) + 1,
        },
        title: titulo,
        body: {
          storage: {
            value: conteudo,
            representation: 'storage',
          },
        },
      });

      const documentoAtualizado: Documentacao = {
        ...documento,
        titulo: response.title,
        conteudo: conteudo,
        tags: analise.resultado.tags,
        metadados: {
          ...documento.metadados,
          dataAtualizacao: new Date(response.version.when),
          versao: response.version.number.toString(),
        },
      };

      this.logger.info('Documento atualizado com sucesso:', { id });
      return documentoAtualizado;
    } catch (error) {
      this.logger.error('Erro ao atualizar documento:', error);
      throw error;
    }
  }

  async buscarDocumento(id: string): Promise<Documentacao | null> {
    try {
      const response = await this.fazerRequisicao(`pages/${id}`, 'GET');
      
      const documento: Documentacao = {
        id: response.id,
        titulo: response.title,
        conteudo: response.body.storage.value,
        tags: [], // TODO: Implementar extração de tags do conteúdo
        metadados: {
          autor: response.version.by.displayName,
          dataCriacao: new Date(response.createdAt),
          dataAtualizacao: new Date(response.version.when),
          versao: response.version.number.toString(),
          status: 'publicado',
        },
      };

      return documento;
    } catch (error: any) {
      if (error.message?.includes('404')) {
        return null;
      }
      this.logger.error('Erro ao buscar documento:', error);
      throw error;
    }
  }

  async listarDocumentos(filtros?: {
    tags?: string[];
    status?: Documentacao['metadados']['status'];
    dataInicio?: Date;
    dataFim?: Date;
  }): Promise<Documentacao[]> {
    try {
      const queryParams = new URLSearchParams({
        spaceId: this.config.spaceKey,
        parentId: this.config.parentPageId,
        limit: '50',
      });

      const response = await this.fazerRequisicao(`pages?${queryParams}`, 'GET');
      
      const documentos = response.results.map((page: any) => ({
        id: page.id,
        titulo: page.title,
        conteudo: page.body.storage.value,
        tags: [], // TODO: Implementar extração de tags do conteúdo
        metadados: {
          autor: page.version.by.displayName,
          dataCriacao: new Date(page.createdAt),
          dataAtualizacao: new Date(page.version.when),
          versao: page.version.number.toString(),
          status: 'publicado',
        },
      }));

      // Aplicar filtros
      return documentos.filter((doc: Documentacao) => {
        if (filtros?.tags && !filtros.tags.every(tag => doc.tags.includes(tag))) {
          return false;
        }
        if (filtros?.status && doc.metadados.status !== filtros.status) {
          return false;
        }
        if (filtros?.dataInicio && doc.metadados.dataCriacao < filtros.dataInicio) {
          return false;
        }
        if (filtros?.dataFim && doc.metadados.dataCriacao > filtros.dataFim) {
          return false;
        }
        return true;
      });
    } catch (error) {
      this.logger.error('Erro ao listar documentos:', error);
      throw error;
    }
  }

  async arquivarDocumento(id: string): Promise<Documentacao> {
    try {
      const documento = await this.buscarDocumento(id);
      if (!documento) {
        throw new Error(`Documento não encontrado: ${id}`);
      }

      await this.fazerRequisicao(`pages/${id}`, 'PUT', {
        version: {
          number: parseInt(documento.metadados.versao) + 1,
        },
        status: 'archived',
      });

      const documentoArquivado: Documentacao = {
        ...documento,
        metadados: {
          ...documento.metadados,
          status: 'arquivado',
          dataAtualizacao: new Date(),
        },
      };

      this.logger.info('Documento arquivado com sucesso:', { id });
      return documentoArquivado;
    } catch (error) {
      this.logger.error('Erro ao arquivar documento:', error);
      throw error;
    }
  }

  async verificarDisponibilidade(): Promise<boolean> {
    try {
      await this.fazerRequisicao('spaces', 'GET');
      return true;
    } catch (error) {
      this.logger.error('Erro ao verificar disponibilidade do Confluence:', error);
      return false;
    }
  }
} 