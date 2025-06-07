import { ConfluenceService } from '../ConfluenceService';
import { InsightTecnico } from '../../domain/InsightTecnico';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ConfluenceService', () => {
  let confluenceService: ConfluenceService;
  const mockInsight: InsightTecnico = {
    titulo: 'Teste de Insight',
    servico: 'Serviço Teste',
    erro: {
      tipo: 'Erro Teste',
      mensagem: 'Mensagem de erro teste'
    },
    codigo: {
      arquivo: 'teste.ts',
      linha: 1,
      codigo: 'console.log("teste");',
      repositorio: 'teste/repo',
      branch: 'main',
      url: 'https://github.com/teste/repo'
    },
    analise: {
      causa: 'Causa teste',
      verificacoesAusentes: ['Verificação teste'],
      sugestaoCorrecao: 'Sugestão teste',
      explicacao: 'Explicação teste',
      nivelConfianca: 100
    },
    dataOcorrencia: new Date().toISOString(),
    status: 'resolvido',
    solucao: 'Solução teste',
    preventivas: ['Preventiva teste']
  };

  beforeEach(() => {
    process.env.CONFLUENCE_BASE_URL = 'https://teste.atlassian.net/wiki';
    process.env.CONFLUENCE_EMAIL = 'teste@teste.com';
    process.env.CONFLUENCE_API_TOKEN = 'token123';
    process.env.CONFLUENCE_SPACE_KEY = 'TEST';

    confluenceService = new ConfluenceService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('criarInsight', () => {
    it('deve criar um insight com sucesso', async () => {
      const mockResponse = {
        data: {
          id: '123456'
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await confluenceService.criarInsight(mockInsight);

      expect(result).toBe('123456');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://teste.atlassian.net/wiki/rest/api/content',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('deve lançar erro quando a criação falhar', async () => {
      const error = new Error('Erro ao criar página');
      mockedAxios.post.mockRejectedValueOnce(error);

      await expect(confluenceService.criarInsight(mockInsight))
        .rejects.toThrow('Erro ao criar página');
    });
  });

  describe('atualizarInsight', () => {
    it('deve atualizar um insight com sucesso', async () => {
      mockedAxios.put.mockResolvedValueOnce({});

      await confluenceService.atualizarInsight('123456', mockInsight);

      expect(mockedAxios.put).toHaveBeenCalledWith(
        'https://teste.atlassian.net/wiki/rest/api/content/123456',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('deve lançar erro quando a atualização falhar', async () => {
      const error = new Error('Erro ao atualizar página');
      mockedAxios.put.mockRejectedValueOnce(error);

      await expect(confluenceService.atualizarInsight('123456', mockInsight))
        .rejects.toThrow('Erro ao atualizar página');
    });
  });

  describe('buscarInsight', () => {
    it('deve buscar um insight com sucesso', async () => {
      const mockResponse = {
        data: {
          title: 'Teste de Insight',
          body: {
            storage: {
              value: 'Conteúdo do insight'
            }
          }
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await confluenceService.buscarInsight('123456');

      expect(result).toBeDefined();
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://teste.atlassian.net/wiki/rest/api/content/123456',
        expect.any(Object)
      );
    });

    it('deve lançar erro quando a busca falhar', async () => {
      const error = new Error('Erro ao buscar página');
      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(confluenceService.buscarInsight('123456'))
        .rejects.toThrow('Erro ao buscar página');
    });
  });

  describe('construtor', () => {
    it('deve lançar erro quando configurações estiverem faltando', () => {
      delete process.env.CONFLUENCE_BASE_URL;
      delete process.env.CONFLUENCE_EMAIL;
      delete process.env.CONFLUENCE_API_TOKEN;

      expect(() => new ConfluenceService())
        .toThrow('Configurações do Confluence não encontradas');
    });
  });
}); 