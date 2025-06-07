# 🤖 Agente Autônomo de QA com Gemini — Guia de Arquitetura e Desenvolvimento

## 📌 Visão Geral

Este projeto propõe a criação de um **Agente Autônomo de QA** utilizando a IA generativa **Gemini**, com uma arquitetura robusta e moderna baseada em:

* Clean Architecture + Hexagonal (Ports and Adapters)
* Princípios SOLID dentro de cada módulo
* Event-Driven Architecture para reatividade
* Modular Monolith (com potencial migração para microsserviços)

O agente será capaz de:

* Monitorar logs de serviços (via RabbitMQ)
* Analisar automaticamente os erros
* Acessar o GitHub e identificar os trechos de código responsáveis
* Usar Gemini para sugerir diagnósticos e correções
* Enviar alertas inteligentes no Slack ou Webhook
* Gerar documentação no Confluence
* Escalar serviços via Kubernetes quando necessário

---

## 🧠 Funcionalidades do Agente

### Fluxo geral:

1. Detecta erro em log via RabbitMQ
2. Extrai serviço, arquivo, linha e tipo de erro
3. Acessa repositório GitHub e busca o código da linha
4. Envia trecho ao Gemini com prompt técnico
5. Recebe explicação + sugestão de correção
6. Envia alerta no Slack com código e link
7. Cria insight técnico no Confluence
8. Monitora fila e escala pods no Kubernetes (se necessário)

---

## 📁 Estrutura de Pastas — Arquitetura Modular (Hexagonal + Clean)

```bash
src/
├── modules/                    # Cada contexto de negócio em um módulo
│   ├── log-analysis/           # Lógica de parsing e análise de logs
│   │   ├── domain/             # Entidades e regras puras
│   │   ├── application/        # UseCases e fluxos
│   │   ├── infra/              # RabbitMQ listener, Redis, etc
│   │   └── presenter/          # Formatação de resposta
│   ├── alerting/               # Envio de notificações Slack/Webhook
│   ├── github-access/          # Integração GitHub
│   ├── ai-prompting/           # Interação com Gemini
│   ├── documentation/          # Integração com Confluence
│   ├── scaling/                # Escalabilidade com Kubernetes
├── shared/                    # Helpers, tipos globais, utils
└── main.ts                    # Bootstrap da aplicação
```

---

## ⚙️ Princípios de Arquitetura Usados

### ✅ Clean Architecture

* Domínio isolado da infraestrutura
* Camadas bem definidas: Domain → Application → Infra → Presenter

### ✅ Hexagonal (Ports and Adapters)

* Interfaces (ports) para cada dependência externa (GitHub, Slack, Redis...)
* Implementações (adapters) podem ser trocadas facilmente

### ✅ Event-Driven

* RabbitMQ aciona os módulos de análise ao receber logs
* Cada módulo reage a eventos e emite novos eventos

### ✅ SOLID (dentro de cada módulo)

* SRP: Cada classe tem uma única responsabilidade
* OCP: Interfaces para extensibilidade (ex: múltiplos notifiers)
* LSP: Adapters podem ser substituídos sem quebrar uso
* ISP: Interfaces pequenas e focadas
* DIP: UseCases dependem apenas de interfaces

---

## 🔁 Fluxo de Execução

```mermaid
graph TD
    A[Erro detectado via RabbitMQ] --> B[Extrai serviço, arquivo, linha]
    B --> C[Acessa repositório GitHub via API]
    C --> D[Busca código da linha de erro]
    D --> E[Interpreta com Gemini (IA)]
    E --> F[Envia alerta contextual no Slack/Webhook]
    F --> G[Gera insight técnico no Confluence]
    A --> H[Verifica volume na fila → Escala pods via K8s]
```

---

## 📤 Prompt de Análise Gemini

````text
Você é um engenheiro de QA autônomo.

Abaixo está o trecho de código onde ocorreu o erro, extraído automaticamente após a análise de logs.

1. O que pode ter causado o erro nesta linha?
2. Há alguma verificação ausente? (null-check, try-catch...)
3. Dê uma sugestão de correção com explicação.

Arquivo: {{file}}, Linha: {{line}}

```{{language}}
{{codigo_extraido}}
````

````

---

## 📥 Alerta Enviado no Slack

```text
🚨 *Erro detectado no serviço `user-service`*

📁 Arquivo: `UserProcessor.java`
📍 Linha: 23
💥 Erro: NullPointerException

🔎 Análise IA:
Provável causa: Objeto `name` está nulo.
💡 Sugestão: Adicionar verificação `if (name != null)`

🔗 [Ver no GitHub](https://github.com/sua-org/user-service/blob/main/src/UserProcessor.java#L23)
````

---

## 🧰 Stack Técnica

| Componente           | Finalidade                      |
| -------------------- | ------------------------------- |
| TypeScript (Node.js) | Linguagem principal do projeto  |
| Gemini API           | Análise de código e logs via IA |
| GitHub API           | Busca de código                 |
| Slack / Webhook      | Alertas                         |
| Confluence API       | Documentação técnica automática |
| PostgreSQL           | Armazenamento de histórico      |
| Redis                | Cache de logs e prompts         |
| RabbitMQ             | Evento de logs                  |
| Kubernetes           | Escalabilidade                  |
| Google Cloud Logs    | Observabilidade e logging       |
| Docker               | Contêinerização                 |

---

## 🧪 Testabilidade

* UseCases testáveis com mocks de interfaces (Gemini, Slack...)
* Testes de integração simulando log em fila e observando efeitos
* Testes de performance para escalonamento via fila

---

## ✅ Recomendações Finais

* Comece com Modular Monolith, mas prepare os módulos para serem migrados para microsserviços, se necessário.
* Use `Interface-Driven Development`: defina as *ports* antes das implementações.
* Versione seus prompts Gemini para rastrear melhorias.
* Logue todas as interações em PostgreSQL para auditoria.
* Use Feature Flags para controlar funcionalidades em produção.

---

## 🏁 Roadmap Inicial

1. Criar interfaces (ports): `ILogFetcher`, `ICodeAnalyzer`, `IAIInterpreter`, `IAlertSender`, `IDocumentPublisher`, `IScaler`
2. Implementar UseCases: `AnalyzeLogUseCase`, `SendAlertUseCase`, `CreateInsightUseCase`, `AutoScaleUseCase`
3. Criar Adapters: Gemini, GitHub, Slack, Confluence, Redis, Kubernetes
4. Configurar orquestração via fila RabbitMQ
5. Testar pipeline completo com mocks
6. Implantar com Docker + Kubernetes (Google Cloud)

---

Esse guia serve como manual de referência para o desenvolvimento e expansão do Agente Autônomo de QA com Gemini.


##Guia de inicio rapido da API segerido pela GEMINI do GOOGLE

curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain how AI works in a few words"
          }
        ]
      }
    ]
  }'