import 'dotenv/config';
import { Server } from './modules/api/server';
import { GitHubRepository } from './modules/github-access/infrastructure/GitHubRepository';
import { GeminiService } from './modules/ai-prompting/infrastructure/GeminiService';
import { SlackAlertService } from './modules/alerting/infrastructure/SlackAlertService';
import { ConfluenceService } from './modules/documentation/infrastructure/ConfluenceService';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Inicializar serviços
const gitHubRepository = new GitHubRepository();
const aiService = new GeminiService();
const alertService = new SlackAlertService();
const documentationService = new ConfluenceService();

// Iniciar servidor
const server = new Server(
  PORT,
  gitHubRepository,
  aiService,
  alertService,
  documentationService
);

server.start(); 