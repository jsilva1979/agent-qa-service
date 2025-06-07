import { IAIService, DadosAnalise } from '../IAIService';
import { AnaliseIA } from '../../entities/AnaliseIA';

// Classe mock para testar a interface
class MockAIService implements IAIService {
  async analisarErro(dados: DadosAnalise): Promise<AnaliseIA> {
    return {
      id: 'mock-id',
      timestamp: new Date(),
      erro: dados.erro,
      resultado: {
        causaRaiz: 'Mock causa raiz',
        sugestoes: ['Mock sugestão'],
        nivelConfianca: 0.8,
        categoria: 'Mock categoria',
        tags: ['mock'],
        referencias: ['mock-ref'],
      },
      metadados: {
        modelo: 'Mock Model',
        versao: '1.0',
        tempoProcessamento: 100,
        tokensUtilizados: 50,
      },
    };
  }

  async verificarDisponibilidade(): Promise<boolean> {
    return true;
  }

  async obterInfoModelo(): Promise<{
    nome: string;
    versao: string;
    capacidades: string[];
    limitacoes: string[];
  }> {
    return {
      nome: 'Mock Model',
      versao: '1.0',
      capacidades: ['Mock capacidade'],
      limitacoes: ['Mock limitação'],
    };
  }
}

describe('IAIService', () => {
  let service: IAIService;

  beforeEach(() => {
    service = new MockAIService();
  });

  describe('analisarErro', () => {
    const mockDados: DadosAnalise = {
      erro: {
        tipo: 'TestError',
        mensagem: 'Test message',
      },
      codigo: 'test code',
    };

    it('deve retornar uma análise válida', async () => {
      const resultado = await service.analisarErro(mockDados);

      expect(resultado).toHaveProperty('id');
      expect(resultado).toHaveProperty('timestamp');
      expect(resultado).toHaveProperty('erro');
      expect(resultado).toHaveProperty('resultado');
      expect(resultado).toHaveProperty('metadados');

      expect(resultado.resultado).toHaveProperty('causaRaiz');
      expect(resultado.resultado).toHaveProperty('sugestoes');
      expect(resultado.resultado).toHaveProperty('nivelConfianca');
      expect(resultado.resultado).toHaveProperty('categoria');
      expect(resultado.resultado).toHaveProperty('tags');
      expect(resultado.resultado).toHaveProperty('referencias');

      expect(resultado.metadados).toHaveProperty('modelo');
      expect(resultado.metadados).toHaveProperty('versao');
      expect(resultado.metadados).toHaveProperty('tempoProcessamento');
      expect(resultado.metadados).toHaveProperty('tokensUtilizados');
    });
  });

  describe('verificarDisponibilidade', () => {
    it('deve retornar um booleano', async () => {
      const resultado = await service.verificarDisponibilidade();
      expect(typeof resultado).toBe('boolean');
    });
  });

  describe('obterInfoModelo', () => {
    it('deve retornar informações do modelo', async () => {
      const info = await service.obterInfoModelo();

      expect(info).toHaveProperty('nome');
      expect(info).toHaveProperty('versao');
      expect(info).toHaveProperty('capacidades');
      expect(info).toHaveProperty('limitacoes');

      expect(Array.isArray(info.capacidades)).toBe(true);
      expect(Array.isArray(info.limitacoes)).toBe(true);
    });
  });
}); 