import { GeminiAIService } from '../application/GeminiAIService';
import { config } from '../config/config';

describe('Demonstração do GeminiAIService', () => {
  let aiService: GeminiAIService;

  beforeAll(() => {
    aiService = new GeminiAIService({
      apiKey: config.ai.apiKey,
      modelName: config.ai.model,
      logging: {
        level: 'info',
        file: {
          path: 'logs/ai-service.log',
        },
      },
    });
  });

  it('Demonstração 1: Análise de um bug de segurança em código JavaScript', async () => {
    const codigoVulneravel = `
      const express = require('express');
      const app = express();
      
      app.get('/user', (req, res) => {
        const userId = req.query.id;
        const query = "SELECT * FROM users WHERE id = " + userId;
        db.query(query, (err, results) => {
          res.json(results);
        });
      });
    `;

    const analise = await aiService.analyzeCode(
      codigoVulneravel,
      'userController.js',
      5,
      'Vulnerabilidade de SQL Injection detectada'
    );

    console.log('\n=== Demonstração 1: Análise de Segurança ===');
    console.log('Código Analisado:', codigoVulneravel);
    console.log('\nAnálise do Gemini:');
    console.log('Causa Raiz:', analise.result.rootCause);
    console.log('\nSugestões de Correção:');
    analise.result.suggestions.forEach((sugestao, index) => {
      console.log(`${index + 1}. ${sugestao}`);
    });
    console.log('\nNível de Confiança:', analise.result.confidenceLevel);
    console.log('Categoria:', analise.result.category);
    console.log('Tags:', analise.result.tags.join(', '));
  }, 30000);

  it('Demonstração 2: Análise de um problema de performance em código TypeScript', async () => {
    const codigoIneficiente = `
      class UserService {
        private users: User[] = [];
        
        async findUserByEmail(email: string): Promise<User | null> {
          // Busca ineficiente em array
          return this.users.find(user => user.email === email) || null;
        }
        
        async getAllUsers(): Promise<User[]> {
          // Cópia desnecessária do array
          return [...this.users];
        }
      }
    `;

    const analise = await aiService.analyzeCode(
      codigoIneficiente,
      'UserService.ts',
      3,
      'Problemas de performance detectados'
    );

    console.log('\n=== Demonstração 2: Análise de Performance ===');
    console.log('Código Analisado:', codigoIneficiente);
    console.log('\nAnálise do Gemini:');
    console.log('Causa Raiz:', analise.result.rootCause);
    console.log('\nSugestões de Correção:');
    analise.result.suggestions.forEach((sugestao, index) => {
      console.log(`${index + 1}. ${sugestao}`);
    });
    console.log('\nNível de Confiança:', analise.result.confidenceLevel);
    console.log('Categoria:', analise.result.category);
    console.log('Tags:', analise.result.tags.join(', '));
  }, 30000);

  it('Demonstração 3: Análise de um erro em tempo de execução', async () => {
    const analise = await aiService.analyzeError({
      code: `
        const user = {
          name: 'John',
          address: null
        };
        
        console.log(user.address.street);
      `,
      error: {
        type: 'TypeError',
        message: 'Cannot read property \'street\' of null',
        stackTrace: `
          TypeError: Cannot read property 'street' of null
            at Object.<anonymous> (/app/src/index.js:5:25)
            at Module._compile (internal/modules/cjs/loader.js:999:30)
            at Object.Module._extensions..js (internal/modules/cjs/loader.js:1027:10)
        `,
        context: {
          environment: 'production',
          timestamp: new Date().toISOString(),
          userId: '12345'
        }
      },
      logs: [
        '2024-03-20 10:15:23 - User session started',
        '2024-03-20 10:15:24 - Attempting to access user address',
        '2024-03-20 10:15:24 - Error: Cannot read property \'street\' of null'
      ],
      metrics: {
        cpu: 45,
        memory: 1024,
        latency: 150
      }
    });

    console.log('\n=== Demonstração 3: Análise de Erro em Tempo de Execução ===');
    console.log('Erro Analisado:', analise.erro);
    console.log('\nAnálise do Gemini:');
    console.log('Causa Raiz:', analise.resultado.causaRaiz);
    console.log('\nSugestões de Correção:');
    analise.resultado.sugestoes.forEach((sugestao, index) => {
      console.log(`${index + 1}. ${sugestao}`);
    });
    console.log('\nNível de Confiança:', analise.resultado.nivelConfianca);
    console.log('Categoria:', analise.resultado.categoria);
    console.log('Tags:', analise.resultado.tags.join(', '));
  }, 30000);
}); 