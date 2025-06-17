import axios from 'axios';

interface JiraAuthConfig {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  cloudId: string;
  baseUrl: string;
}

export class JiraAuth {
  private config: JiraAuthConfig;

  constructor(config: JiraAuthConfig) {
    this.config = config;
  }

  /**
   * Retorna o access token atual (sem renovação automática).
   */
  public async getAccessToken(): Promise<string> {
    return this.config.accessToken;
  }
}

// Função auxiliar para carregar config do ambiente
export function getJiraAuthConfigFromEnv(): JiraAuthConfig {
  return {
    clientId: process.env.JIRA_CLIENT_ID!,
    clientSecret: process.env.JIRA_CLIENT_SECRET!,
    accessToken: process.env.JIRA_ACCESS_TOKEN!,
    cloudId: process.env.JIRA_CLOUD_ID!,
    baseUrl: process.env.JIRA_BASE_URL || 'https://api.atlassian.com',
  };
} 