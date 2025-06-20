import axios from 'axios';

export interface JiraIssueFields {
  project: { key: string };
  summary: string;
  description: {
    version: number;
    type: string;
    content: Array<{
      type: string;
      content?: Array<{
        type: string;
        text?: string;
        [key: string]: unknown;
      }>;
      [key: string]: unknown;
    }>;
  };
  issuetype: { name: string };
  [key: string]: unknown;
}

export async function createJiraIssue({ accessToken, cloudId, fields }: {
  accessToken: string;
  cloudId: string;
  fields: JiraIssueFields;
}): Promise<{ key: string; id: string; self: string }> {
  const url = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue`;
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
  } catch (error: unknown) {
    let errorMsg = 'Erro ao criar issue no Jira: ';
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      error.response &&
      typeof error.response === 'object' &&
      'data' in error.response &&
      error.response.data
    ) {
      // eslint-disable-next-line no-console
      console.error('Detalhes do erro Jira:', error.response.data);
    }
    if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'errorMessages' in error.response.data) {
      errorMsg += (error.response.data.errorMessages as string[]).join(', ');
    } else if (error instanceof Error) {
      errorMsg += error.message;
    }
    throw new Error(errorMsg);
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