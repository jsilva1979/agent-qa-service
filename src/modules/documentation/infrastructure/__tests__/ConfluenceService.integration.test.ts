import 'dotenv/config';
import { ConfluenceService } from '../ConfluenceService';
import { InsightTecnico } from '../../domain/InsightTecnico';

describe('ConfluenceService Integration', () => {
  let confluenceService: ConfluenceService;

  beforeAll(() => {
    // Verificar se as variáveis de ambiente estão configuradas
    const requiredEnvVars = [
      'CONFLUENCE_BASE_URL',
      'CONFLUENCE_EMAIL',
      'CONFLUENCE_API_TOKEN',
      'CONFLUENCE_SPACE_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Variáveis de ambiente faltando: ${missingVars.join(', ')}`);
    }

    confluenceService = new ConfluenceService();
  });

  it('deve criar uma página de teste no Confluence', async () => {
    // Arrange
    const insightTeste: InsightTecnico = {
      titulo: 'Teste de Integração - ' + new Date().toISOString(),
      servico: 'Serviço de Teste',
      erro: {
        tipo: 'Erro de Teste',
        mensagem: 'Mensagem de erro de teste'
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
        causa: 'Causa de teste',
        verificacoesAusentes: ['Verificação de teste'],
        sugestaoCorrecao: 'Sugestão de teste',
        explicacao: 'Explicação de teste',
        nivelConfianca: 100
      },
      dataOcorrencia: new Date().toISOString(),
      status: 'resolvido',
      solucao: 'Solução de teste',
      preventivas: ['Preventiva de teste']
    };

    // Act
    const pageId = await confluenceService.criarInsight(insightTeste);

    // Assert
    expect(pageId).toBeDefined();
    expect(typeof pageId).toBe('string');
    expect(pageId.length).toBeGreaterThan(0);

    // Cleanup (opcional)
    // Se quiser limpar o teste, você pode implementar um método de deleção
    // await confluenceService.deletarInsight(pageId);
  }, 30000); // Aumentando o timeout para 30 segundos devido à chamada de API
}); 