# 🤖 Agent-QA-Service: Agente de QA com IA Gemini, Slack e Jira

Um agente autônomo de QA que integra Slack, Gemini AI (Google), Jira Cloud e banco de dados PostgreSQL/Supabase para automatizar a análise de erros, classificação, geração de cards e evidências.

## 🚀 Funcionalidades

- Análise automática de mensagens de erro postadas no Slack
- Classificação inteligente de erros usando Gemini AI
- Criação automática de cards no Jira com base na análise da IA
- Mapeamento de categoria/impacto para tipos e prioridades válidas do Jira
- Logs detalhados e persistência de análises no PostgreSQL (via Supabase)
- Cache de requisições com Redis
- Fluxo de aprovação interativo no Slack (botões para criar/cancelar card)
- Histórico de ações e análises salvos para auditoria

## 🛠️ Stack Tecnológica

- TypeScript + Node.js
- Slack Bolt (Socket Mode)
- Gemini AI (Google Generative AI)
- Jira Cloud API (OAuth2)
- PostgreSQL/Supabase
- Redis
- Docker (para serviços auxiliares)
- Jest (testes)

## 📋 Pré-requisitos

- Node.js 18+
- Yarn ou npm
- Docker (para Redis e PostgreSQL)
- Conta no Jira Cloud e chave de API Gemini

## ⚡️ Como rodar localmente

1. **Clone o repositório:**
   ```bash
   git clone <url-do-repositorio>
   cd agent-qa-service
   ```

2. **Instale as dependências:**
   ```bash
   yarn install
   # ou npm install
   ```

3. **Configure o ambiente:**
   - Copie o exemplo de variáveis:
     ```bash
     cp .env.example .env
     ```
   - Preencha o `.env` com suas credenciais:
     - SLACK_BOT_TOKEN, SLACK_APP_TOKEN
     - GEMINI_API_KEY
     - JIRA_CLIENT_ID, JIRA_CLIENT_SECRET, JIRA_CLOUD_ID, JIRA_SITE_URL, JIRA_BASE_URL
     - POSTGRES_URL
     - REDIS_URL

4. **Suba os serviços auxiliares:**
   ```bash
   # Exemplo usando Docker Compose (ajuste conforme seu setup)
   docker run -d --name redis-qa-service -p 6379:6379 redis
   docker run -d --name pg-qa-service -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres
   ```

5. **Rode as migrações do banco:**
   ```bash
   yarn migrate # ou npm run migrate
   ```

6. **Inicie o bot do Slack:**
   ```bash
   npx ts-node src/slackBot.ts
   ```

## 💬 Fluxo de Uso

1. Poste uma mensagem de erro no canal do Slack monitorado.
2. O bot analisa a mensagem com a Gemini AI, classifica o erro e sugere ações.
3. O bot responde no Slack com um resumo e botões para criar/cancelar o card no Jira.
4. Ao aprovar, o bot cria o card no Jira, mapeando categoria/impacto para tipo/prioridade válidos.
5. Toda a análise é salva no banco para consulta futura.

## 🧪 Testes

Execute os testes unitários:
```bash
yarn test
```

## 📁 Estrutura do Projeto

```
src/
├── modules/
│   ├── ai-prompting/      # Integração com Gemini AI
│   ├── alerting/          # Notificações e alertas (Slack)
│   ├── api/               # Servidor Express (futuro: webhooks)
│   └── advanced-features/ # Aprovação, escalonamento, etc.
├── shared/
│   ├── config/            # Configurações de banco, Redis, etc.
│   ├── infrastructure/    # Integração com Jira, Slack, logging
│   ├── services/          # Serviços utilitários, repositórios
│   └── database/          # Migrações e scripts SQL
├── scripts/               # Scripts utilitários (ex: listar tipos do Jira)
├── slackBot.ts            # Bot principal do Slack
├── main.ts                # Ponto de entrada do servidor Express
└── testAgentFlow.ts       # Script de teste/manual
```

## 📝 Exemplo de .env

```env
SLACK_BOT_TOKEN=...
SLACK_APP_TOKEN=...
GEMINI_API_KEY=...
JIRA_CLIENT_ID=...
JIRA_CLIENT_SECRET=...
JIRA_CLOUD_ID=...
JIRA_SITE_URL=...
JIRA_BASE_URL=...
POSTGRES_URL=postgres://postgres:postgres@localhost:5432/postgres
REDIS_URL=redis://localhost:6379
```

## 🤝 Contribuindo

1. Faça um fork do repositório
2. Crie sua branch (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit das suas alterações (`git commit -m 'feat: nova funcionalidade'`)
4. Faça push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes. 