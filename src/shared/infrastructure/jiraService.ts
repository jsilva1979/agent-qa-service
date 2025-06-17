import axios from 'axios';
import { JiraAuth, getJiraAuthConfigFromEnv } from './jiraAuth';

export interface JiraIssueFields {
  project: { key: string };
  summary: string;
  description: string;
  issuetype: { name: string };
  [key: string]: any;
}

export class JiraService {
  private auth: JiraAuth;
  private cloudId: string;
  private baseUrl: string;

  constructor() {
    const config = getJiraAuthConfigFromEnv();
    this.auth = new JiraAuth(config);
    this.cloudId = config.cloudId;
    this.baseUrl = config.baseUrl;
  }

  /**
   * Cria uma issue no Jira Cloud
   * @param fields Campos da issue (project, summary, description, issuetype, etc)
   */
  public async createIssue(fields: JiraIssueFields): Promise<any> {
    const accessToken = await this.auth.getAccessToken();
    const url = `${this.baseUrl}/ex/jira/${this.cloudId}/rest/api/3/issue`;
    try {
      const response = await axios.post(
        url,
        { fields },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error('Erro ao criar issue no Jira: ' + (error.response?.data?.errorMessages || error.message));
    }
  }
}

// Exemplo de uso:
// const jira = new JiraService();
// jira.createIssue({
//   project: { key: 'PROJ' },
//   summary: 'Título do problema',
//   description: 'Descrição detalhada do problema',
//   issuetype: { name: 'Bug' },
// }); 