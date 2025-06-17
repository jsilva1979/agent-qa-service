import 'dotenv/config';
import { Server } from './modules/api/server';
import { GitHubRepository } from './modules/github-access/infrastructure/GitHubRepository';
import { GeminiService } from './modules/ai-prompting/infrastructure/GeminiService';
import { SlackAlertService } from './modules/alerting/infrastructure/SlackAlertService';
import { ConfluenceService } from './modules/documentation/infrastructure/ConfluenceService';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Configuração de logging base
const baseLoggingConfig = {
  level: process.env.LOG_LEVEL || 'info',
  file: {
    path: 'logs/app.log',
  },
};

// Inicializar serviços
const gitHubRepository = new GitHubRepository();
const aiService = new GeminiService(); // O GeminiService já lê a API Key do process.env internamente
const alertService = new SlackAlertService({
  accessToken: process.env.SLACK_ACCESS_TOKEN as string,
  refreshToken: process.env.SLACK_REFRESH_TOKEN as string,
  channel: process.env.SLACK_CHANNEL as string,
  logging: baseLoggingConfig,
  jira: {
    url: process.env.JIRA_URL as string,
  },
});
const documentationService = new ConfluenceService({
  baseUrl: process.env.CONFLUENCE_BASE_URL as string,
  username: process.env.CONFLUENCE_USERNAME as string,
  apiToken: process.env.CONFLUENCE_API_TOKEN as string,
  spaceKey: process.env.CONFLUENCE_SPACE_KEY as string,
  logging: baseLoggingConfig,
});

// Iniciar servidor
const server = new Server(
  PORT,
  gitHubRepository,
  aiService,
  alertService,
  documentationService
);

server.start(); 