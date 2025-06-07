import { GitHubService } from '../GitHubService';
import { IGitHubService } from '../../domain/ports/IGitHubService';
import { CodigoFonte } from '../../domain/entities/CodigoFonte';
import { Logger } from 'winston';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    repos: {
      getContent: jest.fn(),
      get: jest.fn(),
      listCommits: jest.fn(),
    },
    rateLimit: {
      get: jest.fn(),
    },
  })),
}));

describe('GitHubService', () => {
  let gitHubService: GitHubService;
  let mockLogger: jest.Mocked<Logger>;
  let mockOctokit: any;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    mockOctokit = new Octokit();
    gitHubService = new GitHubService(mockLogger);
  });

  describe('obterCodigo', () => {
    const mockRepositorio = 'owner/repo';
    const mockArquivo = 'src/index.ts';
    const mockLinha = 10;
    const mockBranch = 'main';
    const mockConteudo = 'console.log("Hello World");';

    it('deve obter código com sucesso', async () => {
      mockOctokit.repos.getContent.mockResolvedValueOnce({
        data: {
          content: Buffer.from(mockConteudo).toString('base64'),
          sha: 'abc123',
          size: 100,
        },
      });

      const resultado = await gitHubService.obterCodigo(
        mockRepositorio,
        mockArquivo,
        mockLinha,
        mockBranch
      );

      expect(resultado).toMatchObject({
        repositorio: mockRepositorio,
        arquivo: mockArquivo,
        linha: mockLinha,
        conteudo: mockConteudo,
        url: `https://github.com/${mockRepositorio}/blob/${mockBranch}/${mockArquivo}#L${mockLinha}`,
        branch: mockBranch,
        commit: 'abc123',
        metadata: {
          tamanho: 100,
        },
      });
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('deve lidar com erro ao obter código', async () => {
      const error = new Error('Arquivo não encontrado');
      mockOctokit.repos.getContent.mockRejectedValueOnce(error);

      await expect(
        gitHubService.obterCodigo(mockRepositorio, mockArquivo, mockLinha, mockBranch)
      ).rejects.toThrow('Arquivo não encontrado');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('obterInfoRepositorio', () => {
    const mockRepositorio = 'owner/repo';

    it('deve obter informações do repositório com sucesso', async () => {
      mockOctokit.repos.get.mockResolvedValueOnce({
        data: {
          name: 'repo',
          description: 'Test repository',
          language: 'TypeScript',
          stargazers_count: 100,
          forks_count: 50,
          updated_at: '2024-03-20T10:00:00Z',
        },
      });

      const resultado = await gitHubService.obterInfoRepositorio(mockRepositorio);

      expect(resultado).toEqual({
        nome: 'repo',
        descricao: 'Test repository',
        linguagem: 'TypeScript',
        estrelas: 100,
        forks: 50,
        ultimaAtualizacao: new Date('2024-03-20T10:00:00Z'),
      });
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('deve lidar com erro ao obter informações do repositório', async () => {
      const error = new Error('Repositório não encontrado');
      mockOctokit.repos.get.mockRejectedValueOnce(error);

      await expect(gitHubService.obterInfoRepositorio(mockRepositorio))
        .rejects.toThrow('Repositório não encontrado');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('obterHistoricoCommits', () => {
    const mockRepositorio = 'owner/repo';
    const mockArquivo = 'src/index.ts';
    const mockBranch = 'main';

    it('deve obter histórico de commits com sucesso', async () => {
      mockOctokit.repos.listCommits.mockResolvedValueOnce({
        data: [
          {
            sha: 'abc123',
            commit: {
              author: {
                name: 'John Doe',
                date: '2024-03-20T10:00:00Z',
              },
              message: 'Initial commit',
            },
          },
        ],
      });

      const resultado = await gitHubService.obterHistoricoCommits(
        mockRepositorio,
        mockArquivo,
        mockBranch
      );

      expect(resultado).toEqual([
        {
          commit: 'abc123',
          autor: 'John Doe',
          data: new Date('2024-03-20T10:00:00Z'),
          mensagem: 'Initial commit',
        },
      ]);
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('deve lidar com erro ao obter histórico de commits', async () => {
      const error = new Error('Erro ao obter commits');
      mockOctokit.repos.listCommits.mockRejectedValueOnce(error);

      await expect(
        gitHubService.obterHistoricoCommits(mockRepositorio, mockArquivo, mockBranch)
      ).rejects.toThrow('Erro ao obter commits');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('verificarDisponibilidade', () => {
    it('deve retornar true quando o GitHub está disponível', async () => {
      mockOctokit.rateLimit.get.mockResolvedValueOnce({});

      const resultado = await gitHubService.verificarDisponibilidade();
      expect(resultado).toBe(true);
    });

    it('deve retornar false quando o GitHub está indisponível', async () => {
      const error = new Error('GitHub API indisponível');
      mockOctokit.rateLimit.get.mockRejectedValueOnce(error);

      const resultado = await gitHubService.verificarDisponibilidade();
      expect(resultado).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
}); 