import { getTokens, saveTokens } from './tokenRepository';
import { refreshAccessToken } from './jiraOAuthService';
import { createJiraIssue, JiraIssueFields } from '../infrastructure/jiraService';

interface AdfDocument {
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
}

export async function createIssueForUser(
  userId: string,
  projectKey: string,
  summary: string,
  description: any,
  issueTypeName: string,
  priorityName: string,
): Promise<any> {
  let token = await getTokens(userId);
  if (!token) {
    throw new Error(`Token não encontrado para o usuário ${userId}`);
  }

  if (Date.now() >= token.expires_at) {
    const refreshed = await refreshAccessToken(token.refresh_token);
    token = {
      ...token,
      access_token: refreshed.accessToken,
      refresh_token: refreshed.refreshToken,
      expires_at: refreshed.obtainedAt + refreshed.expiresIn * 1000,
    };
    await saveTokens({
        userId,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        expiresIn: refreshed.expiresIn,
        cloudId: token.cloud_id,
      });
  }

  const fields: JiraIssueFields = {
    project: { key: projectKey },
    summary,
    description: description,
    issuetype: { name: issueTypeName },
    priority: { name: priorityName },
  };

  const issue = await createJiraIssue({
    accessToken: token.access_token,
    cloudId: token.cloud_id,
    fields,
  });
  return issue;
} 