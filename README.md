# 🤖 Agent-QA-Service

**Agente de QA Inteligente com Gemini AI, Slack e Jira**

![GitHub Stars](https://img.shields.io/github/stars/seu-usuario/agent-qa-service?style=social)
![MIT License](https://img.shields.io/github/license/seu-usuario/agent-qa-service)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)

---

## 🧠 Sobre o Projeto

O **Agent-QA-Service** é um agente autônomo de QA que integra **Slack**, **Gemini AI (Google)**, **Jira Cloud** e banco de dados **PostgreSQL/Supabase** para **automatizar a análise de erros, classificação e criação de cards** com evidências.

Ele reduz drasticamente o tempo entre a detecção de uma falha e sua documentação no Jira, com interação direta via Slack.

---

```
# Exemplo de mensagem de erro no Slack:
[ERRO] TypeError: Cannot read property 'street' of null

# Resposta do bot:
Categoria: Erro de acesso nulo  
Prioridade sugerida: Alta  
🔘 Criar card | 🔘 Cancelar
```

---

## 🚀 Funcionalidades

- ✅ Análise automática de mensagens de erro no Slack
- ✅ Classificação inteligente com Gemini AI
- ✅ Criação automática de cards no Jira
- ✅ Mapeamento de categoria/impacto para tipos válidos do Jira
- ✅ Logs persistidos no PostgreSQL
- ✅ Cache de requisições com Redis
- ✅ Fluxo de aprovação interativo via Slack
- ✅ Histórico completo de ações e análises

---

## ❓ Por que usar este projeto?

Se você trabalha com QA, suporte ou SRE, este agente:

- Reduz a **carga cognitiva** na análise de erros
- Evita **criação manual de tickets**
- Classifica automaticamente o problema com IA
- Cria um histórico confiável e auditável de incidentes

---

## 🛠️ Stack Tecnológica

- **TypeScript + Node.js**
- Slack Bolt (Socket Mode)
- Gemini AI (Google Generative AI)
- Jira Cloud API (OAuth2)
- PostgreSQL + Supabase
- Redis
- Docker
- Jest (testes)

---

## 📋 Pré-requisitos

- Node.js 18+
- Yarn ou npm
- Docker
- Conta no Jira Cloud e chave da API Gemini

---

## ⚡️ Como rodar localmente

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/agent-qa-service.git
cd agent-qa-service

# 2. Instale as dependências
yarn install
# ou: npm install

# 3. Configure o ambiente
cp .env.example .env
# edite o .env com suas credenciais

# 4. Suba os serviços auxiliares
docker run -d --name redis-qa-service -p 6379:6379 redis
docker run -d --name pg-qa-service -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres

# 5. Rode as migrações do banco
yarn migrate

# 6. Inicie o bot do Slack
npx ts-node src/slackBot.ts
```

---

## 🧪 Testes

```bash
yarn test
```

---

## 📁 Estrutura do Projeto

```
src/
├── modules/
│   ├── ai-prompting/        # Integração com Gemini AI
│   ├── alerting/            # Notificações e alertas (Slack)
│   ├── api/                 # Servidor Express (futuro uso)
│   └── advanced-features/   # Aprovação, escalonamento, etc.
├── shared/
│   ├── config/              # Configurações gerais
│   ├── infrastructure/      # Jira, Slack, logging
│   ├── services/            # Repositórios e lógica de negócio
│   └── database/            # Migrações SQL
├── scripts/                 # Utilitários e ferramentas
├── slackBot.ts              # Entrada do bot do Slack
├── main.ts                  # Entrada principal do Express
└── testAgentFlow.ts         # Script de teste manual
```

---

## 🧾 Exemplo de .env

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

---

## 🤝 Contribuindo

1. Faça um fork
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas alterações: `git commit -m 'feat: nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Crie um Pull Request

---

## 📜 Licença

MIT — veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## ⭐ Gostou do projeto?

Se este projeto te ajudou ou te inspirou, **deixe uma estrela** ⭐ no repositório. Isso motiva o autor e ajuda o projeto a alcançar mais pessoas!