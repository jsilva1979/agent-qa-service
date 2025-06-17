import { createLogger, format, transports } from 'winston';
import { Orchestrator } from './application/Orchestrator';
import { config } from './config/config';
import { LogAnalysisService } from '../log-analysis/application/LogAnalysisService';
import { GitHubService } from '../github-access/application/GitHubService';
import { GeminiServiceAdapter } from '../ai-prompting/infra/adapters/GeminiServiceAdapter';
import { SlackAlertAdapter } from '../alerting/infra/adapters/SlackAlertAdapter';
import { ConfluenceDocumentationAdapter } from '../documentation/infra/adapters/ConfluenceDocumentationAdapter';
import { KubernetesScalingAdapter } from '../scaling/infra/adapters/KubernetesScalingAdapter';

// Configuração do logger
const logger = createLogger({
  level: config.orchestrator.logging.level,
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    ...(config.orchestrator.logging.file.enabled
      ? [new transports.File({ filename: config.orchestrator.logging.file.path })]
      : []),
  ],
});

// Inicialização dos serviços
const logAnalysisService = new LogAnalysisService(logger);
const gitHubService = new GitHubService(logger);
const aiService = new GeminiServiceAdapter(logger, process.env.GEMINI_API_KEY || '');
const alertService = new SlackAlertAdapter({
  token: process.env.SLACK_BOT_TOKEN || '',
  channel: process.env.SLACK_CHANNEL || '#alerts',
  logging: {
    level: config.orchestrator.logging.level,
    file: {
      path: config.orchestrator.logging.file.path
    }
  }
});
const documentationService = new ConfluenceDocumentationAdapter({
  baseUrl: process.env.CONFLUENCE_BASE_URL || '',
  username: process.env.CONFLUENCE_USERNAME || '',
  apiToken: process.env.CONFLUENCE_API_TOKEN || '',
  spaceKey: process.env.CONFLUENCE_SPACE_KEY || '',
  parentPageId: process.env.CONFLUENCE_PARENT_PAGE_ID || '',
  logging: {
    level: config.orchestrator.logging.level,
    file: {
      path: config.orchestrator.logging.file.path
    }
  }
});
const scalingService = new KubernetesScalingAdapter(
  logger,
  process.env.KUBE_CONFIG || '',
  process.env.KUBE_NAMESPACE || 'default'
);

// Criação do orquestrador
const orchestrator = new Orchestrator(
  logAnalysisService,
  gitHubService,
  aiService,
  alertService,
  documentationService,
  scalingService,
  logger
);

// Exporta o orquestrador e o logger
export { orchestrator, logger }; 