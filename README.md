# 🤖 Agente de QA com Gemini AI

Um agente autônomo de QA que utiliza a Gemini AI do Google para analisar logs, detectar erros e fornecer soluções inteligentes.

## 🚀 Funcionalidades

- Monitoramento de logs via RabbitMQ
- Análise automática de erros
- Integração com GitHub para contexto de código
- Diagnóstico inteligente com Gemini
- Alertas inteligentes via Slack/Webhook
- Documentação automática no Confluence
- Escalabilidade com Kubernetes

## 🛠️ Stack Tecnológica

- TypeScript/Node.js
- Clean Architecture + Hexagonal
- Arquitetura Orientada a Eventos
- RabbitMQ para processamento de eventos
- Redis para cache
- PostgreSQL para persistência
- Kubernetes para escalabilidade

## 📋 Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- RabbitMQ
- Redis
- PostgreSQL
- Conta Google Cloud (para Gemini API)

## 🚀 Primeiros Passos

1. Clone o repositório:
```bash
git clone [url-do-repositorio]
cd agent-qa-service
```

2. Instale as dependências:
```bash
yarn install
```

3. Crie um arquivo `.env`:
```bash
cp .env.example .env
```

4. Preencha o `.env` com suas credenciais:
- GEMINI_API_KEY
- GITHUB_TOKEN
- SLACK_WEBHOOK_URL
- RABBITMQ_URL
- REDIS_URL
- POSTGRES_URL

5. Inicie o servidor de desenvolvimento:
```bash
yarn dev
```

## 🧪 Testes

Execute a suíte de testes:
```bash
yarn test
```

## 📁 Estrutura do Projeto

```
src/
├── modules/                    # Módulos de contexto de negócio
│   ├── log-analysis/           # Parsing e análise de logs
│   ├── alerting/               # Sistema de notificações
│   ├── github-access/          # Integração com GitHub
│   ├── ai-prompting/           # Integração com Gemini
│   ├── documentation/          # Integração com Confluence
│   └── scaling/                # Escalabilidade com Kubernetes
├── shared/                     # Utilitários compartilhados
└── main.ts                     # Ponto de entrada da aplicação
```

## 🤝 Contribuindo

1. Faça um fork do repositório
2. Crie sua branch (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova funcionalidade'`)
4. Faça push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes. 