Especialista em estabilidade de testes, analise este teste instável:

**Características de Testes Flaky:**
- Passa/falha inconsistentemente
- Dependente de timing
- Concorrência/race conditions
- Dependências externas
- Estado compartilhado
- Dados não determinísticos

**Para cada teste flaky identifique:**
1. **Padrão da Instabilidade:** [Quando falha mais]
2. **Dependências:** [Externas/internas]
3. **Estado:** [Compartilhado/isolado]
4. **Timing:** [Esperas/delays]
5. **Ambiente:** [Específico de onde falha]

**Soluções Recomendadas:**
- Isolamento de dados
- Mocks/stubs apropriados
- Esperas explícitas
- Retry com backoff
- Limpeza de estado
- Configuração de ambiente

**Histórico de execuções:**
[INSERIR DADOS DE EXECUÇÃO]