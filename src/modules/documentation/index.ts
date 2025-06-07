import { ConfluenceDocumentationAdapter } from './infra/adapters/ConfluenceDocumentationAdapter';
import { config } from './config/config';

// Inicialização do serviço de documentação
const documentationService = new ConfluenceDocumentationAdapter({
  baseUrl: config.confluence.baseUrl,
  username: config.confluence.username,
  apiToken: config.confluence.apiToken,
  spaceKey: config.confluence.spaceKey,
  parentPageId: config.confluence.parentPageId,
  logging: config.logging,
});

// Exporta o serviço de documentação
export { documentationService }; 