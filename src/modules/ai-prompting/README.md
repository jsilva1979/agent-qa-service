# Módulo AI Prompting

Este módulo implementa a integração com a API do Gemini para análise de erros e código.

## Configuração

O módulo requer as seguintes variáveis de ambiente:

### Gemini API Configuration
- `GEMINI_API_KEY`: Chave de API do Gemini
- `GEMINI_MODEL`: Modelo do Gemini a ser utilizado (padrão: gemini-2.0-flash)

### Logging Configuration
- `LOG_LEVEL`: Nível de log (padrão: info)
- `LOG_FILE_PATH`: Caminho do arquivo de log (padrão: logs/ai-service.log)

### Redis Cache Configuration
- `REDIS_HOST`: Host do Redis (padrão: localhost)
- `REDIS_PORT`: Porta do Redis (padrão: 6379)
- `CACHE_TTL`: Tempo de vida do cache em segundos (padrão: 3600)
- `CACHE_MAX_SIZE`: Tamanho máximo do cache (padrão: 1000)

### Retry Configuration
- `MAX_RETRIES`: Número máximo de tentativas (padrão: 3)
- `INITIAL_RETRY_DELAY`: Delay inicial em ms (padrão: 1000)
- `MAX_RETRY_DELAY`: Delay máximo em ms (padrão: 10000)
- `RETRY_BACKOFF_FACTOR`: Fator de backoff (padrão: 2)

## Uso

```typescript
import { GeminiAIService } from './application/GeminiAIService';
import { config } from './config/config';

const aiService = new GeminiAIService({
  apiKey: config.ai.apiKey,
  modelName: config.ai.model,
  logging: config.ai.logging,
});

// Analisar um erro
const analise = await aiService.analyzeError({
  error: {
    type: 'Error',
    message: 'Erro de exemplo',
    stackTrace: '...',
  },
});

// Analisar código
const analiseCodigo = await aiService.analyzeCode(
  'código fonte',
  'arquivo.ts',
  123,
  'erro'
);
```

## Funcionalidades

- Análise de erros com retry automático
- Análise de código com cache
- Categorização de erros
- Sugestões de correção
- Nível de confiança da análise
- Tags e referências relevantes

## Prompts

O módulo utiliza prompts estruturados para obter respostas mais precisas do Gemini:

1. Análise de Erros:
   - Causa raiz
   - Sugestões de correção
   - Nível de confiança
   - Categoria
   - Tags
   - Referências

2. Análise de Código:
   - Causa raiz
   - Sugestões de correção com exemplos
   - Nível de confiança
   - Categoria
   - Tags
   - Referências 